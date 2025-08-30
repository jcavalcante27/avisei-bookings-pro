import { query } from '../db.js';

class BusinessHour {
  
  static async createTable() {
    const sql = `
      CREATE TABLE IF NOT EXISTS business_hours (
        id SERIAL PRIMARY KEY,
        establishment_id INTEGER NOT NULL,
        day_of_week INTEGER NOT NULL, -- 0=Domingo, 1=Segunda, ..., 6=Sábado
        morning_start TIME,
        morning_end TIME,
        afternoon_start TIME,
        afternoon_end TIME,
        is_closed BOOLEAN DEFAULT false,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (establishment_id) REFERENCES users(id),
        UNIQUE(establishment_id, day_of_week)
      )
    `;
    return await query(sql);
  }

  static async create(businessHourData) {
    const { 
      establishment_id, 
      day_of_week, 
      morning_start, 
      morning_end, 
      afternoon_start, 
      afternoon_end, 
      is_closed 
    } = businessHourData;
    
    const sql = `
      INSERT INTO business_hours 
      (establishment_id, day_of_week, morning_start, morning_end, afternoon_start, afternoon_end, is_closed) 
      VALUES ($1, $2, $3, $4, $5, $6, $7) 
      RETURNING *
    `;
    
    const result = await query(sql, [
      establishment_id, day_of_week, morning_start, morning_end, 
      afternoon_start, afternoon_end, is_closed
    ]);
    return result.rows[0];
  }

  static async findByEstablishment(establishmentId) {
    const sql = `
      SELECT * FROM business_hours 
      WHERE establishment_id = $1 
      ORDER BY day_of_week
    `;
    const result = await query(sql, [establishmentId]);
    return result.rows;
  }

  static async update(establishmentId, dayOfWeek, updateData) {
    const { morning_start, morning_end, afternoon_start, afternoon_end, is_closed } = updateData;
    
    const sql = `
      UPDATE business_hours 
      SET morning_start = $1, morning_end = $2, afternoon_start = $3, 
          afternoon_end = $4, is_closed = $5, updated_at = CURRENT_TIMESTAMP 
      WHERE establishment_id = $6 AND day_of_week = $7
      RETURNING *
    `;
    
    const result = await query(sql, [
      morning_start, morning_end, afternoon_start, afternoon_end, 
      is_closed, establishmentId, dayOfWeek
    ]);
    return result.rows[0];
  }

  static async upsert(businessHourData) {
    const { establishment_id, day_of_week } = businessHourData;
    
    // Verificar se já existe
    const existing = await query(
      'SELECT id FROM business_hours WHERE establishment_id = $1 AND day_of_week = $2',
      [establishment_id, day_of_week]
    );
    
    if (existing.rows.length > 0) {
      return await this.update(establishment_id, day_of_week, businessHourData);
    } else {
      return await this.create(businessHourData);
    }
  }

  static async isOpenAtTime(establishmentId, dayOfWeek, time) {
    const sql = `
      SELECT * FROM business_hours 
      WHERE establishment_id = $1 AND day_of_week = $2 AND is_closed = false
    `;
    const result = await query(sql, [establishmentId, dayOfWeek]);
    
    if (result.rows.length === 0) return false;
    
    const hours = result.rows[0];
    
    // Verificar se está no horário da manhã
    if (hours.morning_start && hours.morning_end) {
      if (time >= hours.morning_start && time <= hours.morning_end) {
        return true;
      }
    }
    
    // Verificar se está no horário da tarde
    if (hours.afternoon_start && hours.afternoon_end) {
      if (time >= hours.afternoon_start && time <= hours.afternoon_end) {
        return true;
      }
    }
    
    return false;
  }
}

export default BusinessHour;