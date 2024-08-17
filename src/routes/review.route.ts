import express, { Express } from "express"
import {
  createReview,
  getReviews,
  getReviewById,
  updateReview,
  deleteReview,
  importReviews
} from "~/controllers/review.controller"
import { authenticateJWT } from "~/middlewares/authenticate.middleware"

const router = express.Router()

const initReviewRoutes = (app: Express) => {
  router.post("/", authenticateJWT, createReview)
  router.post("/import", importReviews)
  router.get("/", getReviews)
  router.get("/:id", getReviewById)
  router.put("/:id", authenticateJWT, updateReview)
  router.delete("/:id", authenticateJWT, deleteReview)
  return app.use("/api/v1/reviews", router)
}

export default initReviewRoutes
