// /workspaces/eGest_BackEnd/api/empresas.js

import { pool } from '../db.js';

export default async function handler(req, res) {
  // Configura CORS manualmente
  res.setHeader('Access-Control-Allow-Origin', 'https://e-gest.vercel.app');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  // Trata requisição preflight
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  // Valida método
  if (req.method !== 'GET') {
    return res.status(405).json({ message: 'Método não permitido' });
  }

  try {
    const query = 'SELECT empresa_id, nome FROM empresas WHERE situacao = 1 ORDER BY nome';
    const result = await pool.query(query);
    res.status(200).json(result.rows);
  } catch (err) {
    console.error('Erro ao buscar empresas:', err);
    res.status(500).json({ message: 'Erro ao buscar empresas' });
  }
}