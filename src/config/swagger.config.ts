// config/swagger.config.ts
import swaggerJsdoc from "swagger-jsdoc";

const options: swaggerJsdoc.Options = {
  definition: {
    openapi: "3.0.0",
    info: {
      title: "Product API Documentation",
      version: "1.0.0",
      description:
        "A complete REST API for product management with authentication",
    },
    servers: [
      {
        url: "https://e-commerce-api-1-fj3z.onrender.com",
        description: "Development server",
      },
      {
        url: "https://localhost:6000",
        description: "Production server",
      },
    ],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: "http",
          scheme: "bearer",
          bearerFormat: "JWT",
          description: "Enter your JWT token",
        },
      },
    },
    security: [
      {
        bearerAuth: [],
      },
    ],
  },
  apis: ["./src/routes/*.ts", "./src/controllers/*.ts"],
};

const swaggerSpec = swaggerJsdoc(options);

export default swaggerSpec;
