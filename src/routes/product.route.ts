import express, { Express } from "express"
import multer from "multer"
import {
  createProduct,
  getProducts,
  getProductById,
  updateProduct,
  deleteProduct,
  importProducts
} from "~/controllers/product.controller" // Adjust the path as necessary
import { authenticateJWT } from "~/middlewares/authenticate.middleware" // Adjust the path as necessary

// Configure Multer to store files in memory
const storage = multer.memoryStorage()
const upload = multer({
  storage: storage,
  limits: { fileSize: 50 * 1024 * 1024 } // 50 MB limit
})

const router = express.Router()

const initProductRoutes = (app: Express) => {
  // Route for creating a product with image upload
  router.post("/", authenticateJWT, upload.array("images"), createProduct)

  // Route for updating a product with image upload
  router.put("/:id", authenticateJWT, upload.array("images"), updateProduct)

  // Other routes
  router.post("/import", importProducts)
  router.get("/", getProducts)
  router.get("/:id", getProductById)
  router.delete("/:id", authenticateJWT, deleteProduct)

  return app.use("/api/v1/products", router)
}

export default initProductRoutes
