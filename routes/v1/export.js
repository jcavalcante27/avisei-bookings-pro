import express from 'express';
import ReportController from '../../controllers/reportController.js';
import { authenticateToken } from '../../middleware/auth.js';

const router = express.Router();
const reportController = new ReportController();

// Todas as rotas exigem autenticação
router.use(authenticateToken);

/**
 * Exportar agendamentos por profissional
 * GET /api/v1/export/appointments/professional?format=csv&professional_id=1&start_date=2025-08-01&end_date=2025-08-31
 */
router.get('/appointments/professional', reportController.getAppointmentsByProfessional.bind(reportController));

/**
 * Exportar agendamentos por data/período
 * GET /api/v1/export/appointments/date?format=xlsx&date=2025-08-01&period=week
 */
router.get('/appointments/date', reportController.getAppointmentsByDate.bind(reportController));

/**
 * Exportar relatório de comissões
 * GET /api/v1/export/commissions?format=csv&start_date=2025-08-01&end_date=2025-08-31&professional_id=1
 */
router.get('/commissions', reportController.getCommissionReport.bind(reportController));

/**
 * Endpoint legado para compatibilidade - agendamentos (redirect para professional)
 * GET /api/v1/export/appointments?format=csv&start_date=2025-08-01&end_date=2025-08-31
 */
router.get('/appointments', reportController.getAppointmentsByProfessional.bind(reportController));

export default router;