import express, { Express } from "express"
import {
  createBrand,
  getBrands,
  getBrandById,
  updateBrand,
  deleteBrand,
  addMultipleBrands
} from "~/controllers/brand.controller"
import { authenticateJWT } from "~/middlewares/authenticate.middleware"

const router = express.Router()

const initBrandRoutes = (app: Express) => {
  router.post("/", authenticateJWT, createBrand)
  router.post("/bulk", addMultipleBrands)
  router.get("/", getBrands)
  router.get("/:id", getBrandById)
  router.put("/:id", authenticateJWT, updateBrand)
  router.delete("/:id", authenticateJWT, deleteBrand)
  return app.use("/api/v1/brands", router)
}

export default initBrandRoutes
