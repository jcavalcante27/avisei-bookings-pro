import { query } from '../db.js';
import { Parser } from 'json2csv';
import ExcelJS from 'exceljs';

class ReportController {
  
  /**
   * Relatório de agendamentos por profissional
   * - Funcionários: apenas seus próprios agendamentos
   * - Estabelecimentos: todos agendamentos dos seus funcionários
   */
  async getAppointmentsByProfessional(req, res) {
    try {
      const { userType: user_type, userId: user_id } = req.user;
      const { professional_id, start_date, end_date, status, format = 'json' } = req.query;

      let sql = `
        SELECT 
          a.id,
          a.appointment_date,
          a.appointment_time,
          a.status,
          a.created_at,
          u_client.name as client_name,
          u_client.email as client_email,
          u_professional.name as professional_name,
          s.name as service_name,
          s.price,
          s.commission_percentage,
          ROUND(s.price * s.commission_percentage / 100, 2) as commission_amount
        FROM appointments a
        JOIN users u_client ON a.client_id = u_client.id
        JOIN users u_professional ON a.professional_id = u_professional.id
        JOIN services s ON a.service_id = s.id
        WHERE 1=1
      `;

      const params = [];
      let paramCount = 0;

      // Controle de permissões
      if (user_type === 'funcionario') {
        // Funcionário só vê seus próprios agendamentos
        sql += ` AND a.professional_id = $${++paramCount}`;
        params.push(user_id);
      } else if (user_type === 'estabelecimento') {
        // Estabelecimento vê agendamentos dos seus funcionários
        sql += ` AND u_professional.establishment_id = $${++paramCount}`;
        params.push(user_id);
      } else if (user_type === 'super_admin') {
        // Super admin vê todos
        // Sem filtro adicional
      } else {
        return res.status(403).json({ error: 'Acesso negado' });
      }

      // Filtros opcionais
      if (professional_id) {
        sql += ` AND a.professional_id = $${++paramCount}`;
        params.push(professional_id);
      }

      if (start_date) {
        sql += ` AND a.appointment_date >= $${++paramCount}`;
        params.push(start_date);
      }

      if (end_date) {
        sql += ` AND a.appointment_date <= $${++paramCount}`;
        params.push(end_date);
      }

      if (status) {
        sql += ` AND a.status = $${++paramCount}`;
        params.push(status);
      }

      sql += ` ORDER BY a.appointment_date DESC, a.appointment_time DESC`;

      const result = await query(sql, params);

      // Calcular totais
      const summary = {
        total_appointments: result.rows.length,
        total_revenue: result.rows.reduce((sum, row) => sum + parseFloat(row.price || 0), 0),
        total_commission: result.rows.reduce((sum, row) => sum + parseFloat(row.commission_amount || 0), 0),
        by_status: {}
      };

      // Agrupar por status
      result.rows.forEach(row => {
        if (!summary.by_status[row.status]) {
          summary.by_status[row.status] = {
            count: 0,
            revenue: 0,
            commission: 0
          };
        }
        summary.by_status[row.status].count++;
        summary.by_status[row.status].revenue += parseFloat(row.price || 0);
        summary.by_status[row.status].commission += parseFloat(row.commission_amount || 0);
      });

      // Exportar formato específico
      if (format === 'csv') {
        const csvData = result.rows.map(row => ({
          ...row,
          commission_amount: parseFloat(row.commission_amount || 0).toFixed(2),
          price: parseFloat(row.price || 0).toFixed(2)
        }));
        return this.exportCSV(res, csvData, 'agendamentos_profissional');
      } else if (format === 'xlsx') {
        const xlsxData = result.rows.map(row => ({
          ...row,
          commission_amount: parseFloat(row.commission_amount || 0),
          price: parseFloat(row.price || 0)
        }));
        return this.exportXLSX(res, xlsxData, 'agendamentos_profissional', 'Agendamentos por Profissional', summary);
      }

      res.json({
        success: true,
        data: {
          appointments: result.rows,
          summary
        }
      });

    } catch (error) {
      console.error('Erro ao buscar relatório de agendamentos:', error);
      res.status(500).json({ error: 'Erro interno do servidor' });
    }
  }

