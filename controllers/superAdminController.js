import { query } from '../db.js';
import { User } from '../models/User.js';

class SuperAdminController {

  /**
   * Dashboard Super Admin - Visão geral do sistema
   */
  async getDashboard(req, res) {
    try {
      // Verificar se é super admin
      if (req.user.userType !== 'super_admin') {
        return res.status(403).json({ error: 'Acesso negado' });
      }

      // Contar usuários por tipo
      const userStatsQuery = `
        SELECT 
          user_type,
          COUNT(*) as count,
          COUNT(CASE WHEN active = true THEN 1 END) as active_count
        FROM users 
        GROUP BY user_type
      `;

      // Estatísticas de agendamentos do sistema
      const appointmentStatsQuery = `
        SELECT 
          COUNT(*) as total_appointments,
          COUNT(CASE WHEN status = 'scheduled' THEN 1 END) as scheduled,
          COUNT(CASE WHEN status = 'confirmed' THEN 1 END) as confirmed,
          COUNT(CASE WHEN status = 'completed' THEN 1 END) as completed,
          COUNT(CASE WHEN status = 'cancelled' THEN 1 END) as cancelled,
          COALESCE(SUM(CASE WHEN status = 'completed' THEN s.price END), 0) as total_revenue
        FROM appointments a
        LEFT JOIN services s ON a.service_id = s.id
      `;

      // Estatísticas do mês atual
      const monthStatsQuery = `
        SELECT 
          COUNT(*) as appointments_this_month,
          COALESCE(SUM(s.price), 0) as revenue_this_month
        FROM appointments a
        LEFT JOIN services s ON a.service_id = s.id
        WHERE EXTRACT(MONTH FROM a.appointment_date) = EXTRACT(MONTH FROM CURRENT_DATE)
        AND EXTRACT(YEAR FROM a.appointment_date) = EXTRACT(YEAR FROM CURRENT_DATE)
        AND a.status = 'completed'
      `;

      const [userStats, appointmentStats, monthStats] = await Promise.all([
        query(userStatsQuery),
        query(appointmentStatsQuery),
        query(monthStatsQuery)
      ]);

      res.json({
        success: true,
        data: {
          users: userStats.rows,
          appointments: appointmentStats.rows[0],
          current_month: monthStats.rows[0]
        }
      });

    } catch (error) {
      console.error('Erro ao buscar dashboard super admin:', error);
      res.status(500).json({ error: 'Erro interno do servidor' });
    }
  }

  /**
   * Listar todos os estabelecimentos
   */
  async getEstablishments(req, res) {
    try {
      if (req.user.userType !== 'super_admin') {
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
          COUNT(services.id) as services_count,
          COUNT(employees.id) as employees_count
        FROM users u
        LEFT JOIN services ON u.id = services.establishment_id AND services.active = true
        LEFT JOIN users employees ON u.id = employees.establishment_id AND employees.active = true
        WHERE u.user_type = 'estabelecimento'
        GROUP BY u.id, u.name, u.email, u.phone, u.active, u.created_at
        ORDER BY u.created_at DESC
      `;

      const result = await query(sql);
      res.json({
        success: true,
        data: result.rows
      });

    } catch (error) {
      console.error('Erro ao buscar estabelecimentos:', error);
      res.status(500).json({ error: 'Erro interno do servidor' });
    }
  }

  /**
   * Suspender/Reativar conta
   */
  async toggleAccountStatus(req, res) {
    try {
      if (req.user.userType !== 'super_admin') {
        return res.status(403).json({ error: 'Acesso negado' });
      }

      const { userId } = req.params;
      const { active } = req.body;

      if (typeof active !== 'boolean') {
        return res.status(400).json({ error: 'Status deve ser true ou false' });
      }

      // Não permitir desativar super admins
      const user = await User.findById(userId);
      if (!user) {
        return res.status(404).json({ error: 'Usuário não encontrado' });
      }

      if (user.user_type === 'super_admin') {
        return res.status(403).json({ error: 'Não é possível alterar status de super admin' });
      }

      const sql = 'UPDATE users SET active = $1 WHERE id = $2 RETURNING *';
      const result = await query(sql, [active, userId]);

      res.json({
        success: true,
        data: result.rows[0],
        message: `Conta ${active ? 'reativada' : 'suspensa'} com sucesso`
      });

    } catch (error) {
      console.error('Erro ao alterar status da conta:', error);
      res.status(500).json({ error: 'Erro interno do servidor' });
    }
  }

  /**
   * Deletar conta (soft delete)
   */
  async deleteAccount(req, res) {
    try {
      if (req.user.userType !== 'super_admin') {
        return res.status(403).json({ error: 'Acesso negado' });
      }

      const { userId } = req.params;

      // Verificar se não é super admin
      const user = await User.findById(userId);
      if (!user) {
        return res.status(404).json({ error: 'Usuário não encontrado' });
      }

      if (user.user_type === 'super_admin') {
        return res.status(403).json({ error: 'Não é possível deletar super admin' });
      }

      // Soft delete
      const sql = 'UPDATE users SET active = false, deleted_at = CURRENT_TIMESTAMP WHERE id = $1';
      await query(sql, [userId]);

      res.json({
        success: true,
        message: 'Conta deletada com sucesso'
      });

    } catch (error) {
      console.error('Erro ao deletar conta:', error);
      res.status(500).json({ error: 'Erro interno do servidor' });
    }
  }

  /**
   * Ver todos os usuários com filtros
   */
  async getAllUsers(req, res) {
    try {
      if (req.user.userType !== 'super_admin') {
        return res.status(403).json({ error: 'Acesso negado' });
      }

      const { user_type, active, page = 1, limit = 50 } = req.query;
      const offset = (page - 1) * limit;

      let sql = `
        SELECT 
          id, name, email, phone, user_type, active, created_at,
          establishment_id
        FROM users 
        WHERE 1=1
      `;
      const params = [];
      let paramCount = 0;

      if (user_type) {
        sql += ` AND user_type = $${++paramCount}`;
        params.push(user_type);
      }

      if (active !== undefined) {
        sql += ` AND active = $${++paramCount}`;
        params.push(active === 'true');
      }

      sql += ` ORDER BY created_at DESC LIMIT $${++paramCount} OFFSET $${++paramCount}`;
      params.push(limit, offset);

      const result = await query(sql, params);

      // Contar total para paginação
      let countSql = 'SELECT COUNT(*) FROM users WHERE 1=1';
      const countParams = [];
      let countParamCount = 0;

      if (user_type) {
        countSql += ` AND user_type = $${++countParamCount}`;
        countParams.push(user_type);
      }

      if (active !== undefined) {
        countSql += ` AND active = $${++countParamCount}`;
        countParams.push(active === 'true');
      }

      const countResult = await query(countSql, countParams);
      const total = parseInt(countResult.rows[0].count);

      res.json({
        success: true,
        data: {
          users: result.rows,
          pagination: {
            current_page: parseInt(page),
            total_pages: Math.ceil(total / limit),
            total_users: total,
            per_page: parseInt(limit)
          }
        }
      });

    } catch (error) {
      console.error('Erro ao buscar usuários:', error);
      res.status(500).json({ error: 'Erro interno do servidor' });
    }
  }
}

export default SuperAdminController;