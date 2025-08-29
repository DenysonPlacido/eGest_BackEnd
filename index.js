//workspaces/eGest_BackEnd/index.js

import express from 'express';
import cors from 'cors';
import authRoutes from './routes/auth.js';
import empresasRoutes from './routes/empresas.js';

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());

// Rota raiz de teste
app.get('/', (req, res) => {
    res.send('Back-end funcionando!');
});

// Rotas de autenticação
app.use('/api', authRoutes);

// Rotas de empresas
app.use('/api', empresasRoutes);

// Inicia servidor
app.listen(PORT, () => {
    console.log(`Servidor rodando na porta ${PORT}`);
});