  /**
   * Relatório de comissões por atendimento
   */
  async getCommissionReport(req, res) {
    try {
      const { userType: user_type, userId: user_id } = req.user;
      const { professional_id, start_date, end_date, month, year, format = 'json' } = req.query;

      let sql = `
        SELECT 
          a.id,
          a.appointment_date,
          a.appointment_time,
          a.status,
          u_professional.name as professional_name,
          u_professional.id as professional_id,
          s.name as service_name,
          s.price,
          s.commission_percentage,
          ROUND(s.price * s.commission_percentage / 100, 2) as commission_amount,
          u_client.name as client_name
        FROM appointments a
        JOIN users u_professional ON a.professional_id = u_professional.id
        JOIN services s ON a.service_id = s.id
        JOIN users u_client ON a.client_id = u_client.id
        WHERE a.status = 'completed'
      `;

      const params = [];
      let paramCount = 0;

      // Controle de permissões
      if (user_type === 'funcionario') {
        sql += ` AND a.professional_id = $${++paramCount}`;
        params.push(user_id);
      } else if (user_type === 'estabelecimento') {
        sql += ` AND u_professional.establishment_id = $${++paramCount}`;
        params.push(user_id);
      } else if (user_type === 'super_admin') {
        // Super admin vê todos
      } else {
        return res.status(403).json({ error: 'Acesso negado' });
      }

      // Filtros opcionais
      if (professional_id) {
        sql += ` AND a.professional_id = $${++paramCount}`;
        params.push(professional_id);
      }

      if (start_date && end_date) {
        sql += ` AND a.appointment_date BETWEEN $${++paramCount} AND $${++paramCount}`;
        params.push(start_date, end_date);
      } else if (month && year) {
        sql += ` AND EXTRACT(MONTH FROM a.appointment_date) = $${++paramCount} AND EXTRACT(YEAR FROM a.appointment_date) = $${++paramCount}`;
        params.push(month, year);
      }

      sql += ` ORDER BY a.appointment_date DESC, u_professional.name`;

      const result = await query(sql, params);

      // Agrupar por profissional
      const commissionsByProfessional = {};
      let totalCommissions = 0;
      let totalRevenue = 0;

      result.rows.forEach(row => {
        const professionalId = row.professional_id;
        
        if (!commissionsByProfessional[professionalId]) {
          commissionsByProfessional[professionalId] = {
            professional_name: row.professional_name,
            total_appointments: 0,
            total_revenue: 0,
            total_commission: 0,
            appointments: []
          };
        }

        commissionsByProfessional[professionalId].total_appointments++;
        commissionsByProfessional[professionalId].total_revenue += parseFloat(row.price);
        commissionsByProfessional[professionalId].total_commission += parseFloat(row.commission_amount);
        commissionsByProfessional[professionalId].appointments.push(row);

        totalCommissions += parseFloat(row.commission_amount);
        totalRevenue += parseFloat(row.price);
      });

      const reportData = {
        summary: {
          total_revenue: totalRevenue,
          total_commissions: totalCommissions,
          establishment_profit: totalRevenue - totalCommissions,
          total_appointments: result.rows.length
        },
        by_professional: commissionsByProfessional,
        all_appointments: result.rows
      };

      // Exportar formato específico
      if (format === 'csv') {
        const csvData = result.rows.map(row => ({
          ...row,
          commission_amount: parseFloat(row.commission_amount || 0).toFixed(2),
          price: parseFloat(row.price || 0).toFixed(2)
        }));
        return this.exportCSV(res, csvData, 'relatorio_comissoes');
      } else if (format === 'xlsx') {
        const xlsxData = result.rows.map(row => ({
          ...row,
          commission_amount: parseFloat(row.commission_amount || 0),
          price: parseFloat(row.price || 0)
        }));
        return this.exportXLSX(res, xlsxData, 'relatorio_comissoes', 'Relatório de Comissões', reportData.summary);
      }

      res.json({
        success: true,
        data: reportData
      });

    } catch (error) {
      console.error('Erro ao buscar relatório de comissões:', error);
      res.status(500).json({ error: 'Erro interno do servidor' });
    }
  }

