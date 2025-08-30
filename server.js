import express from 'express';
import cors from 'cors';
import { testConnection } from './db.js';
import { User } from './models/User.js';

// Importar rotas
import authRoutes from './routes/auth.js';
import userRoutes from './routes/users.js';
import indexRoutes from './routes/index.js';

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
      console.log('Tabelas criadas com sucesso!');
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