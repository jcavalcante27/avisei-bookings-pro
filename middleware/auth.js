import jwt from 'jsonwebtoken';
import { User, USER_TYPES } from '../models/User.js';

const JWT_SECRET = process.env.JWT_SECRET || 'avisei-jwt-secret-key-2024';

// Middleware de autenticação básica
export const authenticateToken = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN

    if (!token) {
      return res.status(401).json({
        success: false,
        message: 'Token de acesso requerido',
        error: true
      });
    }

    const decoded = jwt.verify(token, JWT_SECRET);
    
    // Verificar se o usuário ainda existe e está ativo
    const user = await User.findById(decoded.userId);
    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Usuário não encontrado ou inativo',
        error: true
      });
    }

    req.user = {
      userId: user.id,
      email: user.email,
      userType: user.user_type,
      name: user.name
    };

    next();
  } catch (error) {
    console.error('Erro na autenticação:', error);
    return res.status(403).json({
      success: false,
      message: 'Token inválido',
      error: true
    });
  }
};

// Middleware para autorizar tipos específicos de usuários
export const authorizeUserTypes = (allowedTypes) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: 'Usuário não autenticado',
        error: true
      });
    }

    if (!allowedTypes.includes(req.user.userType)) {
      return res.status(403).json({
        success: false,
        message: 'Acesso negado: permissão insuficiente',
        error: true
      });
    }

    next();
  };
};

// Middlewares específicos para cada tipo de usuário
export const requireSuperAdmin = authorizeUserTypes([USER_TYPES.SUPER_ADMIN]);

export const requireEstabelecimento = authorizeUserTypes([
  USER_TYPES.SUPER_ADMIN, 
  USER_TYPES.ESTABELECIMENTO
]);

export const requireFuncionario = authorizeUserTypes([
  USER_TYPES.SUPER_ADMIN, 
  USER_TYPES.ESTABELECIMENTO, 
  USER_TYPES.FUNCIONARIO
]);

export const requireCliente = authorizeUserTypes([
  USER_TYPES.SUPER_ADMIN, 
  USER_TYPES.ESTABELECIMENTO, 
  USER_TYPES.FUNCIONARIO, 
  USER_TYPES.CLIENTE
]);

// Middleware para permitir apenas o próprio usuário ou níveis superiores
export const requireSelfOrHigher = (req, res, next) => {
  const targetUserId = parseInt(req.params.userId || req.body.userId);
  const currentUserId = req.user.userId;
  const currentUserType = req.user.userType;

  // Super admin pode acessar tudo
  if (currentUserType === USER_TYPES.SUPER_ADMIN) {
    return next();
  }

  // Estabelecimento pode acessar seus funcionários e clientes
  if (currentUserType === USER_TYPES.ESTABELECIMENTO) {
    // TODO: Implementar lógica para verificar se o usuário alvo pertence ao estabelecimento
    return next();
  }

  // Outros tipos só podem acessar a si mesmos
  if (currentUserId === targetUserId) {
    return next();
  }

  return res.status(403).json({
    success: false,
    message: 'Acesso negado: você só pode acessar seus próprios dados',
    error: true
  });
};