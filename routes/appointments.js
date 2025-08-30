import express from 'express';
import AppointmentController from '../controllers/appointmentController.js';
import { 
  authenticateToken, 
  requireCliente,
  requireFuncionario,
  requireEstabelecimento 
} from '../middleware/auth.js';

const router = express.Router();
const appointmentController = new AppointmentController();

// Criar agendamento (apenas clientes autenticados)
router.post('/', authenticateToken, requireCliente, (req, res) => {
  appointmentController.create(req, res);
});

// Buscar horários disponíveis para agendamento (público)
router.get('/available-slots', (req, res) => {
  appointmentController.getAvailableSlots(req, res);
});

// Buscar meus agendamentos
router.get('/my', authenticateToken, (req, res) => {
  appointmentController.getMyAppointments(req, res);
});

// Buscar agendamentos de hoje (estabelecimentos)
router.get('/today', authenticateToken, requireEstabelecimento, (req, res) => {
  appointmentController.getTodayAppointments(req, res);
});

// Buscar agendamento por ID
router.get('/:id', authenticateToken, (req, res) => {
  appointmentController.getById(req, res);
});

// Confirmar agendamento (estabelecimentos e funcionários)
router.patch('/:id/confirm', authenticateToken, requireFuncionario, (req, res) => {
  appointmentController.confirm(req, res);
});

// Cancelar agendamento
router.patch('/:id/cancel', authenticateToken, (req, res) => {
  appointmentController.cancel(req, res);
});

// Concluir agendamento (estabelecimentos e funcionários)
router.patch('/:id/complete', authenticateToken, requireFuncionario, (req, res) => {
  appointmentController.complete(req, res);
});

export default router;