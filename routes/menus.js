// /workspaces/eGest_BackEnd/routes/menus.js
import express from 'express';
import autenticar from '../middleware/authMiddleware.js';

const router = express.Router();


// Middleware de autenticação para todos os endpoints desse router
router.use(autenticar);

router.get('/', async (req, res) => {
  const client = await req.pool.connect();
  try {
    const usuarioId = req.user.id; // obtido do token
    await client.query('BEGIN');

    const query = `
                    select
                      distinct on
                      (m.ordem)
                            m.id,
                      m.nome,
                      m.icone,
                      m.caminho,
                      m.tipo,
                      m.hierarquia_pai,
                      m.ordem
                    from
                      usuarios u
                    join usuario_perfil up on
                      up.usuario_id = u.id
                    join perfis p on
                      p.id = up.perfil_id
                    join perfil_menu_permissao pmp on
                      pmp.perfil_id = p.id
                      and pmp.ativo = true
                    join menus_sistema m on
                      m.id = pmp.menu_id
                    where
                      u.id = 1
                      and m.ordem is not null
                    order by
                      m.ordem asc;

    `;

    const result = await client.query(query, [usuarioId]);
    const menus = result.rows;

    await client.query('COMMIT');

    const estrutura = [];
    const menuMap = {};
    const submenuMap = {};
    const menuIdMap = {};

    // Menus
    menus.forEach(item => {
      if (item.tipo === 'menu') {
        const key = `${item.nome}|${item.caminho}`;
        if (!menuMap[key]) {
          const menu = {
            id: item.id,
            nome: item.nome,
            icone: item.icone,
            caminho: item.caminho,
            tipo: item.tipo,
            submenus: [],
            acoes: []
          };
          estrutura.push(menu);
          menuMap[key] = menu;
          menuIdMap[item.id] = menu;
        }
      }
    });

    // Submenus
    menus.forEach(item => {
      if (item.tipo === 'submenu') {
        const menuPai = menuIdMap[item.hierarquia_pai];
        if (!menuPai) return;
        const sub = {
          id: item.id,
          nome: item.nome,
          icone: item.icone,
          caminho: item.caminho,
          tipo: item.tipo,
          submenus: [],
          acoes: []
        };
        menuPai.submenus.push(sub);
        submenuMap[item.id] = sub;
      }
    });

    // Ações
    menus.forEach(item => {
      if (item.tipo === 'acao') {
        const parentSub = submenuMap[item.hierarquia_pai];
        if (parentSub) {
          parentSub.acoes.push({
            id: item.id,
            nome: item.nome,
            icone: item.icone,
            caminho: item.caminho
          });
        } else {
          const parentMenu = menuIdMap[item.hierarquia_pai];
          if (parentMenu) {
            parentMenu.acoes.push({
              id: item.id,
              nome: item.nome,
              icone: item.icone,
              caminho: item.caminho
            });
          }
        }
      }
    });

    res.status(200).json(estrutura);

  } catch (err) {
    await client.query('ROLLBACK');
    console.error('❌ Erro ao buscar menus:', err);
    res.status(500).json({ message: 'Erro interno ao buscar menus' });
  } finally {
    client.release();
  }
});

export default router;
