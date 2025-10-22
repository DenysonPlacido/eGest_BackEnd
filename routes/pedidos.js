// /workspaces/eGest_BackEnd/routes/pedidos.js
import express from 'express';
import autenticar from '../middleware/authMiddleware.js';

const router = express.Router();
router.use(autenticar);

/* =========================================================
   🧾 CRIAR PEDIDO
========================================================= */
router.post('/', async (req, res) => {
  const { tipo_pedido, cliente_id, observacao, itens } = req.body;
  const usuario_id = req.user.id;
  const client = await req.pool.connect();

  try {
    await client.query('BEGIN');

    // 1️⃣ Cria o pedido
    const pedidoResult = await client.query(
      `INSERT INTO public.pedidos (
        tipo_pedido, cliente_id, observacao, usuario_inclusao, data_inclusao, ativo
      ) VALUES ($1, $2, $3, $4, CURRENT_TIMESTAMP, TRUE)
      RETURNING pedido_id`,
      [tipo_pedido, cliente_id, observacao, usuario_id]
    );

    const pedido_id = pedidoResult.rows[0].pedido_id;

    // 2️⃣ Insere os itens
    let totalPedido = 0;
    for (const item of itens) {
      const subtotal = item.quantidade * item.preco_unitario;
      totalPedido += subtotal;

      await client.query(
        `INSERT INTO public.pedido_item (
          pedido_id, item_id, quantidade, preco_unitario, versao_registro, data_inclusao, ativo
        ) VALUES ($1, $2, $3, $4, 0, CURRENT_TIMESTAMP, TRUE)`,
        [pedido_id, item.item_id, item.quantidade, item.preco_unitario]
      );
    }

    // 3️⃣ Atualiza o valor total
    await client.query(
      `UPDATE public.pedidos
          SET valor_total = $1,
              usuario_alteracao = $2,
              data_alteracao = CURRENT_TIMESTAMP
        WHERE pedido_id = $3`,
      [totalPedido, usuario_id, pedido_id]
    );

    // 4️⃣ Insere histórico inicial
    await client.query(
      `INSERT INTO public.historico_pedidos (
         pedido_id, usuario_responsavel, status_anterior, status_novo, observacao
       ) VALUES ($1, $2, NULL, 'ABERTO', $3)`,
      [pedido_id, usuario_id, 'Pedido criado']
    );

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

/* =========================================================
   🔍 CONSULTAR PEDIDOS
========================================================= */
router.get('/', async (req, res) => {
  const { tipo = '', status = '' } = req.query;
  try {
    const result = await req.pool.query(
      `SELECT 
          p.pedido_id,
          p.tipo_pedido,
          p.status,
          p.valor_total,
          p.data_pedido,
          ps.nome AS nome_cliente,
          p.observacao
       FROM public.pedidos p
       JOIN public.clientes c ON p.cliente_id = c.cliente_id
       JOIN public.pessoas ps ON c.pessoa_id = ps.pessoa_id
      WHERE (COALESCE($1, '') = '' OR p.tipo_pedido = $1)
        AND (COALESCE($2, '') = '' OR p.status = $2)
        AND c.ativo = TRUE
      ORDER BY p.data_pedido DESC`,
      [tipo, status]
    );
    res.json(result.rows);
  } catch (err) {
    console.error('❌ Erro ao listar pedidos:', err);
    res.status(500).json({ error: err.message });
  }
});

/* =========================================================
   🔁 APROVAR PEDIDO
========================================================= */
router.post('/:id/aprovar', async (req, res) => {
  const { id } = req.params;
  const { observacao } = req.body;
  const usuario_id = req.user.id;

  const client = await req.pool.connect();
  try {
    await client.query('BEGIN');

    const pedidoResult = await client.query(
      `SELECT status FROM public.pedidos WHERE pedido_id = $1`,
      [id]
    );
    if (pedidoResult.rowCount === 0) {
      throw new Error(`Pedido ${id} não encontrado`);
    }
    const statusAnterior = pedidoResult.rows[0].status;

    if (statusAnterior !== 'ABERTO') {
      throw new Error('Somente pedidos ABERTOS podem ser aprovados');
    }

    await client.query(
      `UPDATE public.pedidos
          SET status = 'APROVADO',
              usuario_alteracao = $2,
              data_alteracao = CURRENT_TIMESTAMP
        WHERE pedido_id = $1`,
      [id, usuario_id]
    );

    await client.query(
      `INSERT INTO public.aprovacoes_pedido (
         pedido_id, usuario_aprovador, observacao
       ) VALUES ($1, $2, $3)`,
      [id, usuario_id, observacao]
    );

    await client.query(
      `INSERT INTO public.historico_pedidos (
         pedido_id, usuario_responsavel, status_anterior, status_novo, observacao
       ) VALUES ($1, $2, $3, 'APROVADO', $4)`,
      [id, usuario_id, statusAnterior, observacao]
    );

    await client.query('COMMIT');
    res.json({ status: 'OK', mensagem: `Pedido ${id} aprovado com sucesso` });
  } catch (err) {
    await client.query('ROLLBACK');
    console.error('❌ Erro ao aprovar pedido:', err);
    res.status(500).json({ error: err.message });
  } finally {
    client.release();
  }
});

/* =========================================================
   🚫 CANCELAR PEDIDO
========================================================= */
router.post('/:id/cancelar', async (req, res) => {
  const { id } = req.params;
  const { observacao } = req.body;
  const usuario_id = req.user.id;

  const client = await req.pool.connect();
  try {
    await client.query('BEGIN');

    const pedidoResult = await client.query(
      `SELECT status FROM public.pedidos WHERE pedido_id = $1`,
      [id]
    );
    if (pedidoResult.rowCount === 0) {
      throw new Error(`Pedido ${id} não encontrado`);
    }

    const statusAnterior = pedidoResult.rows[0].status;

    await client.query(
      `UPDATE public.pedidos
          SET status = 'CANCELADO',
              usuario_alteracao = $2,
              data_alteracao = CURRENT_TIMESTAMP
        WHERE pedido_id = $1`,
      [id, usuario_id]
    );

    await client.query(
      `INSERT INTO public.historico_pedidos (
         pedido_id, usuario_responsavel, status_anterior, status_novo, observacao
       ) VALUES ($1, $2, $3, 'CANCELADO', $4)`,
      [id, usuario_id, statusAnterior, observacao]
    );

    await client.query('COMMIT');
    res.json({ status: 'OK', mensagem: `Pedido ${id} cancelado com sucesso` });
  } catch (err) {
    await client.query('ROLLBACK');
    console.error('❌ Erro ao cancelar pedido:', err);
    res.status(500).json({ error: err.message });
  } finally {
    client.release();
  }
});

/* =========================================================
   🧾 HISTÓRICO DE PEDIDO
========================================================= */
router.get('/:id/historico', async (req, res) => {
  const { id } = req.params;
  try {
    const result = await req.pool.query(
      `SELECT 
         h.historico_id,
         h.status_anterior,
         h.status_novo,
         h.data_alteracao,
         h.observacao,
         u.nome_completo AS usuario
       FROM public.historico_pedidos h
       JOIN public.usuarios u ON h.usuario_responsavel = u.id
      WHERE h.pedido_id = $1
      ORDER BY h.data_alteracao DESC`,
      [id]
    );
    res.json(result.rows);
  } catch (err) {
    console.error('❌ Erro ao buscar histórico:', err);
    res.status(500).json({ error: err.message });
  }
});

/* =========================================================
   🏁 CONCLUIR PEDIDO
========================================================= */
router.post('/:id/concluir', async (req, res) => {
  const { id } = req.params;
  const { observacao } = req.body;
  const usuario_id = req.user.id;

  const client = await req.pool.connect();
  try {
    await client.query('BEGIN');

    const pedidoResult = await client.query(
      `SELECT status FROM public.pedidos WHERE pedido_id = $1`,
      [id]
    );
    if (pedidoResult.rowCount === 0) {
      throw new Error(`Pedido ${id} não encontrado`);
    }

    const statusAnterior = pedidoResult.rows[0].status;

    if (statusAnterior !== 'APROVADO') {
      throw new Error('Somente pedidos APROVADOS podem ser concluídos');
    }

    await client.query(
      `UPDATE public.pedidos
          SET status = 'CONCLUIDO',
              usuario_alteracao = $2,
              data_alteracao = CURRENT_TIMESTAMP
        WHERE pedido_id = $1`,
      [id, usuario_id]
    );

    await client.query(
      `INSERT INTO public.historico_pedidos (
         pedido_id, usuario_responsavel, status_anterior, status_novo, observacao
       ) VALUES ($1, $2, $3, 'CONCLUIDO', $4)`,
      [id, usuario_id, statusAnterior, observacao]
    );

    await client.query('COMMIT');
    res.json({ status: 'OK', mensagem: `Pedido ${id} concluído com sucesso` });
  } catch (err) {
    await client.query('ROLLBACK');
    console.error('❌ Erro ao concluir pedido:', err);
    res.status(500).json({ error: err.message });
  } finally {
    client.release();
  }
});

export default router;
