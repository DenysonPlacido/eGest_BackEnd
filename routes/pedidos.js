// /workspaces/eGest_BackEnd/routes/pedidos.js
import express from 'express';
import autenticar from '../middleware/authMiddleware.js';

const router = express.Router();
router.use(autenticar);

// 🧾 Criar pedido
router.post('/', async (req, res) => {
  const { tipo_pedido, pessoa_id, observacao, itens } = req.body;
  const usuario_id = req.user.id;
  const client = await req.pool.connect();

  try {
    await client.query('BEGIN');

    // Cabeçalho
    const pedidoResult = await client.query(
      `SELECT public.sp_inserir_pedido($1, $2, $3, $4) AS pedido_id`,
      [tipo_pedido, pessoa_id, observacao, usuario_id]
    );
    const pedido_id = pedidoResult.rows[0].pedido_id;

    // Itens
    for (const item of itens) {
      await client.query(
        `SELECT public.sp_inserir_item_pedido($1, $2, $3, $4, $5)`,
        [pedido_id, item.produto_id, item.quantidade, item.valor_unitario, usuario_id]
      );
    }

    await client.query('COMMIT');
    res.json({ status: 'OK', mensagem: 'Pedido criado com sucesso', pedido_id });
  } catch (err) {
    await client.query('ROLLBACK');
    console.error('❌ Erro ao criar pedido:', err);
    res.status(500).json({ error: err.message });
  } finally {
    client.release();
  }
});

// 🔍 Consultar pedidos
router.get('/', async (req, res) => {
  const { tipo = '', status = '' } = req.query;
  try {
    const result = await req.pool.query(
      `SELECT p.pedido_id, p.tipo_pedido, p.status, p.valor_total,
              p.data_pedido, ps.nome AS pessoa, p.observacao
         FROM public.pedidos p
         JOIN public.pessoas ps ON ps.pessoa_id = p.pessoa_id
        WHERE ($1 = '' OR p.tipo_pedido = $1)
          AND ($2 = '' OR p.status = $2)
          AND p.ativo = TRUE
        ORDER BY p.data_pedido DESC`,
      [tipo, status]
    );
    res.json(result.rows);
  } catch (err) {
    console.error('❌ Erro ao listar pedidos:', err);
    res.status(500).json({ error: err.message });
  }
});

// 🔁 Aprovar pedido
router.post('/:id/aprovar', async (req, res) => {
  const { id } = req.params;
  const { decisao, observacao } = req.body;
  const usuario_id = req.user.id;

  try {
    await req.pool.query(
      `SELECT public.sp_aprovar_pedido($1, $2, $3, $4)`,
      [id, usuario_id, decisao, observacao]
    );
    res.json({ status: 'OK', mensagem: 'Decisão registrada com sucesso' });
  } catch (err) {
    console.error('❌ Erro ao aprovar pedido:', err);
    res.status(500).json({ error: err.message });
  }
});

// 🚫 Cancelar pedido
router.post('/:id/cancelar', async (req, res) => {
  const { id } = req.params;
  const { observacao } = req.body;
  const usuario_id = req.user.id;

  try {
    await req.pool.query(
      `SELECT public.sp_atualizar_status_pedido($1, 'CANCELADO', $2, $3)`,
      [id, usuario_id, observacao]
    );
    res.json({ status: 'OK', mensagem: 'Pedido cancelado com sucesso' });
  } catch (err) {
    console.error('❌ Erro ao cancelar pedido:', err);
    res.status(500).json({ error: err.message });
  }
});

export default router;
