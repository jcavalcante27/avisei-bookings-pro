// Controller base com métodos utilitários
class BaseController {
  
  // Resposta de sucesso
  success(res, data, message = 'Sucesso') {
    return res.status(200).json({
      success: true,
      message,
      data
    });
  }

  // Resposta de erro
  error(res, message = 'Erro interno', status = 500) {
    return res.status(status).json({
      success: false,
      message,
      error: true
    });
  }

  // Resposta de não encontrado
  notFound(res, message = 'Recurso não encontrado') {
    return res.status(404).json({
      success: false,
      message,
      error: true
    });
  }

  // Resposta de validação
  validationError(res, errors) {
    return res.status(400).json({
      success: false,
      message: 'Erro de validação',
      errors,
      error: true
    });
  }
}

export default BaseController;