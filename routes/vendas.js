// /workspaces/eGest_BackEnd/routes/vendas.js
import express from 'express';
import autenticar from '../middleware/authMiddleware.js';

const router = express.Router();
router.use(autenticar);

/* =========================================================
   🧾 CRIAR VENDA
========================================================= */
router.post('/', async (req, res) => {
  const { cliente_id, tipo_venda, observacao, pedido_id, itens } = req.body;
  const usuario_id = req.user.id;
  const client = await req.pool.connect();

  try {
    await client.query('BEGIN');

    // 1️⃣ Cria a venda
    const vendaResult = await client.query(
      `INSERT INTO public.vendas (
        cliente_id, tipo_venda, observacao, pedido_id,
        usuario_inclusao, data_inclusao, ativo
      ) VALUES ($1, $2, $3, $4, $5, CURRENT_TIMESTAMP, TRUE)
      RETURNING venda_id`,
      [cliente_id, tipo_venda, observacao, pedido_id || null, usuario_id]
    );

    const venda_id = vendaResult.rows[0].venda_id;

    // 2️⃣ Insere itens e atualiza estoque
    let totalVenda = 0;

    for (const item of itens) {
      const subtotal = (item.quantidade || 0) * (item.preco_unitario || 0);
      totalVenda += subtotal;

      // Adiciona item da venda
      await client.query(
        `INSERT INTO public.venda_item (
          venda_id, item_id, quantidade, preco_unitario,
          usuario_inclusao, data_inclusao, ativo
        ) VALUES ($1, $2, $3, $4, $5, CURRENT_TIMESTAMP, TRUE)`,
        [venda_id, item.item_id, item.quantidade, item.preco_unitario, usuario_id]
      );

      // Atualiza estoque (saída)
      await client.query(
        `UPDATE public.estoque_item
            SET estoque_unidade = estoque_unidade - $2,
                usuario_alteracao = $3,
                data_alteracao = CURRENT_TIMESTAMP
          WHERE item_id = $1`,
        [item.item_id, item.quantidade, usuario_id]
      );

      // Registra movimento de saída
      await client.query(
        `INSERT INTO public.movimentos_estoque (
          item_id, tipo_movimento, origem, referencia_id,
          quantidade_unidade, quantidade_peso,
          usuario_inclusao, data_inclusao, data_movimento, ativo
        ) VALUES (
          $1, 'SAIDA', 'VENDA', $2,
          $3, 0,
          $4, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP, TRUE
        )`,
        [item.item_id, venda_id, item.quantidade, usuario_id]
      );
    }

    // 3️⃣ Atualiza total da venda
    await client.query(
      `UPDATE public.vendas
          SET valor_total = $2,
              usuario_alteracao = $3,
              data_alteracao = CURRENT_TIMESTAMP
        WHERE venda_id = $1`,
      [venda_id, totalVenda, usuario_id]
    );

    await client.query('COMMIT');
    res.json({ status: 'OK', mensagem: 'Venda registrada com sucesso', venda_id });
  } catch (err) {
    await client.query('ROLLBACK');
    console.error('❌ Erro ao registrar venda:', err);
    res.status(500).json({ error: err.message });
  } finally {
    client.release();
  }
});

/* =========================================================
   🔍 LISTAR VENDAS
========================================================= */
router.get('/', async (req, res) => {
  const { tipo = '', cliente = '' } = req.query;
  try {
    const result = await req.pool.query(
      `SELECT 
          v.venda_id,
          v.data_venda,
          v.tipo_venda,
          v.valor_total,
          v.observacao,
          ps.nome AS cliente,
          v.pedido_id
       FROM public.vendas v
       JOIN public.clientes c ON v.cliente_id = c.cliente_id
       JOIN public.pessoas ps ON c.cliente_id = ps.pessoa_id
      WHERE (COALESCE($1, '') = '' OR v.tipo_venda = $1)
        AND (COALESCE($2, '') = '' OR ps.nome ILIKE '%' || $2 || '%')
        AND v.ativo = TRUE
      ORDER BY v.data_venda DESC`,
      [tipo, cliente]
    );
    res.json(result.rows);
  } catch (err) {
    console.error('❌ Erro ao listar vendas:', err);
    res.status(500).json({ error: err.message });
  }
});

/* =========================================================
   📦 LISTAR ITENS DE UMA VENDA
========================================================= */
router.get('/:venda_id/itens', async (req, res) => {
  const { venda_id } = req.params;
  try {
    const result = await req.pool.query(
      `SELECT 
          vi.venda_item_id,
          vi.item_id,
          ei.descricao_item,
          vi.quantidade,
          vi.preco_unitario,
          (vi.quantidade * vi.preco_unitario) AS preco_total
       FROM public.venda_item vi
       JOIN public.estoque_item ei ON vi.item_id = ei.item_id
      WHERE vi.venda_id = $1
        AND vi.ativo = TRUE
      ORDER BY vi.venda_item_id ASC`,
      [venda_id]
    );
    res.json(result.rows);
  } catch (err) {
    console.error('❌ Erro ao listar itens da venda:', err);
    res.status(500).json({ error: err.message });
  }
});

/* =========================================================
   🚫 CANCELAR VENDA
========================================================= */
router.post('/:venda_id/cancelar', async (req, res) => {
  const { venda_id } = req.params;
  const { observacao } = req.body;
  const usuario_id = req.user.id;

  const client = await req.pool.connect();
  try {
    await client.query('BEGIN');

    const vendaResult = await client.query(
      `SELECT ativo FROM public.vendas WHERE venda_id = $1`,
      [venda_id]
    );
    if (vendaResult.rowCount === 0) {
      throw new Error(`Venda ${venda_id} não encontrada`);
    }
    if (!vendaResult.rows[0].ativo) {
      throw new Error('Venda já cancelada anteriormente');
    }

    // 1️⃣ Reverte estoque
    const itensVenda = await client.query(
      `SELECT item_id, quantidade FROM public.venda_item WHERE venda_id = $1`,
      [venda_id]
    );

    for (const item of itensVenda.rows) {
      await client.query(
        `UPDATE public.estoque_item
            SET estoque_unidade = estoque_unidade + $2,
                usuario_alteracao = $3,
                data_alteracao = CURRENT_TIMESTAMP
          WHERE item_id = $1`,
        [item.item_id, item.quantidade, usuario_id]
      );

      // registra movimento de retorno
      await client.query(
        `INSERT INTO public.movimentos_estoque (
          item_id, tipo_movimento, origem, referencia_id,
          quantidade_unidade, quantidade_peso,
          usuario_inclusao, data_inclusao, data_movimento, ativo
        ) VALUES (
          $1, 'ENTRADA', 'CANCELAMENTO_VENDA', $2,
          $3, 0,
          $4, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP, TRUE
        )`,
        [item.item_id, venda_id, item.quantidade, usuario_id]
      );
    }

    // 2️⃣ Cancela a venda
    await client.query(
      `UPDATE public.vendas
          SET ativo = FALSE,
              observacao = COALESCE($2, observacao),
              usuario_alteracao = $3,
              data_alteracao = CURRENT_TIMESTAMP
        WHERE venda_id = $1`,
      [venda_id, observacao, usuario_id]
    );

    await client.query('COMMIT');
    res.json({ status: 'OK', mensagem: `Venda ${venda_id} cancelada e estoque revertido` });
  } catch (err) {
    await client.query('ROLLBACK');
    console.error('❌ Erro ao cancelar venda:', err);
    res.status(500).json({ error: err.message });
  } finally {
    client.release();
  }
});

export default router;
