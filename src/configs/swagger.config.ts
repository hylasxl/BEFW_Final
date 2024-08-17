import { Express } from "express"
import swaggerUi from "swagger-ui-express"
import swaggerJsdoc from "swagger-jsdoc"
export const SwaggerInit = (app: Express) => {
  const options = {
    definition: {
      openapi: "3.0.0",
      info: {
        title: "Node.js TypeScript API",
        version: "1.0.0"
      },
      servers: [
        {
          url: "http://localhost:5000"
        }
      ]
    },
    apis: ["./src/controllers/*.ts", "./src/models/database/*.ts"]
  }

  const specs = swaggerJsdoc(options)
  return app.use("/api-docs", swaggerUi.serve, swaggerUi.setup(specs))
}
