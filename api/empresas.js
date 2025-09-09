import { pool } from '../db.js';

export default async function handler(req, res) {
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