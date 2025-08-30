import BusinessHour from '../models/BusinessHour.js';
import { User } from '../models/User.js';
import BaseController from './baseController.js';

class BusinessHourController extends BaseController {

  async create(req, res) {
    try {
      const { 
        day_of_week, 
        morning_start, 
        morning_end, 
        afternoon_start, 
        afternoon_end, 
        is_closed 
      } = req.body;
      const { userId } = req.user;

      // Validações
      if (day_of_week < 0 || day_of_week > 6) {
        return this.validationError(res, 'Dia da semana deve estar entre 0 (domingo) e 6 (sábado)');
      }

      // Verificar se o usuário é um estabelecimento
      const user = await User.findById(userId);
      if (!user || user.user_type !== 'estabelecimento') {
        return this.error(res, 'Apenas estabelecimentos podem configurar horários', 403);
      }

      const businessHour = await BusinessHour.upsert({
        establishment_id: userId,
        day_of_week: parseInt(day_of_week),
        morning_start,
        morning_end,
        afternoon_start,
        afternoon_end,
        is_closed: is_closed || false
      });

      return this.success(res, businessHour, 'Horário de funcionamento configurado com sucesso');

    } catch (error) {
      console.error('Erro ao configurar horário:', error);
      return this.error(res, 'Erro interno do servidor');
    }
  }

  async getByEstablishment(req, res) {
    try {
      const { establishment_id } = req.params;
      const { userId, userType } = req.user;

      // Verificar se pode acessar os horários deste estabelecimento
      if (userType !== 'super_admin' && userId.toString() !== establishment_id) {
        const businessHours = await BusinessHour.findByEstablishment(establishment_id);
        return this.success(res, businessHours);
      }

      const businessHours = await BusinessHour.findByEstablishment(establishment_id);
      return this.success(res, businessHours);

    } catch (error) {
      console.error('Erro ao buscar horários:', error);
      return this.error(res, 'Erro interno do servidor');
    }
  }

  async bulkUpdate(req, res) {
    try {
      const { schedules } = req.body; // Array de horários
      const { userId } = req.user;

      if (!Array.isArray(schedules)) {
        return this.validationError(res, 'Schedules deve ser um array');
      }

      // Verificar se o usuário é um estabelecimento
      const user = await User.findById(userId);
      if (!user || user.user_type !== 'estabelecimento') {
        return this.error(res, 'Apenas estabelecimentos podem configurar horários', 403);
      }

      const results = [];

      for (const schedule of schedules) {
        const { 
          day_of_week, 
          morning_start, 
          morning_end, 
          afternoon_start, 
          afternoon_end, 
          is_closed 
        } = schedule;

        const businessHour = await BusinessHour.upsert({
          establishment_id: userId,
          day_of_week: parseInt(day_of_week),
          morning_start,
          morning_end,
          afternoon_start,
          afternoon_end,
          is_closed: is_closed || false
        });

        results.push(businessHour);
      }

      return this.success(res, results, 'Horários atualizados com sucesso');

    } catch (error) {
      console.error('Erro ao atualizar horários:', error);
      return this.error(res, 'Erro interno do servidor');
    }
  }

  async getFormattedSchedule(req, res) {
    try {
      const { establishment_id } = req.params;
      
      const businessHours = await BusinessHour.findByEstablishment(establishment_id);
      
      const daysOfWeek = [
        'Domingo', 'Segunda-feira', 'Terça-feira', 'Quarta-feira',
        'Quinta-feira', 'Sexta-feira', 'Sábado'
      ];

      const formattedSchedule = daysOfWeek.map((day, index) => {
        const daySchedule = businessHours.find(bh => bh.day_of_week === index);
        
        if (!daySchedule || daySchedule.is_closed) {
          return {
            day: day,
            day_of_week: index,
            status: 'Fechado'
          };
        }

        let schedule = '';
        
        if (daySchedule.morning_start && daySchedule.morning_end) {
          schedule += `${daySchedule.morning_start.substring(0, 5)} às ${daySchedule.morning_end.substring(0, 5)}`;
        }
        
        if (daySchedule.afternoon_start && daySchedule.afternoon_end) {
          if (schedule) schedule += ' / ';
          schedule += `${daySchedule.afternoon_start.substring(0, 5)} às ${daySchedule.afternoon_end.substring(0, 5)}`;
        }

        return {
          day: day,
          day_of_week: index,
          status: schedule || 'Fechado'
        };
      });

      return this.success(res, formattedSchedule);

    } catch (error) {
      console.error('Erro ao buscar horário formatado:', error);
      return this.error(res, 'Erro interno do servidor');
    }
  }
}

export default BusinessHourController;