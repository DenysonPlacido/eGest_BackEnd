// /workspaces/eGest_BackEnd/routes/produtos.js
import express from 'express';
import autenticar from '../middleware/authMiddleware.js';

const router = express.Router();
router.use(autenticar);

// 📌 Cadastrar produto
router.post('/', async (req, res) => {
  const {
    descricao, tipo_medicao, peso_unitario,
    custo_unitario, custo_grama, valor_venda
  } = req.body;

  if (!descricao || !tipo_medicao) {
    return res.status(400).json({ error: 'Campos obrigatórios não preenchidos' });
  }

  const client = await req.pool.connect();
  try {
    await client.query('BEGIN');

    await client.query(
      `INSERT INTO public.produtos (
        descricao, tipo_medicao, peso_unitario,
        custo_unitario, custo_grama, valor_venda,
        usuario_inclusao, versao_registro, ativo
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, 0, true)`,
      [
        descricao, tipo_medicao, peso_unitario || 0,
        custo_unitario || 0, custo_grama || 0, valor_venda || 0,
        req.user.id
      ]
    );

    await client.query('COMMIT');
    res.json({ status: 'OK', mensagem: 'Produto cadastrado com sucesso' });
  } catch (err) {
    await client.query('ROLLBACK');
    console.error('❌ Erro ao cadastrar produto:', err);
    res.status(500).json({ error: err.message });
  } finally {
    client.release();
  }
});

// 🔍 Consultar produtos
router.get('/', async (req, res) => {
  const { descricao = '', ativo = 'true' } = req.query;
  try {
    const result = await req.pool.query(
      `SELECT * FROM public.produtos
       WHERE ($1 = '' OR descricao ILIKE '%' || $1 || '%')
         AND ativo = $2
       ORDER BY descricao`,
      [descricao, ativo === 'true']
    );
    res.json(result.rows);
  } catch (err) {
    console.error('❌ Erro ao listar produtos:', err);
    res.status(500).json({ error: err.message });
  }
});

// ✏️ Atualizar produto
router.put('/:id', async (req, res) => {
  const { id } = req.params;
  const {
    descricao, tipo_medicao, peso_unitario,
    custo_unitario, custo_grama, valor_venda
  } = req.body;

  const client = await req.pool.connect();
  try {
    await client.query('BEGIN');
    await client.query(
      `UPDATE public.produtos SET
        descricao = $1,
        tipo_medicao = $2,
        peso_unitario = $3,
        custo_unitario = $4,
        custo_grama = $5,
        valor_venda = $6,
        versao_registro = versao_registro + 1,
        usuario_alteracao = $7,
        data_alteracao = CURRENT_TIMESTAMP
      WHERE produto_id = $8`,
      [
        descricao, tipo_medicao, peso_unitario,
        custo_unitario, custo_grama, valor_venda,
        req.user.id, id
      ]
    );
    await client.query('COMMIT');
    res.json({ status: 'OK', mensagem: 'Produto atualizado com sucesso' });
  } catch (err) {
    await client.query('ROLLBACK');
    console.error('❌ Erro ao atualizar produto:', err);
    res.status(500).json({ error: err.message });
  } finally {
    client.release();
  }
});

// 🗑️ Inativar produto
router.delete('/:id', async (req, res) => {
  const { id } = req.params;
  try {
    const result = await req.pool.query(
      `UPDATE public.produtos
         SET ativo = false,
             usuario_alteracao = $2,
             data_alteracao = CURRENT_TIMESTAMP
       WHERE produto_id = $1`,
      [id, req.user.id]
    );
    res.json({ status: 'OK', mensagem: 'Produto desativado com sucesso' });
  } catch (err) {
    console.error('❌ Erro ao desativar produto:', err);
    res.status(500).json({ error: err.message });
  }
});

export default router;
