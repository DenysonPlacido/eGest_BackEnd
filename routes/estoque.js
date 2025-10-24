// /workspaces/eGest_BackEnd/routes/estoque.js
import express from 'express';
import autenticar from '../middleware/authMiddleware.js';

const router = express.Router();
router.use(autenticar);

/* =========================================================
   🏭 CADASTRAR ESTOQUE
========================================================= */
router.post('/', async (req, res) => {
  const { localizacao, responsavel_id } = req.body;
  const usuario_id = req.user.id;
  const client = await req.pool.connect();

  try {
    await client.query('BEGIN');

    await client.query(
      `INSERT INTO public.estoque (
        localizacao, responsavel, usuario_inclusao, data_inclusao, ativo
      ) VALUES ($1, $2, $3, CURRENT_TIMESTAMP, TRUE)`,
      [localizacao, responsavel_id, usuario_id]
    );

    await client.query('COMMIT');
    res.json({ status: 'OK', mensagem: 'Estoque cadastrado com sucesso' });
  } catch (err) {
    await client.query('ROLLBACK');
    console.error('❌ Erro ao cadastrar estoque:', err);
    res.status(500).json({ error: err.message });
  } finally {
    client.release();
  }
});

/* =========================================================
   🔍 LISTAR ESTOQUES
========================================================= */
router.get('/', async (req, res) => {
  try {
    const result = await req.pool.query(
      `SELECT 
          e.estoque_id,
          e.localizacao,
          e.responsavel,
          P.NOME AS responsavel_nome,
          e.data_inclusao,
          e.ativo
       FROM public.estoque e
       LEFT JOIN public.usuarios u ON e.responsavel = u.id
       left join pessoas p on U.pessoa_id  = p.pessoa_id 
      WHERE e.ativo = TRUE
      ORDER BY e.localizacao ASC`
    );
    res.json(result.rows);
  } catch (err) {
    console.error('❌ Erro ao listar estoques:', err);
    res.status(500).json({ error: err.message });
  }
});

/* =========================================================
   📦 CADASTRAR ITEM NO ESTOQUE
========================================================= */
router.post('/:estoque_id/itens', async (req, res) => {
  const { estoque_id } = req.params;
  const {
    descricao_item,
    tipo_medicao,
    peso_unitario,
    estoque_unidade,
    estoque_peso,
    custo_unitario,
    custo_grama,
    valor_venda
  } = req.body;

  const usuario_id = req.user.id;
  const client = await req.pool.connect();

  try {
    await client.query('BEGIN');

    await client.query(
      `INSERT INTO public.estoque_item (
        estoque_id, descricao_item, tipo_medicao, peso_unitario,
        estoque_unidade, estoque_peso, custo_unitario, custo_grama,
        valor_venda, usuario_inclusao, data_inclusao, ativo
      ) VALUES (
        $1, $2, $3, $4,
        $5, $6, $7, $8,
        $9, $10, CURRENT_TIMESTAMP, TRUE
      )`,
      [
        estoque_id, descricao_item, tipo_medicao, peso_unitario,
        estoque_unidade, estoque_peso, custo_unitario, custo_grama,
        valor_venda, usuario_id
      ]
    );

    await client.query('COMMIT');
    res.json({ status: 'OK', mensagem: 'Item cadastrado no estoque com sucesso' });
  } catch (err) {
    await client.query('ROLLBACK');
    console.error('❌ Erro ao cadastrar item no estoque:', err);
    res.status(500).json({ error: err.message });
  } finally {
    client.release();
  }
});

/* =========================================================
   🔍 LISTAR ITENS DE UM ESTOQUE
========================================================= */
router.get('/itemestoque', async (req, res) => {
  const {
    estoque_id = '',
    item_id = '',
    descricao_item = '',
    limit = 10,
    offset = 0
  } = req.query;

  try {
    const result = await req.pool.query(
      `
      SELECT
        i.item_id,
        i.descricao_item,
        e.estoque_id,
        e.localizacao,
        i.tipo_medicao,
        i.peso_unitario,
        i.estoque_unidade,
        i.estoque_peso,
        i.custo_unitario,
        i.custo_grama,
        i.valor_venda,
        i.data_inclusao,
        i.ativo
      FROM
        public.estoque_item i
      JOIN public.estoque e ON i.estoque_id = e.estoque_id
      WHERE
        i.ativo = TRUE
        AND e.ativo = TRUE
        AND (NULLIF($1, '') IS NULL OR i.estoque_id = CAST($1 AS INTEGER))
        AND (NULLIF($2, '') IS NULL OR i.item_id = CAST($2 AS INTEGER))
        AND (NULLIF($3, '') IS NULL OR i.descricao_item ILIKE '%' || $3 || '%')
      ORDER BY
        i.item_id ASC
      LIMIT $4 OFFSET $5
      `,
      [estoque_id, item_id, descricao_item, limit, offset]
    );
    res.json(result.rows);
  } catch (err) {
    console.error('❌ Erro ao listar itens:', err);
    res.status(500).json({ error: err.message });
  }
});

