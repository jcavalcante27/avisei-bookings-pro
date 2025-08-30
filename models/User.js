import { query } from '../db.js';
import bcrypt from 'bcrypt';

const USER_TYPES = {
  SUPER_ADMIN: 'super_admin',
  ESTABELECIMENTO: 'estabelecimento', 
  FUNCIONARIO: 'funcionario',
  CLIENTE: 'cliente'
};

class User {
  
  static async createTable() {
    const sql = `
      CREATE TABLE IF NOT EXISTS users (
        id SERIAL PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        email VARCHAR(255) UNIQUE NOT NULL,
        password VARCHAR(255) NOT NULL,
        user_type VARCHAR(50) NOT NULL CHECK (user_type IN ('super_admin', 'estabelecimento', 'funcionario', 'cliente')),
        active BOOLEAN DEFAULT true,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `;
    return await query(sql);
  }

  static async findByEmail(email) {
    const sql = 'SELECT * FROM users WHERE email = $1 AND active = true';
    const result = await query(sql, [email]);
    return result.rows[0];
  }

  static async findById(id) {
    const sql = 'SELECT * FROM users WHERE id = $1 AND active = true';
    const result = await query(sql, [id]);
    return result.rows[0];
  }

  static async create(userData) {
    const { name, email, password, user_type } = userData;
    
    // Verificar se o email já existe
    const existingUser = await this.findByEmail(email);
    if (existingUser) {
      throw new Error('Email já cadastrado');
    }

    // Criptografar senha
    const saltRounds = 12;
    const hashedPassword = await bcrypt.hash(password, saltRounds);

    const sql = `
      INSERT INTO users (name, email, password, user_type) 
      VALUES ($1, $2, $3, $4) 
      RETURNING id, name, email, user_type, active, created_at
    `;
    
    const result = await query(sql, [name, email, hashedPassword, user_type]);
    return result.rows[0];
  }

  static async validatePassword(plainPassword, hashedPassword) {
    return await bcrypt.compare(plainPassword, hashedPassword);
  }

  static async updateLastLogin(userId) {
    const sql = 'UPDATE users SET updated_at = CURRENT_TIMESTAMP WHERE id = $1';
    return await query(sql, [userId]);
  }

  static async getAllByType(userType) {
    const sql = 'SELECT id, name, email, user_type, active, created_at FROM users WHERE user_type = $1';
    const result = await query(sql, [userType]);
    return result.rows;
  }

  static async deactivate(userId) {
    const sql = 'UPDATE users SET active = false WHERE id = $1';
    return await query(sql, [userId]);
  }
}

export { User, USER_TYPES };