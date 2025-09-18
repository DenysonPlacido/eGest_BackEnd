// api/index.js

import express from 'express';
import cors from 'cors';
import { swaggerUi, swaggerSpec } from '../docs/swagger.js';

import authRoutes from '../routes/auth.js';
import menusRoutes from '../routes/menus.js';
import pessoasRoutes from '../routes/pessoas.js';
import usuariosRoutes from '../routes/usuarios.js';
import { autenticar } from '../middleware/authMiddleware.js';

const app = express();

app.use(cors());
app.use(express.json());
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec, { explorer: true }));

app.get('/', (req, res) => {
  res.send('✅ Back-end funcionando!');
});

app.use('/api/auth', authRoutes);
app.use('/api/menus', autenticar, menusRoutes);
app.use('/api/pessoas', autenticar, pessoasRoutes);
app.use('/api/usuarios', autenticar, usuariosRoutes);

// 🔁 Exporta como função serverless
export default app;