// /workspaces/eGest_BackEnd/routes/usuarios.js
import express from 'express';

const router = express.Router();

/**
 * GET /api/usuarios
 * Lista usuários (com paginação opcional)
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
 * GET /api/usuarios/:id
 * Busca usuário por ID
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
 * POST /api/usuarios
 * Cria novo usuário
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
 * PUT /api/usuarios/:id
 * Atualiza usuário existente
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
 * DELETE /api/usuarios/:id
 * Remove usuário por ID
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



/**
 * @swagger
 * /api/usuarios:
 *   get:
 *     summary: Lista usuários com filtros e paginação
 *     tags: [Usuários]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: id
 *         schema:
 *           type: integer
 *       - in: query
 *         name: login
 *         schema:
 *           type: string
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
 *       500:
 *         description: Erro interno ao listar usuários
 */



/**
 * @swagger
 * /api/usuarios/{id}:
 *   get:
 *     summary: Busca um usuário pelo ID
 *     tags: [Usuários]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Dados do usuário
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *       404:
 *         description: Usuário não encontrado
 *       500:
 *         description: Erro interno ao buscar usuário
 */



/**
 * @swagger
 * /api/usuarios:
 *   post:
 *     summary: Cria um novo usuário
 *     tags: [Usuários]
 *     security:
 *       - bearerAuth: []
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
 *         description: Erro interno ao criar usuário
 */


/**
 * @swagger
 * /api/usuarios/{id}:
 *   put:
 *     summary: Atualiza os dados de um usuário
 *     tags: [Usuários]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
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
 *         description: Erro interno ao atualizar usuário
 */


/**
 * @swagger
 * /api/usuarios/{id}:
 *   delete:
 *     summary: Remove um usuário pelo ID
 *     tags: [Usuários]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Usuário deletado com sucesso
 *       500:
 *         description: Erro interno ao deletar usuário
 */