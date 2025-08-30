import Appointment from '../models/Appointment.js';
import Service from '../models/Service.js';
import ProfessionalAvailability from '../models/ProfessionalAvailability.js';
import BusinessHour from '../models/BusinessHour.js';
import { User } from '../models/User.js';
import EmailService from '../utils/emailService.js';
import BaseController from './baseController.js';

class AppointmentController extends BaseController {

  async create(req, res) {
    try {
      const { 
        professional_id, 
        establishment_id, 
        service_id, 
        appointment_date, 
        appointment_time, 
        notes 
      } = req.body;
      const { userId } = req.user; // ID do cliente

      // Validações básicas
      if (!professional_id || !establishment_id || !service_id || !appointment_date || !appointment_time) {
        return this.validationError(res, 'Todos os campos são obrigatórios');
      }

      // Verificar se o serviço existe
      const service = await Service.findById(service_id);
      if (!service) {
        return this.notFound(res, 'Serviço não encontrado');
      }

      // Verificar se o profissional existe
      const professional = await User.findById(professional_id);
      if (!professional || professional.user_type !== 'funcionario') {
        return this.validationError(res, 'Profissional não encontrado');
      }

      // Verificar se o estabelecimento existe
      const establishment = await User.findById(establishment_id);
      if (!establishment || establishment.user_type !== 'estabelecimento') {
        return this.validationError(res, 'Estabelecimento não encontrado');
      }

      // Verificar se a data não é no passado
      const appointmentDateTime = new Date(`${appointment_date}T${appointment_time}`);
      if (appointmentDateTime < new Date()) {
        return this.validationError(res, 'Não é possível agendar para datas passadas');
      }

      // Verificar horário de funcionamento
      const dayOfWeek = appointmentDateTime.getDay();
      const isOpen = await BusinessHour.isOpenAtTime(establishment_id, dayOfWeek, appointment_time);
      if (!isOpen) {
        return this.validationError(res, 'Estabelecimento fechado neste horário');
      }

      // Verificar disponibilidade do profissional
      const endTime = Appointment.addMinutesToTime(appointment_time, service.duration);
      const isAvailable = await ProfessionalAvailability.isAvailable(
        professional_id, 
        dayOfWeek, 
        appointment_time, 
        endTime
      );
      
      if (!isAvailable) {
        return this.validationError(res, 'Profissional não disponível neste horário');
      }

      // Verificar se não há conflito de agendamento
      const hasConflict = await Appointment.checkAvailability(
        professional_id, 
        appointment_date, 
        appointment_time, 
        service.duration
      );

      if (!hasConflict) {
        return this.validationError(res, 'Horário já ocupado');
      }

      // Criar o agendamento
      const appointment = await Appointment.create({
        client_id: userId,
        professional_id: parseInt(professional_id),
        establishment_id: parseInt(establishment_id),
        service_id: parseInt(service_id),
        appointment_date,
        appointment_time,
        duration: service.duration,
        total_price: service.price,
        notes
      });

      // Buscar dados completos para o email
      const fullAppointment = await Appointment.findById(appointment.id);
      
      // Enviar emails de confirmação
      try {
        await EmailService.sendAppointmentConfirmation(fullAppointment);
      } catch (emailError) {
        console.error('Erro ao enviar email:', emailError);
        // Não falhar o agendamento por conta do email
      }

      return this.success(res, fullAppointment, 'Agendamento realizado com sucesso');

    } catch (error) {
      console.error('Erro ao criar agendamento:', error);
      return this.error(res, 'Erro interno do servidor');
    }
  }

  async getById(req, res) {
    try {
      const { id } = req.params;
      const { userId, userType } = req.user;

      const appointment = await Appointment.findById(id);
      if (!appointment) {
        return this.notFound(res, 'Agendamento não encontrado');
      }

      // Verificar permissões
      const hasPermission = 
        userType === 'super_admin' ||
        appointment.client_id === userId ||
        appointment.professional_id === userId ||
        appointment.establishment_id === userId;

      if (!hasPermission) {
        return this.error(res, 'Acesso negado', 403);
      }

      return this.success(res, appointment);

    } catch (error) {
      console.error('Erro ao buscar agendamento:', error);
      return this.error(res, 'Erro interno do servidor');
    }
  }

  async getMyAppointments(req, res) {
    try {
      const { userId, userType } = req.user;
      const { status } = req.query;

      let appointments = [];

      switch (userType) {
        case 'cliente':
          appointments = await Appointment.findByClient(userId, status);
          break;
        case 'funcionario':
          appointments = await Appointment.findByProfessional(userId, status);
          break;
        case 'estabelecimento':
          appointments = await Appointment.findByEstablishment(userId, status);
          break;
        case 'super_admin':
          // TODO: Implementar busca geral para super admin
          appointments = [];
          break;
        default:
          return this.error(res, 'Tipo de usuário inválido', 403);
      }

      return this.success(res, appointments);

    } catch (error) {
      console.error('Erro ao buscar agendamentos:', error);
      return this.error(res, 'Erro interno do servidor');
    }
  }

