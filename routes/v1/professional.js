import express from 'express';
import ProfessionalController from '../../controllers/professionalController.js';
import { authenticateToken, requireFuncionario } from '../../middleware/auth.js';

const router = express.Router();
const professionalController = new ProfessionalController();

// Todas as rotas exigem autenticação de funcionário ou estabelecimento
router.use(authenticateToken);
router.use(requireFuncionario);

/**
 * Dashboard do Profissional/Funcionário
 * GET /api/v1/professional/dashboard
 */
router.get('/dashboard', (req, res) => {
  professionalController.getDashboard(req, res);
});

/**
 * Visualizar agenda do profissional
 * GET /api/v1/professional/schedule?start_date=2025-08-31&end_date=2025-09-07
 * start_date e end_date são opcionais (padrão: próximos 7 dias)
 */
router.get('/schedule', (req, res) => {
  professionalController.getSchedule(req, res);
});

/**
 * Visualizar comissões do profissional
 * GET /api/v1/professional/commissions?month=8&year=2025
 * month e year são opcionais (padrão: mês atual)
 */
router.get('/commissions', (req, res) => {
  professionalController.getCommissions(req, res);
});

/**
 * Clientes atendidos pelo profissional
 * GET /api/v1/professional/clients
 */
router.get('/clients', (req, res) => {
  professionalController.getClientsServed(req, res);
});

export default router;