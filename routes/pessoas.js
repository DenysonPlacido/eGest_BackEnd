// /workspaces/eGest_BackEnd/routes/pessoas.js

import express from 'express';
const router = express.Router();

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
