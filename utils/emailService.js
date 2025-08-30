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
}

export default new EmailService();