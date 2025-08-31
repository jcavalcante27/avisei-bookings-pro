import { query } from '../db.js';
import emailService from '../utils/emailService.js';

class ClientController {

  /**
   * Dashboard do cliente
   */
  async getDashboard(req, res) {
    try {
      if (req.user.userType !== 'cliente') {
        return res.status(403).json({ error: 'Acesso negado' });
      }

      const clientId = req.user.userId;

      // Estatísticas do cliente
      const statsQuery = `
        SELECT 
          COUNT(*) as total_appointments,
          COUNT(CASE WHEN status = 'completed' THEN 1 END) as completed_appointments,
          COUNT(CASE WHEN status = 'cancelled' THEN 1 END) as cancelled_appointments,
          COUNT(CASE WHEN appointment_date >= CURRENT_DATE THEN 1 END) as upcoming_appointments,
          COALESCE(SUM(CASE WHEN status = 'completed' THEN s.price END), 0) as total_spent
        FROM appointments a
        JOIN services s ON a.service_id = s.id
        WHERE a.client_id = $1
      `;

      // Próximos agendamentos
      const upcomingQuery = `
        SELECT 
          a.id,
          a.appointment_date,
          a.appointment_time,
          a.status,
          u_professional.name as professional_name,
          u_establishment.name as establishment_name,
          s.name as service_name,
          s.duration,
          s.price
        FROM appointments a
        JOIN users u_professional ON a.professional_id = u_professional.id
        JOIN users u_establishment ON u_professional.establishment_id = u_establishment.id
        JOIN services s ON a.service_id = s.id
        WHERE a.client_id = $1
        AND (a.appointment_date > CURRENT_DATE 
             OR (a.appointment_date = CURRENT_DATE AND a.appointment_time > CURRENT_TIME))
        AND a.status IN ('scheduled', 'confirmed')
        ORDER BY a.appointment_date, a.appointment_time
        LIMIT 5
      `;

      // Últimos agendamentos
      const recentQuery = `
        SELECT 
          a.id,
          a.appointment_date,
          a.appointment_time,
          a.status,
          u_professional.name as professional_name,
          u_establishment.name as establishment_name,
          s.name as service_name,
          s.price
        FROM appointments a
        JOIN users u_professional ON a.professional_id = u_professional.id
        JOIN users u_establishment ON u_professional.establishment_id = u_establishment.id
        JOIN services s ON a.service_id = s.id
        WHERE a.client_id = $1
        ORDER BY a.appointment_date DESC, a.appointment_time DESC
        LIMIT 5
      `;

      const [stats, upcoming, recent] = await Promise.all([
        query(statsQuery, [clientId]),
        query(upcomingQuery, [clientId]),
        query(recentQuery, [clientId])
      ]);

      res.json({
        success: true,
        data: {
          statistics: stats.rows[0],
          upcoming_appointments: upcoming.rows,
          recent_appointments: recent.rows
        }
      });

    } catch (error) {
      console.error('Erro ao buscar dashboard cliente:', error);
      res.status(500).json({ error: 'Erro interno do servidor' });
    }
  }

  /**
   * Histórico de agendamentos do cliente
   */
  async getAppointmentHistory(req, res) {
    try {
      if (req.user.userType !== 'cliente') {
        return res.status(403).json({ error: 'Acesso negado' });
      }

      const { page = 1, limit = 20, status } = req.query;
      const offset = (page - 1) * limit;
      const clientId = req.user.userId;

      let statusFilter = '';
      const params = [clientId];
      let paramCount = 1;

      if (status) {
        statusFilter = `AND a.status = $${++paramCount}`;
        params.push(status);
      }

      const sql = `
        SELECT 
          a.id,
          a.appointment_date,
          a.appointment_time,
          a.status,
          a.created_at,
          u_professional.name as professional_name,
          u_establishment.name as establishment_name,
          u_establishment.phone as establishment_phone,
          s.name as service_name,
          s.duration,
          s.price
        FROM appointments a
        JOIN users u_professional ON a.professional_id = u_professional.id
        JOIN users u_establishment ON u_professional.establishment_id = u_establishment.id
        JOIN services s ON a.service_id = s.id
        WHERE a.client_id = $1 ${statusFilter}
        ORDER BY a.appointment_date DESC, a.appointment_time DESC
        LIMIT $${++paramCount} OFFSET $${++paramCount}
      `;

      params.push(limit, offset);

      // Contar total para paginação
      const countSql = `
        SELECT COUNT(*) 
        FROM appointments a 
        WHERE a.client_id = $1 ${statusFilter}
      `;
      const countParams = status ? [clientId, status] : [clientId];

      const [appointments, countResult] = await Promise.all([
        query(sql, params),
        query(countSql, countParams)
      ]);

      const total = parseInt(countResult.rows[0].count);

      res.json({
        success: true,
        data: {
          appointments: appointments.rows,
          pagination: {
            current_page: parseInt(page),
            total_pages: Math.ceil(total / limit),
            total_appointments: total,
            per_page: parseInt(limit)
          }
        }
      });

    } catch (error) {
      console.error('Erro ao buscar histórico de agendamentos:', error);
      res.status(500).json({ error: 'Erro interno do servidor' });
    }
  }

