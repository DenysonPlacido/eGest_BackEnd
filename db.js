// /db.js
import pkg from 'pg';
const { Pool } = pkg;

// ✅ Validação das variáveis de ambiente
if (!process.env.DB_URL_NEONDB || !process.env.DB_URL_EGEST) {
  throw new Error('❌ Variáveis de banco não definidas no ambiente!');
}

// 🔧 Configurações por empresa
const dbConfigs = {
  1: {
    connectionString: process.env.DB_URL_NEONDB,
    ssl: { rejectUnauthorized: false }
  },
  2: {
    connectionString: process.env.DB_URL_EGEST,
    ssl: { rejectUnauthorized: false }
  }
};

// 🔁 Cria pools para cada empresa
const dbPools = {};
for (const [empresaId, config] of Object.entries(dbConfigs)) {
  dbPools[empresaId] = new Pool(config);
  console.log(`✅ Pool criado para empresa ${empresaId}:`, config.connectionString);
}

// 🔁 Exporta função para obter pool
export function getPool(empresa_id) {
  const pool = dbPools[empresa_id];
  if (!pool) {
    console.error(`❌ Empresa ${empresa_id} não configurada.`);
    throw new Error(`Empresa ${empresa_id} não configurada no banco.`);
  }

  return pool;
}

export { dbPools };