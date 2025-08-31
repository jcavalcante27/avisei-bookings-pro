import express from 'express';
import ReportController from '../../controllers/reportController.js';
import SuperAdminController from '../../controllers/superAdminController.js';
import EstablishmentController from '../../controllers/establishmentController.js';
import ExportService from '../../utils/exportService.js';
import { authenticateToken, requireFuncionario } from '../../middleware/auth.js';

const router = express.Router();
const reportController = new ReportController();
const superAdminController = new SuperAdminController();
const establishmentController = new EstablishmentController();

// Todas as rotas exigem autenticação
router.use(authenticateToken);

/**
 * Exportar relatório de agendamentos
 * GET /api/v1/export/appointments?format=csv&start_date=2025-08-01&end_date=2025-08-31
 */
router.get('/appointments', requireFuncionario, async (req, res) => {
  try {
    const { format = 'json' } = req.query;
    
    // Reutilizar controller de relatórios para buscar dados
    const mockRes = {
      json: (data) => data,
      status: () => mockRes
    };
    
    const reportData = await new Promise((resolve) => {
      const originalRes = res;
      res.json = (data) => resolve(data);
      res.status = () => res;
      reportController.getAppointmentsByProfessional(req, res);
    });

    if (!reportData.success) {
      return res.status(400).json(reportData);
    }

    const exported = ExportService.formatAppointmentsForExport(
      reportData.data.appointments, 
      format
    );

    res.setHeader('Content-Type', exported.contentType);
    res.setHeader('Content-Disposition', `attachment; filename="${exported.filename}"`);
    res.send(exported.content);

  } catch (error) {
    console.error('Erro ao exportar agendamentos:', error);
    res.status(500).json({ error: 'Erro ao exportar dados' });
  }
});

/**
 * Exportar relatório de comissões
 * GET /api/v1/export/commissions?format=csv&month=8&year=2025
 */
router.get('/commissions', requireFuncionario, async (req, res) => {
  try {
    const { format = 'json' } = req.query;
    
    const mockRes = {
      json: (data) => data,
      status: () => mockRes
    };
    
    const reportData = await new Promise((resolve) => {
      const originalRes = res;
      res.json = (data) => resolve(data);
      res.status = () => res;
      reportController.getCommissionReport(req, res);
    });

    if (!reportData.success) {
      return res.status(400).json(reportData);
    }

    const exported = ExportService.formatCommissionsForExport(
      reportData.data.all_appointments, 
      format
    );

    res.setHeader('Content-Type', exported.contentType);
    res.setHeader('Content-Disposition', `attachment; filename="${exported.filename}"`);
    res.send(exported.content);

  } catch (error) {
    console.error('Erro ao exportar comissões:', error);
    res.status(500).json({ error: 'Erro ao exportar dados' });
  }
});

export default router;