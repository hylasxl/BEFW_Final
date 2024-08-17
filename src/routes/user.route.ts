import express, { Express } from "express"
import { createUser, getUser, updateUser, deleteUser, getAllUsers } from "~/controllers/user.controller"
import { authenticateJWT } from "~/middlewares/authenticate.middleware"

const router = express.Router()

const initUserRoute = (app: Express) => {
  router.post("/", authenticateJWT, createUser)
  router.get("/", authenticateJWT, getAllUsers) // Only authenticated users can create a new user
  router.get("/:id", authenticateJWT, getUser) // Only authenticated users can get user details
  router.put("/:id", authenticateJWT, updateUser) // Only authenticated users can update user details
  router.delete("/:id", authenticateJWT, deleteUser) // Only authenticated users can delete a user
  return app.use("/api/v1/users", router)
}

export default initUserRoute
