import { query } from '../db.js';

class Service {
  
  static async createTable() {
    const sql = `
      CREATE TABLE IF NOT EXISTS services (
        id SERIAL PRIMARY KEY,
        establishment_id INTEGER NOT NULL,
        name VARCHAR(255) NOT NULL,
        description TEXT,
        duration INTEGER NOT NULL, -- duração em minutos
        price DECIMAL(10,2) NOT NULL,
        active BOOLEAN DEFAULT true,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (establishment_id) REFERENCES users(id)
      )
    `;
    return await query(sql);
  }

  static async create(serviceData) {
    const { establishment_id, name, description, duration, price } = serviceData;
    
    const sql = `
      INSERT INTO services (establishment_id, name, description, duration, price) 
      VALUES ($1, $2, $3, $4, $5) 
      RETURNING *
    `;
    
    const result = await query(sql, [establishment_id, name, description, duration, price]);
    return result.rows[0];
  }

  static async findById(id) {
    const sql = 'SELECT * FROM services WHERE id = $1 AND active = true';
    const result = await query(sql, [id]);
    return result.rows[0];
  }

  static async findByEstablishment(establishmentId) {
    const sql = 'SELECT * FROM services WHERE establishment_id = $1 AND active = true ORDER BY name';
    const result = await query(sql, [establishmentId]);
    return result.rows;
  }

  static async update(id, updateData) {
    const { name, description, duration, price } = updateData;
    const sql = `
      UPDATE services 
      SET name = $1, description = $2, duration = $3, price = $4, updated_at = CURRENT_TIMESTAMP 
      WHERE id = $5 AND active = true
      RETURNING *
    `;
    const result = await query(sql, [name, description, duration, price, id]);
    return result.rows[0];
  }

  static async deactivate(id) {
    const sql = 'UPDATE services SET active = false WHERE id = $1';
    return await query(sql, [id]);
  }

  static async getAllActive() {
    const sql = `
      SELECT s.*, u.name as establishment_name 
      FROM services s 
      JOIN users u ON s.establishment_id = u.id 
      WHERE s.active = true AND u.active = true
      ORDER BY u.name, s.name
    `;
    const result = await query(sql);
    return result.rows;
  }
}

export default Service;