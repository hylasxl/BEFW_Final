// src/controllers/BrandController.ts
import { Request, Response } from "express"
import { Brand } from "../models/database/brand.model"
import redisClient from "../configs/redis.config"
import BrandMockData from "~/mocks/brand.mock.json"
const BRAND_CACHE_KEY = "brands:all"

/**
 * @swagger
 * /api/v1/brands:
 *   post:
 *     summary: Create a new brand
 *     tags: [Brands]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - name
 *               - description
 *               - website
 *             properties:
 *               name:
 *                 type: string
 *               description:
 *                 type: string
 *               website:
 *                 type: string
 *     responses:
 *       201:
 *         description: Brand created successfully
 *       400:
 *         description: Validation error
 *       500:
 *         description: Error creating brand
 */
export const createBrand = async (req: Request, res: Response) => {
  try {
    const { name, description, website } = req.body
    const newBrand = new Brand({ name, description, website })
    await newBrand.save()
    // Invalidate cache
    redisClient.del(BRAND_CACHE_KEY)
    res.status(201).json({ message: "Brand created successfully", brand: newBrand })
  } catch (error: any) {
    if (error.name === "ValidationError") {
      res.status(400).json({ message: "Validation error", errors: error.errors })
    } else {
      res.status(500).json({ message: "Error creating brand", error })
    }
  }
}

/**
 * @swagger
 * /api/v1/brands:
 *   get:
 *     summary: Get all brands
 *     tags: [Brands]
 *     responses:
 *       200:
 *         description: A list of brands
 *       500:
 *         description: Error fetching brands
 */
export const getBrands = async (req: Request, res: Response) => {
  try {
    // Check if brands are cached
    const cachedBrands = await redisClient.get(BRAND_CACHE_KEY)
    if (cachedBrands) {
      return res.status(200).json({ brands: JSON.parse(cachedBrands) })
    }
    const brands = await Brand.find()
    // Cache the brands
    redisClient.set(BRAND_CACHE_KEY, JSON.stringify(brands), "EX", 60 * 60)
    res.status(200).json({ brands })
  } catch (error) {
    res.status(500).json({ message: "Error fetching brands", error })
  }
}

/**
 * @swagger
 * /api/v1/brands/{id}:
 *   get:
 *     summary: Get brand by ID
 *     tags: [Brands]
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: string
 *         required: true
 *         description: The brand ID
 *     responses:
 *       200:
 *         description: Brand found
 *       404:
 *         description: Brand not found
 *       500:
 *         description: Error fetching brand
 */
export const getBrandById = async (req: Request, res: Response) => {
  try {
    const { id } = req.params
    const brand = await Brand.findById(id)
    if (!brand) {
      return res.status(404).json({ message: "Brand not found" })
    }
    res.status(200).json({ brand })
  } catch (error) {
    res.status(500).json({ message: "Error fetching brand", error })
  }
}

/**
 * @swagger
 * /api/v1/brands/{id}:
 *   put:
 *     summary: Update brand by ID
 *     tags: [Brands]
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: string
 *         required: true
 *         description: The brand ID
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
 *               website:
 *                 type: string
 *     responses:
 *       200:
 *         description: Brand updated successfully
 *       400:
 *         description: Validation error
 *       404:
 *         description: Brand not found
 *       500:
 *         description: Error updating brand
 */
export const updateBrand = async (req: Request, res: Response) => {
  try {
    const { id } = req.params
    const { name, description, website } = req.body
    const updatedBrand = await Brand.findByIdAndUpdate(
      id,
      { name, description, website },
      { new: true, runValidators: true }
    )
    if (!updatedBrand) {
      return res.status(404).json({ message: "Brand not found" })
    }
    // Invalidate cache
    redisClient.del(BRAND_CACHE_KEY)
    res.status(200).json({ message: "Brand updated successfully", brand: updatedBrand })
  } catch (error: any) {
    if (error.name === "ValidationError") {
      res.status(400).json({ message: "Validation error", errors: error.errors })
    } else {
      res.status(500).json({ message: "Error updating brand", error })
    }
  }
}

/**
 * @swagger
 * /api/v1/brands/{id}:
 *   delete:
 *     summary: Delete brand by ID
 *     tags: [Brands]
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: string
 *         required: true
 *         description: The brand ID
 *     responses:
 *       200:
 *         description: Brand deleted successfully
 *       404:
 *         description: Brand not found
 *       500:
 *         description: Error deleting brand
 */
export const deleteBrand = async (req: Request, res: Response) => {
  try {
    const { id } = req.params
    const deletedBrand = await Brand.findByIdAndDelete(id)
    if (!deletedBrand) {
      return res.status(404).json({ message: "Brand not found" })
    }
    // Invalidate cache
    redisClient.del(BRAND_CACHE_KEY)
    res.status(200).json({ message: "Brand deleted successfully" })
  } catch (error) {
    res.status(500).json({ message: "Error deleting brand", error })
  }
}

/**
 * @swagger
 * /api/v1/brands/bulk:
 *   post:
 *     summary: Add multiple brands from a JSON file
 *     tags: [Brands]
 *     responses:
 *       201:
 *         description: Brands added successfully
 *       500:
 *         description: Error adding brands
 */
export const addMultipleBrands = async (req: Request, res: Response) => {
  try {
    const brands = BrandMockData.map((brand) => ({
      _id: brand._id.$oid,
      name: brand.name,
      description: brand.description,
      website: brand.website
    }))
    await Brand.insertMany(brands)
    // Invalidate cache
    redisClient.del(BRAND_CACHE_KEY)
    res.status(201).json({ message: "Brands added successfully" })
  } catch (error) {
    res.status(500).json({ message: "Error adding brands", error })
  }
}
