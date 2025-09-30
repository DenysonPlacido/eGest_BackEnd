// /workspaces/eGest_BackEnd/routes/usuarios.js
import express from 'express';
import autenticar from '../middleware/authMiddleware.js';

const router = express.Router();

// 🔐 Aplica autenticação em todas as rotas
router.use(autenticar);


// 📌 Cadastro de Usuario
router.post('/', async (req, res) => {
  const { pessoa_id, status_usuario, tipo_usuario, senha,  login } = req.body;
  const client = await req.pool.connect();

    // ✅ Validação básica
  if (!status_usuario || !pessoa_id || !login ||  !senha  || ! tipo_usuario ) {
    return res.status(400).json({ error: 'Campos obrigatórios não preenchidos' });
  }

  try {
    await client.query('BEGIN');
    await client.query(
      `CALL inserir_usuario($1,$2,$3,$4,$5,$6)`,
      [pessoa_id, status_usuario, tipo_usuario, senha || null, login || null]
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















// Buscar Usuario
router.get('/', async (req, res) => {
  const { nome = '', login = '', limit = 10, offset = 0 } = req.query;

  const client = await req.pool.connect();
  try {
    const result = await client.query(
      `select
        u.id,
        u.login,
        u.data_cadastro,
        P.nome,
        u.status_usuario
      from
        public.usuarios U
        left join pessoas p 
          on U.pessoa_id = P.pessoa_id 
      where
          ($1 = ''
          or P.nome ilike '%' || $1 || '%')
        and ($2 = ''
          or U.login ilike '%' || $2 || '%')
      order by
        P.nome
      LIMIT $3 OFFSET $4`,
      [nome, login, limit, offset]
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



// 🗑️ Exclusão de Usuario
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
