// /middleware/authMiddleware.js
import jwt from 'jsonwebtoken';
import { getPool } from '../db.js';

const autenticar = (req, res, next) => {
  const authHeader = req.headers.authorization;
  const token = authHeader?.split(' ')[1];

  if (!token) return res.status(401).json({ message: 'Token não fornecido' });

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // 🔑 empresa_id pode vir do header ou do token
    const empresa_id = parseInt(req.headers['x-empresa-id'], 10) || decoded.empresa_id;

    if (!empresa_id) {
      return res.status(400).json({ message: 'Empresa não informada' });
    }

    const pool = getPool(empresa_id); // garante que cria se não existir
    req.user = decoded;
    req.pool = pool;

    next();
  } catch (err) {
    console.error('Erro na autenticação:', err);
    res.status(401).json({ message: 'Token inválido ou expirado' });
  }
};

export default autenticar;