import express from 'express';
import cors from 'cors';

import authRoutes from './routes/auth.js';         // login e empresas
import menusRoutes from './routes/menus.js';       // menus
import pessoasRoutes from './routes/pessoas.js';   // pessoas
import usuariosRoutes from './routes/usuarios.js'; // usuários

const app = express(); // 🔄 mover para cima antes de usar
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());

// Rotas
app.get('/', (req, res) => {
  res.send('✅ Back-end funcionando!');
});

app.use('/api', authRoutes);
app.use('/api', menusRoutes);
app.use('/api', pessoasRoutes);
app.use('/api', usuariosRoutes);

// Inicia servidor
app.listen(PORT, () => {
  console.log(`🚀 Servidor rodando na porta ${PORT}`);
});