/* =========================================================
   🔄 MOVIMENTAR ESTOQUE (ENTRADA / SAÍDA)
========================================================= */
router.post('/movimentar', async (req, res) => {
  const {
    item_id,
    tipo_movimento,   // 'ENTRADA' ou 'SAIDA'
    origem,
    referencia_id,
    quantidade_unidade,
    quantidade_peso
  } = req.body;

  const usuario_id = req.user.id;
  const client = await req.pool.connect();

  try {
    await client.query('BEGIN');

    // Validação de tipo
    if (!['ENTRADA', 'SAIDA'].includes(tipo_movimento.toUpperCase())) {
      throw new Error("Tipo de movimento inválido. Use 'ENTRADA' ou 'SAIDA'.");
    }

    // Busca o item atual
    const itemResult = await client.query(
      `SELECT estoque_unidade, estoque_peso FROM public.estoque_item WHERE item_id = $1`,
      [item_id]
    );
    if (itemResult.rowCount === 0) throw new Error(`Item ${item_id} não encontrado`);

    let novoEstoqueUnidade = itemResult.rows[0].estoque_unidade;
    let novoEstoquePeso = itemResult.rows[0].estoque_peso;

    // Calcula novo saldo
    if (tipo_movimento === 'ENTRADA') {
      novoEstoqueUnidade += quantidade_unidade || 0;
      novoEstoquePeso += quantidade_peso || 0;
    } else if (tipo_movimento === 'SAIDA') {
      novoEstoqueUnidade -= quantidade_unidade || 0;
      novoEstoquePeso -= quantidade_peso || 0;
    }

    if (novoEstoqueUnidade < 0 || novoEstoquePeso < 0) {
      throw new Error('Movimentação inválida: saldo insuficiente.');
    }

    // Atualiza estoque
    await client.query(
      `UPDATE public.estoque_item
          SET estoque_unidade = $2,
              estoque_peso = $3,
              usuario_alteracao = $4,
              data_alteracao = CURRENT_TIMESTAMP
        WHERE item_id = $1`,
      [item_id, novoEstoqueUnidade, novoEstoquePeso, usuario_id]
    );

    // Registra movimento
    await client.query(
      `INSERT INTO public.movimentos_estoque (
        item_id, tipo_movimento, origem, referencia_id,
        quantidade_unidade, quantidade_peso,
        usuario_inclusao, data_inclusao, data_movimento, ativo
      ) VALUES (
        $1, $2, $3, $4,
        $5, $6,
        $7, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP, TRUE
      )`,
      [item_id, tipo_movimento, origem, referencia_id, quantidade_unidade, quantidade_peso, usuario_id]
    );

    await client.query('COMMIT');
    res.json({ status: 'OK', mensagem: `Movimentação ${tipo_movimento} registrada com sucesso` });
  } catch (err) {
    await client.query('ROLLBACK');
    console.error('❌ Erro ao movimentar estoque:', err);
    res.status(500).json({ error: err.message });
  } finally {
    client.release();
  }
});

/* =========================================================
   📜 CONSULTAR HISTÓRICO DE MOVIMENTOS DE UM ITEM
========================================================= */
router.get('/itens/:item_id/movimentos', async (req, res) => {
  const { item_id } = req.params;
  try {
    const result = await req.pool.query(
      `SELECT 
          m.movimento_id,
          m.tipo_movimento,
          m.origem,
          m.referencia_id,
          m.quantidade_unidade,
          m.quantidade_peso,
          m.data_movimento,
          u.nome_completo AS usuario
       FROM public.movimentos_estoque m
       LEFT JOIN public.usuarios u ON m.usuario_inclusao = u.id
      WHERE m.item_id = $1
      ORDER BY m.data_movimento DESC`,
      [item_id]
    );
    res.json(result.rows);
  } catch (err) {
    console.error('❌ Erro ao listar movimentos:', err);
    res.status(500).json({ error: err.message });
  }
});

export default router;
