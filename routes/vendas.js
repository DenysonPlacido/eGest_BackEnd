// /workspaces/eGest_BackEnd/routes/vendas.js
import express from 'express';
import autenticar from '../middleware/authMiddleware.js';

const router = express.Router();
router.use(autenticar);

// 💎 Registrar venda
router.post('/', async (req, res) => {
  const { cliente_id, itens, observacao } = req.body;
  const usuario_id = req.user.id;
  const client = await req.pool.connect();

  try {
    await client.query('BEGIN');

    const tipo_venda = itens.some(i => i.qtd_unidade > 0 && i.qtd_peso > 0)
      ? 'MISTA'
      : (itens[0].qtd_peso > 0 ? 'PESO' : 'PECA');

    const vendaResult = await client.query(
      `INSERT INTO public.vendas (cliente_id, tipo_venda, observacao, usuario_inclusao)
       VALUES ($1, $2, $3, $4)
       RETURNING venda_id`,
      [cliente_id, tipo_venda, observacao || null, usuario_id]
    );
    const venda_id = vendaResult.rows[0].venda_id;

    for (const item of itens) {
      const { produto_id, qtd_unidade, qtd_peso, valor_unitario } = item;

      await client.query(
        `INSERT INTO public.itens_venda (
          venda_id, produto_id, quantidade_unidade, quantidade_peso, valor_unitario, usuario_inclusao
        ) VALUES ($1, $2, $3, $4, $5, $6)`,
        [venda_id, produto_id, qtd_unidade, qtd_peso, valor_unitario, usuario_id]
      );

      await client.query(
        `CALL public.sp_baixa_estoque_venda($1, $2, $3, $4, $5)`,
        [produto_id, qtd_unidade, qtd_peso, venda_id, usuario_id]
      );
    }

    await client.query(
      `UPDATE public.vendas
          SET valor_total = (
            SELECT SUM(valor_total) FROM public.itens_venda WHERE venda_id = $1
          )
        WHERE venda_id = $1`,
      [venda_id]
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

// 🔍 Consultar vendas
router.get('/', async (req, res) => {
  const { cliente = '' } = req.query;
  try {
    const result = await req.pool.query(
      `SELECT v.venda_id, v.data_venda, v.tipo_venda, v.valor_total,
              p.nome AS cliente, v.observacao
         FROM public.vendas v
         JOIN public.pessoas p ON p.pessoa_id = v.cliente_id
        WHERE ($1 = '' OR p.nome ILIKE '%' || $1 || '%')
          AND v.ativo = true
        ORDER BY v.data_venda DESC`,
      [cliente]
    );
    res.json(result.rows);
  } catch (err) {
    console.error('❌ Erro ao listar vendas:', err);
    res.status(500).json({ error: err.message });
  }
});

export default router;
