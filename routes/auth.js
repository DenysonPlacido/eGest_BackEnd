// /workspaces/eGest_BackEnd/routes/auth.js
import express from 'express';
import { pool } from '../db.js'; // Certifique-se que db.js exporta 'pool'
import jwt from 'jsonwebtoken';


const router = express.Router();

// ... dentro do router.post('/login')
const usuario = result.rows[0];

if (!usuario || !usuario.usuario_id) {
  return res.status(401).json({ message: 'Credenciais inválidas' });
}

// Gerar token
const token = jwt.sign(
  { id: usuario.usuario_id, empresa_id: usuario.empresa_id },
  process.env.JWT_SECRET,
  { expiresIn: '8h' }
);

// Retornar dados + token
return res.json({
  usuario: {
    id: usuario.usuario_id,
    nome: usuario.nome,
    perfil: usuario.perfil
  },
  token
});



// ===========================
// Rota de login
// ===========================
router.post('/login', async (req, res) => {
    const { empresa_id, username, senha } = req.body;

    if (!empresa_id || !username || !senha) {
        return res.status(400).json({ message: 'Campos obrigatórios' });
    }

    try {
        const query = `
            SELECT * FROM lg_in($1, $2, $3);
        `;
        const result = await pool.query(query, [empresa_id.toString(), username, senha]);


        // Retorna o primeiro registro da procedure
        return res.json(result.rows[0]);
    } catch (err) {
        console.error('Erro no login:', err);
        return res.status(500).json({ message: 'Erro interno no servidor' });
    }
});

// ===========================
// Rota para listar empresas ativas
// ===========================
router.get('/empresas', async (req, res) => {
    try {
        const query = 'SELECT empresa_id, nome FROM empresas WHERE situacao = 1 ORDER BY nome';
        const result = await pool.query(query);
        res.json(result.rows);
    } catch (err) {
        console.error('Erro ao buscar empresas:', err);
        res.status(500).json({ message: 'Erro ao buscar empresas' });
    }
});

export default router;
