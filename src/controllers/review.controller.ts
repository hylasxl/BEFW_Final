// src/controllers/ReviewController.ts
import { Request, Response } from "express"
import { Review } from "~/models/database/review.model"
import redisClient from "../configs/redis.config"
import ReviewMockData from "~/mocks/review.mock.json"
import mongoose from "mongoose"
const REVIEW_CACHE_KEY = "reviews:all"

/**
 * @swagger
 * /api/v1/reviews:
 *   post:
 *     summary: Create a new review
 *     tags: [Reviews]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - product
 *               - rating
 *               - comment
 *               - createdBy
 *             properties:
 *               product:
 *                 type: string
 *                 description: The ID of the product being reviewed
 *               rating:
 *                 type: number
 *                 description: The rating given to the product
 *                 minimum: 1
 *                 maximum: 5
 *               comment:
 *                 type: string
 *                 description: The review comment
 *                 minlength: 10
 *               createdBy:
 *                 type: string
 *                 description: The ID of the user creating the review
 *     responses:
 *       201:
 *         description: Review created successfully
 *       400:
 *         description: Validation error
 *       500:
 *         description: Error creating review
 */

export const createReview = async (req: Request, res: Response) => {
  try {
    const { product, rating, comment } = req.body
    const createdBy = req.user?._id
    
    
    if (!createdBy) {
      return res.status(400).json({ message: "User not authenticated" })
    }

    const newReview = new Review({ product, rating, comment, createdBy })
    await newReview.save()
    // Invalidate cache
    redisClient.del(REVIEW_CACHE_KEY)
    res.status(201).json({ message: "Review created successfully", review: newReview })
  } catch (error: any) {
    if (error.name === "ValidationError") {
      res.status(400).json({ message: "Validation error", errors: error.errors })
    } else {
      res.status(500).json({ message: "Error creating review", error })
    }
  }
}


/**
 * @swagger
 * /api/v1/reviews:
 *   get:
 *     summary: Get all reviews
 *     tags: [Reviews]
 *     responses:
 *       200:
 *         description: A list of reviews
 *       500:
 *         description: Error fetching reviews
 */
export const getReviews = async (req: Request, res: Response) => {
  try {
    // Check if reviews are cached
    const cachedReviews = await redisClient.get(REVIEW_CACHE_KEY)
    if (cachedReviews) {
      return res.status(200).json({ reviews: JSON.parse(cachedReviews) })
    }
    const reviews = await Review.find()
    // Cache the reviews
    redisClient.set(REVIEW_CACHE_KEY, JSON.stringify(reviews), "EX", 60 * 60)
    res.status(200).json({ reviews })
  } catch (error) {
    res.status(500).json({ message: "Error fetching reviews", error })
  }
}

/**
 * @swagger
 * /api/v1/reviews/{id}:
 *   get:
 *     summary: Get review by ID
 *     tags: [Reviews]
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: string
 *         required: true
 *         description: The review ID
 *     responses:
 *       200:
 *         description: Review found
 *       404:
 *         description: Review not found
 *       500:
 *         description: Error fetching review
 */
export const getReviewById = async (req: Request, res: Response) => {
  try {
    const { id } = req.params
    const review = await Review.findById(id)
    if (!review) {
      return res.status(404).json({ message: "Review not found" })
    }
    res.status(200).json({ review })
  } catch (error) {
    res.status(500).json({ message: "Error fetching review", error })
  }
}

/**
 * @swagger
 * /api/v1/reviews/{id}:
 *   put:
 *     summary: Update review by ID
 *     tags: [Reviews]
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: string
 *         required: true
 *         description: The review ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               rating:
 *                 type: number
 *                 minimum: 1
 *                 maximum: 5
 *               comment:
 *                 type: string
 *     responses:
 *       200:
 *         description: Review updated successfully
 *       400:
 *         description: Validation error
 *       404:
 *         description: Review not found
 *       500:
 *         description: Error updating review
 */
export const updateReview = async (req: Request, res: Response) => {
  try {
    const { id } = req.params
    const { rating, comment } = req.body
    const updatedReview = await Review.findByIdAndUpdate(id, { rating, comment }, { new: true, runValidators: true })
    if (!updatedReview) {
      return res.status(404).json({ message: "Review not found" })
    }
    // Invalidate cache
    redisClient.del(REVIEW_CACHE_KEY)
    res.status(200).json({ message: "Review updated successfully", review: updatedReview })
  } catch (error: any) {
    if (error.name === "ValidationError") {
      res.status(400).json({ message: "Validation error", errors: error.errors })
    } else {
      res.status(500).json({ message: "Error updating review", error })
    }
  }
}

/**
 * @swagger
 * /api/v1/reviews/{id}:
 *   delete:
 *     summary: Delete review by ID
 *     tags: [Reviews]
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: string
 *         required: true
 *         description: The review ID
 *     responses:
 *       200:
 *         description: Review deleted successfully
 *       404:
 *         description: Review not found
 *       500:
 *         description: Error deleting review
 */
export const deleteReview = async (req: Request, res: Response) => {
  try {
    const { id } = req.params
    const deletedReview = await Review.findByIdAndDelete(id)
    if (!deletedReview) {
      return res.status(404).json({ message: "Review not found" })
    }
    // Invalidate cache
    redisClient.del(REVIEW_CACHE_KEY)
    res.status(200).json({ message: "Review deleted successfully" })
  } catch (error) {
    res.status(500).json({ message: "Error deleting review", error })
  }
}

/**
 * @swagger
 * /api/v1/reviews/import:
 *   post:
 *     summary: Import multiple reviews from JSON
 *     tags: [Reviews]
 *     responses:
 *       200:
 *         description: Reviews imported successfully
 *       500:
 *         description: Error importing reviews
 */
export const importReviews = async () => {
  try {
    // Transform the reviewsData to match your Review model
    const reviewsToInsert = ReviewMockData.map((review) => {
      return {
        _id: new mongoose.Types.ObjectId(review._id.$oid), // Convert ObjectId from JSON to Mongoose ObjectId
        product: new mongoose.Types.ObjectId(review.product), // Ensure product is ObjectId
        user: new mongoose.Types.ObjectId(review.user), // Ensure user is ObjectId
        rating: review.rating,
        comment: review.comment
      }
    })

    // Insert multiple reviews at once
    const insertedReviews = await Review.insertMany(reviewsToInsert)
  } catch (error) {
    console.error("Error importing reviews:", error)
  }
}
