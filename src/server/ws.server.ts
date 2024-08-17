import { configDotenv } from "dotenv"
import { WebSocketServer, WebSocket } from "ws"

configDotenv()
const initWSS = () => {
  const webSocketDefaultPort = 8080
  const WEBSOCKETPORT = Number(process.env.WEBSOCKETPORT) || webSocketDefaultPort
  const wss = new WebSocketServer({ port: WEBSOCKETPORT })
  wss.on("connection", (ws: WebSocket) => {
    console.log("New client connected")

    ws.on("message", (message: string) => {
      console.log(`Received message: ${message}`)

      wss.clients.forEach((client) => {
        if (client.readyState === WebSocket.OPEN) {
          client.send(message)
        }
      })
    })

    ws.on("close", () => {
      console.log("Client disconnected")
    })
  })
}

export default initWSS
