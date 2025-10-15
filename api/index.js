// /workspaces/eGest_BackEnd/api/index.js

import express from 'express';
import cors from 'cors';
import path from 'path';
import swaggerUi from 'swagger-ui-express';
import { swaggerSpec } from '../docs/swagger.js';


import authRoutes from '../routes/auth.js';
import menusRoutes from '../routes/menus.js';
import pessoasRoutes from '../routes/pessoas.js';
import usuariosRoutes from '../routes/usuarios.js';
import produtosRoutes from '../routes/produtos.js';
import estoqueRoutes from '../routes/estoque.js';
import vendasRoutes from '../routes/vendas.js';

app.use('/api/produtos', produtosRoutes);
app.use('/api/estoque', estoqueRoutes);
app.use('/api/vendas', vendasRoutes);

import autenticar from '../middleware/authMiddleware.js';

const app = express();


// Middlewares
app.use(cors());
app.use(express.json());

// ----------------------------
// Swagger UI oficial (funciona no Vercel)
// ----------------------------
// Rota do Swagger UI

// app.use('/api-docs', autenticar, swaggerUi.serve, swaggerUi.setup(swaggerSpec));

// NÃO PROTEJA a rota do Swagger
// app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec));

app.use('/api-docs', (req, res) => {
  res.send(`
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="UTF-8">
      <title>Swagger UI</title>
      <link rel="stylesheet" href="https://unpkg.com/swagger-ui-dist/swagger-ui.css" />
    </head>
    <body>
      <div id="swagger-ui"></div>
      <script src="https://unpkg.com/swagger-ui-dist/swagger-ui-bundle.js"></script>
      <script src="https://unpkg.com/swagger-ui-dist/swagger-ui-standalone-preset.js"></script>
      <script>
        window.onload = () => {
          SwaggerUIBundle({
            url: '/api/swagger.json',
            dom_id: '#swagger-ui',
            presets: [SwaggerUIBundle.presets.apis, SwaggerUIStandalonePreset],
            layout: 'StandaloneLayout'
          });
        };
      </script>
    </body>
    </html>
  `);
});

// Rota de health check
app.get('/health', (req, res) => {
  res.status(200).json({
    status: 'ok',
    uptime: process.uptime(),
    timestamp: Date.now()
  });
});


// Rota para servir o JSON da documentação
app.get('/api/swagger.json', (req, res) => {
  res.setHeader('Content-Type', 'application/json');
  res.send(swaggerSpec);
});


// ----------------------------
// Arquivos estáticos da pasta public
// ----------------------------
app.use(express.static(path.join(process.cwd(), 'public')));

// ----------------------------
// Página inicial usando index.html
// ----------------------------
app.get('/', (req, res) => {
  res.sendFile(path.join(process.cwd(), 'public', 'index.html'));
});

// ----------------------------
// Rotas da API protegidas
// ----------------------------
app.use('/api/auth', authRoutes);
app.use('/api/menus',autenticar, menusRoutes);
app.use('/api/pessoas', autenticar, pessoasRoutes);
app.use('/api/usuarios', autenticar, usuariosRoutes);
app.use('/api/produtos', autenticar, produtosRoutes);
app.use('/api/estoque', autenticar, estoqueRoutes);
app.use('/api/vendas', autenticar, vendasRoutes);

export default app;
