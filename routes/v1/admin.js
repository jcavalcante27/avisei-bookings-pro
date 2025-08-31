import express from 'express';
import SuperAdminController from '../../controllers/superAdminController.js';
import { authenticateToken, requireSuperAdmin } from '../../middleware/auth.js';

const router = express.Router();
const superAdminController = new SuperAdminController();

// Todas as rotas exigem autenticação de super admin
router.use(authenticateToken);
router.use(requireSuperAdmin);

/**
 * Dashboard do Super Admin
 * GET /api/v1/admin/dashboard
 */
router.get('/dashboard', (req, res) => {
  superAdminController.getDashboard(req, res);
});

/**
 * Listar todos os estabelecimentos
 * GET /api/v1/admin/establishments
 */
router.get('/establishments', (req, res) => {
  superAdminController.getEstablishments(req, res);
});

/**
 * Listar todos os usuários com filtros e paginação
 * GET /api/v1/admin/users?user_type=cliente&active=true&page=1&limit=50
 */
router.get('/users', (req, res) => {
  superAdminController.getAllUsers(req, res);
});

/**
 * Suspender ou reativar conta
 * PATCH /api/v1/admin/users/:userId/status
 * Body: { "active": true/false }
 */
router.patch('/users/:userId/status', (req, res) => {
  superAdminController.toggleAccountStatus(req, res);
});

/**
 * Deletar conta (soft delete)
 * DELETE /api/v1/admin/users/:userId
 */
router.delete('/users/:userId', (req, res) => {
  superAdminController.deleteAccount(req, res);
});

export default router;