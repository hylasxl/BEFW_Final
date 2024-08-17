// src/controllers/ProductController.ts
import { Request, Response } from "express"
import { Product } from "~/models/database/product.model"
import redisClient from "~/configs/redis.config"
import ProductMockData from "~/mocks/product.mock.json"
import mongoose from "mongoose"
import multer from "multer"
import cloudinary from "~/configs/cloudinary.config"
import { v4 as uuidv4 } from "uuid"

// Configure Multer to store files in memory
const storage = multer.memoryStorage()
const upload = multer({
  storage: storage,
  limits: { fileSize: 50 * 1024 * 1024 } // 50 MB limit
})
const PRODUCT_CACHE_KEY = "products:all"

/**
 * @openapi
 * /api/v1/products:
 *   post:
 *     summary: Create a new product
 *     tags:
 *       - Products
 *     requestBody:
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *                 example: "Sample Product"
 *               description:
 *                 type: string
 *                 example: "This is a sample product."
 *               price:
 *                 type: number
 *                 format: float
 *                 example: 19.99
 *               category:
 *                 type: string
 *                 example: "Electronics"
 *               brand:
 *                 type: string
 *                 example: "BrandX"
 *               stock:
 *                 type: integer
 *                 example: 100
 *               images:
 *                 type: array
 *                 items:
 *                   type: string
 *                   format: binary
 *                 description: Array of image files
 *       required: true
 *     responses:
 *       201:
 *         description: Product created successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "Product created successfully"
 *                 product:
 *                   $ref: '#/components/schemas/Product'
 *       400:
 *         description: Validation error
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                 errors:
 *                   type: object
 *       500:
 *         description: Error creating product
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                 error:
 *                   type: string
 */
export const createProduct = async (req: Request, res: Response) => {
  try {
    const { name, description, price, category, brand, stock } = req.body
    const images = req.files as Express.Multer.File[] // Get files from the request

    // Upload images to Cloudinary
    const uploadPromises = images.map(
      (file) =>
        new Promise<string>((resolve, reject) => {
          cloudinary.v2.uploader
            .upload_stream({ resource_type: "image" }, (error, result) => {
              if (error) {
                reject(error)
              } else {
                resolve(result?.secure_url || "")
              }
            })
            .end(file.buffer)
        })
    )

    const imageUrls = await Promise.all(uploadPromises)

    const createdBy = req.user?._id
    const newProduct = new Product({
      name,
      description,
      price,
      category,
      brand,
      stock,
      images: imageUrls,
      createdBy
    })

    await newProduct.save()

    // Invalidate cache
    redisClient.del(PRODUCT_CACHE_KEY)
    res.status(201).json({ message: "Product created successfully", product: newProduct })
  } catch (error: any) {
    if (error.name === "ValidationError") {
      res.status(400).json({ message: "Validation error", errors: error.errors })
    } else {
      res.status(500).json({ message: "Error creating product", error })
    }
  }
}

/**
 * @openapi
 * /api/v1/products:
 *   get:
 *     summary: Get all products
 *     tags:
 *       - Products
 *     responses:
 *       200:
 *         description: A list of products
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 products:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/Product'
 *       500:
 *         description: Error fetching products
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                 error:
 *                   type: string
 */
export const getProducts = async (req: Request, res: Response) => {
  try {
    // Check if products are cached
    const cachedProducts = await redisClient.get(PRODUCT_CACHE_KEY)
    if (cachedProducts) {
      return res.status(200).json({ products: JSON.parse(cachedProducts) })
    }
    const products = await Product.find()
    // Cache the products
    redisClient.set(PRODUCT_CACHE_KEY, JSON.stringify(products), "EX", 60 * 60)
    res.status(200).json({ products })
  } catch (error) {
    res.status(500).json({ message: "Error fetching products", error })
  }
}

/**
 * @openapi
 * /api/v1/products/{id}:
 *   get:
 *     summary: Get product by ID
 *     tags:
 *       - Products
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: string
 *         required: true
 *         description: The product ID
 *     responses:
 *       200:
 *         description: Product found
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 product:
 *                   $ref: '#/components/schemas/Product'
 *       404:
 *         description: Product not found
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *       500:
 *         description: Error fetching product
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                 error:
 *                   type: string
 */
export const getProductById = async (req: Request, res: Response) => {
  try {
    const { id } = req.params
    const product = await Product.findById(id)
    if (!product) {
      return res.status(404).json({ message: "Product not found" })
    }
    res.status(200).json({ product })
  } catch (error) {
    res.status(500).json({ message: "Error fetching product", error })
  }
}
/**
 * @openapi
 * /api/v1/products/{id}:
 *   put:
 *     summary: Update product by ID
 *     tags:
 *       - Products
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: string
 *         required: true
 *         description: The product ID
 *     requestBody:
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *                 example: "Updated Product Name"
 *               description:
 *                 type: string
 *                 example: "Updated product description."
 *               price:
 *                 type: number
 *                 format: float
 *                 example: 29.99
 *               categoryId:
 *                 type: string
 *                 example: "categoryId123"
 *               brandId:
 *                 type: string
 *                 example: "brandId123"
 *               stock:
 *                 type: integer
 *                 example: 150
 *               images:
 *                 type: array
 *                 items:
 *                   type: string
 *                   format: binary
 *                   description: Array of image files to upload
 *     responses:
 *       200:
 *         description: Product updated successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "Product updated successfully"
 *                 product:
 *                   $ref: '#/components/schemas/Product'
 *       400:
 *         description: Validation error
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                 errors:
 *                   type: object
 *       404:
 *         description: Product not found
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *       500:
 *         description: Error updating product
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                 error:
 *                   type: string
 */
