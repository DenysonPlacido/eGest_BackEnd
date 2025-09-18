// /workspaces/eGest_BackEnd/routes/auth.js
import express from 'express';
import jwt from 'jsonwebtoken';
import { getPool } from '../db.js';

const router = express.Router();

router.post('/login', async (req, res) => {
  const empresa_id = parseInt(req.headers['x-empresa-id'], 10);
  const { username, senha } = req.body;

  if (!empresa_id || !username || !senha) {
    return res.status(400).json({ message: 'Campos obrigatórios' });
  }

  try {
    const pool = getPool(empresa_id);

    // 1️⃣ Verifica credenciais
    const loginQuery = `SELECT * FROM lg_in($1, $2);`;
    const loginResult = await pool.query(loginQuery, [username, senha]);
    const usuario = loginResult.rows[0];

    if (!usuario || !usuario.usuario_id) {
      return res.status(401).json({ message: 'Credenciais inválidas' });
    }

    // 2️⃣ Busca tempo de sessão na tabela de configurações
    const configQuery = `
      SELECT valor 
      FROM public.configuracoes 
      WHERE nome = 'TEMPO_SESSAO'
    `;
    const configResult = await pool.query(configQuery);
    let tempoSessao = configResult.rows[0]?.valor || 3; // padrão 3 minutos se não existir
    tempoSessao = parseInt(tempoSessao, 10); // garante número

    // 3️⃣ Gera o token com tempo de expiração da configuração
    const token = jwt.sign(
      {
        id: usuario.usuario_id,
        empresa_id: usuario.empresa_id,
        nome: usuario.nome_completo,
        tipo_usuario: usuario.tipo_usuario
      },
      process.env.JWT_SECRET,
      { expiresIn: `${tempoSessao}m` } // usa valor da tabela
    );

    res.status(200).json({
      usuario: {
        id: usuario.usuario_id,
        nome: usuario.nome_completo,
        tipo_usuario: usuario.tipo_usuario,
        empresa_id: usuario.empresa_id,
        empresa_nome: usuario.empresa_nome
      },
      token,
      tempoSessao
    });
  } catch (err) {
    console.error('Erro no login:', err);
    res.status(500).json({ message: 'Erro interno no servidor' });
  }
});

export default router;





/**
 * @swagger
 * tags:
 *   name: Auth
 *   description: Endpoints de autenticação

 * /api/auth/login:
 *   post:
 *     summary: Realiza login do usuário
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - empresa_id
 *               - username
 *               - senha
 *             properties:
 *               empresa_id:
 *                 type: integer
 *                 example: 1
 *               username:
 *                 type: string
 *                 example: "admin"
 *               senha:
 *                 type: string
 *                 example: "123456"
 *     responses:
 *       200:
 *         description: Login realizado com sucesso
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 usuario:
 *                   type: object
 *                   properties:
 *                     id:
 *                       type: integer
 *                     nome:
 *                       type: string
 *                     tipo_usuario:
 *                       type: string
 *                     empresa_id:
 *                       type: integer
 *                     empresa_nome:
 *                       type: string
 *                 token:
 *                   type: string
 *                 tempoSessao:
 *                   type: integer
 *       400:
 *         description: Campos obrigatórios ausentes
 *       401:
 *         description: Credenciais inválidas
 *       500:
 *         description: Erro interno no servidor
 */