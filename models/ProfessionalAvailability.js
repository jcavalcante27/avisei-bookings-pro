import { query } from '../db.js';

class ProfessionalAvailability {
  
  static async createTable() {
    const sql = `
      CREATE TABLE IF NOT EXISTS professional_availability (
        id SERIAL PRIMARY KEY,
        professional_id INTEGER NOT NULL,
        establishment_id INTEGER NOT NULL,
        day_of_week INTEGER NOT NULL, -- 0=Domingo, 1=Segunda, ..., 6=Sábado
        start_time TIME NOT NULL,
        end_time TIME NOT NULL,
        is_available BOOLEAN DEFAULT true,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (professional_id) REFERENCES users(id),
        FOREIGN KEY (establishment_id) REFERENCES users(id)
      )
    `;
    return await query(sql);
  }

  static async create(availabilityData) {
    const { 
      professional_id, 
      establishment_id, 
      day_of_week, 
      start_time, 
      end_time, 
      is_available = true 
    } = availabilityData;
    
    const sql = `
      INSERT INTO professional_availability 
      (professional_id, establishment_id, day_of_week, start_time, end_time, is_available) 
      VALUES ($1, $2, $3, $4, $5, $6) 
      RETURNING *
    `;
    
    const result = await query(sql, [
      professional_id, establishment_id, day_of_week, start_time, end_time, is_available
    ]);
    return result.rows[0];
  }

  static async findByProfessional(professionalId) {
    const sql = `
      SELECT pa.*, u.name as professional_name, e.name as establishment_name
      FROM professional_availability pa
      JOIN users u ON pa.professional_id = u.id
      JOIN users e ON pa.establishment_id = e.id
      WHERE pa.professional_id = $1 AND pa.is_available = true
      ORDER BY pa.day_of_week, pa.start_time
    `;
    const result = await query(sql, [professionalId]);
    return result.rows;
  }

  static async findByEstablishment(establishmentId) {
    const sql = `
      SELECT pa.*, u.name as professional_name
      FROM professional_availability pa
      JOIN users u ON pa.professional_id = u.id
      WHERE pa.establishment_id = $1 AND pa.is_available = true
      ORDER BY u.name, pa.day_of_week, pa.start_time
    `;
    const result = await query(sql, [establishmentId]);
    return result.rows;
  }

  static async isAvailable(professionalId, dayOfWeek, startTime, endTime) {
    const sql = `
      SELECT * FROM professional_availability 
      WHERE professional_id = $1 
        AND day_of_week = $2 
        AND is_available = true
        AND start_time <= $3 
        AND end_time >= $4
    `;
    
    const result = await query(sql, [professionalId, dayOfWeek, startTime, endTime]);
    return result.rows.length > 0;
  }

  static async getAvailableSlots(professionalId, date, duration) {
    const dayOfWeek = new Date(date).getDay();
    
    const sql = `
      SELECT start_time, end_time 
      FROM professional_availability 
      WHERE professional_id = $1 
        AND day_of_week = $2 
        AND is_available = true
    `;
    
    const result = await query(sql, [professionalId, dayOfWeek]);
    
    if (result.rows.length === 0) return [];
    
    // Gerar slots disponíveis baseados na duração do serviço
    const slots = [];
    const durationMinutes = duration;
    
    for (const period of result.rows) {
      let current = this.timeToMinutes(period.start_time);
      const end = this.timeToMinutes(period.end_time);
      
      while (current + durationMinutes <= end) {
        slots.push(this.minutesToTime(current));
        current += 30; // Slots de 30 em 30 minutos
      }
    }
    
    return slots;
  }

  static timeToMinutes(timeString) {
    const [hours, minutes] = timeString.split(':').map(Number);
    return hours * 60 + minutes;
  }

  static minutesToTime(minutes) {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return `${hours.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}`;
  }

  static async update(id, updateData) {
    const { day_of_week, start_time, end_time, is_available } = updateData;
    
    const sql = `
      UPDATE professional_availability 
      SET day_of_week = $1, start_time = $2, end_time = $3, is_available = $4, updated_at = CURRENT_TIMESTAMP 
      WHERE id = $5
      RETURNING *
    `;
    
    const result = await query(sql, [day_of_week, start_time, end_time, is_available, id]);
    return result.rows[0];
  }

  static async delete(id) {
    const sql = 'DELETE FROM professional_availability WHERE id = $1';
    return await query(sql, [id]);
  }
}

export default ProfessionalAvailability;