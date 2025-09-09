// routes/menuRoutes.js
import express from 'express';
import { listarMenus } from '../controllers/menuController.js';
import { verificarToken } from '../middlewares/authMiddleware.js';

const router = express.Router();

router.get('/menus', verificarToken, listarMenus);

export default router;