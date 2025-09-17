// /workspaces/eGest_BackEnd/routes/pessoas.js

import express from 'express';
import { pool } from '../db.js';

const router = express.Router();

/**
 * GET /api/pessoas
 * Lista pessoas (com paginação opcional)
 */
router.get('/', async (req, res) => {
  const { limit = 10, offset = 0 } = req.query;

  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    await client.query(
      `
      CALL gerenciar_pessoa(
        $1, $2, $3, $4, $5, $6, $7, $8, $9,
        $10, $11, $12, $13, $14, $15,
        $16, $17
      )
      `,
      [
        'SELECT', null, null, null, null, null, null, null, null,
        null, null, null, null, null, null,
        'resultado_cursor', limit, offset
      ]
    );

    const result = await client.query('FETCH ALL IN resultado_cursor');
    await client.query('COMMIT');

    res.json(result.rows);
  } catch (err) {
    await client.query('ROLLBACK');
    console.error('❌ Erro ao buscar pessoas:', err);
    res.status(500).json({ error: err.message });
  } finally {
    client.release();
  }
});

/**
 * GET /api/pessoas/:id
 * Busca pessoa por ID
 */
router.get('/:id', async (req, res) => {
  const { id } = req.params;

  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    await client.query(
      `
      CALL gerenciar_pessoa(
        $1, $2, $3, $4, $5, $6, $7, $8, $9,
        $10, $11, $12, $13, $14, $15,
        $16, $17
      )
      `,
      [
        'SELECT', id, null, null, null, null, null, null, null,
        null, null, null, null, null, null,
        'resultado_cursor', 1, 0
      ]
    );

    const result = await client.query('FETCH ALL IN resultado_cursor');
    await client.query('COMMIT');

    if (result.rows.length === 0) {
      return res.status(404).json({ erro: 'Pessoa não encontrada' });
    }

    res.json(result.rows[0]);
  } catch (err) {
    await client.query('ROLLBACK');
    console.error('❌ Erro ao buscar pessoa por ID:', err);
    res.status(500).json({ error: err.message });
  } finally {
    client.release();
  }
});

/**
 * POST /api/pessoas
 * Cria nova pessoa
 */
router.post('/', async (req, res) => {
  const {
    tipo_pessoa, cpf_cnpj, nome, data_nascimento,
    ddd, fone, email, cep, cod_logradouro, numero, cod_bairro, complemento
  } = req.body;

  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    await client.query(
      `
      CALL gerenciar_pessoa(
        $1, $2, $3, $4, $5, $6, $7, $8, $9,
        $10, $11, $12, $13, $14, $15,
        $16, $17
      )
      `,
      [
        'INSERT', null, tipo_pessoa, cpf_cnpj, nome, data_nascimento,
        ddd, fone, email, cep, cod_logradouro, numero, cod_bairro, complemento,
        null, null, null
      ]
    );
    await client.query('COMMIT');

    res.status(201).json({ mensagem: 'Pessoa criada com sucesso' });
  } catch (err) {
    await client.query('ROLLBACK');
    console.error('❌ Erro ao criar pessoa:', err);
    res.status(500).json({ error: err.message });
  } finally {
    client.release();
  }
});

/**
 * PUT /api/pessoas/:id
 * Atualiza pessoa existente
 */
router.put('/:id', async (req, res) => {
  const { id } = req.params;
  const {
    tipo_pessoa, cpf_cnpj, nome, data_nascimento,
    ddd, fone, email, cep, cod_logradouro, numero, cod_bairro, complemento
  } = req.body;

  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    await client.query(
      `
      CALL gerenciar_pessoa(
        $1, $2, $3, $4, $5, $6, $7, $8, $9,
        $10, $11, $12, $13, $14, $15,
        $16, $17
      )
      `,
      [
        'UPDATE', id, tipo_pessoa, cpf_cnpj, nome, data_nascimento,
        ddd, fone, email, cep, cod_logradouro, numero, cod_bairro, complemento,
        null, null, null
      ]
    );
    await client.query('COMMIT');

    res.json({ mensagem: 'Pessoa atualizada com sucesso' });
  } catch (err) {
    await client.query('ROLLBACK');
    console.error('❌ Erro ao atualizar pessoa:', err);
    res.status(500).json({ error: err.message });
  } finally {
    client.release();
  }
});

/**
 * DELETE /api/pessoas/:id
 * Remove pessoa por ID
 */
router.delete('/:id', async (req, res) => {
  const { id } = req.params;

  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    await client.query(
      `
      CALL gerenciar_pessoa(
        $1, $2, $3, $4, $5, $6, $7, $8, $9,
        $10, $11, $12, $13, $14, $15,
        $16, $17
      )
      `,
      [
        'DELETE', id, null, null, null, null, null, null, null,
        null, null, null, null, null, null,
        null, null, null
      ]
    );
    await client.query('COMMIT');

    res.json({ mensagem: 'Pessoa removida com sucesso' });
  } catch (err) {
    await client.query('ROLLBACK');
    console.error('❌ Erro ao remover pessoa:', err);
    res.status(500).json({ error: err.message });
  } finally {
    client.release();
  }
});

/**
 * GET /api/pessoas/enderecos?cep=XXXXX
 * Busca endereço pelo CEP
 */
router.get('/enderecos/buscar', async (req, res) => {
  const { cep } = req.query;

  try {
    const result = await pool.query(
      `
      SELECT cod_logradouro, cod_bairro, nome_logradouro AS logradouro, nome_bairro AS bairro
      FROM logradouros
      WHERE cep = $1
      `,
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
