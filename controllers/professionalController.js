import { query } from '../db.js';

class ProfessionalController {

  /**
   * Dashboard do funcionário/profissional
   */
  async getDashboard(req, res) {
    try {
      if (!['funcionario', 'estabelecimento'].includes(req.user.userType)) {
        return res.status(403).json({ error: 'Acesso negado' });
      }

      const professionalId = req.user.userId;

      // Estatísticas do profissional
      const statsQuery = `
        SELECT 
          COUNT(*) as total_appointments,
          COUNT(CASE WHEN status = 'completed' THEN 1 END) as completed_appointments,
          COUNT(CASE WHEN appointment_date = CURRENT_DATE THEN 1 END) as today_appointments,
          COALESCE(SUM(CASE WHEN status = 'completed' THEN s.price END), 0) as total_revenue,
          COALESCE(SUM(CASE WHEN status = 'completed' THEN s.price * s.commission_percentage / 100 END), 0) as total_commission
        FROM appointments a
        JOIN services s ON a.service_id = s.id
        WHERE a.professional_id = $1
      `;

      // Estatísticas do mês atual
      const monthStatsQuery = `
        SELECT 
          COUNT(*) as appointments_this_month,
          COALESCE(SUM(s.price), 0) as revenue_this_month,
          COALESCE(SUM(s.price * s.commission_percentage / 100), 0) as commission_this_month
        FROM appointments a
        JOIN services s ON a.service_id = s.id
        WHERE a.professional_id = $1
        AND EXTRACT(MONTH FROM a.appointment_date) = EXTRACT(MONTH FROM CURRENT_DATE)
        AND EXTRACT(YEAR FROM a.appointment_date) = EXTRACT(YEAR FROM CURRENT_DATE)
        AND a.status = 'completed'
      `;

      // Próximos agendamentos
      const upcomingQuery = `
        SELECT 
          a.id,
          a.appointment_date,
          a.appointment_time,
          a.status,
          u_client.name as client_name,
          u_client.phone as client_phone,
          s.name as service_name,
          s.duration,
          s.price
        FROM appointments a
        JOIN users u_client ON a.client_id = u_client.id
        JOIN services s ON a.service_id = s.id
        WHERE a.professional_id = $1
        AND (a.appointment_date > CURRENT_DATE 
             OR (a.appointment_date = CURRENT_DATE AND a.appointment_time > CURRENT_TIME))
        AND a.status IN ('scheduled', 'confirmed')
        ORDER BY a.appointment_date, a.appointment_time
        LIMIT 5
      `;

      const [stats, monthStats, upcoming] = await Promise.all([
        query(statsQuery, [professionalId]),
        query(monthStatsQuery, [professionalId]),
        query(upcomingQuery, [professionalId])
      ]);

      res.json({
        success: true,
        data: {
          statistics: stats.rows[0],
          current_month: monthStats.rows[0],
          upcoming_appointments: upcoming.rows
        }
      });

    } catch (error) {
      console.error('Erro ao buscar dashboard profissional:', error);
      res.status(500).json({ error: 'Erro interno do servidor' });
    }
  }

  /**
   * Visualizar agenda do profissional
   */
  async getSchedule(req, res) {
    try {
      if (!['funcionario', 'estabelecimento'].includes(req.user.userType)) {
        return res.status(403).json({ error: 'Acesso negado' });
      }

      const { start_date, end_date } = req.query;
      const professionalId = req.user.userId;

      let dateFilter = '';
      const params = [professionalId];
      let paramCount = 1;

      if (start_date && end_date) {
        dateFilter = `AND a.appointment_date BETWEEN $${++paramCount} AND $${++paramCount}`;
        params.push(start_date, end_date);
      } else {
        // Se não especificado, buscar próximos 7 dias
        dateFilter = `AND a.appointment_date BETWEEN CURRENT_DATE AND CURRENT_DATE + INTERVAL '7 days'`;
      }

      const sql = `
        SELECT 
          a.id,
          a.appointment_date,
          a.appointment_time,
          a.status,
          a.created_at,
          u_client.name as client_name,
          u_client.phone as client_phone,
          u_client.email as client_email,
          s.name as service_name,
          s.duration,
          s.price,
          s.commission_percentage,
          ROUND(s.price * s.commission_percentage / 100, 2) as commission_amount
        FROM appointments a
        JOIN users u_client ON a.client_id = u_client.id
        JOIN services s ON a.service_id = s.id
        WHERE a.professional_id = $1 ${dateFilter}
        ORDER BY a.appointment_date, a.appointment_time
      `;

      const result = await query(sql, params);

      // Agrupar por data
      const scheduleByDate = {};
      result.rows.forEach(appointment => {
        const date = appointment.appointment_date.toISOString().split('T')[0];
        if (!scheduleByDate[date]) {
          scheduleByDate[date] = [];
        }
        scheduleByDate[date].push(appointment);
      });

      res.json({
        success: true,
        data: {
          schedule_by_date: scheduleByDate,
          all_appointments: result.rows,
          total_appointments: result.rows.length
        }
      });

    } catch (error) {
      console.error('Erro ao buscar agenda profissional:', error);
      res.status(500).json({ error: 'Erro interno do servidor' });
    }
  }

