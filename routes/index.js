import express from 'express';
const router = express.Router();

// Rota principal das rotas da API
router.get('/', (req, res) => {
  res.json({ 
    message: 'Rotas da API Avisei',
    endpoints: [
      'GET /health - Health check',
      'GET /api - Lista de endpoints disponíveis'
    ]
  });
});

export default router;