// middleware/authMiddleware.js
import jwt from 'jsonwebtoken';
import { dbPools } from '../db.js';

export function autenticar(req, res, next) {
  const authHeader = req.headers.authorization;
  const token = authHeader?.split(' ')[1];

  if (!token) return res.status(401).json({ message: 'Token não fornecido' });

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const empresa_id = decoded.empresa_id;

    const pool = dbPools[empresa_id];
    if (!pool) {
      return res.status(400).json({ message: 'Empresa inválida ou sem pool configurado' });
    }

    // 🔑 Injeta no request
    req.user = decoded;   // dados do usuário
    req.pool = pool;      // pool da empresa

    next();
  } catch (err) {
    console.error('Erro na autenticação:', err);
    res.status(401).json({ message: 'Token inválido ou expirado' });
  }
}