  /**
   * Relatório resumido para dashboard
   */
  async getDashboardSummary(req, res) {
    try {
      const { userType: user_type, userId: user_id } = req.user;
      const today = new Date().toISOString().split('T')[0];

      let whereClause = '';
      const params = [];

      if (user_type === 'funcionario') {
        whereClause = 'WHERE a.professional_id = $1';
        params.push(user_id);
      } else if (user_type === 'estabelecimento') {
        whereClause = 'WHERE u_professional.establishment_id = $1';
        params.push(user_id);
      } else if (user_type === 'super_admin') {
        whereClause = 'WHERE 1=1';
      } else {
        return res.status(403).json({ error: 'Acesso negado' });
      }

      // Agendamentos de hoje
      const todayQuery = `
        SELECT COUNT(*) as count, COALESCE(SUM(s.price), 0) as revenue
        FROM appointments a
        JOIN users u_professional ON a.professional_id = u_professional.id
        JOIN services s ON a.service_id = s.id
        ${whereClause} AND a.appointment_date = '${today}'
      `;

      // Agendamentos do mês
      const monthQuery = `
        SELECT 
          COUNT(*) as count, 
          COALESCE(SUM(s.price), 0) as revenue,
          COALESCE(SUM(s.price * s.commission_percentage / 100), 0) as commission
        FROM appointments a
        JOIN users u_professional ON a.professional_id = u_professional.id
        JOIN services s ON a.service_id = s.id
        ${whereClause} 
        AND EXTRACT(MONTH FROM a.appointment_date) = EXTRACT(MONTH FROM CURRENT_DATE)
        AND EXTRACT(YEAR FROM a.appointment_date) = EXTRACT(YEAR FROM CURRENT_DATE)
        AND a.status = 'completed'
      `;

      const [todayResult, monthResult] = await Promise.all([
        query(todayQuery, params),
        query(monthQuery, params)
      ]);

      res.json({
        success: true,
        data: {
          today: {
            appointments: parseInt(todayResult.rows[0].count),
            revenue: parseFloat(todayResult.rows[0].revenue)
          },
          this_month: {
            appointments: parseInt(monthResult.rows[0].count),
            revenue: parseFloat(monthResult.rows[0].revenue),
            commission: parseFloat(monthResult.rows[0].commission)
          }
        }
      });

    } catch (error) {
      console.error('Erro ao buscar resumo do dashboard:', error);
      res.status(500).json({ error: 'Erro interno do servidor' });
    }
  }

  /**
   * Exportar dados em formato CSV
   */
  exportCSV(res, data, filename) {
    try {
      if (!data || data.length === 0) {
        return res.status(400).json({ error: 'Nenhum dado para exportar' });
      }

      const fields = Object.keys(data[0]);
      const parser = new Parser({ fields });
      const csv = parser.parse(data);

      res.setHeader('Content-Type', 'text/csv; charset=utf-8');
      res.setHeader('Content-Disposition', `attachment; filename="${filename}_${new Date().toISOString().split('T')[0]}.csv"`);
      res.setHeader('Access-Control-Expose-Headers', 'Content-Disposition');
      
      return res.send(csv);

    } catch (error) {
      console.error('Erro ao exportar CSV:', error);
      return res.status(500).json({ error: 'Erro ao gerar arquivo CSV' });
    }
  }

