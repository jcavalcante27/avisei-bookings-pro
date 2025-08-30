import express from 'express';
import ServiceController from '../controllers/serviceController.js';
import { 
  authenticateToken, 
  requireEstabelecimento,
  requireSelfOrHigher 
} from '../middleware/auth.js';

const router = express.Router();
const serviceController = new ServiceController();

// Criar serviço (apenas estabelecimentos)
router.post('/', authenticateToken, requireEstabelecimento, (req, res) => {
  serviceController.create(req, res);
});

// Listar todos os serviços (público)
router.get('/', (req, res) => {
  serviceController.getAll(req, res);
});

// Buscar serviço por ID (público)
router.get('/:id', (req, res) => {
  serviceController.getById(req, res);
});

// Buscar serviços por estabelecimento (público)
router.get('/establishment/:establishment_id', (req, res) => {
  serviceController.getByEstablishment(req, res);
});

// Atualizar serviço (apenas dono)
router.put('/:id', authenticateToken, requireEstabelecimento, (req, res) => {
  serviceController.update(req, res);
});

// Deletar serviço (apenas dono)
router.delete('/:id', authenticateToken, requireEstabelecimento, (req, res) => {
  serviceController.delete(req, res);
});

export default router;