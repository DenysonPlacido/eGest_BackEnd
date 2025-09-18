import express from 'express';
import cors from 'cors';
import path from 'path';
import { fileURLToPath } from 'url';
import swaggerUiDist from 'swagger-ui-dist';
import { swaggerSpec } from '../docs/swagger.js';

import authRoutes from '../routes/auth.js';
import menusRoutes from '../routes/menus.js';
import pessoasRoutes from '../routes/pessoas.js';
import usuariosRoutes from '../routes/usuarios.js';
import autenticar from '../middleware/authMiddleware.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();

app.use(cors());
app.use(express.json());

// Servir os arquivos estáticos do Swagger UI
app.use('/swagger-assets', express.static(swaggerUiDist.getAbsoluteFSPath()));

// Rota que serve o HTML customizado do Swagger
app.get('/api-docs', (req, res) => {
  res.send(`
    <!DOCTYPE html>
    <html lang="pt-br">
    <head>
      <meta charset="UTF-8">
      <title>eGest API Docs</title>
      <link rel="stylesheet" href="/swagger-assets/swagger-ui.css" />
    </head>
    <body>
      <div id="swagger-ui"></div>
      <script src="/swagger-assets/swagger-ui-bundle.js"></script>
      <script src="/swagger-assets/swagger-ui-standalone-preset.js"></script>
      <script>
        window.onload = () => {
          SwaggerUIBundle({
            url: '/swagger.json',
            dom_id: '#swagger-ui',
            presets: [SwaggerUIBundle.presets.apis, SwaggerUIStandalonePreset],
            layout: "StandaloneLayout"
          });
        };
      </script>
    </body>
    </html>
  `);
});

// Rota que serve o JSON da documentação
app.get('/swagger.json', (req, res) => {
  res.setHeader('Content-Type', 'application/json');
  res.send(swaggerSpec);
});

app.get('/', (req, res) => {
  res.send(`
    <!DOCTYPE html>
    <html lang="pt-br">
    <head>
      <meta charset="UTF-8" />
      <title>eGest Back-End</title>
      <style>
        body {
          margin: 0;
          background-color: #000;
          color: #0f0;
          font-family: 'Courier New', Courier, monospace;
          display: flex;
          align-items: center;
          justify-content: center;
          height: 100vh;
          text-align: center;
        }
        h1 {
          font-size: 2.5rem;
        }
        .status {
          font-size: 1.2rem;
          margin-top: 10px;
          color: #ccc;
        }
      </style>
    </head>
    <body>
      <div>
        <h1>✅ Back-end funcionando!</h1>
        <div class="status">Servidor eGest ativo e operacional</div>
      </div>
    </body>
    </html>
  `);
});


app.use('/api/auth', authRoutes);
app.use('/api/menus', autenticar, menusRoutes);
app.use('/api/pessoas', autenticar, pessoasRoutes);
app.use('/api/usuarios', autenticar, usuariosRoutes);

export default app;