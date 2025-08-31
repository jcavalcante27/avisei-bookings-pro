import { query } from '../db.js';
import { User } from '../models/User.js';
import Service from '../models/Service.js';

class EstablishmentController {

  /**
   * Dashboard do estabelecimento
   */
  async getDashboard(req, res) {
    try {
      if (req.user.userType !== 'estabelecimento') {
        return res.status(403).json({ error: 'Acesso negado' });
      }

      const establishmentId = req.user.userId;

      // Estatísticas gerais
      const statsQuery = `
        SELECT 
          (SELECT COUNT(*) FROM services WHERE establishment_id = $1 AND active = true) as services_count,
          (SELECT COUNT(*) FROM users WHERE establishment_id = $1 AND user_type = 'funcionario' AND active = true) as employees_count,
          (SELECT COUNT(*) FROM appointments a 
           JOIN users u ON a.professional_id = u.id 
           WHERE u.establishment_id = $1 AND a.appointment_date = CURRENT_DATE) as today_appointments,
          (SELECT COALESCE(SUM(s.price), 0) FROM appointments a 
           JOIN users u ON a.professional_id = u.id 
           JOIN services s ON a.service_id = s.id
           WHERE u.establishment_id = $1 
           AND EXTRACT(MONTH FROM a.appointment_date) = EXTRACT(MONTH FROM CURRENT_DATE)
           AND EXTRACT(YEAR FROM a.appointment_date) = EXTRACT(YEAR FROM CURRENT_DATE)
           AND a.status = 'completed') as month_revenue
      `;

      // Agendamentos recentes
      const recentAppointmentsQuery = `
        SELECT 
          a.id,
          a.appointment_date,
          a.appointment_time,
          a.status,
          u_client.name as client_name,
          u_professional.name as professional_name,
          s.name as service_name,
          s.price
        FROM appointments a
        JOIN users u_client ON a.client_id = u_client.id
        JOIN users u_professional ON a.professional_id = u_professional.id
        JOIN services s ON a.service_id = s.id
        WHERE u_professional.establishment_id = $1
        ORDER BY a.appointment_date DESC, a.appointment_time DESC
        LIMIT 10
      `;

      // Top funcionários por agendamentos do mês
      const topEmployeesQuery = `
        SELECT 
          u.name,
          COUNT(a.id) as appointments_count,
          COALESCE(SUM(s.price), 0) as total_revenue,
          COALESCE(SUM(s.price * s.commission_percentage / 100), 0) as total_commission
        FROM users u
        LEFT JOIN appointments a ON u.id = a.professional_id 
          AND EXTRACT(MONTH FROM a.appointment_date) = EXTRACT(MONTH FROM CURRENT_DATE)
          AND EXTRACT(YEAR FROM a.appointment_date) = EXTRACT(YEAR FROM CURRENT_DATE)
          AND a.status = 'completed'
        LEFT JOIN services s ON a.service_id = s.id
        WHERE u.establishment_id = $1 AND u.user_type = 'funcionario' AND u.active = true
        GROUP BY u.id, u.name
        ORDER BY appointments_count DESC
        LIMIT 5
      `;

      const [stats, recentAppointments, topEmployees] = await Promise.all([
        query(statsQuery, [establishmentId]),
        query(recentAppointmentsQuery, [establishmentId]),
        query(topEmployeesQuery, [establishmentId])
      ]);

      res.json({
        success: true,
        data: {
          statistics: stats.rows[0],
          recent_appointments: recentAppointments.rows,
          top_employees: topEmployees.rows
        }
      });

    } catch (error) {
      console.error('Erro ao buscar dashboard estabelecimento:', error);
      res.status(500).json({ error: 'Erro interno do servidor' });
    }
  }

  /**
   * Gerenciar funcionários (CRUD)
   */
  async getEmployees(req, res) {
    try {
      if (req.user.userType !== 'estabelecimento') {
        return res.status(403).json({ error: 'Acesso negado' });
      }

      const sql = `
        SELECT 
          u.id,
          u.name,
          u.email,
          u.phone,
          u.active,
          u.created_at,
          COUNT(a.id) as total_appointments,
          COALESCE(SUM(CASE WHEN a.status = 'completed' THEN s.price END), 0) as total_revenue
        FROM users u
        LEFT JOIN appointments a ON u.id = a.professional_id AND a.status = 'completed'
        LEFT JOIN services s ON a.service_id = s.id
        WHERE u.establishment_id = $1 AND u.user_type = 'funcionario'
        GROUP BY u.id, u.name, u.email, u.phone, u.active, u.created_at
        ORDER BY u.name
      `;

      const result = await query(sql, [req.user.userId]);
      res.json({
        success: true,
        data: result.rows
      });

    } catch (error) {
      console.error('Erro ao buscar funcionários:', error);
      res.status(500).json({ error: 'Erro interno do servidor' });
    }
  }