  /**
   * Visualizar comissões do profissional
   */
  async getCommissions(req, res) {
    try {
      if (!['funcionario', 'estabelecimento'].includes(req.user.userType)) {
        return res.status(403).json({ error: 'Acesso negado' });
      }

      const { month, year } = req.query;
      const professionalId = req.user.userId;

      let dateFilter = '';
      const params = [professionalId];
      let paramCount = 1;

      if (month && year) {
        dateFilter = `AND EXTRACT(MONTH FROM a.appointment_date) = $${++paramCount} AND EXTRACT(YEAR FROM a.appointment_date) = $${++paramCount}`;
        params.push(month, year);
      } else {
        // Mês atual se não especificado
        dateFilter = `AND EXTRACT(MONTH FROM a.appointment_date) = EXTRACT(MONTH FROM CURRENT_DATE) AND EXTRACT(YEAR FROM a.appointment_date) = EXTRACT(YEAR FROM CURRENT_DATE)`;
      }

      const sql = `
        SELECT 
          a.id,
          a.appointment_date,
          a.appointment_time,
          u_client.name as client_name,
          s.name as service_name,
          s.price,
          s.commission_percentage,
          ROUND(s.price * s.commission_percentage / 100, 2) as commission_amount
        FROM appointments a
        JOIN users u_client ON a.client_id = u_client.id
        JOIN services s ON a.service_id = s.id
        WHERE a.professional_id = $1 
        AND a.status = 'completed'
        ${dateFilter}
        ORDER BY a.appointment_date DESC
      `;

      const result = await query(sql, params);

      // Calcular totais
      const totalCommission = result.rows.reduce((sum, row) => sum + parseFloat(row.commission_amount), 0);
      const totalRevenue = result.rows.reduce((sum, row) => sum + parseFloat(row.price), 0);

      res.json({
        success: true,
        data: {
          commissions: result.rows,
          summary: {
            total_appointments: result.rows.length,
            total_revenue: totalRevenue,
            total_commission: totalCommission,
            average_commission: result.rows.length > 0 ? totalCommission / result.rows.length : 0
          },
          period: { month, year }
        }
      });

    } catch (error) {
      console.error('Erro ao buscar comissões:', error);
      res.status(500).json({ error: 'Erro interno do servidor' });
    }
  }

  /**
   * Clientes atendidos pelo profissional
   */
  async getClientsServed(req, res) {
    try {
      if (!['funcionario', 'estabelecimento'].includes(req.user.userType)) {
        return res.status(403).json({ error: 'Acesso negado' });
      }

      const professionalId = req.user.userId;

      const sql = `
        SELECT 
          u_client.id,
          u_client.name,
          u_client.phone,
          u_client.email,
          COUNT(a.id) as total_appointments,
          MAX(a.appointment_date) as last_appointment,
          COALESCE(SUM(s.price), 0) as total_spent
        FROM appointments a
        JOIN users u_client ON a.client_id = u_client.id
        JOIN services s ON a.service_id = s.id
        WHERE a.professional_id = $1 AND a.status = 'completed'
        GROUP BY u_client.id, u_client.name, u_client.phone, u_client.email
        ORDER BY total_appointments DESC, last_appointment DESC
      `;

      const result = await query(sql, [professionalId]);

      res.json({
        success: true,
        data: {
          clients: result.rows,
          total_clients: result.rows.length
        }
      });

    } catch (error) {
      console.error('Erro ao buscar clientes atendidos:', error);
      res.status(500).json({ error: 'Erro interno do servidor' });
    }
  }
}

export default ProfessionalController;