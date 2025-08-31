import express from 'express';

// Importar rotas v1
import adminRoutes from './admin.js';
import establishmentRoutes from './establishment.js';
import professionalRoutes from './professional.js';
import clientRoutes from './client.js';
import exportRoutes from './export.js';

const router = express.Router();

// Registrar rotas v1
router.use('/admin', adminRoutes);
router.use('/establishment', establishmentRoutes);
router.use('/professional', professionalRoutes);
router.use('/client', clientRoutes);
router.use('/export', exportRoutes);

// Endpoint de informações da API v1
router.get('/', (req, res) => {
  res.json({
    message: 'Avisei API v1 - Sistema de Agendamento',
    version: '1.0.0',
    documentation: {
      super_admin: {
        dashboard: 'GET /api/v1/admin/dashboard',
        establishments: 'GET /api/v1/admin/establishments',
        users: 'GET /api/v1/admin/users',
        toggle_status: 'PATCH /api/v1/admin/users/:id/status',
        delete_user: 'DELETE /api/v1/admin/users/:id'
      },
      establishment: {
        dashboard: 'GET /api/v1/establishment/dashboard',
        employees: 'GET /api/v1/establishment/employees',
        create_employee: 'POST /api/v1/establishment/employees',
        update_employee: 'PUT /api/v1/establishment/employees/:id',
        appointments: 'GET /api/v1/establishment/appointments'
      },
      professional: {
        dashboard: 'GET /api/v1/professional/dashboard',
        schedule: 'GET /api/v1/professional/schedule',
        commissions: 'GET /api/v1/professional/commissions',
        clients: 'GET /api/v1/professional/clients'
      },
      client: {
        dashboard: 'GET /api/v1/client/dashboard',
        appointments: 'GET /api/v1/client/appointments',
        cancel: 'DELETE /api/v1/client/appointments/:id',
        reschedule: 'PATCH /api/v1/client/appointments/:id/reschedule'
      },
      export: {
        appointments: 'GET /api/v1/export/appointments?format=csv',
        commissions: 'GET /api/v1/export/commissions?format=json'
      }
    }
  });
});

export default router;