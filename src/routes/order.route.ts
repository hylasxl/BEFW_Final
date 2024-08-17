import express, { Express } from "express"
import {
  createOrder,
  getOrders,
  getOrderById,
  updateOrder,
  deleteOrder,
  importOrders,
  getOrdersByUserId
} from "~/controllers/order.controller"
import { authenticateJWT } from "~/middlewares/authenticate.middleware"

const router = express.Router()

const initOrderRoutes = (app: Express) => {
  router.post("/", authenticateJWT, createOrder)
  router.post("/import", importOrders)
  router.get("/", authenticateJWT, getOrders)
  router.get("/:id", authenticateJWT, getOrderById)
  router.put("/:id", authenticateJWT, updateOrder)
  router.delete("/:id", authenticateJWT, deleteOrder)
  router.get("/user/:userId", getOrdersByUserId)

  return app.use("/api/v1/orders", router)
}

export default initOrderRoutes
