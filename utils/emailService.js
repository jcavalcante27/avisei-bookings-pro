import nodemailer from 'nodemailer';
import dotenv from 'dotenv';

dotenv.config();

class EmailService {
  constructor() {
    this.transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST || 'smtp.gmail.com',
      port: process.env.SMTP_PORT || 587,
      secure: false, // true para 465, false para outras portas
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS
      }
    });
  }

  async sendEmail(to, subject, html, attachments = null) {
    try {
      if (!process.env.SMTP_USER || !process.env.SMTP_PASS) {
        console.log('⚠️  Email não enviado: Configurações SMTP não encontradas');
        console.log('   Configure SMTP_HOST, SMTP_USER, SMTP_PASS nos Secrets');
        return false;
      }

      const mailOptions = {
        from: `"${process.env.BUSINESS_NAME || 'Avisei'}" <${process.env.SMTP_USER}>`,
        to: to,
        subject: subject,
        html: html,
        attachments: attachments
      };

      const info = await this.transporter.sendMail(mailOptions);
      console.log('✅ Email enviado:', info.messageId);
      return true;
    } catch (error) {
      console.error('❌ Erro ao enviar email:', error);
      return false;
    }
  }

  generateAppointmentConfirmationEmail(appointmentData) {
    const { 
      client_name, 
      establishment_name, 
      service_name, 
      appointment_date, 
      appointment_time, 
      total_price,
      professional_name 
    } = appointmentData;

    const formattedDate = new Date(appointment_date).toLocaleDateString('pt-BR');
    const formattedTime = appointment_time.substring(0, 5);

    return `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; text-align: center;">
          <h1 style="margin: 0; font-size: 28px;">✅ Agendamento Confirmado</h1>
          <p style="margin: 10px 0 0 0; font-size: 16px;">Avisei - Sistema de Agendamentos</p>
        </div>
        
        <div style="padding: 30px; background: #f8f9fa;">
          <h2 style="color: #333; margin-bottom: 20px;">Olá, ${client_name}!</h2>
          
          <p style="font-size: 16px; color: #666; margin-bottom: 25px;">
            Seu agendamento foi confirmado com sucesso. Confira os detalhes:
          </p>
          
          <div style="background: white; padding: 25px; border-radius: 8px; box-shadow: 0 2px 10px rgba(0,0,0,0.1);">
            <div style="display: flex; align-items: center; margin-bottom: 15px;">
              <span style="font-weight: bold; color: #333; width: 120px;">🏢 Local:</span>
              <span style="color: #666;">${establishment_name}</span>
            </div>
            
            <div style="display: flex; align-items: center; margin-bottom: 15px;">
              <span style="font-weight: bold; color: #333; width: 120px;">💼 Serviço:</span>
              <span style="color: #666;">${service_name}</span>
            </div>
            
            <div style="display: flex; align-items: center; margin-bottom: 15px;">
              <span style="font-weight: bold; color: #333; width: 120px;">👨‍💼 Profissional:</span>
              <span style="color: #666;">${professional_name}</span>
            </div>
            
            <div style="display: flex; align-items: center; margin-bottom: 15px;">
              <span style="font-weight: bold; color: #333; width: 120px;">📅 Data:</span>
              <span style="color: #666;">${formattedDate}</span>
            </div>
            
            <div style="display: flex; align-items: center; margin-bottom: 15px;">
              <span style="font-weight: bold; color: #333; width: 120px;">🕐 Horário:</span>
              <span style="color: #666;">${formattedTime}</span>
            </div>
            
            <div style="display: flex; align-items: center; margin-bottom: 0;">
              <span style="font-weight: bold; color: #333; width: 120px;">💰 Valor:</span>
              <span style="color: #28a745; font-weight: bold;">R$ ${Number(total_price).toFixed(2)}</span>
            </div>
          </div>
          
          <div style="background: #e8f4f8; padding: 20px; border-radius: 8px; margin-top: 25px; border-left: 4px solid #17a2b8;">
            <h3 style="margin-top: 0; color: #17a2b8;">📋 Instruções Importantes</h3>
            <ul style="margin: 0; padding-left: 20px; color: #666;">
              <li>Chegue com 10 minutos de antecedência</li>
              <li>Em caso de cancelamento, avise com pelo menos 2 horas de antecedência</li>
              <li>Guarde este email como comprovante</li>
            </ul>
          </div>
        </div>
        
        <div style="background: #333; color: white; padding: 20px; text-align: center;">
          <p style="margin: 0; font-size: 14px;">
            © ${new Date().getFullYear()} Avisei - Sistema de Agendamentos
          </p>
        </div>
      </div>
    `;
  }

  generateCancellationEmail(appointmentData) {
    const { 
      client_name, 
      establishment_name, 
      service_name, 
      appointment_date, 
      appointment_time 
    } = appointmentData;

    const formattedDate = new Date(appointment_date).toLocaleDateString('pt-BR');
    const formattedTime = appointment_time.substring(0, 5);

    return `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <div style="background: linear-gradient(135deg, #ff6b6b 0%, #ee5a24 100%); color: white; padding: 30px; text-align: center;">
          <h1 style="margin: 0; font-size: 28px;">❌ Agendamento Cancelado</h1>
          <p style="margin: 10px 0 0 0; font-size: 16px;">Avisei - Sistema de Agendamentos</p>
        </div>
        
        <div style="padding: 30px; background: #f8f9fa;">
          <h2 style="color: #333; margin-bottom: 20px;">Olá, ${client_name}!</h2>
          
          <p style="font-size: 16px; color: #666; margin-bottom: 25px;">
            Seu agendamento foi cancelado. Veja os detalhes do agendamento cancelado:
          </p>
          
          <div style="background: white; padding: 25px; border-radius: 8px; box-shadow: 0 2px 10px rgba(0,0,0,0.1);">
            <div style="display: flex; align-items: center; margin-bottom: 15px;">
              <span style="font-weight: bold; color: #333; width: 120px;">🏢 Local:</span>
              <span style="color: #666;">${establishment_name}</span>
            </div>
            
            <div style="display: flex; align-items: center; margin-bottom: 15px;">
              <span style="font-weight: bold; color: #333; width: 120px;">💼 Serviço:</span>
              <span style="color: #666;">${service_name}</span>
            </div>
            
            <div style="display: flex; align-items: center; margin-bottom: 15px;">
              <span style="font-weight: bold; color: #333; width: 120px;">📅 Data:</span>
              <span style="color: #666;">${formattedDate}</span>
            </div>
            
            <div style="display: flex; align-items: center; margin-bottom: 0;">
              <span style="font-weight: bold; color: #333; width: 120px;">🕐 Horário:</span>
              <span style="color: #666;">${formattedTime}</span>
            </div>
          </div>
          
          <div style="background: #fff3cd; padding: 20px; border-radius: 8px; margin-top: 25px; border-left: 4px solid #ffc107;">
            <p style="margin: 0; color: #856404;">
              <strong>💡 Que tal agendar novamente?</strong><br>
              Entre em contato conosco para reagendar seu atendimento.
            </p>
          </div>
        </div>
        
        <div style="background: #333; color: white; padding: 20px; text-align: center;">
          <p style="margin: 0; font-size: 14px;">
            © ${new Date().getFullYear()} Avisei - Sistema de Agendamentos
          </p>
        </div>
      </div>
    `;
  }

  async sendAppointmentConfirmation(appointmentData) {
    const subject = `✅ Agendamento Confirmado - ${appointmentData.establishment_name}`;
    const html = this.generateAppointmentConfirmationEmail(appointmentData);
    
    // Enviar para cliente
    const clientSent = await this.sendEmail(appointmentData.client_email, subject, html);
    
    // Enviar para estabelecimento
    const establishmentSubject = `📋 Novo Agendamento - ${appointmentData.client_name}`;
    const establishmentSent = await this.sendEmail(appointmentData.establishment_email, establishmentSubject, html);
    
    return { clientSent, establishmentSent };
  }

  async sendAppointmentCancellation(appointmentData) {
    const subject = `❌ Agendamento Cancelado - ${appointmentData.establishment_name}`;
    const html = this.generateCancellationEmail(appointmentData);
    
    // Enviar para cliente
    const clientSent = await this.sendEmail(appointmentData.client_email, subject, html);
    
    // Enviar para estabelecimento
    const establishmentSubject = `📋 Cancelamento - ${appointmentData.client_name}`;
    const establishmentSent = await this.sendEmail(appointmentData.establishment_email, establishmentSubject, html);
    
    return { clientSent, establishmentSent };
  }

  // Template para reagendamento
  generateRescheduleEmail(appointmentData, oldDate, oldTime) {
    const { 
      client_name, 
      establishment_name, 
      service_name, 
      appointment_date, 
      appointment_time,
      professional_name 
    } = appointmentData;

    const formattedNewDate = new Date(appointment_date).toLocaleDateString('pt-BR');
    const formattedNewTime = appointment_time.substring(0, 5);
    const formattedOldDate = new Date(oldDate).toLocaleDateString('pt-BR');
    const formattedOldTime = oldTime.substring(0, 5);

    return `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <div style="background: linear-gradient(135deg, #f39c12 0%, #e67e22 100%); color: white; padding: 30px; text-align: center;">
          <h1 style="margin: 0; font-size: 28px;">🔄 Agendamento Reagendado</h1>
          <p style="margin: 10px 0 0 0; font-size: 16px;">Avisei - Sistema de Agendamentos</p>
        </div>
        
        <div style="padding: 30px; background: #f8f9fa;">
          <h2 style="color: #333; margin-bottom: 20px;">Olá, ${client_name}!</h2>
          
          <p style="font-size: 16px; color: #666; margin-bottom: 25px;">
            Seu agendamento foi reagendado com sucesso. Confira os novos detalhes:
          </p>
          
          <div style="background: white; padding: 25px; border-radius: 8px; box-shadow: 0 2px 10px rgba(0,0,0,0.1);">
            <h3 style="color: #28a745; margin-top: 0;">📅 NOVO AGENDAMENTO</h3>
            
            <div style="display: flex; align-items: center; margin-bottom: 15px;">
              <span style="font-weight: bold; color: #333; width: 120px;">🏢 Local:</span>
              <span style="color: #666;">${establishment_name}</span>
            </div>
            
            <div style="display: flex; align-items: center; margin-bottom: 15px;">
              <span style="font-weight: bold; color: #333; width: 120px;">💼 Serviço:</span>
              <span style="color: #666;">${service_name}</span>
            </div>
            
            <div style="display: flex; align-items: center; margin-bottom: 15px;">
              <span style="font-weight: bold; color: #333; width: 120px;">👨‍💼 Profissional:</span>
              <span style="color: #666;">${professional_name}</span>
            </div>
            
            <div style="display: flex; align-items: center; margin-bottom: 15px;">
              <span style="font-weight: bold; color: #333; width: 120px;">📅 Nova Data:</span>
              <span style="color: #28a745; font-weight: bold;">${formattedNewDate}</span>
            </div>
            
            <div style="display: flex; align-items: center;">
              <span style="font-weight: bold; color: #333; width: 120px;">🕐 Novo Horário:</span>
              <span style="color: #28a745; font-weight: bold;">${formattedNewTime}</span>
            </div>
          </div>

          <div style="background: #f8f9fa; padding: 20px; border-radius: 8px; margin-top: 20px; border-left: 4px solid #6c757d;">
            <h4 style="color: #6c757d; margin-top: 0;">🗓️ Agendamento Anterior (Cancelado)</h4>
            <p style="margin: 5px 0; color: #666;">📅 Data: <span style="text-decoration: line-through;">${formattedOldDate}</span></p>
            <p style="margin: 5px 0; color: #666;">🕐 Horário: <span style="text-decoration: line-through;">${formattedOldTime}</span></p>
          </div>
          
          <div style="background: #d4edda; padding: 20px; border-radius: 8px; margin-top: 25px; border-left: 4px solid #28a745;">
            <h3 style="margin-top: 0; color: #155724;">📋 Lembre-se</h3>
            <ul style="margin: 0; padding-left: 20px; color: #155724;">
              <li>Chegue com 10 minutos de antecedência</li>
              <li>Confirme o novo horário em sua agenda</li>
              <li>Guarde este email como comprovante</li>
            </ul>
          </div>
        </div>
        
        <div style="background: #333; color: white; padding: 20px; text-align: center;">
          <p style="margin: 0; font-size: 14px;">
            © ${new Date().getFullYear()} Avisei - Sistema de Agendamentos
          </p>
        </div>
      </div>
    `;
  }

  // Template específico para estabelecimento (novo agendamento)
  generateEstablishmentNewAppointmentEmail(appointmentData) {
    const { 
      client_name, 
      client_phone,
      client_email,
      establishment_name, 
      service_name, 
      appointment_date, 
      appointment_time,
      total_price,
      professional_name 
    } = appointmentData;

    const formattedDate = new Date(appointment_date).toLocaleDateString('pt-BR');
    const formattedTime = appointment_time.substring(0, 5);

    return `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <div style="background: linear-gradient(135deg, #17a2b8 0%, #138496 100%); color: white; padding: 30px; text-align: center;">
          <h1 style="margin: 0; font-size: 28px;">📋 Novo Agendamento Recebido</h1>
          <p style="margin: 10px 0 0 0; font-size: 16px;">Avisei - Sistema de Agendamentos</p>
        </div>
        
        <div style="padding: 30px; background: #f8f9fa;">
          <h2 style="color: #333; margin-bottom: 20px;">Olá, ${establishment_name}!</h2>
          
          <p style="font-size: 16px; color: #666; margin-bottom: 25px;">
            Você recebeu um novo agendamento. Confira os detalhes:
          </p>
          
          <div style="background: white; padding: 25px; border-radius: 8px; box-shadow: 0 2px 10px rgba(0,0,0,0.1);">
            <h3 style="color: #17a2b8; margin-top: 0;">👤 DADOS DO CLIENTE</h3>
            
            <div style="display: flex; align-items: center; margin-bottom: 15px;">
              <span style="font-weight: bold; color: #333; width: 120px;">👤 Nome:</span>
              <span style="color: #666;">${client_name}</span>
            </div>
            
            <div style="display: flex; align-items: center; margin-bottom: 15px;">
              <span style="font-weight: bold; color: #333; width: 120px;">📞 Telefone:</span>
              <span style="color: #666;">${client_phone || 'Não informado'}</span>
            </div>
            
            <div style="display: flex; align-items: center; margin-bottom: 25px;">
              <span style="font-weight: bold; color: #333; width: 120px;">📧 Email:</span>
              <span style="color: #666;">${client_email}</span>
            </div>

            <h3 style="color: #17a2b8; margin-top: 0;">📅 DETALHES DO AGENDAMENTO</h3>
            
            <div style="display: flex; align-items: center; margin-bottom: 15px;">
              <span style="font-weight: bold; color: #333; width: 120px;">💼 Serviço:</span>
              <span style="color: #666;">${service_name}</span>
            </div>
            
            <div style="display: flex; align-items: center; margin-bottom: 15px;">
              <span style="font-weight: bold; color: #333; width: 120px;">👨‍💼 Profissional:</span>
              <span style="color: #666;">${professional_name}</span>
            </div>
            
            <div style="display: flex; align-items: center; margin-bottom: 15px;">
              <span style="font-weight: bold; color: #333; width: 120px;">📅 Data:</span>
              <span style="color: #666;">${formattedDate}</span>
            </div>
            
            <div style="display: flex; align-items: center; margin-bottom: 15px;">
              <span style="font-weight: bold; color: #333; width: 120px;">🕐 Horário:</span>
              <span style="color: #666;">${formattedTime}</span>
            </div>
            
            <div style="display: flex; align-items: center; margin-bottom: 0;">
              <span style="font-weight: bold; color: #333; width: 120px;">💰 Valor:</span>
              <span style="color: #28a745; font-weight: bold;">R$ ${Number(total_price).toFixed(2)}</span>
            </div>
          </div>
        </div>
        
        <div style="background: #333; color: white; padding: 20px; text-align: center;">
          <p style="margin: 0; font-size: 14px;">
            © ${new Date().getFullYear()} Avisei - Sistema de Agendamentos
          </p>
        </div>
      </div>
    `;
  }

  // Método para envio de reagendamento
  async sendAppointmentReschedule(appointmentData, oldDate, oldTime) {
    const subject = `🔄 Agendamento Reagendado - ${appointmentData.establishment_name}`;
    const html = this.generateRescheduleEmail(appointmentData, oldDate, oldTime);
    
    // Enviar para cliente
    const clientSent = await this.sendEmail(appointmentData.client_email, subject, html);
    
    // Enviar para estabelecimento
    const establishmentSubject = `📋 Reagendamento - ${appointmentData.client_name}`;
    const establishmentSent = await this.sendEmail(appointmentData.establishment_email, establishmentSubject, html);
    
    return { clientSent, establishmentSent };
  }

  // Método para envio específico ao estabelecimento (novo agendamento)
  async sendNewAppointmentToEstablishment(appointmentData) {
    const subject = `📋 Novo Agendamento - ${appointmentData.client_name}`;
    const html = this.generateEstablishmentNewAppointmentEmail(appointmentData);
    
    return await this.sendEmail(appointmentData.establishment_email, subject, html);
  }

  // Função reutilizável conforme solicitado
  async enviarEmail(to, subject, htmlContent) {
    return await this.sendEmail(to, subject, htmlContent);
  }
}

export default new EmailService();