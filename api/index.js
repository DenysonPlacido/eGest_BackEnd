// /workspaces/eGest_BackEnd/api/index.js

import express from 'express';
import cors from 'cors';
import swaggerUi from 'swagger-ui-express';
import { swaggerSpec } from '../docs/swagger.js';

import authRoutes from '../routes/auth.js';
import menusRoutes from '../routes/menus.js';
import pessoasRoutes from '../routes/pessoas.js';
import usuariosRoutes from '../routes/usuarios.js';
import autenticar from '../middleware/authMiddleware.js';

const app = express();

app.use(cors());
app.use(express.json());

// Rota do Swagger UI
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec));

// Rota para servir o JSON da documentação
app.get('/api/swagger.json', (req, res) => {
  res.setHeader('Content-Type', 'application/json');
  res.send(swaggerSpec);
});

// Página inicial simples
app.get('/', (req, res) => {
  res.sendFile(process.cwd() + '/public/index.html');
});

// Rotas da API
app.use('/api/auth', authRoutes);
app.use('/api/menus', autenticar, menusRoutes);
app.use('/api/pessoas', autenticar, pessoasRoutes);
app.use('/api/usuarios', autenticar, usuariosRoutes);

export default app;