  /**
   * Exportar dados em formato XLSX
   */
  async exportXLSX(res, data, filename, sheetName, summary = null) {
    try {
      if (!data || data.length === 0) {
        return res.status(400).json({ error: 'Nenhum dado para exportar' });
      }

      const workbook = new ExcelJS.Workbook();
      workbook.creator = 'Avisei - Sistema de Agendamentos';
      workbook.lastModifiedBy = 'Avisei';
      workbook.created = new Date();

      const worksheet = workbook.addWorksheet(sheetName || 'Relatório');

      // Adicionar cabeçalhos
      const headers = Object.keys(data[0]);
      const headerRow = worksheet.addRow(headers.map(h => h.replace(/_/g, ' ').toUpperCase()));
      
      // Estilizar cabeçalhos
      headerRow.eachCell((cell, colNumber) => {
        cell.font = { bold: true, color: { argb: 'FFFFFF' } };
        cell.fill = {
          type: 'pattern',
          pattern: 'solid',
          fgColor: { argb: '4F81BD' }
        };
        cell.border = {
          top: { style: 'thin' },
          left: { style: 'thin' },
          bottom: { style: 'thin' },
          right: { style: 'thin' }
        };
        cell.alignment = { horizontal: 'center', vertical: 'middle' };
      });

      // Adicionar dados
      data.forEach(item => {
        const row = worksheet.addRow(Object.values(item));
        row.eachCell((cell, colNumber) => {
          cell.border = {
            top: { style: 'thin' },
            left: { style: 'thin' },
            bottom: { style: 'thin' },
            right: { style: 'thin' }
          };
          
          // Formatação especial para valores monetários e datas
          const value = cell.value;
          if (typeof value === 'number' && (headers[colNumber - 1].includes('price') || headers[colNumber - 1].includes('commission'))) {
            cell.numFmt = 'R$ #,##0.00';
          } else if (headers[colNumber - 1].includes('date')) {
            cell.numFmt = 'dd/mm/yyyy';
          }
        });
      });

      // Ajustar largura das colunas
      worksheet.columns.forEach(column => {
        let maxLength = 0;
        column.eachCell({ includeEmpty: true }, (cell) => {
          const cellLength = cell.value ? cell.value.toString().length : 10;
          if (cellLength > maxLength) {
            maxLength = cellLength;
          }
        });
        column.width = Math.min(maxLength + 2, 50); // máximo de 50 caracteres
      });

      // Adicionar resumo se fornecido
      if (summary) {
        const summaryStartRow = worksheet.rowCount + 3;
        const summaryCell = worksheet.getCell(`A${summaryStartRow}`);
        summaryCell.value = 'RESUMO GERAL';
        summaryCell.font = { bold: true, size: 14 };
        summaryCell.fill = {
          type: 'pattern',
          pattern: 'solid',
          fgColor: { argb: 'D9D9D9' }
        };
        
        Object.entries(summary).forEach(([key, value], index) => {
          const row = summaryStartRow + index + 1;
          const keyCell = worksheet.getCell(`A${row}`);
          const valueCell = worksheet.getCell(`B${row}`);
          
          keyCell.value = key.replace(/_/g, ' ').toUpperCase() + ':';
          keyCell.font = { bold: true };
          
          valueCell.value = value;
          if (typeof value === 'number' && (key.includes('revenue') || key.includes('commission') || key.includes('profit'))) {
            valueCell.numFmt = 'R$ #,##0.00';
          }
        });
      }

      const dateStr = new Date().toISOString().split('T')[0];
      res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
      res.setHeader('Content-Disposition', `attachment; filename="${filename}_${dateStr}.xlsx"`);
      res.setHeader('Access-Control-Expose-Headers', 'Content-Disposition');

      await workbook.xlsx.write(res);
      res.end();

    } catch (error) {
      console.error('Erro ao exportar XLSX:', error);
      return res.status(500).json({ error: 'Erro ao gerar arquivo Excel' });
    }
  }

