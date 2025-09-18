// /db.js
import pkg from 'pg';
const { Pool } = pkg;

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
}

// 🔁 Exporta função e pools
export function getPool(empresa_id) {
  const pool = dbPools[empresa_id];
  if (!pool) {
    throw new Error(`Empresa ${empresa_id} não configurada no banco.`);
  }
  return pool;
}

export { dbPools };