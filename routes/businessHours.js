import express from 'express';
import BusinessHourController from '../controllers/businessHourController.js';
import { 
  authenticateToken, 
  requireEstabelecimento 
} from '../middleware/auth.js';

const router = express.Router();
const businessHourController = new BusinessHourController();

// Configurar horário individual (apenas estabelecimentos)
router.post('/', authenticateToken, requireEstabelecimento, (req, res) => {
  businessHourController.create(req, res);
});

// Atualizar múltiplos horários de uma vez (apenas estabelecimentos)
router.post('/bulk', authenticateToken, requireEstabelecimento, (req, res) => {
  businessHourController.bulkUpdate(req, res);
});

// Buscar horários por estabelecimento (público)
router.get('/establishment/:establishment_id', (req, res) => {
  businessHourController.getByEstablishment(req, res);
});

// Buscar horários formatados por estabelecimento (público)
router.get('/establishment/:establishment_id/formatted', (req, res) => {
  businessHourController.getFormattedSchedule(req, res);
});

export default router;