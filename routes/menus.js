// /workspaces/eGest_BackEnd/routes/menus.js
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
      SELECT DISTINCT ON (m.ordem)
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

    // Montagem da estrutura hierárquica
    const estrutura = [];
    const menuMap = {};
    const submenuMap = {};
    const submenuKeyMap = {};
    const menuIdMap = {};

    menus.forEach(item => {
      if (item.tipo === 'menu') {
        const key = `${item.nome}|${item.caminho}`;
        if (!menuMap[key]) {
          const menu = {
            nome: item.nome,
            icone: item.icone,
            caminho: item.caminho,
            tipo: item.tipo,
            submenus: []
          };
          estrutura.push(menu);
          menuMap[key] = menu;
          menuIdMap[item.id] = menu;
        }
      }
    });

    menus.forEach(item => {
      if (item.tipo === 'submenu') {
        const key = `${item.nome}|${item.caminho}`;
        const menuPai = menuIdMap[item.hierarquia_pai];
        if (menuPai && !submenuKeyMap[key]) {
          const sub = {
            nome: item.nome,
            icone: item.icone,
            caminho: item.caminho,
            tipo: item.tipo,
            acoes: []
          };
          menuPai.submenus.push(sub);
          submenuKeyMap[key] = sub;
          submenuMap[item.id] = sub;
        }
      }
    });

    menus.forEach(item => {
      if (item.tipo === 'acao') {
        const submenu = submenuMap[item.hierarquia_pai];
        if (submenu) {
          submenu.acoes.push({
            nome: item.nome,
            caminho: item.caminho,
            icone: item.icone
          });
        } else {
          const menu = menuIdMap[item.hierarquia_pai];
          if (menu) {
            if (!menu.acoes) menu.acoes = [];
            menu.acoes.push({
              nome: item.nome,
              caminho: item.caminho,
              icone: item.icone
            });
          }
        }
      }
    });

    res.status(200).json(estrutura);
  } catch (err) {
    console.error('Erro ao buscar menus:', err);
    res.status(500).json({ message: 'Erro interno ao buscar menus' });
  }
});

export default router;