  /**
   * Cancelar agendamento (regra: até 40 minutos antes)
   */
  async cancelAppointment(req, res) {
    try {
      if (req.user.userType !== 'cliente') {
        return res.status(403).json({ error: 'Acesso negado' });
      }

      const { appointmentId } = req.params;
      const { reason } = req.body;
      const clientId = req.user.userId;

      // Buscar agendamento
      const appointmentSql = `
        SELECT 
          a.*,
          u_professional.name as professional_name,
          u_professional.email as professional_email,
          u_establishment.name as establishment_name,
          u_establishment.email as establishment_email,
          s.name as service_name
        FROM appointments a
        JOIN users u_professional ON a.professional_id = u_professional.id
        JOIN users u_establishment ON u_professional.establishment_id = u_establishment.id
        JOIN services s ON a.service_id = s.id
        WHERE a.id = $1 AND a.client_id = $2
      `;

      const appointmentResult = await query(appointmentSql, [appointmentId, clientId]);
      
      if (appointmentResult.rows.length === 0) {
        return res.status(404).json({ error: 'Agendamento não encontrado' });
      }

      const appointment = appointmentResult.rows[0];

      // Verificar se já foi cancelado
      if (appointment.status === 'cancelled') {
        return res.status(400).json({ error: 'Agendamento já foi cancelado' });
      }

      // Verificar se já foi concluído
      if (appointment.status === 'completed') {
        return res.status(400).json({ error: 'Não é possível cancelar agendamento já concluído' });
      }

      // Verificar regra de 40 minutos antes
      const appointmentDateTime = new Date(`${appointment.appointment_date.toISOString().split('T')[0]}T${appointment.appointment_time}`);
      const now = new Date();
      const timeDifference = appointmentDateTime.getTime() - now.getTime();
      const minutesDifference = timeDifference / (1000 * 60);

      if (minutesDifference < 40) {
        return res.status(400).json({ 
          error: 'Cancelamento deve ser feito com pelo menos 40 minutos de antecedência',
          minutes_until_appointment: Math.floor(minutesDifference)
        });
      }

      // Cancelar agendamento
      const cancelSql = `
        UPDATE appointments 
        SET status = 'cancelled', cancellation_reason = $1, cancelled_at = CURRENT_TIMESTAMP
        WHERE id = $2
        RETURNING *
      `;

      await query(cancelSql, [reason || 'Cancelado pelo cliente', appointmentId]);

      // Enviar email de cancelamento
      try {
        const client = req.user;
        
        // Email para o cliente
        await emailService.sendCancellationEmail(
          client.email,
          client.name,
          {
            id: appointment.id,
            date: appointment.appointment_date,
            time: appointment.appointment_time,
            service: appointment.service_name,
            professional: appointment.professional_name,
            establishment: appointment.establishment_name
          }
        );

        // Email para o estabelecimento
        await emailService.sendCancellationEmail(
          appointment.establishment_email,
          appointment.establishment_name,
          {
            id: appointment.id,
            date: appointment.appointment_date,
            time: appointment.appointment_time,
            service: appointment.service_name,
            professional: appointment.professional_name,
            client: client.name,
            client_phone: client.phone
          },
          true // isEstablishment
        );

      } catch (emailError) {
        console.error('Erro ao enviar email de cancelamento:', emailError);
        // Não falhar o cancelamento por erro de email
      }

      res.json({
        success: true,
        message: 'Agendamento cancelado com sucesso',
        data: {
          appointment_id: appointmentId,
          cancelled_at: new Date(),
          reason: reason || 'Cancelado pelo cliente'
        }
      });

    } catch (error) {
      console.error('Erro ao cancelar agendamento:', error);
      res.status(500).json({ error: 'Erro interno do servidor' });
    }
  }

  /**
   * Reagendar compromisso (mesmo que criar novo)
   */
  async rescheduleAppointment(req, res) {
    try {
      if (req.user.userType !== 'cliente') {
        return res.status(403).json({ error: 'Acesso negado' });
      }

      const { appointmentId } = req.params;
      const { new_date, new_time } = req.body;
      const clientId = req.user.userId;

      if (!new_date || !new_time) {
        return res.status(400).json({ error: 'Nova data e horário são obrigatórios' });
      }

      // Buscar agendamento original
      const originalAppointment = await query(
        'SELECT * FROM appointments WHERE id = $1 AND client_id = $2',
        [appointmentId, clientId]
      );

      if (originalAppointment.rows.length === 0) {
        return res.status(404).json({ error: 'Agendamento não encontrado' });
      }

      const appointment = originalAppointment.rows[0];

      // Verificar se pode reagendar (mesmas regras de cancelamento)
      const appointmentDateTime = new Date(`${appointment.appointment_date.toISOString().split('T')[0]}T${appointment.appointment_time}`);
      const now = new Date();
      const timeDifference = appointmentDateTime.getTime() - now.getTime();
      const minutesDifference = timeDifference / (1000 * 60);

      if (minutesDifference < 40) {
        return res.status(400).json({ 
          error: 'Reagendamento deve ser feito com pelo menos 40 minutos de antecedência'
        });
      }

      // Verificar disponibilidade do novo horário
      const conflictCheck = await query(
        `SELECT id FROM appointments 
         WHERE professional_id = $1 AND appointment_date = $2 AND appointment_time = $3 
         AND status IN ('scheduled', 'confirmed') AND id != $4`,
        [appointment.professional_id, new_date, new_time, appointmentId]
      );

      if (conflictCheck.rows.length > 0) {
        return res.status(400).json({ error: 'Horário não disponível' });
      }

      // Atualizar agendamento
      const updateSql = `
        UPDATE appointments 
        SET appointment_date = $1, appointment_time = $2, status = 'scheduled', updated_at = CURRENT_TIMESTAMP
        WHERE id = $3
        RETURNING *
      `;

      const result = await query(updateSql, [new_date, new_time, appointmentId]);

      res.json({
        success: true,
        message: 'Agendamento reagendado com sucesso',
        data: result.rows[0]
      });

    } catch (error) {
      console.error('Erro ao reagendar agendamento:', error);
      res.status(500).json({ error: 'Erro interno do servidor' });
    }
  }
}

export default ClientController;