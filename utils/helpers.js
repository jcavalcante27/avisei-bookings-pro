// Funções utilitárias do sistema

// Formatar data para padrão brasileiro
const formatDateBR = (date) => {
  return new Date(date).toLocaleDateString('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });
};

// Validar email
const validateEmail = (email) => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

// Gerar ID único
const generateId = () => {
  return Math.random().toString(36).substr(2, 9);
};

// Sanitizar string
const sanitizeString = (str) => {
  return str.toString().trim().toLowerCase();
};

export {
  formatDateBR,
  validateEmail,
  generateId,
  sanitizeString
};