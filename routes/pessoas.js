// /workspaces/eGest_BackEnd/routes/pessoas.js

import express from 'express';
const router = express.Router();

// ===================================
// 🔎 GET /pessoas  (listar pessoas)
// ===================================
router.get('/', async (req, res) => {
  const { pessoa_id, nome, cpf_cnpj, limit = 10, offset = 0 } = req.query;

  const client = await req.pool.connect();
  try {
    await client.query('BEGIN');

    await client.query(
      `CALL selecionar_pessoa($1, $2, $3, $4, $5, $6)`,
      [
        pessoa_id || null,
        nome || null,
        cpf_cnpj || null,
        limit,
        offset,
        'resultado_cursor'
      ]
    );

    const result = await client.query('FETCH ALL IN resultado_cursor');
    await client.query('COMMIT');
    res.json(result.rows);
  } catch (err) {
    await client.query('ROLLBACK');
    console.error('❌ Erro ao selecionar pessoas:', err);
    res.status(500).json({ error: err.message });
  } finally {
    client.release();
  }
});

// ===================================
// ➕ POST /pessoas  (inserir pessoa)
// ===================================
router.post('/', async (req, res) => {
  const {
    tipo_pessoa, cpf_cnpj, nome, data_nascimento,
    ddd, fone, email, cep, cod_logradouro,
    numero, cod_bairro, complemento
  } = req.body;

  const client = await req.pool.connect();
  try {
    await client.query('BEGIN');
    await client.query(
      `CALL inserir_pessoa($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12)`,
      [
        tipo_pessoa, cpf_cnpj, nome, data_nascimento,
        ddd, fone, email, cep, cod_logradouro,
        numero, cod_bairro, complemento
      ]
    );
    await client.query('COMMIT');
    res.json({ status: 'OK', mensagem: 'Pessoa cadastrada com sucesso' });
  } catch (err) {
    await client.query('ROLLBACK');
    console.error('❌ Erro ao inserir pessoa:', err);
    res.status(500).json({ error: err.message });
  } finally {
    client.release();
  }
});

// ===================================
// ✏️ PUT /pessoas/:id  (atualizar pessoa)
// ===================================
router.put('/:id', async (req, res) => {
  const { id } = req.params;
  const {
    tipo_pessoa, cpf_cnpj, nome, data_nascimento,
    ddd, fone, email, cep, cod_logradouro,
    numero, cod_bairro, complemento
  } = req.body;

  const client = await req.pool.connect();
  try {
    await client.query('BEGIN');
    await client.query(
      `CALL atualizar_pessoa($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13)`,
      [
        id, tipo_pessoa, cpf_cnpj, nome, data_nascimento,
        ddd, fone, email, cep, cod_logradouro,
        numero, cod_bairro, complemento
      ]
    );
    await client.query('COMMIT');
    res.json({ status: 'OK', mensagem: `Pessoa ${id} atualizada com sucesso` });
  } catch (err) {
    await client.query('ROLLBACK');
    console.error('❌ Erro ao atualizar pessoa:', err);
    res.status(500).json({ error: err.message });
  } finally {
    client.release();
  }
});

// ===================================
// 🗑️ DELETE /pessoas/:id  (deletar pessoa)
// ===================================
router.delete('/:id', async (req, res) => {
  const { id } = req.params;

  const client = await req.pool.connect();
  try {
    await client.query('BEGIN');
    await client.query(`CALL deletar_pessoa($1)`, [id]);
    await client.query('COMMIT');
    res.json({ status: 'OK', mensagem: `Pessoa ${id} deletada com sucesso` });
  } catch (err) {
    await client.query('ROLLBACK');
    console.error('❌ Erro ao deletar pessoa:', err);
    res.status(500).json({ error: err.message });
  } finally {
    client.release();
  }
});

// ===================================
// 🔎 GET /pessoas/enderecos/buscar?cep=xxxxx
// ===================================
router.get('/enderecos/buscar', async (req, res) => {
  const { cep } = req.query;
  try {
    const result = await req.pool.query(
      `SELECT cod_logradouro, cod_bairro, nome_logradouro AS logradouro, nome_bairro AS bairro
       FROM logradouros
       WHERE cep = $1`,
      [cep]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ erro: 'Endereço não encontrado' });
    }

    res.json(result.rows[0]);
  } catch (err) {
    console.error('❌ Erro ao buscar endereço:', err);
    res.status(500).json({ error: err.message });
  }
});

export default router;



/**
 * @swagger
 * /api/pessoas:
 *   get:
 *     summary: Lista pessoas com filtros opcionais
 *     tags: [Pessoas]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: pessoa_id
 *         schema:
 *           type: integer
 *       - in: query
 *         name: nome
 *         schema:
 *           type: string
 *       - in: query
 *         name: cpf_cnpj
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
 *         description: Lista de pessoas
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 type: object
 *       500:
 *         description: Erro interno ao listar pessoas
 */



/**
 * @swagger
 * /api/pessoas:
 *   post:
 *     summary: Insere uma nova pessoa
 *     tags: [Pessoas]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - tipo_pessoa
 *               - cpf_cnpj
 *               - nome
 *             properties:
 *               tipo_pessoa:
 *                 type: string
 *               cpf_cnpj:
 *                 type: string
 *               nome:
 *                 type: string
 *               data_nascimento:
 *                 type: string
 *                 format: date
 *               ddd:
 *                 type: string
 *               fone:
 *                 type: string
 *               email:
 *                 type: string
 *               cep:
 *                 type: string
 *               cod_logradouro:
 *                 type: integer
 *               numero:
 *                 type: string
 *               cod_bairro:
 *                 type: integer
 *               complemento:
 *                 type: string
 *     responses:
 *       200:
 *         description: Pessoa cadastrada com sucesso
 *       500:
 *         description: Erro interno ao inserir pessoa
 */



/**
 * @swagger
 * /api/pessoas/{id}:
 *   put:
 *     summary: Atualiza os dados de uma pessoa
 *     tags: [Pessoas]
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
 *               tipo_pessoa:
 *                 type: string
 *               cpf_cnpj:
 *                 type: string
 *               nome:
 *                 type: string
 *               data_nascimento:
 *                 type: string
 *                 format: date
 *               ddd:
 *                 type: string
 *               fone:
 *                 type: string
 *               email:
 *                 type: string
 *               cep:
 *                 type: string
 *               cod_logradouro:
 *                 type: integer
 *               numero:
 *                 type: string
 *               cod_bairro:
 *                 type: integer
 *               complemento:
 *                 type: string
 *     responses:
 *       200:
 *         description: Pessoa atualizada com sucesso
 *       500:
 *         description: Erro interno ao atualizar pessoa
 */



/**
 * @swagger
 * /api/pessoas/{id}:
 *   delete:
 *     summary: Remove uma pessoa pelo ID
 *     tags: [Pessoas]
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
 *         description: Pessoa deletada com sucesso
 *       500:
 *         description: Erro interno ao deletar pessoa
 */



/**
 * @swagger
 * /api/pessoas/enderecos/buscar:
 *   get:
 *     summary: Busca endereço pelo CEP
 *     tags: [Pessoas]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: cep
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Endereço encontrado
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 cod_logradouro:
 *                   type: integer
 *                 cod_bairro:
 *                   type: integer
 *                 logradouro:
 *                   type: string
 *                 bairro:
 *                   type: string
 *       404:
 *         description: Endereço não encontrado
 *       500:
 *         description: Erro interno ao buscar endereço
 */