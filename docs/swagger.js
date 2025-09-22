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
    './docs/swaggerTags/*.js',
  ],
});