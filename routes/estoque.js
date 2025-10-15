// /workspaces/eGest_BackEnd/routes/estoque.js
import express from 'express';
import autenticar from '../middleware/authMiddleware.js';

const router = express.Router();
router.use(autenticar);

// 📦 Entrada de estoque
router.post('/entrada', async (req, res) => {
  const { produto_id, qtd_unidade, peso_total, origem, referencia_id } = req.body;
  const usuario_id = req.user.id;

  try {
    await req.pool.query(
      `CALL public.sp_entrada_estoque($1, $2, $3, $4, $5, $6)`,
      [produto_id, qtd_unidade, peso_total, origem, referencia_id, usuario_id]
    );
    res.json({ status: 'OK', mensagem: 'Entrada de estoque registrada com sucesso' });
  } catch (err) {
    console.error('❌ Erro na entrada de estoque:', err);
    res.status(500).json({ error: err.message });
  }
});

// 📉 Consulta de saldo de estoque
router.get('/saldo/:id', async (req, res) => {
  const { id } = req.params;
  try {
    const result = await req.pool.query(
      `SELECT produto_id, descricao, estoque_unidade, estoque_peso
         FROM public.produtos
        WHERE produto_id = $1`,
      [id]
    );
    if (result.rows.length === 0) return res.status(404).json({ erro: 'Produto não encontrado' });
    res.json(result.rows[0]);
  } catch (err) {
    console.error('❌ Erro ao consultar saldo de estoque:', err);
    res.status(500).json({ error: err.message });
  }
});

// 📜 Histórico de movimentações
router.get('/movimentos/:produto_id', async (req, res) => {
  const { produto_id } = req.params;
  try {
    const result = await req.pool.query(
      `SELECT m.*, p.descricao
         FROM public.movimentos_estoque m
         JOIN public.produtos p ON p.produto_id = m.produto_id
        WHERE m.produto_id = $1
        ORDER BY m.data_inclusao DESC`,
      [produto_id]
    );
    res.json(result.rows);
  } catch (err) {
    console.error('❌ Erro ao listar movimentos:', err);
    res.status(500).json({ error: err.message });
  }
});

export default router;