  /**
   * Cadastrar novo funcionário
   */
  async createEmployee(req, res) {
    try {
      if (req.user.userType !== 'estabelecimento') {
        return res.status(403).json({ error: 'Acesso negado' });
      }

      const { name, email, phone, password } = req.body;

      if (!name || !email || !password) {
        return res.status(400).json({ error: 'Nome, email e senha são obrigatórios' });
      }

      // Verificar se email já existe
      const existingUser = await User.findByEmail(email);
      if (existingUser) {
        return res.status(400).json({ error: 'Email já está em uso' });
      }

      const userData = {
        name,
        email,
        phone,
        password,
        user_type: 'funcionario',
        establishment_id: req.user.userId
      };

      const employee = await User.create(userData);
      
      // Remover senha da resposta
      delete employee.password;

      res.status(201).json({
        success: true,
        data: employee,
        message: 'Funcionário cadastrado com sucesso'
      });

    } catch (error) {
      console.error('Erro ao cadastrar funcionário:', error);
      res.status(500).json({ error: 'Erro interno do servidor' });
    }
  }

  /**
   * Atualizar funcionário
   */
  async updateEmployee(req, res) {
    try {
      if (req.user.userType !== 'estabelecimento') {
        return res.status(403).json({ error: 'Acesso negado' });
      }

      const { employeeId } = req.params;
      const { name, email, phone, active } = req.body;

      // Verificar se funcionário pertence ao estabelecimento
      const employee = await User.findById(employeeId);
      if (!employee || employee.establishment_id !== req.user.userId) {
        return res.status(404).json({ error: 'Funcionário não encontrado' });
      }

      const sql = `
        UPDATE users 
        SET name = $1, email = $2, phone = $3, active = $4, updated_at = CURRENT_TIMESTAMP
        WHERE id = $5 AND establishment_id = $6
        RETURNING id, name, email, phone, active, created_at
      `;

      const result = await query(sql, [
        name || employee.name,
        email || employee.email,
        phone || employee.phone,
        active !== undefined ? active : employee.active,
        employeeId,
        req.user.userId
      ]);

      res.json({
        success: true,
        data: result.rows[0],
        message: 'Funcionário atualizado com sucesso'
      });

    } catch (error) {
      console.error('Erro ao atualizar funcionário:', error);
      res.status(500).json({ error: 'Erro interno do servidor' });
    }
  }

  /**
   * Consultar agendamentos por período
   */
  async getAppointmentsByPeriod(req, res) {
    try {
      if (req.user.userType !== 'estabelecimento') {
        return res.status(403).json({ error: 'Acesso negado' });
      }

      const { period = 'day', date, professional_id } = req.query;
      let dateFilter = '';
      const params = [req.user.id];
      let paramCount = 1;

      if (period === 'day') {
        dateFilter = `AND a.appointment_date = $${++paramCount}`;
        params.push(date || new Date().toISOString().split('T')[0]);
      } else if (period === 'week') {
        const startDate = date || new Date().toISOString().split('T')[0];
        dateFilter = `AND a.appointment_date >= $${++paramCount} AND a.appointment_date < $${++paramCount}`;
        const endDate = new Date(startDate);
        endDate.setDate(endDate.getDate() + 7);
        params.push(startDate, endDate.toISOString().split('T')[0]);
      } else if (period === 'month') {
        const targetDate = date ? new Date(date) : new Date();
        dateFilter = `AND EXTRACT(MONTH FROM a.appointment_date) = $${++paramCount} AND EXTRACT(YEAR FROM a.appointment_date) = $${++paramCount}`;
        params.push(targetDate.getMonth() + 1, targetDate.getFullYear());
      }

      if (professional_id) {
        dateFilter += ` AND a.professional_id = $${++paramCount}`;
        params.push(professional_id);
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
          u_professional.name as professional_name,
          s.name as service_name,
          s.duration,
          s.price,
          s.commission_percentage,
          ROUND(s.price * s.commission_percentage / 100, 2) as commission_amount
        FROM appointments a
        JOIN users u_client ON a.client_id = u_client.id
        JOIN users u_professional ON a.professional_id = u_professional.id
        JOIN services s ON a.service_id = s.id
        WHERE u_professional.establishment_id = $1 ${dateFilter}
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

      res.json({
        success: true,
        data: {
          appointments: result.rows,
          summary,
          period,
          filters: { date, professional_id }
        }
      });

    } catch (error) {
      console.error('Erro ao buscar agendamentos por período:', error);
      res.status(500).json({ error: 'Erro interno do servidor' });
    }
  }
}

export default EstablishmentController;