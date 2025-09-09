// routes/empresas.js
import express from 'express';
import { pool } from '../db.js';

const router = express.Router();

router.get('/empresas', async (req, res) => {
  try {
    const query = 'SELECT empresa_id, nome FROM empresas WHERE situacao = 1 ORDER BY nome';
    const result = await pool.query(query);
    res.status(200).json(result.rows);
  } catch (err) {
    console.error('Erro ao buscar empresas:', err);
    res.status(500).json({ message: 'Erro ao buscar empresas' });
  }
});

export default router;