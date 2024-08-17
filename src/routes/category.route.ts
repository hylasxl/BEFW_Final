import express, { Express } from "express"
import {
  createCategory,
  getCategories,
  getCategoryById,
  updateCategory,
  deleteCategory,
  addMultipleCategories
} from "~/controllers/category.controller"
import { authenticateJWT } from "~/middlewares/authenticate.middleware"

const router = express.Router()

const initCategoryRoutes = (app: Express) => {
  router.post("/", authenticateJWT, createCategory)
  router.get("/", getCategories)
  router.get("/:id", getCategoryById)
  router.put("/:id", authenticateJWT, updateCategory)
  router.delete("/:id", authenticateJWT, deleteCategory)
  router.post("/bulk", addMultipleCategories)
  return app.use("/api/v1/categories", router)
}

export default initCategoryRoutes
