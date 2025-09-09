// routes/usuarios.js
import express from 'express';
import { pool } from '../db.js';

const router = express.Router();

router.post('/usuarios/gerenciar', async (req, res) => {
  const {
    acao, id, pessoa_id, status_usuario, tipo_usuario,
    senha, empresa_id, login
  } = req.body;

  const client = await pool.connect();
  try {
    if (acao === 'SELECT') {
      await client.query('BEGIN');
      await client.query(`CALL gerenciar_usuario($1,$2,$3,$4,$5,$6,$7,$8,$9)`, [
        acao, id, pessoa_id, status_usuario, tipo_usuario,
        senha, empresa_id, login, 'resultado_cursor'
      ]);
      const result = await client.query('FETCH ALL IN resultado_cursor');
      await client.query('COMMIT');
      res.json(result.rows);
    } else {
      await client.query(`CALL gerenciar_usuario($1,$2,$3,$4,$5,$6,$7,$8,$9)`, [
        acao, id, pessoa_id, status_usuario, tipo_usuario,
        senha, empresa_id, login, null
      ]);
      res.json({ status: 'OK', acao });
    }
  } catch (err) {
    await client.query('ROLLBACK');
    console.error('Erro na procedure usuarios:', err);
    res.status(500).json({ error: err.message });
  } finally {
    client.release();
  }
});

export default router;