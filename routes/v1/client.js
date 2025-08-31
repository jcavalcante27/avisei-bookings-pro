import express from 'express';
import ClientController from '../../controllers/clientController.js';
import { authenticateToken, requireCliente } from '../../middleware/auth.js';

const router = express.Router();
const clientController = new ClientController();

// Todas as rotas exigem autenticação de cliente
router.use(authenticateToken);
router.use(requireCliente);

/**
 * Dashboard do Cliente
 * GET /api/v1/client/dashboard
 */
router.get('/dashboard', (req, res) => {
  clientController.getDashboard(req, res);
});

/**
 * Histórico de agendamentos do cliente
 * GET /api/v1/client/appointments?page=1&limit=20&status=completed
 * page, limit e status são opcionais
 */
router.get('/appointments', (req, res) => {
  clientController.getAppointmentHistory(req, res);
});

/**
 * Cancelar agendamento (regra: até 40 minutos antes)
 * DELETE /api/v1/client/appointments/:appointmentId
 * Body: { "reason": "Motivo do cancelamento" } (opcional)
 */
router.delete('/appointments/:appointmentId', (req, res) => {
  clientController.cancelAppointment(req, res);
});

/**
 * Reagendar compromisso
 * PATCH /api/v1/client/appointments/:appointmentId/reschedule
 * Body: { "new_date": "2025-09-01", "new_time": "14:30" }
 */
router.patch('/appointments/:appointmentId/reschedule', (req, res) => {
  clientController.rescheduleAppointment(req, res);
});

export default router;