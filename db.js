import pg from 'pg';
const { Pool } = pg;

// Configuração da conexão com o banco PostgreSQL
let connectionString = process.env.DATABASE_URL;

// Verificar se DATABASE_URL está no formato psql e extrair apenas a URL
if (connectionString && connectionString.includes("psql '")) {
  connectionString = connectionString.match(/'([^']+)'/)?.[1];
}

const pool = connectionString ? new Pool({
  connectionString: connectionString,
  ssl: { rejectUnauthorized: false } // Neon requer SSL
}) : null;

// Função para testar a conexão
const testConnection = async () => {
  if (!pool) {
    throw new Error('DATABASE_URL não configurada');
  }
  
  try {
    const client = await pool.connect();
    console.log('✅ Conectado ao banco de dados PostgreSQL');
    client.release();
  } catch (err) {
    console.error('❌ Erro ao conectar ao banco:', err);
    throw err;
  }
};

// Função para executar queries
const query = async (text, params) => {
  if (!pool) {
    throw new Error('DATABASE_URL não configurada - configure nos Secrets do Replit');
  }
  
  const start = Date.now();
  try {
    const res = await pool.query(text, params);
    const duration = Date.now() - start;
    console.log('✅ Query executada:', { text: text.substring(0, 50) + '...', duration, rows: res.rowCount });
    return res;
  } catch (err) {
    console.error('❌ Erro na query:', err);
    throw err;
  }
};

export {
  pool,
  query,
  testConnection
};