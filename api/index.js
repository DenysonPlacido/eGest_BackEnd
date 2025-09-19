// /workspaces/eGest_BackEnd/api/index.js

import express from 'express';
import cors from 'cors';
import path from 'path';
import swaggerUi from 'swagger-ui-express';
import { swaggerSpec } from '../docs/swagger.js';

import authRoutes from '../routes/auth.js';
import menusRoutes from '../routes/menus.js';
import pessoasRoutes from '../routes/pessoas.js';
import usuariosRoutes from '../routes/usuarios.js';
import autenticar from '../middleware/authMiddleware.js';

const app = express();

// Middlewares
app.use(cors());
app.use(express.json());

// Swagger UI (sempre primeiro para evitar conflito com arquivos estáticos)
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec));

// Arquivos estáticos da pasta public
app.use(express.static(path.join(process.cwd(), 'public')));

// Página inicial usando index.html
app.get('/', (req, res) => {
  res.sendFile(path.join(process.cwd(), 'public', 'index.html'));
});

// Rotas da API
app.use('/api/auth', authRoutes);
app.use('/api/menus', autenticar, menusRoutes);
app.use('/api/pessoas', autenticar, pessoasRoutes);
app.use('/api/usuarios', autenticar, usuariosRoutes);

export default app;
