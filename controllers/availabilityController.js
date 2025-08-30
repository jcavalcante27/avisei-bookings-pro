import ProfessionalAvailability from '../models/ProfessionalAvailability.js';
import { User } from '../models/User.js';
import BaseController from './baseController.js';

class AvailabilityController extends BaseController {

  async create(req, res) {
    try {
      const { 
        professional_id, 
        establishment_id, 
        day_of_week, 
        start_time, 
        end_time, 
        is_available = true 
      } = req.body;
      const { userId, userType } = req.user;

      // Validações
      if (!professional_id || !establishment_id || day_of_week === undefined || !start_time || !end_time) {
        return this.validationError(res, 'Todos os campos são obrigatórios');
      }

      if (day_of_week < 0 || day_of_week > 6) {
        return this.validationError(res, 'Dia da semana deve estar entre 0 (domingo) e 6 (sábado)');
      }

      // Verificar permissões
      if (userType === 'funcionario' && userId !== professional_id) {
        return this.error(res, 'Funcionários só podem configurar sua própria disponibilidade', 403);
      }

      if (userType === 'estabelecimento' && userId !== establishment_id) {
        return this.error(res, 'Você só pode configurar disponibilidade em seu estabelecimento', 403);
      }

      // Verificar se o profissional existe e é do tipo funcionário
      const professional = await User.findById(professional_id);
      if (!professional || professional.user_type !== 'funcionario') {
        return this.validationError(res, 'Profissional não encontrado ou inválido');
      }

      // Verificar se o estabelecimento existe
      const establishment = await User.findById(establishment_id);
      if (!establishment || establishment.user_type !== 'estabelecimento') {
        return this.validationError(res, 'Estabelecimento não encontrado ou inválido');
      }

      const availability = await ProfessionalAvailability.create({
        professional_id: parseInt(professional_id),
        establishment_id: parseInt(establishment_id),
        day_of_week: parseInt(day_of_week),
        start_time,
        end_time,
        is_available
      });

      return this.success(res, availability, 'Disponibilidade configurada com sucesso');

    } catch (error) {
      console.error('Erro ao configurar disponibilidade:', error);
      return this.error(res, 'Erro interno do servidor');
    }
  }

  async getByProfessional(req, res) {
    try {
      const { professional_id } = req.params;
      const { userId, userType } = req.user;

      // Verificar permissões
      if (userType === 'funcionario' && userId.toString() !== professional_id) {
        return this.error(res, 'Acesso negado', 403);
      }

      const availability = await ProfessionalAvailability.findByProfessional(professional_id);
      return this.success(res, availability);

    } catch (error) {
      console.error('Erro ao buscar disponibilidade:', error);
      return this.error(res, 'Erro interno do servidor');
    }
  }

  async getByEstablishment(req, res) {
    try {
      const { establishment_id } = req.params;
      const { userId, userType } = req.user;

      // Verificar permissões
      if (userType === 'estabelecimento' && userId.toString() !== establishment_id) {
        return this.error(res, 'Acesso negado', 403);
      }

      const availability = await ProfessionalAvailability.findByEstablishment(establishment_id);
      return this.success(res, availability);

    } catch (error) {
      console.error('Erro ao buscar disponibilidade:', error);
      return this.error(res, 'Erro interno do servidor');
    }
  }

  async getAvailableSlots(req, res) {
    try {
      const { professional_id } = req.params;
      const { date, duration } = req.query;

      if (!date || !duration) {
        return this.validationError(res, 'Data e duração são obrigatórias');
      }

      const slots = await ProfessionalAvailability.getAvailableSlots(
        professional_id, 
        date, 
        parseInt(duration)
      );

      return this.success(res, slots);

    } catch (error) {
      console.error('Erro ao buscar horários disponíveis:', error);
      return this.error(res, 'Erro interno do servidor');
    }
  }

  async update(req, res) {
    try {
      const { id } = req.params;
      const { day_of_week, start_time, end_time, is_available } = req.body;
      const { userId, userType } = req.user;

      // TODO: Verificar se o usuário pode editar esta disponibilidade
      
      const availability = await ProfessionalAvailability.update(id, {
        day_of_week: parseInt(day_of_week),
        start_time,
        end_time,
        is_available
      });

      if (!availability) {
        return this.notFound(res, 'Disponibilidade não encontrada');
      }

      return this.success(res, availability, 'Disponibilidade atualizada com sucesso');

    } catch (error) {
      console.error('Erro ao atualizar disponibilidade:', error);
      return this.error(res, 'Erro interno do servidor');
    }
  }

  async delete(req, res) {
    try {
      const { id } = req.params;
      const { userId, userType } = req.user;

      // TODO: Verificar se o usuário pode deletar esta disponibilidade

      await ProfessionalAvailability.delete(id);
      return this.success(res, null, 'Disponibilidade removida com sucesso');

    } catch (error) {
      console.error('Erro ao remover disponibilidade:', error);
      return this.error(res, 'Erro interno do servidor');
    }
  }

  async getFormattedAvailability(req, res) {
    try {
      const { professional_id } = req.params;
      
      const availability = await ProfessionalAvailability.findByProfessional(professional_id);
      
      const daysOfWeek = [
        'Domingo', 'Segunda-feira', 'Terça-feira', 'Quarta-feira',
        'Quinta-feira', 'Sexta-feira', 'Sábado'
      ];

      const formattedAvailability = daysOfWeek.map((day, index) => {
        const dayAvailability = availability.filter(av => av.day_of_week === index);
        
        if (dayAvailability.length === 0) {
          return {
            day: day,
            day_of_week: index,
            status: 'Indisponível',
            periods: []
          };
        }

        const periods = dayAvailability.map(av => ({
          start_time: av.start_time.substring(0, 5),
          end_time: av.end_time.substring(0, 5),
          is_available: av.is_available
        }));

        return {
          day: day,
          day_of_week: index,
          status: 'Disponível',
          periods: periods
        };
      });

      return this.success(res, formattedAvailability);

    } catch (error) {
      console.error('Erro ao buscar disponibilidade formatada:', error);
      return this.error(res, 'Erro interno do servidor');
    }
  }
}

export default AvailabilityController;