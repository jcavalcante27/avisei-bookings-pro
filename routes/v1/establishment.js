import express from 'express';
import EstablishmentController from '../../controllers/establishmentController.js';
import { authenticateToken, requireEstabelecimento } from '../../middleware/auth.js';

const router = express.Router();
const establishmentController = new EstablishmentController();

// Todas as rotas exigem autenticação de estabelecimento
router.use(authenticateToken);
router.use(requireEstabelecimento);

/**
 * Dashboard do Estabelecimento
 * GET /api/v1/establishment/dashboard
 */
router.get('/dashboard', (req, res) => {
  establishmentController.getDashboard(req, res);
});

/**
 * Gerenciar funcionários
 */

// Listar funcionários do estabelecimento
// GET /api/v1/establishment/employees
router.get('/employees', (req, res) => {
  establishmentController.getEmployees(req, res);
});

// Cadastrar novo funcionário
// POST /api/v1/establishment/employees
// Body: { "name": "João", "email": "joao@email.com", "phone": "11999999999", "password": "senha123" }
router.post('/employees', (req, res) => {
  establishmentController.createEmployee(req, res);
});

// Atualizar funcionário
// PUT /api/v1/establishment/employees/:employeeId
// Body: { "name": "João Silva", "email": "joao.silva@email.com", "phone": "11888888888", "active": true }
router.put('/employees/:employeeId', (req, res) => {
  establishmentController.updateEmployee(req, res);
});

/**
 * Consultar agendamentos por período
 * GET /api/v1/establishment/appointments?period=day&date=2025-08-31&professional_id=123
 * period: day, week, month
 * date: YYYY-MM-DD (opcional, padrão hoje)
 * professional_id: filtro por profissional (opcional)
 */
router.get('/appointments', (req, res) => {
  establishmentController.getAppointmentsByPeriod(req, res);
});

export default router;