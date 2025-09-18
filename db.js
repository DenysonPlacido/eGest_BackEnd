// /workspaces/eGest_BackEnd/db.js
import pkg from 'pg';
const { Pool } = pkg;

// Configurações de conexões para cada empresa
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

// Função que retorna o pool certo conforme empresa
export function getPool(empresa_id) {
  const config = dbConfigs[empresa_id];
  if (!config) {
    throw new Error(`Empresa ${empresa_id} não configurada no banco.`);
  }
  return new Pool(config);
}
