// /docs/swagger.js
import swaggerJSDoc from 'swagger-jsdoc';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';

console.log('📂 Procurando arquivos swaggerTags em:', path.join(process.cwd(), 'docs/swaggerTags/*.js'));
console.log('📂 Conteúdo da pasta:', fs.readdirSync(path.join(process.cwd(), 'docs/swaggerTags')));


const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export const swaggerSpec = swaggerJSDoc({
  definition: {
    openapi: '3.0.3',
    info: {
      title: 'eGest API',
      version: '1.0.0',
      description: 'Documentação da API eGest',
    },
    servers: [
      {
        url: 'https://e-gest-back-end.vercel.app',
        description: 'Servidor de produção',
      },
    ],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT',
        },
      },
    },
    security: [{ bearerAuth: [] }],
  },
  apis: [
  path.resolve(__dirname, 'swaggerTags/*.js'),
  path.join(process.cwd(), 'docs/swaggerTags/*.js')
]
,
});
