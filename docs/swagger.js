// /docs/swagger.js
import swaggerJSDoc from 'swagger-jsdoc';
import swaggerUi from 'swagger-ui-express';

const swaggerDefinition = {
  openapi: '3.0.0',
  info: {
    title: 'eGest API',
    version: '1.0.0',
    description: 'Documentação da API do eGest',
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
  security: [
    {
      bearerAuth: [],
    },
  ],
};

const options = {
  swaggerDefinition,
  apis: ['./routes/*.js'], // Caminho para os arquivos com comentários Swagger
};

const swaggerSpec = swaggerJSDoc(options);

export { swaggerUi, swaggerSpec };