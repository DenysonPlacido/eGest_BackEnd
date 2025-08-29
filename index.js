import express from 'express';
import cors from 'cors';
import authRoutes from './routes/auth.js';

const app = express(); // ⚠️ aqui criamos o app Express
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());

app.use('/api', authRoutes);

app.listen(PORT, () => {
  console.log(`Servidor rodando na porta ${PORT}`);
});


app.get('/', (req, res) => {
    res.send('Back-end funcionando!');
});