  async getTodayAppointments(req, res) {
    try {
      const { userId, userType } = req.user;

      if (userType !== 'estabelecimento' && userType !== 'super_admin') {
        return this.error(res, 'Acesso negado', 403);
      }

      const appointments = await Appointment.getTodayAppointments(userId);
      return this.success(res, appointments);

    } catch (error) {
      console.error('Erro ao buscar agendamentos de hoje:', error);
      return this.error(res, 'Erro interno do servidor');
    }
  }

  async confirm(req, res) {
    try {
      const { id } = req.params;
      const { userId, userType } = req.user;

      const appointment = await Appointment.findById(id);
      if (!appointment) {
        return this.notFound(res, 'Agendamento não encontrado');
      }

      // Apenas estabelecimento ou profissional podem confirmar
      if (userType === 'cliente' || 
          (userType === 'estabelecimento' && appointment.establishment_id !== userId) ||
          (userType === 'funcionario' && appointment.professional_id !== userId)) {
        return this.error(res, 'Acesso negado', 403);
      }

      const confirmedAppointment = await Appointment.confirm(id);
      return this.success(res, confirmedAppointment, 'Agendamento confirmado');

    } catch (error) {
      console.error('Erro ao confirmar agendamento:', error);
      return this.error(res, 'Erro interno do servidor');
    }
  }

  async cancel(req, res) {
    try {
      const { id } = req.params;
      const { notes } = req.body;
      const { userId, userType } = req.user;

      const appointment = await Appointment.findById(id);
      if (!appointment) {
        return this.notFound(res, 'Agendamento não encontrado');
      }

      // Verificar permissões para cancelar
      const canCancel = 
        userType === 'super_admin' ||
        appointment.client_id === userId ||
        appointment.professional_id === userId ||
        appointment.establishment_id === userId;

      if (!canCancel) {
        return this.error(res, 'Acesso negado', 403);
      }

      // Verificar se pode ser cancelado (não pode cancelar se já foi completado)
      if (appointment.status === 'completed') {
        return this.validationError(res, 'Não é possível cancelar um agendamento já concluído');
      }

      const cancelledAppointment = await Appointment.cancel(id, notes);
      
      // Enviar emails de cancelamento
      try {
        await EmailService.sendAppointmentCancellation(appointment);
      } catch (emailError) {
        console.error('Erro ao enviar email de cancelamento:', emailError);
      }

      return this.success(res, cancelledAppointment, 'Agendamento cancelado');

    } catch (error) {
      console.error('Erro ao cancelar agendamento:', error);
      return this.error(res, 'Erro interno do servidor');
    }
  }

  async complete(req, res) {
    try {
      const { id } = req.params;
      const { notes } = req.body;
      const { userId, userType } = req.user;

      const appointment = await Appointment.findById(id);
      if (!appointment) {
        return this.notFound(res, 'Agendamento não encontrado');
      }

      // Apenas estabelecimento ou profissional podem marcar como concluído
      if ((userType === 'estabelecimento' && appointment.establishment_id !== userId) ||
          (userType === 'funcionario' && appointment.professional_id !== userId)) {
        return this.error(res, 'Acesso negado', 403);
      }

      const completedAppointment = await Appointment.complete(id, notes);
      return this.success(res, completedAppointment, 'Agendamento concluído');

    } catch (error) {
      console.error('Erro ao concluir agendamento:', error);
      return this.error(res, 'Erro interno do servidor');
    }
  }

  async getAvailableSlots(req, res) {
    try {
      const { professional_id, service_id, date } = req.query;

      if (!professional_id || !service_id || !date) {
        return this.validationError(res, 'professional_id, service_id e date são obrigatórios');
      }

      // Buscar o serviço para obter a duração
      const service = await Service.findById(service_id);
      if (!service) {
        return this.notFound(res, 'Serviço não encontrado');
      }

      // Obter horários disponíveis do profissional
      const slots = await ProfessionalAvailability.getAvailableSlots(
        professional_id, 
        date, 
        service.duration
      );

      // Filtrar horários que já estão ocupados
      const availableSlots = [];
      
      for (const slot of slots) {
        const isSlotAvailable = await Appointment.checkAvailability(
          professional_id, 
          date, 
          slot, 
          service.duration
        );
        
        if (isSlotAvailable) {
          availableSlots.push({
            time: slot,
            duration: service.duration,
            service_name: service.name
          });
        }
      }

      return this.success(res, availableSlots);

    } catch (error) {
      console.error('Erro ao buscar horários disponíveis:', error);
      return this.error(res, 'Erro interno do servidor');
    }
  }
}

export default AppointmentController;