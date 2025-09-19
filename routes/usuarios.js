// /workspaces/eGest_BackEnd/routes/usuarios.js
import express from 'express';

const router = express.Router();

/**
 * @swagger
 * tags:
 *   name: Usuarios
 *   description: Endpoints para gerenciamento de usuários
 */

/**
 * @swagger
 * /api/usuarios:
 *   get:
 *     summary: Lista usuários com paginação opcional
 *     tags: [Usuarios]
 *     parameters:
 *       - in: query
 *         name: id
 *         schema:
 *           type: integer
 *         description: Filtrar por ID do usuário
 *       - in: query
 *         name: login
 *         schema:
 *           type: string
 *         description: Filtrar por login
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 10
 *       - in: query
 *         name: offset
 *         schema:
 *           type: integer
 *           default: 0
 *     responses:
 *       200:
 *         description: Lista de usuários
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 type: object
 *                 properties:
 *                   id:
 *                     type: integer
 *                   login:
 *                     type: string
 *                   tipo_usuario:
 *                     type: string
 *                   empresa_id:
 *                     type: integer
 *       500:
 *         description: Erro interno do servidor
 */
router.get('/', async (req, res) => {
  const { id, login, limit = 10, offset = 0 } = req.query;
  const client = await req.pool.connect();

  try {
    await client.query('BEGIN');
    await client.query(
      `CALL listar_usuarios($1, $2, $3, $4, $5)`,
      [id || null, login || null, limit, offset, 'resultado_cursor']
    );

    const result = await client.query('FETCH ALL IN resultado_cursor');
    await client.query('COMMIT');

    res.json(result.rows);
  } catch (err) {
    await client.query('ROLLBACK');
    console.error('❌ Erro ao listar usuários:', err);
    res.status(500).json({ error: err.message });
  } finally {
    client.release();
  }
});

/**
 * @swagger
 * /api/usuarios/{id}:
 *   get:
 *     summary: Busca usuário por ID
 *     tags: [Usuarios]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID do usuário
 *     responses:
 *       200:
 *         description: Usuário encontrado
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 id:
 *                   type: integer
 *                 login:
 *                   type: string
 *                 tipo_usuario:
 *                   type: string
 *                 empresa_id:
 *                   type: integer
 *       404:
 *         description: Usuário não encontrado
 *       500:
 *         description: Erro interno do servidor
 */
router.get('/:id', async (req, res) => {
  const { id } = req.params;
  const client = await req.pool.connect();

  try {
    await client.query('BEGIN');
    await client.query(
      `CALL listar_usuarios($1, $2, $3, $4, $5)`,
      [id, null, 1, 0, 'resultado_cursor']
    );

    const result = await client.query('FETCH ALL IN resultado_cursor');
    await client.query('COMMIT');

    if (result.rows.length === 0) {
      return res.status(404).json({ erro: 'Usuário não encontrado' });
    }

    res.json(result.rows[0]);
  } catch (err) {
    await client.query('ROLLBACK');
    console.error('❌ Erro ao buscar usuário:', err);
    res.status(500).json({ error: err.message });
  } finally {
    client.release();
  }
});

/**
 * @swagger
 * /api/usuarios:
 *   post:
 *     summary: Cria novo usuário
 *     tags: [Usuarios]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - pessoa_id
 *               - status_usuario
 *               - tipo_usuario
 *               - senha
 *             properties:
 *               pessoa_id:
 *                 type: integer
 *               status_usuario:
 *                 type: string
 *               tipo_usuario:
 *                 type: string
 *               senha:
 *                 type: string
 *               empresa_id:
 *                 type: integer
 *               login:
 *                 type: string
 *     responses:
 *       201:
 *         description: Usuário criado com sucesso
 *       500:
 *         description: Erro interno do servidor
 */
router.post('/', async (req, res) => {
  const { pessoa_id, status_usuario, tipo_usuario, senha, empresa_id, login } = req.body;
  const client = await req.pool.connect();

  try {
    await client.query('BEGIN');
    await client.query(
      `CALL inserir_usuario($1,$2,$3,$4,$5,$6)`,
      [pessoa_id, status_usuario, tipo_usuario, senha, empresa_id || null, login || null]
    );
    await client.query('COMMIT');

    res.status(201).json({ mensagem: 'Usuário criado com sucesso' });
  } catch (err) {
    await client.query('ROLLBACK');
    console.error('❌ Erro ao criar usuário:', err);
    res.status(500).json({ error: err.message });
  } finally {
    client.release();
  }
});

/**
 * @swagger
 * /api/usuarios/{id}:
 *   put:
 *     summary: Atualiza usuário existente
 *     tags: [Usuarios]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID do usuário
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               pessoa_id:
 *                 type: integer
 *               status_usuario:
 *                 type: string
 *               tipo_usuario:
 *                 type: string
 *               senha:
 *                 type: string
 *               empresa_id:
 *                 type: integer
 *               login:
 *                 type: string
 *     responses:
 *       200:
 *         description: Usuário atualizado com sucesso
 *       500:
 *         description: Erro interno do servidor
 */
router.put('/:id', async (req, res) => {
  const { id } = req.params;
  const { pessoa_id, status_usuario, tipo_usuario, senha, empresa_id, login } = req.body;
  const client = await req.pool.connect();

  try {
    await client.query('BEGIN');
    await client.query(
      `CALL atualizar_usuario($1,$2,$3,$4,$5,$6,$7)`,
      [id, pessoa_id || null, status_usuario || null, tipo_usuario || null, senha || null, empresa_id || null, login || null]
    );
    await client.query('COMMIT');

    res.json({ mensagem: `Usuário ${id} atualizado com sucesso` });
  } catch (err) {
    await client.query('ROLLBACK');
    console.error('❌ Erro ao atualizar usuário:', err);
    res.status(500).json({ error: err.message });
  } finally {
    client.release();
  }
});

/**
 * @swagger
 * /api/usuarios/{id}:
 *   delete:
 *     summary: Remove usuário por ID
 *     tags: [Usuarios]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID do usuário
 *     responses:
 *       200:
 *         description: Usuário deletado com sucesso
 *       500:
 *         description: Erro interno do servidor
 */
router.delete('/:id', async (req, res) => {
  const { id } = req.params;
  const client = await req.pool.connect();

  try {
    await client.query('BEGIN');
    await client.query(`CALL deletar_usuario($1)`, [id]);
    await client.query('COMMIT');

    res.json({ mensagem: `Usuário ${id} deletado com sucesso` });
  } catch (err) {
    await client.query('ROLLBACK');
    console.error('❌ Erro ao deletar usuário:', err);
    res.status(500).json({ error: err.message });
  } finally {
    client.release();
  }
});

export default router;
