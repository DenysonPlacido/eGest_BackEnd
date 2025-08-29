import express from 'express';
import { pool } from '../db.js';

const router = express.Router();

router.post('/login', async (req, res) => {
    const { empresa_id, username, senha } = req.body;

    if (!empresa_id || !username || !senha) {
        return res.status(400).json({ message: 'Campos obrigatórios' });
    }

    try {
        const query = `
            SELECT * FROM lg_in($1, $2, $3);
        `;

        const result = await pool.query(query, [empresa_id, username, senha]);
        return res.json(result.rows[0]);
    } catch (err) {
        console.error(err);
        return res.status(500).json({ message: 'Erro interno no servidor' });
    }
});


router.get('/empresas', async (req, res) => {
    try {
        const query = 'SELECT id, nome FROM empresas WHERE situacao = 1 ORDER BY nome';
        const result = await pool.query(query);
        res.json(result.rows);
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Erro ao buscar empresas' });
    }
});





export default router;
