import { query } from '../db.js';

class ReportController {
  
  /**
   * Relatório de agendamentos por profissional
   * - Funcionários: apenas seus próprios agendamentos
   * - Estabelecimentos: todos agendamentos dos seus funcionários
   */
  async getAppointmentsByProfessional(req, res) {
    try {
      const { user_type, id: user_id, establishment_id } = req.user;
      const { professional_id, start_date, end_date, status } = req.query;

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
      const { user_type, id: user_id } = req.user;
      const { professional_id, start_date, end_date, month, year } = req.query;

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

      res.json({
        success: true,
        data: {
          summary: {
            total_revenue: totalRevenue,
            total_commissions: totalCommissions,
            establishment_profit: totalRevenue - totalCommissions,
            total_appointments: result.rows.length
          },
          by_professional: commissionsByProfessional,
          all_appointments: result.rows
        }
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
      const { user_type, id: user_id } = req.user;
      const today = new Date().toISOString().split('T')[0];

      let whereClause = '';
      const params = [];

      if (user_type === 'funcionario') {
        whereClause = 'WHERE a.professional_id = $1';
        params.push(user_id);
      } else if (user_type === 'estabelecimento') {
        whereClause = 'WHERE u_professional.establishment_id = $1';
        params.push(user_id);
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
}

export default ReportController;