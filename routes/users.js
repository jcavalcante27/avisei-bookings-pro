import express from 'express';
import { User } from '../models/User.js';
import { 
  authenticateToken, 
  requireSuperAdmin, 
  requireEstabelecimento,
  requireSelfOrHigher 
} from '../middleware/auth.js';
import BaseController from '../controllers/baseController.js';

const router = express.Router();
const baseController = new BaseController();

// Listar todos os usuários (apenas Super Admin)
router.get('/', authenticateToken, requireSuperAdmin, async (req, res) => {
  try {
    const users = await User.getAllByType(req.query.type);
    return baseController.success(res, users, 'Usuários listados com sucesso');
  } catch (error) {
    console.error('Erro ao listar usuários:', error);
    return baseController.error(res, 'Erro interno do servidor');
  }
});

// Buscar usuário por ID
router.get('/:userId', authenticateToken, requireSelfOrHigher, async (req, res) => {
  try {
    const user = await User.findById(req.params.userId);
    if (!user) {
      return baseController.notFound(res, 'Usuário não encontrado');
    }
    
    return baseController.success(res, {
      id: user.id,
      name: user.name,
      email: user.email,
      user_type: user.user_type,
      created_at: user.created_at
    });
  } catch (error) {
    console.error('Erro ao buscar usuário:', error);
    return baseController.error(res, 'Erro interno do servidor');
  }
});

// Desativar usuário (apenas Super Admin e Estabelecimento)
router.delete('/:userId', authenticateToken, requireEstabelecimento, async (req, res) => {
  try {
    await User.deactivate(req.params.userId);
    return baseController.success(res, null, 'Usuário desativado com sucesso');
  } catch (error) {
    console.error('Erro ao desativar usuário:', error);
    return baseController.error(res, 'Erro interno do servidor');
  }
});

export default router;