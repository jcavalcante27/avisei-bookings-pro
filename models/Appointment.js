import { query } from '../db.js';

class Appointment {
  
  static async createTable() {
    const sql = `
      CREATE TABLE IF NOT EXISTS appointments (
        id SERIAL PRIMARY KEY,
        client_id INTEGER NOT NULL,
        professional_id INTEGER NOT NULL,
        establishment_id INTEGER NOT NULL,
        service_id INTEGER NOT NULL,
        appointment_date DATE NOT NULL,
        appointment_time TIME NOT NULL,
        duration INTEGER NOT NULL, -- duração em minutos
        total_price DECIMAL(10,2) NOT NULL,
        status VARCHAR(50) DEFAULT 'scheduled', -- scheduled, confirmed, completed, cancelled
        notes TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (client_id) REFERENCES users(id),
        FOREIGN KEY (professional_id) REFERENCES users(id),
        FOREIGN KEY (establishment_id) REFERENCES users(id),
        FOREIGN KEY (service_id) REFERENCES services(id)
      )
    `;
    return await query(sql);
  }

  static async create(appointmentData) {
    const { 
      client_id, 
      professional_id, 
      establishment_id, 
      service_id, 
      appointment_date, 
      appointment_time, 
      duration, 
      total_price, 
      notes 
    } = appointmentData;
    
    const sql = `
      INSERT INTO appointments 
      (client_id, professional_id, establishment_id, service_id, appointment_date, appointment_time, duration, total_price, notes) 
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9) 
      RETURNING *
    `;
    
    const result = await query(sql, [
      client_id, professional_id, establishment_id, service_id, 
      appointment_date, appointment_time, duration, total_price, notes
    ]);
    return result.rows[0];
  }

  static async findById(id) {
    const sql = `
      SELECT a.*, 
             c.name as client_name, c.email as client_email,
             p.name as professional_name, p.email as professional_email,
             e.name as establishment_name, e.email as establishment_email,
             s.name as service_name
      FROM appointments a
      JOIN users c ON a.client_id = c.id
      JOIN users p ON a.professional_id = p.id
      JOIN users e ON a.establishment_id = e.id
      JOIN services s ON a.service_id = s.id
      WHERE a.id = $1
    `;
    const result = await query(sql, [id]);
    return result.rows[0];
  }

  static async findByClient(clientId, status = null) {
    let sql = `
      SELECT a.*, 
             p.name as professional_name,
             e.name as establishment_name,
             s.name as service_name
      FROM appointments a
      JOIN users p ON a.professional_id = p.id
      JOIN users e ON a.establishment_id = e.id
      JOIN services s ON a.service_id = s.id
      WHERE a.client_id = $1
    `;
    
    const params = [clientId];
    
    if (status) {
      sql += ' AND a.status = $2';
      params.push(status);
    }
    
    sql += ' ORDER BY a.appointment_date DESC, a.appointment_time DESC';
    
    const result = await query(sql, params);
    return result.rows;
  }

  static async findByProfessional(professionalId, status = null) {
    let sql = `
      SELECT a.*, 
             c.name as client_name, c.email as client_email,
             e.name as establishment_name,
             s.name as service_name
      FROM appointments a
      JOIN users c ON a.client_id = c.id
      JOIN users e ON a.establishment_id = e.id
      JOIN services s ON a.service_id = s.id
      WHERE a.professional_id = $1
    `;
    
    const params = [professionalId];
    
    if (status) {
      sql += ' AND a.status = $2';
      params.push(status);
    }
    
    sql += ' ORDER BY a.appointment_date, a.appointment_time';
    
    const result = await query(sql, params);
    return result.rows;
  }

  static async findByEstablishment(establishmentId, status = null) {
    let sql = `
      SELECT a.*, 
             c.name as client_name,
             p.name as professional_name,
             s.name as service_name
      FROM appointments a
      JOIN users c ON a.client_id = c.id
      JOIN users p ON a.professional_id = p.id
      JOIN services s ON a.service_id = s.id
      WHERE a.establishment_id = $1
    `;
    
    const params = [establishmentId];
    
    if (status) {
      sql += ' AND a.status = $2';
      params.push(status);
    }
    
    sql += ' ORDER BY a.appointment_date, a.appointment_time';
    
    const result = await query(sql, params);
    return result.rows;
  }

  static async checkAvailability(professionalId, appointmentDate, appointmentTime, duration) {
    const endTime = this.addMinutesToTime(appointmentTime, duration);
    
    const sql = `
      SELECT * FROM appointments 
      WHERE professional_id = $1 
        AND appointment_date = $2 
        AND status IN ('scheduled', 'confirmed')
        AND (
          (appointment_time <= $3 AND appointment_time + (duration || ' minutes')::interval > $3)
          OR
          (appointment_time < $4 AND appointment_time + (duration || ' minutes')::interval >= $4)
          OR
          (appointment_time >= $3 AND appointment_time < $4)
        )
    `;
    
    const result = await query(sql, [professionalId, appointmentDate, appointmentTime, endTime]);
    return result.rows.length === 0; // true se não há conflitos
  }

  static addMinutesToTime(time, minutes) {
    const [hours, mins] = time.split(':').map(Number);
    const totalMinutes = hours * 60 + mins + minutes;
    const newHours = Math.floor(totalMinutes / 60);
    const newMins = totalMinutes % 60;
    return `${newHours.toString().padStart(2, '0')}:${newMins.toString().padStart(2, '0')}`;
  }

  static async updateStatus(id, status, notes = null) {
    let sql = `
      UPDATE appointments 
      SET status = $1, updated_at = CURRENT_TIMESTAMP
    `;
    const params = [status];
    
    if (notes) {
      sql += ', notes = $3';
      params.push(notes);
    }
    
    sql += ' WHERE id = $2 RETURNING *';
    params.splice(-1, 0, id);
    
    const result = await query(sql, params);
    return result.rows[0];
  }

  static async cancel(id, notes = null) {
    return await this.updateStatus(id, 'cancelled', notes);
  }

  static async confirm(id) {
    return await this.updateStatus(id, 'confirmed');
  }

  static async complete(id, notes = null) {
    return await this.updateStatus(id, 'completed', notes);
  }

  static async getTodayAppointments(establishmentId) {
    const today = new Date().toISOString().split('T')[0];
    
    const sql = `
      SELECT a.*, 
             c.name as client_name, c.email as client_email,
             p.name as professional_name,
             s.name as service_name
      FROM appointments a
      JOIN users c ON a.client_id = c.id
      JOIN users p ON a.professional_id = p.id
      JOIN services s ON a.service_id = s.id
      WHERE a.establishment_id = $1 
        AND a.appointment_date = $2
        AND a.status IN ('scheduled', 'confirmed')
      ORDER BY a.appointment_time
    `;
    
    const result = await query(sql, [establishmentId, today]);
    return result.rows;
  }
}

export default Appointment;