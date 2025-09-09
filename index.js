// /workspaces/eGest_BackEnd/index.js
import express from 'express';
import cors from 'cors';
import authRoutes from './routes/auth.js';
import menusRoutes from './routes/menus.js';

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());

// Rotas
app.get('/', (req, res) => {
  res.send('✅ Back-end funcionando!');
});

app.use('/api', authRoutes);     // login e empresas
app.use('/api', menusRoutes);    // menus

// Inicia servidor
app.listen(PORT, () => {
  console.log(`🚀 Servidor rodando na porta ${PORT}`);
});