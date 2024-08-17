import express, { Express } from "express"
import {
  register,
  login,
  refreshToken,
  logout,
  protectedRoute,
  registerMultipleUsers
} from "~/controllers/authenticate.controller"
import { authenticateJWT } from "~/middlewares/authenticate.middleware"
const router = express.Router()

const initAuthenticateRoute = (app: Express) => {
  router.post("/register", register)
  router.post("/login", login)
  router.post("/token", refreshToken)
  router.post("/logout", logout)
  router.post("/register-multiple", registerMultipleUsers)
  router.get("/protected", authenticateJWT, protectedRoute)
  return app.use("/api/v1/auth", router)
}

export default initAuthenticateRoute
