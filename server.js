import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { testConnection } from './db.js';
import { User } from './models/User.js';
import Service from './models/Service.js';
import BusinessHour from './models/BusinessHour.js';
import ProfessionalAvailability from './models/ProfessionalAvailability.js';
import Appointment from './models/Appointment.js';

// Configurar dotenv
dotenv.config();

// Importar rotas
import authRoutes from './routes/auth.js';
import userRoutes from './routes/users.js';
import indexRoutes from './routes/index.js';
import serviceRoutes from './routes/services.js';
import businessHourRoutes from './routes/businessHours.js';
import availabilityRoutes from './routes/availability.js';
import appointmentRoutes from './routes/appointments.js';

const app = express();
const PORT = process.env.PORT || 3000;

// Middlewares
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Rota de health check
app.get('/health', (req, res) => {
  res.status(200).json({ status: 'ok', message: 'Servidor funcionando!' });
});

// Rotas da API
app.use('/api', indexRoutes);
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/services', serviceRoutes);
app.use('/api/business-hours', businessHourRoutes);
app.use('/api/availability', availabilityRoutes);
app.use('/api/appointments', appointmentRoutes);

// Rota raiz
app.get('/', (req, res) => {
  res.json({ 
    message: 'API do Avisei - Sistema de Agendamento', 
    version: '1.0.0',
    endpoints: {
      auth: {
        register: 'POST /api/auth/register',
        login: 'POST /api/auth/login', 
        profile: 'GET /api/auth/profile',
        verify: 'POST /api/auth/verify'
      },
      users: {
        list: 'GET /api/users',
        get: 'GET /api/users/:id',
        delete: 'DELETE /api/users/:id'
      },
      services: {
        create: 'POST /api/services',
        list: 'GET /api/services',
        get: 'GET /api/services/:id',
        byEstablishment: 'GET /api/services/establishment/:id'
      },
      businessHours: {
        set: 'POST /api/business-hours',
        bulk: 'POST /api/business-hours/bulk',
        get: 'GET /api/business-hours/establishment/:id'
      },
      availability: {
        set: 'POST /api/availability',
        professional: 'GET /api/availability/professional/:id',
        slots: 'GET /api/availability/slots/:id'
      },
      appointments: {
        create: 'POST /api/appointments',
        my: 'GET /api/appointments/my',
        available: 'GET /api/appointments/available-slots',
        today: 'GET /api/appointments/today'
      }
    }
  });
});

// Inicializar servidor
const startServer = async () => {
  try {
    // Testar conexão com o banco (se DATABASE_URL estiver disponível)
    if (process.env.DATABASE_URL) {
      console.log('Testando conexão com banco de dados...');
      await testConnection();
      
      // Criar tabelas do banco de dados
      console.log('Criando tabelas do banco de dados...');
      await User.createTable();
      await Service.createTable();
      await BusinessHour.createTable();
      await ProfessionalAvailability.createTable();
      await Appointment.createTable();
      console.log('✅ Todas as tabelas criadas com sucesso!');
    } else {
      console.log('⚠️  DATABASE_URL não configurada. Banco de dados desabilitado.');
      console.log('   Configure DATABASE_URL nos Secrets para ativar o banco.');
    }
    
    app.listen(PORT, () => {
      console.log(`Servidor rodando na porta ${PORT}`);
      console.log(`Health check: http://localhost:${PORT}/health`);
      console.log(`API endpoints: http://localhost:${PORT}/api`);
      console.log(`Auth: http://localhost:${PORT}/api/auth`);
    });
  } catch (error) {
    console.error('Erro ao inicializar servidor:', error);
    process.exit(1);
  }
};

startServer();