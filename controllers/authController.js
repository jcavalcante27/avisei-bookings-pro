import jwt from 'jsonwebtoken';
import { User, USER_TYPES } from '../models/User.js';
import BaseController from './baseController.js';

const JWT_SECRET = process.env.JWT_SECRET || 'avisei-jwt-secret-key-2024';
const JWT_EXPIRES_IN = '7d';

class AuthController extends BaseController {

  async register(req, res) {
    try {
      const { name, email, password, user_type } = req.body;

      // Validações básicas
      if (!name || !email || !password || !user_type) {
        return this.validationError(res, 'Todos os campos são obrigatórios');
      }

      if (!Object.values(USER_TYPES).includes(user_type)) {
        return this.validationError(res, 'Tipo de usuário inválido');
      }

      if (password.length < 6) {
        return this.validationError(res, 'Senha deve ter pelo menos 6 caracteres');
      }

      // Criar usuário
      const user = await User.create({ name, email, password, user_type });

      // Gerar token JWT
      const token = jwt.sign(
        { 
          userId: user.id, 
          email: user.email, 
          userType: user.user_type 
        },
        JWT_SECRET,
        { expiresIn: JWT_EXPIRES_IN }
      );

      return this.success(res, {
        user: {
          id: user.id,
          name: user.name,
          email: user.email,
          user_type: user.user_type
        },
        token
      }, 'Usuário cadastrado com sucesso');

    } catch (error) {
      console.error('Erro no registro:', error);
      if (error.message === 'Email já cadastrado') {
        return this.error(res, error.message, 409);
      }
      return this.error(res, 'Erro interno do servidor');
    }
  }

  async login(req, res) {
    try {
      const { email, password } = req.body;

      // Validações básicas
      if (!email || !password) {
        return this.validationError(res, 'Email e senha são obrigatórios');
      }

      // Buscar usuário
      const user = await User.findByEmail(email);
      if (!user) {
        return this.error(res, 'Credenciais inválidas', 401);
      }

      // Validar senha
      const isValidPassword = await User.validatePassword(password, user.password);
      if (!isValidPassword) {
        return this.error(res, 'Credenciais inválidas', 401);
      }

      // Atualizar último login
      await User.updateLastLogin(user.id);

      // Gerar token JWT
      const token = jwt.sign(
        { 
          userId: user.id, 
          email: user.email, 
          userType: user.user_type 
        },
        JWT_SECRET,
        { expiresIn: JWT_EXPIRES_IN }
      );

      return this.success(res, {
        user: {
          id: user.id,
          name: user.name,
          email: user.email,
          user_type: user.user_type
        },
        token
      }, 'Login realizado com sucesso');

    } catch (error) {
      console.error('Erro no login:', error);
      return this.error(res, 'Erro interno do servidor');
    }
  }

  async getProfile(req, res) {
    try {
      const { userId } = req.user;
      const user = await User.findById(userId);
      
      if (!user) {
        return this.notFound(res, 'Usuário não encontrado');
      }

      return this.success(res, {
        id: user.id,
        name: user.name,
        email: user.email,
        user_type: user.user_type,
        created_at: user.created_at
      });

    } catch (error) {
      console.error('Erro ao buscar perfil:', error);
      return this.error(res, 'Erro interno do servidor');
    }
  }

  async verifyToken(req, res) {
    try {
      const token = req.headers.authorization?.replace('Bearer ', '');
      
      if (!token) {
        return this.error(res, 'Token não fornecido', 401);
      }

      const decoded = jwt.verify(token, JWT_SECRET);
      return this.success(res, decoded, 'Token válido');

    } catch (error) {
      return this.error(res, 'Token inválido', 401);
    }
  }
}

export default AuthController;