import { pool } from '../db.js';

export async function autenticarUsuario(empresa_id, username, senha) {
  const query = `SELECT * FROM lg_in($1, $2, $3);`;
  const result = await pool.query(query, [empresa_id.toString(), username, senha]);
  return result.rows[0];
}

export async function listarEmpresasAtivas() {
  const query = 'SELECT empresa_id, nome FROM empresas WHERE situacao = 1 ORDER BY nome';
  const result = await pool.query(query);
  return result.rows;
}