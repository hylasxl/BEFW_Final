// src/controllers/CategoryController.ts
import { Request, Response } from "express"
import { Category } from "~/models/database/category.model"
import redisClient from "~/configs/redis.config"
import CategoriesMockData from "~/mocks/category.mock.json"
const CATEGORY_CACHE_KEY = "categories:all"

/**
 * @swagger
 * /api/v1/categories:
 *   post:
 *     summary: Create a new category
 *     tags: [Categories]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - name
 *               - description
 *             properties:
 *               name:
 *                 type: string
 *               description:
 *                 type: string
 *     responses:
 *       201:
 *         description: Category created successfully
 *       400:
 *         description: Validation error
 *       500:
 *         description: Error creating category
 */
export const createCategory = async (req: Request, res: Response) => {
  try {
    const { name, description } = req.body
    const createdBy = req.user?._id
    const newCategory = new Category({ name, description, createdBy })
    await newCategory.save()
    // Invalidate cache
    redisClient.del(CATEGORY_CACHE_KEY)
    res.status(201).json({ message: "Category created successfully", category: newCategory })
  } catch (error: any) {
    if (error.name === "ValidationError") {
      res.status(400).json({ message: "Validation error", errors: error.errors })
    } else {
      res.status(500).json({ message: "Error creating category", error })
    }
  }
}

/**
 * @swagger
 * /api/v1/categories:
 *   get:
 *     summary: Get all categories
 *     tags: [Categories]
 *     responses:
 *       200:
 *         description: A list of categories
 *       500:
 *         description: Error fetching categories
 */
export const getCategories = async (req: Request, res: Response) => {
  try {
    // Check if categories are cached
    const cachedCategories = await redisClient.get(CATEGORY_CACHE_KEY)
    if (cachedCategories) {
      return res.status(200).json({ categories: JSON.parse(cachedCategories) })
    }
    const categories = await Category.find()
    // Cache the categories
    redisClient.set(CATEGORY_CACHE_KEY, JSON.stringify(categories), "EX", 60 * 60)
    res.status(200).json({ categories })
  } catch (error) {
    res.status(500).json({ message: "Error fetching categories", error })
  }
}

/**
 * @swagger
 * /api/v1/categories/{id}:
 *   get:
 *     summary: Get category by ID
 *     tags: [Categories]
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: string
 *         required: true
 *         description: The category ID
 *     responses:
 *       200:
 *         description: Category found
 *       404:
 *         description: Category not found
 *       500:
 *         description: Error fetching category
 */
export const getCategoryById = async (req: Request, res: Response) => {
  try {
    const { id } = req.params
    const category = await Category.findById(id)
    if (!category) {
      return res.status(404).json({ message: "Category not found" })
    }
    res.status(200).json({ category })
  } catch (error) {
    res.status(500).json({ message: "Error fetching category", error })
  }
}

/**
 * @swagger
 * /api/v1/categories/{id}:
 *   put:
 *     summary: Update category by ID
 *     tags: [Categories]
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: string
 *         required: true
 *         description: The category ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *               description:
 *                 type: string
 *     responses:
 *       200:
 *         description: Category updated successfully
 *       400:
 *         description: Validation error
 *       404:
 *         description: Category not found
 *       500:
 *         description: Error updating category
 */
export const updateCategory = async (req: Request, res: Response) => {
  try {
    const { id } = req.params
    const { name, description } = req.body
    const updatedCategory = await Category.findByIdAndUpdate(
      id,
      { name, description },
      { new: true, runValidators: true }
    )
    if (!updatedCategory) {
      return res.status(404).json({ message: "Category not found" })
    }
    // Invalidate cache
    redisClient.del(CATEGORY_CACHE_KEY)
    res.status(200).json({ message: "Category updated successfully", category: updatedCategory })
  } catch (error: any) {
    if (error.name === "ValidationError") {
      res.status(400).json({ message: "Validation error", errors: error.errors })
    } else {
      res.status(500).json({ message: "Error updating category", error })
    }
  }
}

/**
 * @swagger
 * /api/v1/categories/{id}:
 *   delete:
 *     summary: Delete category by ID
 *     tags: [Categories]
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: string
 *         required: true
 *         description: The category ID
 *     responses:
 *       200:
 *         description: Category deleted successfully
 *       404:
 *         description: Category not found
 *       500:
 *         description: Error deleting category
 */
export const deleteCategory = async (req: Request, res: Response) => {
  try {
    const { id } = req.params
    const deletedCategory = await Category.findByIdAndDelete(id)
    if (!deletedCategory) {
      return res.status(404).json({ message: "Category not found" })
    }
    // Invalidate cache
    redisClient.del(CATEGORY_CACHE_KEY)
    res.status(200).json({ message: "Category deleted successfully" })
  } catch (error) {
    res.status(500).json({ message: "Error deleting category", error })
  }
}

/**
 * @swagger
 * /api/v1/categories/bulk:
 *   post:
 *     summary: Add multiple categories from a JSON file
 *     tags: [Categories]
 *     responses:
 *       201:
 *         description: Categories added successfully
 *       500:
 *         description: Error adding categories
 */

export const addMultipleCategories = async (req: Request, res: Response) => {
  try {
    const categories = CategoriesMockData.map((category) => ({
      _id: category._id.$oid,
      name: category.name,
      description: category.description
    }))
    await Category.insertMany(categories)
    // Invalidate cache
    redisClient.del(CATEGORY_CACHE_KEY)
    res.status(201).json({ message: "Categories added successfully" })
  } catch (error) {
    res.status(500).json({ message: "Error adding categories", error })
  }
}
