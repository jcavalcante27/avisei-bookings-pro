import pg from 'pg';
const { Pool } = pg;

// Configuração da conexão com o banco PostgreSQL
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
});

// Função para testar a conexão
const testConnection = async () => {
  try {
    const client = await pool.connect();
    console.log('Conectado ao banco de dados PostgreSQL');
    client.release();
  } catch (err) {
    console.error('Erro ao conectar ao banco:', err);
  }
};

// Função para executar queries
const query = async (text, params) => {
  const start = Date.now();
  try {
    const res = await pool.query(text, params);
    const duration = Date.now() - start;
    console.log('Query executada:', { text, duration, rows: res.rowCount });
    return res;
  } catch (err) {
    console.error('Erro na query:', err);
    throw err;
  }
};

export {
  pool,
  query,
  testConnection
};