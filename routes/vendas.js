// rota: /routes/vendas.js
import express from 'express';
import autenticar from '../middleware/authMiddleware.js';

const router = express.Router();

// 🔐 Aplica autenticação em todas as rotas
router.use(autenticar);

router.post('/', async (req, res) => {
  const { cliente_id, itens } = req.body;
  const usuario_id = req.user.id;

  const client = await req.pool.connect();
  try {
    await client.query('BEGIN');

    const vendaResult = await client.query(
      `INSERT INTO vendas (cliente_id, tipo_venda, usuario_inclusao)
       VALUES ($1, 'MISTA', $2) RETURNING venda_id`,
      [cliente_id, usuario_id]
    );

    const venda_id = vendaResult.rows[0].venda_id;

    for (const item of itens) {
      const { produto_id, qtd_unidade, qtd_peso, valor_unitario } = item;

      await client.query(
        `INSERT INTO itens_venda (venda_id, produto_id, quantidade_unidade, quantidade_peso, valor_unitario, usuario_inclusao)
         VALUES ($1, $2, $3, $4, $5, $6)`,
        [venda_id, produto_id, qtd_unidade, qtd_peso, valor_unitario, usuario_id]
      );

      // chamada da procedure de baixa
      await client.query(`CALL sp_baixa_estoque_venda($1, $2, $3, $4, $5)`, [
        produto_id,
        qtd_unidade,
        qtd_peso,
        venda_id,
        usuario_id
      ]);
    }

    await client.query('COMMIT');
    res.json({ status: 'OK', mensagem: 'Venda registrada com sucesso', venda_id });
  } catch (err) {
    await client.query('ROLLBACK');
    console.error('Erro ao registrar venda:', err);
    res.status(500).json({ error: 'Erro ao registrar venda' });
  } finally {
    client.release();
  }
});



export default router;