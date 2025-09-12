import express from 'express';
import { pool } from '../db.js';

const router = express.Router();

router.post('/pessoas/gerenciar', async (req, res) => {
  const {
    acao, pessoa_id, tipo_pessoa, cpf_cnpj, nome, data_nascimento,
    ddd, fone, email, cep, cod_logradouro, numero, cod_bairro, complemento
  } = req.body;

  const client = await pool.connect();
  try {
    if (acao === 'SELECT') {
      await client.query('BEGIN');
      await client.query(`
        CALL gerenciar_pessoa(
          $1, $2, $3, $4, $5, $6, $7, $8, $9,
          $10, $11, $12, $13, $14, $15
        )
      `, [
        acao, pessoa_id, tipo_pessoa, cpf_cnpj, nome, data_nascimento,
        ddd, fone, email, cep, cod_logradouro, numero, cod_bairro, complemento, 'resultado_cursor'
      ]);
      const result = await client.query('FETCH ALL IN resultado_cursor');
      await client.query('COMMIT');
      res.json(result.rows);
    } else {
      await client.query('BEGIN');
      await client.query(`
        CALL gerenciar_pessoa(
          $1, $2, $3, $4, $5, $6, $7, $8, $9,
          $10, $11, $12, $13, $14, $15
        )
      `, [
        acao, pessoa_id, tipo_pessoa, cpf_cnpj, nome, data_nascimento,
        ddd, fone, email, cep, cod_logradouro, numero, cod_bairro, complemento, null
      ]);

      // Captura de mensagens via SELECT opcional
      const feedback = await client.query(`SELECT 'Ação realizada com sucesso' AS mensagem`);
      await client.query('COMMIT');

      res.json({
        status: 'OK',
        acao,
        mensagem: feedback.rows[0].mensagem
      });
    }
  } catch (err) {
    await client.query('ROLLBACK');
    console.error('❌ Erro na procedure pessoas:', err);
    res.status(500).json({ error: err.message });
  } finally {
    client.release();
  }
});

export default router;