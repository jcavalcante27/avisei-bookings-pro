import express from 'express';
import ReportController from '../controllers/reportController.js';
import { 
  authenticateToken, 
  requireFuncionario 
} from '../middleware/auth.js';

const router = express.Router();
const reportController = new ReportController();

// Todas as rotas de relatórios requerem autenticação de funcionário ou superior
router.use(authenticateToken);
router.use(requireFuncionario);

/**
 * Relatório de agendamentos por profissional
 * Query params:
 * - professional_id: ID do profissional (opcional)
 * - start_date: Data início (YYYY-MM-DD)
 * - end_date: Data fim (YYYY-MM-DD)
 * - status: Status do agendamento (optional)
 */
router.get('/appointments', (req, res) => {
  reportController.getAppointmentsByProfessional(req, res);
});

/**
 * Relatório de comissões por atendimento
 * Query params:
 * - professional_id: ID do profissional (opcional)
 * - start_date: Data início (YYYY-MM-DD)
 * - end_date: Data fim (YYYY-MM-DD)
 * - month: Mês (1-12)
 * - year: Ano (YYYY)
 */
router.get('/commissions', (req, res) => {
  reportController.getCommissionReport(req, res);
});

/**
 * Resumo para dashboard
 * Retorna dados de hoje e do mês atual
 */
router.get('/dashboard', (req, res) => {
  reportController.getDashboardSummary(req, res);
});

export default router;