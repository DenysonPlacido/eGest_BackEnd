// /workspaces/eGest_BackEnd/routes/compras.js
import express from 'express';
import autenticar from '../middleware/authMiddleware.js';

const router = express.Router();
router.use(autenticar);

/* =========================================================
   🧾 CRIAR COMPRA
========================================================= */
router.post('/', async (req, res) => {
  const { fornecedor_id, observacao, itens } = req.body;
  const usuario_id = req.user.id;
  const client = await req.pool.connect();


  if (!fornecedor_id || !Array.isArray(itens) || itens.length === 0) {
  return res.status(400).json({ error: 'Fornecedor e itens são obrigatórios' });
}

  try {
    await client.query('BEGIN');

    // 1️⃣ Cria a compra
    const compraResult = await client.query(
      `INSERT INTO public.compras (
        fornecedor_id, observacao, usuario_responsavel,
        usuario_inclusao, data_inclusao, status, ativo
      ) VALUES ($1, $2, $3, $3, CURRENT_TIMESTAMP, 'ABERTA', TRUE)
      RETURNING compra_id`,
      [fornecedor_id, observacao, usuario_id]
    );
    const compra_id = compraResult.rows[0].compra_id;

    // 2️⃣ Adiciona itens e calcula o total
    let totalCompra = 0;

    for (const item of itens) {
      const subtotal = item.quantidade * item.preco_unitario;
      totalCompra += subtotal;

      await client.query(
        `INSERT INTO public.compra_item (
          compra_id, item_id, quantidade, preco_unitario,
          usuario_inclusao, data_inclusao, ativo
        ) VALUES ($1, $2, $3, $4, $5, CURRENT_TIMESTAMP, TRUE)`,
        [compra_id, item.item_id, item.quantidade, item.preco_unitario, usuario_id]
      );

      // 3️⃣ Atualiza estoque (entrada de itens)
      await client.query(
        `UPDATE public.estoque_item
            SET estoque_unidade = estoque_unidade + $2,
                usuario_alteracao = $3,
                data_alteracao = CURRENT_TIMESTAMP
          WHERE item_id = $1`,
        [item.item_id, item.quantidade, usuario_id]
      );

      // 4️⃣ Registra movimento de entrada
      await client.query(
        `INSERT INTO public.movimentos_estoque (
          item_id, tipo_movimento, origem, referencia_id,
          quantidade_unidade, quantidade_peso, usuario_inclusao,
          data_inclusao, data_movimento, ativo
        ) VALUES (
          $1, 'ENTRADA', 'COMPRA', $2, $3, 0, $4,
          CURRENT_TIMESTAMP, CURRENT_TIMESTAMP, TRUE
        )`,
        [item.item_id, compra_id, item.quantidade, usuario_id]
      );
    }

    // 5️⃣ Atualiza valor total da compra
    await client.query(
      `UPDATE public.compras
          SET valor_total = $2,
              usuario_alteracao = $3,
              data_alteracao = CURRENT_TIMESTAMP
        WHERE compra_id = $1`,
      [compra_id, totalCompra, usuario_id]
    );

    await client.query('COMMIT');
    res.json({ status: 'OK', mensagem: 'Compra criada com sucesso', compra_id });
  } catch (err) {
    await client.query('ROLLBACK');
    console.error('❌ Erro ao criar compra:', err);
    res.status(500).json({ error: err.message });
  } finally {
    client.release();
  }
});

/* =========================================================
   🔍 LISTAR COMPRAS
========================================================= */
router.get('/', async (req, res) => {
  const { status = '', fornecedor = '' } = req.query;
  try {
    const result = await req.pool.query(
      `SELECT 
          c.compra_id,
          c.data_compra,
          c.status,
          c.valor_total,
          c.observacao,
          f.nome_contato AS fornecedor,
          f.email,
          f.telefone
       FROM public.compras c
       JOIN public.fornecedores f ON c.fornecedor_id = f.fornecedor_id
      WHERE (COALESCE($1, '') = '' OR c.status = $1)
        AND (COALESCE($2, '') = '' OR f.nome_contato ILIKE '%' || $2 || '%')
        AND c.ativo = TRUE
      ORDER BY c.data_compra DESC`,
      [status, fornecedor]
    );
    res.json(result.rows);
  } catch (err) {
    console.error('❌ Erro ao listar compras:', err);
    res.status(500).json({ error: err.message });
  }
});

