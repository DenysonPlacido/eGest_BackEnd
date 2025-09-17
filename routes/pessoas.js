// /workspaces/eGest_BackEnd/routes/pessoas.js
// /workspaces/eGest_BackEnd/routes/pessoas.js

import express from 'express';
import { pool } from '../db.js';

const router = express.Router();


// ===================================
// 🔎 GET /pessoas  (listar pessoas)
// ===================================
router.get('/pessoas', async (req, res) => {
  const { pessoa_id, nome, cpf_cnpj, limit = 10, offset = 0 } = req.query;

  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    await client.query(`
      CALL selecionar_pessoa($1, $2, $3, $4, $5, $6)
    `, [
      pessoa_id || null,
      nome || null,
      cpf_cnpj || null,
      limit,
      offset,
      'resultado_cursor'
    ]);

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
router.post('/pessoas', async (req, res) => {
  const {
    tipo_pessoa, cpf_cnpj, nome, data_nascimento,
    ddd, fone, email, cep, cod_logradouro,
    numero, cod_bairro, complemento
  } = req.body;

  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    await client.query(`
      CALL inserir_pessoa($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12)
    `, [
      tipo_pessoa, cpf_cnpj, nome, data_nascimento,
      ddd, fone, email, cep, cod_logradouro,
      numero, cod_bairro, complemento
    ]);
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
router.put('/pessoas/:id', async (req, res) => {
  const { id } = req.params;
  const {
    tipo_pessoa, cpf_cnpj, nome, data_nascimento,
    ddd, fone, email, cep, cod_logradouro,
    numero, cod_bairro, complemento
  } = req.body;

  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    await client.query(`
      CALL atualizar_pessoa($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13)
    `, [
      id, tipo_pessoa, cpf_cnpj, nome, data_nascimento,
      ddd, fone, email, cep, cod_logradouro,
      numero, cod_bairro, complemento
    ]);
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
router.delete('/pessoas/:id', async (req, res) => {
  const { id } = req.params;

  const client = await pool.connect();
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
// 🔎 GET /enderecos/buscar?cep=xxxxx
// ===================================
router.get('/enderecos/buscar', async (req, res) => {
  const { cep } = req.query;
  try {
    const result = await pool.query(`
      SELECT cod_logradouro, cod_bairro, nome_logradouro AS logradouro, nome_bairro AS bairro
      FROM logradouros
      WHERE cep = $1
    `, [cep]);

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
