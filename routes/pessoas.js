// /workspaces/eGest_BackEnd/routes/pessoas.js
import express from 'express';
import autenticar from '../middleware/authMiddleware.js';

const router = express.Router();

// 🔐 Aplica autenticação em todas as rotas
router.use(autenticar);

// 📌 Cadastro de pessoa
router.post('/', async (req, res) => {
  const {
    tipo_pessoa, cpf_cnpj, nome, data_nascimento,
    ddd, fone, email, cep, cod_logradouro,
    numero, cod_bairro, complemento
  } = req.body;

  // ✅ Validação básica
  if (!cpf_cnpj || !nome || !tipo_pessoa) {
    return res.status(400).json({ error: 'Campos obrigatórios não preenchidos' });
  }

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
    console.error(`❌ Erro ao inserir pessoa (usuário ${req.user.id}):`, err);

    if (err.code === '23505') {
      return res.status(409).json({ error: 'CPF/CNPJ já cadastrado' });
    }

    res.status(500).json({ error: err.message });
  } finally {
    client.release();
  }
});





// Buscar pessoas
router.get('/', async (req, res) => {
  const { nome = '', pessoa_id = '', limit = 10, offset = 0 } = req.query;

  const client = await req.pool.connect();
  try {
    const result = await client.query(
      `SELECT pessoa_id, tipo_pessoa, cpf_cnpj, nome, data_nascimento, ddd, fone, email,
              cep, cod_logradouro, numero,  complemento
       FROM pessoas
       WHERE ($1 = '' OR nome ILIKE '%' || $1 || '%')
         AND ($2 = '' OR pessoa_id = CAST($2 AS INTEGER))

       ORDER BY pessoa_id
       LIMIT $3 OFFSET $4`,
      [nome, pessoa_id, limit, offset]
    );

    res.json(result.rows);
  } catch (err) {
    console.error('❌ Erro ao listar pessoas:', err);
    res.status(500).json({ error: err.message });
  } finally {
    client.release();
  }
});





// ✏️ Atualização de pessoa
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
    console.error(`❌ Erro ao atualizar pessoa (usuário ${req.user.id}):`, err);
    res.status(500).json({ error: err.message });
  } finally {
    client.release();
  }
});

// 🗑️ Exclusão de pessoa
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
    console.error(`❌ Erro ao deletar pessoa (usuário ${req.user.id}):`, err);
    res.status(500).json({ error: err.message });
  } finally {
    client.release();
  }
});

// 📍 Busca de endereço por CEP
router.get('/enderecos/buscar', async (req, res) => {
  const { cep } = req.query;

  if (!cep) {
    return res.status(400).json({ erro: 'CEP não informado' });
  }

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
    console.error(`❌ Erro ao buscar endereço (usuário ${req.user.id}):`, err);
    res.status(500).json({ error: err.message });
  }
});

export default router;