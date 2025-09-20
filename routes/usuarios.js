// /workspaces/eGest_BackEnd/routes/usuarios.js
import express from 'express';

const router = express.Router();

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
