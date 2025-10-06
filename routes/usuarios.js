// /workspaces/eGest_BackEnd/routes/usuarios.js
import express from 'express';
import autenticar from '../middleware/authMiddleware.js';

const router = express.Router();

router.use(autenticar);


// 📌 Cadastro de Usuario
router.post('/', async (req, res) => {
  const { pessoa_id, status_usuario, tipo_usuario, senha, login, usuario_inclusao } = req.body;
  const client = await req.pool.connect();

  // ✅ Validação básica
  if (!pessoa_id || !status_usuario || !tipo_usuario || !senha || !login) {
    return res.status(400).json({ erro: 'Campos obrigatórios não preenchidos.' });
  }

  try {
    await client.query('BEGIN');

    await client.query(
      `CALL inserir_usuario($1, $2, $3, $4, $5, $6)`,
      [
        pessoa_id,
        status_usuario,
        tipo_usuario,
        senha,
        login,
        usuario_inclusao || 'egest_sistema'
      ]
    );

    await client.query('COMMIT');

    res.status(201).json({
      mensagem: '✅ Usuário criado com sucesso.',
      login,
      criado_por: usuario_inclusao || 'egest_sistema'
    });
  } catch (err) {
    await client.query('ROLLBACK');

    // 🎯 Tratamento de erros específicos
    if (err.code === '23505') {
      return res.status(409).json({ erro: 'Login já está em uso.' });
    }

    if (err.code === '23503') {
      return res.status(400).json({ erro: 'Referência inválida: pessoa, status ou tipo de usuário não existem.' });
    }

    console.error('❌ Erro ao criar usuário:', err);
    res.status(500).json({ erro: 'Erro interno ao cadastrar usuário.' });
  } finally {
    client.release();
  }
});



// 🔍 Buscar Usuario
router.get('/', async (req, res) => {
  const { nome = '', login = '', cpf_cnpj = '', limit = 10, offset = 0 } = req.query;


  const client = await req.pool.connect();
  try {
    const result = await client.query(
      `
        select
          u.id,
          u.login,
          u.data_cadastro,
          p.nome,
          p.cpf_cnpj,
          su.descricao as status_usuario
        from
          public.usuarios u
          left join pessoas p 
            on u.pessoa_id = p.pessoa_id
          join status_usuarios su 
            on su.status_usuario = u.status_usuario 
        where
            ($1 = ''
            or p.nome ilike '%' || $1 || '%')
          and ($2 = ''
            or u.login ilike '%' || $2 || '%')
          and ($3 = ''
            or p.cpf_cnpj ilike '%' || $3 || '%')
        order by
          p.nome
        limit $4 offset $5

      `,
      [nome, login, cpf_cnpj, limit, offset]

    );

    res.json(result.rows);
  } catch (err) {
    console.error('❌ Erro ao listar Usuarios:', err);
    res.status(500).json({ error: err.message });
  } finally {
    client.release();
  }
});










// ✏️ Atualização de Usuario
router.put('/:id', async (req, res) => {
  const { id } = req.params;
  const {
    pessoa_id,
    status_usuario,
    tipo_usuario,
    senha,
    versao_registro,
    usuario_alteracao,
    situacao
  } = req.body;

  const client = await req.pool.connect();

  try {
    await client.query('BEGIN');

    await client.query(
      `CALL atualizar_usuario($1, $2, $3, $4, $5, $6, $7, $8)`,
      [
        id,
        pessoa_id || null,
        status_usuario || null,
        tipo_usuario || null,
        senha || null,
        versao_registro || null,
        usuario_alteracao || null,
        situacao || null
      ]
    );

    await client.query('COMMIT');

    res.json({
      mensagem: `✅ Usuário ${id} atualizado com sucesso.`,
      alterado_por: `egest_${usuario_alteracao || 'sistema'}`,
      timestamp: new Date().toISOString()
    });
  } catch (err) {
    await client.query('ROLLBACK');

    if (err.code === '23503') {
      return res.status(400).json({ erro: 'Referência inválida: pessoa, status ou tipo de usuário não existem.' });
    }

    console.error('❌ Erro ao atualizar usuário:', err);
    res.status(500).json({ erro: 'Erro interno ao atualizar usuário.' });
  } finally {
    client.release();
  }
});





// 🗑️ Exclusão de Usuario
router.delete('/:id', async (req, res) => {
  const { id } = req.params;
  const client = await req.pool.connect();

  // ✅ Validação básica
  if (!id || isNaN(id)) {
    return res.status(400).json({ erro: 'ID inválido para exclusão.' });
  }

  try {
    await client.query('BEGIN');

    // 🔍 Verifica se o usuário existe e está ativo
    const { rows } = await client.query(
      'SELECT ativo FROM usuarios WHERE id = $1',
      [id]
    );

    if (rows.length === 0) {
      await client.query('ROLLBACK');
      return res.status(404).json({ erro: `Usuário ${id} não encontrado.` });
    }

    if (!rows[0].ativo) {
      await client.query('ROLLBACK');
      return res.status(400).json({ erro: `Usuário ${id} já está inativo.` });
    }

    // 🗑️ Executa exclusão lógica
    await client.query(`CALL deletar_usuario($1)`, [id]);
    await client.query('COMMIT');

    res.json({
      mensagem: `🗑️ Usuário ${id} excluído logicamente com sucesso.`,
      timestamp: new Date().toISOString()
    });
  } catch (err) {
    await client.query('ROLLBACK');
    console.error('❌ Erro ao deletar usuário:', err);
    res.status(500).json({ erro: 'Erro interno ao excluir usuário.' });
  } finally {
    client.release();
  }
});


export default router;