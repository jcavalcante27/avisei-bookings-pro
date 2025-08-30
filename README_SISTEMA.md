# 🚀 Avisei - Sistema de Agendamento

Sistema completo de agendamento com confirmação automática por email, desenvolvido em Node.js + Express + PostgreSQL.

## ✨ Funcionalidades Implementadas

### 🔐 Sistema de Autenticação
- **JWT com expiração de 7 dias**
- **Senhas criptografadas com bcrypt (12 rounds)**
- **4 tipos de usuários com permissões específicas:**
  - `super_admin`: Controle total do sistema
  - `estabelecimento`: Gerencia funcionários, serviços e agendamentos
  - `funcionario`: Acesso a agendamentos e disponibilidade
  - `cliente`: Realiza agendamentos

### 🏢 Gestão de Estabelecimentos
- **Cadastro de serviços** (nome, duração, valor)
- **Horários de funcionamento** configuráveis por dia da semana
- **Horários flexíveis**: manhã (08:00-12:00) + tarde (13:00-22:00)

### 👨‍💼 Gestão de Profissionais  
- **Disponibilidade configurável** por dia da semana e horário
- **Múltiplos períodos** por dia
- **Verificação automática** de disponibilidade para agendamentos

### 📅 Sistema de Agendamentos
- **Verificação inteligente** de disponibilidade
- **Prevenção de conflitos** de horários  
- **Status de agendamento**: scheduled, confirmed, completed, cancelled
- **Validações completas**:
  - Horário de funcionamento do estabelecimento
  - Disponibilidade do profissional
  - Conflitos de agendamento existentes

### 📧 Sistema de Email Automático
- **Emails HTML responsivos** com design profissional
- **Confirmação de agendamento** para cliente e estabelecimento
- **Cancelamento** com notificação automática
- **Configuração via SMTP** (Gmail, Outlook, etc.)

## 🛠️ Configuração

### Variáveis de Ambiente Necessárias (.env)
```env
# Banco de dados (já configurado via Replit Secrets)
DATABASE_URL=sua_url_do_neon_database

# Email (Configure nos Secrets do Replit)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=seu@email.com
SMTP_PASS=sua_senha_ou_app_password
BUSINESS_NAME=Nome do seu Negócio

# JWT (opcional, tem padrão)
JWT_SECRET=sua_chave_secreta_jwt
```

## 📡 API Endpoints

### 🔐 Autenticação
```
POST /api/auth/register/cliente      # Cadastro de cliente
POST /api/auth/register/funcionario  # Cadastro de funcionário  
POST /api/auth/register/estabelecimento # Cadastro de estabelecimento
POST /api/auth/login                 # Login
GET  /api/auth/profile              # Perfil do usuário
```

### 🛍️ Serviços
```
POST /api/services                   # Criar serviço
GET  /api/services                   # Listar todos serviços
GET  /api/services/:id               # Buscar serviço
GET  /api/services/establishment/:id # Serviços por estabelecimento
```

### 🕐 Horários de Funcionamento
```
POST /api/business-hours             # Configurar horário
POST /api/business-hours/bulk        # Configurar múltiplos horários
GET  /api/business-hours/establishment/:id # Ver horários
GET  /api/business-hours/establishment/:id/formatted # Horários formatados
```

### 👨‍💼 Disponibilidade de Profissionais
```
POST /api/availability               # Configurar disponibilidade
GET  /api/availability/professional/:id # Ver disponibilidade
GET  /api/availability/slots/:id     # Horários disponíveis
```

### 📅 Agendamentos
```
POST /api/appointments               # Criar agendamento
GET  /api/appointments/my            # Meus agendamentos
GET  /api/appointments/available-slots # Horários disponíveis
GET  /api/appointments/today         # Agendamentos de hoje
PATCH /api/appointments/:id/confirm  # Confirmar
PATCH /api/appointments/:id/cancel   # Cancelar
PATCH /api/appointments/:id/complete # Concluir
```

## 🗄️ Estrutura do Banco

### Tabelas Criadas Automaticamente:
- `users` - Usuários do sistema
- `services` - Serviços oferecidos
- `business_hours` - Horários de funcionamento
- `professional_availability` - Disponibilidade dos profissionais
- `appointments` - Agendamentos

## 🔒 Sistema de Permissões

- **Cliente**: Pode criar agendamentos e ver os próprios
- **Funcionário**: Pode ver agendamentos atribuídos e configurar disponibilidade  
- **Estabelecimento**: Pode gerenciar serviços, horários e ver todos agendamentos
- **Super Admin**: Acesso completo ao sistema

## 📧 Configuração de Email

Para ativar emails automáticos, configure nos **Secrets do Replit**:

1. `SMTP_HOST` - Servidor SMTP (ex: smtp.gmail.com)
2. `SMTP_USER` - Seu email
3. `SMTP_PASS` - Senha ou App Password
4. `BUSINESS_NAME` - Nome do seu negócio

## 🚀 Como Usar

1. **Crie seu usuário Super Admin primeiro:**
```bash
curl -X POST http://localhost:3000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"name":"Seu Nome","email":"admin@exemplo.com","password":"senha123","user_type":"super_admin"}'
```

2. **Faça login e obtenha o token:**
```bash
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@exemplo.com","password":"senha123"}'
```

3. **Use o token nas requisições protegidas:**
```bash
curl -H "Authorization: Bearer SEU_TOKEN" http://localhost:3000/api/users
```

## ✅ Status do Sistema

✅ **Autenticação completa** - JWT + bcrypt  
✅ **Gestão de serviços** - CRUD completo  
✅ **Horários de funcionamento** - Configuração flexível  
✅ **Disponibilidade profissional** - Sistema inteligente  
✅ **Agendamentos** - Verificação completa de disponibilidade  
✅ **Emails automáticos** - HTML responsivo  
✅ **Sistema de permissões** - 4 níveis de acesso  
✅ **Banco PostgreSQL** - Todas tabelas criadas  

## 🎯 Pronto para Produção!

O sistema está **100% funcional** e pronto para começar a receber agendamentos reais. Basta configurar as variáveis de email e começar a usar!