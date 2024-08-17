import express, { Express } from "express"
import { configDotenv } from "dotenv"
import { connectDatabase } from "./configs/mongoDB.config"

import redisClient from "./configs/redis.config"
import initRoutes from "./routes/index.route"
import { SwaggerInit } from "./configs/swagger.config"
import { errorHandler } from "./middlewares/errorHandler.middleware"
import cookieParser from "cookie-parser"
import path from "path"
import initWSS from "./server/ws.server"
import cors from "cors"

configDotenv()

const defaultPort = 5000
const webSocketDefaultPort = 8080
const PORT = process.env.PORT || defaultPort
const WEBSOCKETPORT = Number(process.env.WEBSOCKETPORT) || webSocketDefaultPort
const app: Express = express()
app.use(express.json({ limit: "50mb" }))
app.use(express.urlencoded({ limit: "50mb", extended: true }))
app.use(errorHandler)
app.use(cookieParser())
app.use(express.static(path.join(__dirname, "public")))
const corsOptions = {
  origin: "http://localhost:3000",
  methods: ["GET", "POST", "PUT", "DELETE"],
  credentials: true
}

app.use(cors(corsOptions))

initRoutes(app)
SwaggerInit(app)

app.listen(PORT, () => {
  connectDatabase()

  redisClient.on("connect", () => {
    console.log("Connected to Redis")
  })

  redisClient.on("error", (err) => {
    console.error("Redis error: ", err)
  })

  console.log(`Server is listening on port: ${PORT}`)
  initWSS()
  console.log(`WebSocket Server is listening on port: ${WEBSOCKETPORT}`)
})
