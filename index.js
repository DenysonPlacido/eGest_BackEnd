// /workspaces/eGest_BackEnd/index.js

import express from 'express';
import cors from 'cors';

import authRoutes from './routes/auth.js';         // login e autenticação
import menusRoutes from './routes/menus.js';       // menus
import pessoasRoutes from './routes/pessoas.js';   // CRUD de pessoas
import usuariosRoutes from './routes/usuarios.js'; // CRUD de usuários
import empresasRoutes from './routes/empresas.js'; // CRUD de empresas

const app = express();
const PORT = process.env.PORT || 3000;

// =======================
// Middlewares globais
// =======================
app.use(cors());
app.use(express.json());

// =======================
// Health-check
// =======================
app.get('/', (req, res) => {
  res.send('✅ Back-end funcionando!');
});

// =======================
// Rotas principais (RESTful)
// =======================
// Cada grupo de rotas em seu endpoint
app.use('/api/auth', authRoutes);         // autenticação (login, logout)
app.use('/api/menus', menusRoutes);       // menus
app.use('/api/pessoas', pessoasRoutes);   // CRUD de pessoas
app.use('/api/usuarios', usuariosRoutes); // CRUD de usuários
app.use('/api/empresas', empresasRoutes); // CRUD de empresas

// =======================
// Inicialização do servidor
// =======================
app.listen(PORT, () => {
  console.log(`🚀 Servidor rodando na porta ${PORT}`);
});