  /**
   * Relatório de agendamentos por data
   */
  async getAppointmentsByDate(req, res) {
    try {
      const { userType: user_type, userId: user_id } = req.user;
      const { date, period = 'day', format = 'json' } = req.query;

      // Verificar permissões
      if (user_type === 'cliente') {
        return res.status(403).json({ error: 'Acesso negado' });
      }

      let dateFilter = '';
      let whereClause = '';
      const params = [];
      let paramCount = 0;

      // Filtros baseados no tipo de usuário
      if (user_type === 'funcionario') {
        whereClause = 'WHERE u_professional.id = $1';
        params.push(user_id);
        paramCount = 1;
      } else if (user_type === 'estabelecimento') {
        whereClause = 'WHERE u_professional.establishment_id = $1';
        params.push(user_id);
        paramCount = 1;
      } else if (user_type === 'super_admin') {
        whereClause = 'WHERE 1=1';
      }

      // Filtro de período
      const targetDate = date ? new Date(date) : new Date();
      
      if (period === 'day') {
        dateFilter = ` AND a.appointment_date = $${++paramCount}`;
        params.push(targetDate.toISOString().split('T')[0]);
      } else if (period === 'week') {
        const startOfWeek = new Date(targetDate);
        startOfWeek.setDate(targetDate.getDate() - targetDate.getDay());
        const endOfWeek = new Date(startOfWeek);
        endOfWeek.setDate(startOfWeek.getDate() + 6);
        
        dateFilter = ` AND a.appointment_date BETWEEN $${++paramCount} AND $${++paramCount}`;
        params.push(startOfWeek.toISOString().split('T')[0]);
        params.push(endOfWeek.toISOString().split('T')[0]);
      } else if (period === 'month') {
        dateFilter = ` AND EXTRACT(MONTH FROM a.appointment_date) = $${++paramCount} AND EXTRACT(YEAR FROM a.appointment_date) = $${++paramCount}`;
        params.push(targetDate.getMonth() + 1);
        params.push(targetDate.getFullYear());
      }

      whereClause += dateFilter;

      const sql = `
        SELECT 
          a.id,
          a.appointment_date,
          a.appointment_time,
          a.status,
          a.created_at,
          u_client.name as client_name,
          u_client.email as client_email,
          u_professional.name as professional_name,
          u_establishment.name as establishment_name,
          s.name as service_name,
          s.duration,
          s.price,
          s.commission_percentage,
          ROUND(s.price * s.commission_percentage / 100, 2) as commission_amount
        FROM appointments a
        JOIN users u_client ON a.client_id = u_client.id
        JOIN users u_professional ON a.professional_id = u_professional.id
        JOIN users u_establishment ON a.establishment_id = u_establishment.id
        JOIN services s ON a.service_id = s.id
        ${whereClause}
        ORDER BY a.appointment_date DESC, a.appointment_time DESC
      `;

      const result = await query(sql, params);

      // Calcular resumo
      const summary = {
        total_appointments: result.rows.length,
        total_revenue: result.rows.reduce((sum, row) => sum + parseFloat(row.price || 0), 0),
        total_commission: result.rows.reduce((sum, row) => sum + parseFloat(row.commission_amount || 0), 0),
        by_status: {}
      };

      result.rows.forEach(row => {
        if (!summary.by_status[row.status]) {
          summary.by_status[row.status] = 0;
        }
        summary.by_status[row.status]++;
      });

      if (format === 'csv') {
        const csvData = result.rows.map(row => ({
          ...row,
          commission_amount: parseFloat(row.commission_amount || 0).toFixed(2),
          price: parseFloat(row.price || 0).toFixed(2)
        }));
        return this.exportCSV(res, csvData, `agendamentos_${period}_${targetDate.toISOString().split('T')[0]}`);
      } else if (format === 'xlsx') {
        const xlsxData = result.rows.map(row => ({
          ...row,
          commission_amount: parseFloat(row.commission_amount || 0),
          price: parseFloat(row.price || 0)
        }));
        return this.exportXLSX(res, xlsxData, `agendamentos_${period}_${targetDate.toISOString().split('T')[0]}`, `Agendamentos - ${period}`, summary);
      }

      return res.json({
        success: true,
        data: {
          appointments: result.rows,
          summary,
          period,
          date: targetDate.toISOString().split('T')[0]
        }
      });

    } catch (error) {
      console.error('Erro ao buscar relatório por data:', error);
      return res.status(500).json({ error: 'Erro interno do servidor' });
    }
  }
}

export default ReportController;