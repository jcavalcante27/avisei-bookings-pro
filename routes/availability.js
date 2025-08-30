import express from 'express';
import AvailabilityController from '../controllers/availabilityController.js';
import { 
  authenticateToken, 
  requireFuncionario 
} from '../middleware/auth.js';

const router = express.Router();
const availabilityController = new AvailabilityController();

// Configurar disponibilidade (funcionários e estabelecimentos)
router.post('/', authenticateToken, requireFuncionario, (req, res) => {
  availabilityController.create(req, res);
});

// Buscar disponibilidade por profissional (público)
router.get('/professional/:professional_id', (req, res) => {
  availabilityController.getByProfessional(req, res);
});

// Buscar disponibilidade formatada por profissional (público)
router.get('/professional/:professional_id/formatted', (req, res) => {
  availabilityController.getFormattedAvailability(req, res);
});

// Buscar disponibilidade por estabelecimento
router.get('/establishment/:establishment_id', authenticateToken, (req, res) => {
  availabilityController.getByEstablishment(req, res);
});

// Buscar horários disponíveis para agendamento (público)
router.get('/slots/:professional_id', (req, res) => {
  availabilityController.getAvailableSlots(req, res);
});

// Atualizar disponibilidade
router.put('/:id', authenticateToken, requireFuncionario, (req, res) => {
  availabilityController.update(req, res);
});

// Remover disponibilidade
router.delete('/:id', authenticateToken, requireFuncionario, (req, res) => {
  availabilityController.delete(req, res);
});

export default router;