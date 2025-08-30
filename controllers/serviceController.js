import Service from '../models/Service.js';
import { User } from '../models/User.js';
import BaseController from './baseController.js';

class ServiceController extends BaseController {

  async create(req, res) {
    try {
      const { name, description, duration, price } = req.body;
      const { userId } = req.user;

      // Validações
      if (!name || !duration || !price) {
        return this.validationError(res, 'Nome, duração e preço são obrigatórios');
      }

      if (duration <= 0) {
        return this.validationError(res, 'Duração deve ser maior que zero');
      }

      if (price <= 0) {
        return this.validationError(res, 'Preço deve ser maior que zero');
      }

      // Verificar se o usuário é um estabelecimento
      const user = await User.findById(userId);
      if (!user || user.user_type !== 'estabelecimento') {
        return this.error(res, 'Apenas estabelecimentos podem criar serviços', 403);
      }

      const service = await Service.create({
        establishment_id: userId,
        name,
        description,
        duration: parseInt(duration),
        price: parseFloat(price)
      });

      return this.success(res, service, 'Serviço criado com sucesso');

    } catch (error) {
      console.error('Erro ao criar serviço:', error);
      return this.error(res, 'Erro interno do servidor');
    }
  }

  async getByEstablishment(req, res) {
    try {
      const { establishment_id } = req.params;
      const { userId, userType } = req.user;

      // Verificar se pode acessar os serviços deste estabelecimento
      if (userType !== 'super_admin' && userId.toString() !== establishment_id) {
        return this.error(res, 'Acesso negado', 403);
      }

      const services = await Service.findByEstablishment(establishment_id);
      return this.success(res, services);

    } catch (error) {
      console.error('Erro ao buscar serviços:', error);
      return this.error(res, 'Erro interno do servidor');
    }
  }

  async getAll(req, res) {
    try {
      const services = await Service.getAllActive();
      return this.success(res, services);

    } catch (error) {
      console.error('Erro ao buscar serviços:', error);
      return this.error(res, 'Erro interno do servidor');
    }
  }

  async getById(req, res) {
    try {
      const { id } = req.params;
      
      const service = await Service.findById(id);
      if (!service) {
        return this.notFound(res, 'Serviço não encontrado');
      }

      return this.success(res, service);

    } catch (error) {
      console.error('Erro ao buscar serviço:', error);
      return this.error(res, 'Erro interno do servidor');
    }
  }

  async update(req, res) {
    try {
      const { id } = req.params;
      const { name, description, duration, price } = req.body;
      const { userId } = req.user;

      const service = await Service.findById(id);
      if (!service) {
        return this.notFound(res, 'Serviço não encontrado');
      }

      // Verificar se o usuário é dono do serviço
      if (service.establishment_id !== userId) {
        return this.error(res, 'Apenas o estabelecimento dono pode editar este serviço', 403);
      }

      // Validações
      if (!name || !duration || !price) {
        return this.validationError(res, 'Nome, duração e preço são obrigatórios');
      }

      const updatedService = await Service.update(id, {
        name,
        description,
        duration: parseInt(duration),
        price: parseFloat(price)
      });

      return this.success(res, updatedService, 'Serviço atualizado com sucesso');

    } catch (error) {
      console.error('Erro ao atualizar serviço:', error);
      return this.error(res, 'Erro interno do servidor');
    }
  }

  async delete(req, res) {
    try {
      const { id } = req.params;
      const { userId } = req.user;

      const service = await Service.findById(id);
      if (!service) {
        return this.notFound(res, 'Serviço não encontrado');
      }

      // Verificar se o usuário é dono do serviço
      if (service.establishment_id !== userId) {
        return this.error(res, 'Apenas o estabelecimento dono pode deletar este serviço', 403);
      }

      await Service.deactivate(id);
      return this.success(res, null, 'Serviço desativado com sucesso');

    } catch (error) {
      console.error('Erro ao deletar serviço:', error);
      return this.error(res, 'Erro interno do servidor');
    }
  }
}

export default ServiceController;