import express from 'express';
import { login, listarEmpresas } from '../controllers/authController.js';

const router = express.Router();

router.post('/login', login);
router.get('/empresas', listarEmpresas);

export default router;