/* =========================================================
   📦 LISTAR ITENS DE UMA COMPRA
========================================================= */
router.get('/:compra_id/itens', async (req, res) => {
  const { compra_id } = req.params;
  try {
    const result = await req.pool.query(
      `SELECT 
          ci.compra_item_id,
          ci.item_id,
          ei.descricao_item,
          ci.quantidade,
          ci.preco_unitario,
          ci.preco_total,
          ci.data_inclusao
       FROM public.compra_item ci
       JOIN public.estoque_item ei ON ci.item_id = ei.item_id
      WHERE ci.compra_id = $1
        AND ci.ativo = TRUE
      ORDER BY ci.compra_item_id ASC`,
      [compra_id]
    );
    res.json(result.rows);
  } catch (err) {
    console.error('❌ Erro ao listar itens da compra:', err);
    res.status(500).json({ error: err.message });
  }
});

/* =========================================================
   ✅ FINALIZAR COMPRA
========================================================= */
router.post('/:compra_id/finalizar', async (req, res) => {
  const { compra_id } = req.params;
  const usuario_id = req.user.id;

  const client = await req.pool.connect();
  try {
    await client.query('BEGIN');

    const compraResult = await client.query(
      `SELECT status FROM public.compras WHERE compra_id = $1`,
      [compra_id]
    );
    if (compraResult.rowCount === 0) {
      throw new Error(`Compra ${compra_id} não encontrada`);
    }

    const statusAtual = compraResult.rows[0].status;
    if (statusAtual !== 'ABERTA') {
      throw new Error('Somente compras com status ABERTA podem ser finalizadas');
    }

    await client.query(
      `UPDATE public.compras
          SET status = 'FINALIZADA',
              usuario_alteracao = $2,
              data_alteracao = CURRENT_TIMESTAMP
        WHERE compra_id = $1`,
      [compra_id, usuario_id]
    );

    await client.query('COMMIT');
    res.json({ status: 'OK', mensagem: `Compra ${compra_id} finalizada com sucesso` });
  } catch (err) {
    await client.query('ROLLBACK');
    console.error('❌ Erro ao finalizar compra:', err);
    res.status(500).json({ error: err.message });
  } finally {
    client.release();
  }
});

/* =========================================================
   🚫 CANCELAR COMPRA
========================================================= */
router.post('/:compra_id/cancelar', async (req, res) => {
  const { compra_id } = req.params;
  const { observacao } = req.body;
  const usuario_id = req.user.id;

  const client = await req.pool.connect();
  try {
    await client.query('BEGIN');

    const compraResult = await client.query(
      `SELECT status FROM public.compras WHERE compra_id = $1`,
      [compra_id]
    );
    if (compraResult.rowCount === 0) {
      throw new Error(`Compra ${compra_id} não encontrada`);
    }

    const statusAtual = compraResult.rows[0].status;
    if (statusAtual === 'CANCELADA') {
      throw new Error('Compra já está cancelada');
    }

    await client.query(
      `UPDATE public.compras
          SET status = 'CANCELADA',
              observacao = COALESCE($2, observacao),
              usuario_alteracao = $3,
              data_alteracao = CURRENT_TIMESTAMP
        WHERE compra_id = $1`,
      [compra_id, observacao, usuario_id]
    );

    await client.query('COMMIT');
    res.json({ status: 'OK', mensagem: `Compra ${compra_id} cancelada com sucesso` });
  } catch (err) {
    await client.query('ROLLBACK');
    console.error('❌ Erro ao cancelar compra:', err);
    res.status(500).json({ error: err.message });
  } finally {
    client.release();
  }
});

export default router;
