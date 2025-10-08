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
      `
        select
          p.pessoa_id,
          p.data_cadastro,
          p.tipo_pessoa AS id_tipo_pessoa,
          tp.descricao AS tipo_pessoa,
          p.cpf_cnpj,
          p.rg,
          p.nome,
          p.data_nascimento,
          p.ddd,
          p.fone,
          p.email,
          l.cep,
          p.cod_logradouro,
          l.nome_do_logradouro,
          p.numero,
          p.complemento,
          l.bairro,
          l.cod_cidade,
          c.nome_cidade,
          c.codigo_uf,
          p2.id_pais,
          p2.nome_pais
        from
          pessoas p
        left join tipos_pessoas tp on
          p.tipo_pessoa = tp.tipo_pessoa
        left join logradouros l on
          p.cod_logradouro = l.cod_logradouro
        left join cidades c on
          l.cod_cidade = c.cod_cidade
        left join paises p2 on
          c.id_pais = p2.id_pais
        where
          ($1 = ''
            or p.nome ilike '%' || $1 || '%')
          and ($2 = ''
            or p.pessoa_id = cast($2 as INTEGER))
          and p.ativo = true
        order by
          p.nome
        limit $3 offset $4
      `,
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

// 🗑️ Exclusão lógica de pessoa (ativo = false)
router.delete('/:id', async (req, res) => {
  const { id } = req.params;

  const client = await req.pool.connect();
  try {
    await client.query('BEGIN');

    const result = await client.query(
      `UPDATE public.pessoas SET ativo = false, data_alteracao = CURRENT_TIMESTAMP, usuario_alteracao = $2 WHERE pessoa_id = $1`,
      [id, req.user?.id || 'sistema']
    );

    await client.query('COMMIT');

    if (result.rowCount === 0) {
      return res.status(404).json({ erro: `Pessoa ${id} não encontrada` });
    }

    res.json({ status: 'OK', mensagem: `Pessoa ${id} desativada com sucesso` });
  } catch (err) {
    await client.query('ROLLBACK');
    console.error(`❌ Erro ao desativar pessoa (usuário ${req.user?.id || 'desconhecido'}):`, err);
    res.status(500).json({ error: 'Erro interno ao desativar pessoa' });
  } finally {
    client.release();
  }
});


// 📍 Busca de endereço por múltiplos critérios
router.get('/enderecos/buscar', async (req, res) => {
  const { cep, logradouro, bairro, cidade } = req.query;

  try {
    // Base da query
    let query = `
      SELECT
        l.cod_logradouro,
        l.nome_do_logradouro,
        l.cep,
        l.bairro,
        l.distrito,
        l.latitude,
        l.longitude,
        c.cod_cidade
        c.nome_cidade,
        c.codigo_uf,
        p.nome_pais
      FROM public.logradouros l
      JOIN public.cidades c ON l.cod_cidade = c.cod_cidade
      JOIN public.paises p ON c.id_pais = p.id_pais
      WHERE l.ativo = true AND l.visivel = true
    `;

    // Array de cláusulas e parâmetros
    const conditions = [];
    const params = [];

    if (cep) {
      conditions.push(`l.cep = $${params.length + 1}`);
      params.push(cep);
    }

    if (logradouro) {
      conditions.push(`l.nome_do_logradouro ILIKE '%' || $${params.length + 1} || '%'`);
      params.push(logradouro);
    }

    if (bairro) {
      conditions.push(`l.bairro ILIKE '%' || $${params.length + 1} || '%'`);
      params.push(bairro);
    }

    if (cidade) {
      conditions.push(`c.nome_cidade ILIKE '%' || $${params.length + 1} || '%'`);
      params.push(cidade);
    }

    // Adiciona filtros se houver
    if (conditions.length > 0) {
      query += ' AND ' + conditions.join(' AND ');
    }

    query += ' ORDER BY l.nome_do_logradouro ASC';

    const result = await req.pool.query(query, params);

    if (result.rows.length === 0) {
      return res.status(404).json({ erro: 'Nenhum endereço encontrado com os critérios informados' });
    }

    res.json(result.rows);
  } catch (err) {
    console.error(`❌ Erro ao buscar endereço (usuário ${req.user?.id || 'desconhecido'}):`, err);
    res.status(500).json({ error: 'Erro interno ao buscar endereço' });
  }
});

export default router;