import express from 'express';
import AuthController from '../controllers/authController.js';
import { authenticateToken, requireSuperAdmin } from '../middleware/auth.js';

const router = express.Router();
const authController = new AuthController();

// Rotas públicas (não requerem autenticação)
router.post('/register', (req, res) => authController.register(req, res));
router.post('/login', (req, res) => authController.login(req, res));

// Rotas protegidas (requerem autenticação)
router.get('/profile', authenticateToken, (req, res) => authController.getProfile(req, res));
router.post('/verify', (req, res) => authController.verifyToken(req, res));

// Rotas específicas para cadastro de cada tipo de usuário
router.post('/register/super-admin', requireSuperAdmin, (req, res) => {
  req.body.user_type = 'super_admin';
  authController.register(req, res);
});

router.post('/register/estabelecimento', requireSuperAdmin, (req, res) => {
  req.body.user_type = 'estabelecimento';
  authController.register(req, res);
});

router.post('/register/funcionario', authenticateToken, (req, res) => {
  // TODO: Implementar lógica para permitir apenas estabelecimentos cadastrarem funcionários
  req.body.user_type = 'funcionario';
  authController.register(req, res);
});

router.post('/register/cliente', (req, res) => {
  req.body.user_type = 'cliente';
  authController.register(req, res);
});

export default router;