import express from 'express';
import jwt from 'jsonwebtoken';
import { pool } from '../db.js';

const router = express.Router();

router.get('/menus', async (req, res) => {
  const authHeader = req.headers.authorization;
  const token = authHeader?.split(' ')[1];

  if (!token) return res.status(401).json({ message: 'Token não fornecido' });

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const usuarioId = decoded.id;

    const query = `
      SELECT 
        m.id, m.nome, m.icone, m.caminho, m.tipo, m.hierarquia_pai
      FROM usuarios u
      JOIN usuario_perfil up ON up.usuario_id = u.id
      JOIN perfis p ON p.id = up.perfil_id
      JOIN perfil_menu_permissao pmp ON pmp.perfil_id = p.id AND pmp.ativo = TRUE
      JOIN menus_sistema m ON m.id = pmp.menu_id
      WHERE u.id = $1
      ORDER BY m.ordem ASC
    `;

    const result = await pool.query(query, [usuarioId]);
    const menus = result.rows;

    // Organizar estrutura hierárquica
    const estrutura = menus
      .filter(m => m.tipo === 'menu' || m.tipo === 'submenu')
      .map(menu => ({
        id: menu.id,
        nome: menu.nome,
        icone: menu.icone,
        caminho: menu.caminho,
        tipo: menu.tipo,
        submenus: menus
          .filter(sub => sub.hierarquia_pai === menu.id && sub.tipo === 'acao')
          .map(sub => ({
            nome: sub.nome,
            caminho: sub.caminho
          }))
      }));

    res.json(estrutura);
  } catch (err) {
    console.error('Erro ao buscar menus:', err);
    res.status(500).json({ message: 'Erro interno ao buscar menus' });
  }
});

export default router;