// routes/auth.js
import express from 'express';
import jwt from 'jsonwebtoken';
import { pool } from '../db.js';

const router = express.Router();

router.post('/login', async (req, res) => {
  const { empresa_id, username, senha } = req.body;

  if (!empresa_id || !username || !senha) {
    return res.status(400).json({ message: 'Campos obrigatórios' });
  }

  try {
    const query = `SELECT * FROM lg_in($1, $2, $3);`;
    const result = await pool.query(query, [empresa_id.toString(), username, senha]);
    const usuario = result.rows[0];

    if (!usuario || !usuario.usuario_id) {
      return res.status(401).json({ message: 'Credenciais inválidas' });
    }

    const token = jwt.sign(
      {
        id: usuario.usuario_id,
        empresa_id: usuario.empresa_id,
        nome: usuario.nome,
        perfil: usuario.perfil
      },
      process.env.JWT_SECRET,
      { expiresIn: '5m' }
    );

    res.status(200).json({
      usuario: {
        id: usuario.usuario_id,
        nome: usuario.nome,
        perfil: usuario.perfil,
        empresa_id: usuario.empresa_id
      },
      token
    });
  } catch (err) {
    console.error('Erro no login:', err);
    res.status(500).json({ message: 'Erro interno no servidor' });
  }
});

export default router;