export const updateProduct = async (req: Request, res: Response) => {
  try {
    const { id } = req.params
    const { name, description, price, categoryId, brandId, stock } = req.body
    const images = req.files as Express.Multer.File[] // Get files from the request

    // Get the existing product
    const existingProduct = await Product.findById(id)
    if (!existingProduct) {
      return res.status(404).json({ message: "Product not found" })
    }

    // Handle image upload if provided
    let imageUrls: string[] = existingProduct.images || []

    if (images && Array.isArray(images) && images.length > 0) {
      // Upload new images to Cloudinary
      const uploadPromises = images.map(
        (file) =>
          new Promise<string>((resolve, reject) => {
            cloudinary.v2.uploader
              .upload_stream({ resource_type: "image" }, (error, result) => {
                if (error) {
                  reject(error)
                } else {
                  resolve(result?.secure_url || "")
                }
              })
              .end(file.buffer)
          })
      )

      const newImageUrls = await Promise.all(uploadPromises)
      imageUrls = [...imageUrls, ...newImageUrls]
    }

    // Update the product
    const updatedProduct = await Product.findByIdAndUpdate(
      id,
      {
        name,
        description,
        price,
        categoryId,
        brandId,
        stock,
        images: imageUrls.length > 0 ? imageUrls : existingProduct.images
      },
      { new: true, runValidators: true }
    )

    if (!updatedProduct) {
      return res.status(404).json({ message: "Product not found" })
    }

    // Invalidate cache
    redisClient.del(PRODUCT_CACHE_KEY)

    res.status(200).json({ message: "Product updated successfully", product: updatedProduct })
  } catch (error: any) {
    if (error.name === "ValidationError") {
      res.status(400).json({ message: "Validation error", errors: error.errors })
    } else {
      res.status(500).json({ message: "Error updating product", error })
    }
  }
}

/**
 * @openapi
 * /api/v1/products/{id}:
 *   delete:
 *     summary: Delete product by ID
 *     tags:
 *       - Products
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: string
 *         required: true
 *         description: The product ID
 *     responses:
 *       200:
 *         description: Product deleted successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "Product deleted successfully"
 *       404:
 *         description: Product not found
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *       500:
 *         description: Error deleting product
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                 error:
 *                   type: string
 */
export const deleteProduct = async (req: Request, res: Response) => {
  try {
    const { id } = req.params
    const deletedProduct = await Product.findByIdAndDelete(id)
    if (!deletedProduct) {
      return res.status(404).json({ message: "Product not found" })
    }
    // Invalidate cache
    redisClient.del(PRODUCT_CACHE_KEY)
    res.status(200).json({ message: "Product deleted successfully" })
  } catch (error) {
    res.status(500).json({ message: "Error deleting product", error })
  }
}

/**
 * @openapi
 * /api/v1/products/import:
 *   post:
 *     summary: Import multiple products from a JSON file
 *     tags:
 *       - Products
 *     responses:
 *       200:
 *         description: Products imported successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "Products imported successfully"
 *                 products:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/Product'
 *       400:
 *         description: Validation error
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                 errors:
 *                   type: object
 *       500:
 *         description: Error importing products
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                 error:
 *                   type: string
 */
export const importProducts = async (req: Request, res: Response) => {
  try {
    const createdProducts = []

    for (const productData of ProductMockData) {
      const { name, price, category, brand, stock, images, createdBy, description } = productData

      const newProduct = new Product({
        _id: new mongoose.Types.ObjectId(productData._id.$oid),
        name,
        price,
        category,
        brand,
        stock,
        images,
        createdBy,
        description
      })

      try {
        const savedProduct = await newProduct.save()
        createdProducts.push(savedProduct)
      } catch (error: any) {
        if (error.name === "ValidationError") {
          return res.status(400).json({ message: "Validation error", errors: error.errors })
        }
        console.error(`Error saving product ${name}:`, error)
      }
    }

    redisClient.del(PRODUCT_CACHE_KEY)

    res.status(200).json({ message: "Products imported successfully", products: createdProducts })
  } catch (error) {
    res.status(500).json({ message: "Error importing products", error })
  }
}

/**
 * @openapi
 * components:
 *   schemas:
 *     Product:
 *       type: object
 *       properties:
 *         _id:
 *           type: string
 *           example: "605c72ef6d7f1c001f64b1c1"
 *         name:
 *           type: string
 *           example: "Sample Product"
 *         description:
 *           type: string
 *           example: "This is a sample product."
 *         price:
 *           type: number
 *           format: float
 *           example: 19.99
 *         category:
 *           type: string
 *           example: "Electronics"
 *         brand:
 *           type: string
 *           example: "BrandX"
 *         stock:
 *           type: integer
 *           example: 100
 *         images:
 *           type: array
 *           items:
 *             type: string
 *             format: uri
 *           example: ["https://example.com/image1.jpg", "https://example.com/image2.jpg"]
 *         createdBy:
 *           type: string
 *           example: "userId123"
 *         createdAt:
 *           type: string
 *           format: date-time
 *           example: "2024-08-17T14:30:00Z"
 *         updatedAt:
 *           type: string
 *           format: date-time
 *           example: "2024-08-17T15:00:00Z"
 */
