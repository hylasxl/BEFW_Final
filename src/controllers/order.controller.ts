// src/controllers/OrderController.ts
import { Request, Response } from "express"
import { Order } from "~/models/database/order.model"
import { Product } from "~/models/database/product.model"
import redisClient from "../configs/redis.config"
import OrderMockData from "~/mocks/order.mock.json"
const ORDER_CACHE_KEY = "orders:all"
const ORDER_CACHE_KEY_PREFIX = "orders:user:"

/**
 * @swagger
 * /api/v1/orders/user/{userId}:
 *   get:
 *     summary: Get orders by user ID
 *     tags: [Orders]
 *     parameters:
 *       - in: path
 *         name: userId
 *         schema:
 *           type: string
 *         required: true
 *         description: The user ID
 *     responses:
 *       200:
 *         description: A list of orders for the specified user
 *       404:
 *         description: No orders found for this user
 *       500:
 *         description: Error fetching orders
 */
export const getOrdersByUserId = async (req: Request, res: Response) => {
  try {
    const { userId } = req.params
    const cacheKey = `${ORDER_CACHE_KEY_PREFIX}${userId}`
    console.log(userId)
    // Check if orders are cached
    const cachedOrders = await redisClient.get(cacheKey)
    if (cachedOrders) {
      return res.status(200).json({ orders: JSON.parse(cachedOrders) })
    }

    const orders = await Order.find({ user: userId }).exec()

    if (!orders.length) {
      return res.status(404).json({ message: "No orders found for this user" })
    }

    // Cache the orders
    redisClient.set(cacheKey, JSON.stringify(orders), "EX", 60 * 60)

    res.status(200).json({ orders })
  } catch (error) {
    res.status(500).json({ message: "Error fetching orders", error })
  }
}
/**
 * @swagger
 * /api/v1/orders:
 *   post:
 *     summary: Create a new order
 *     tags: [Orders]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - user
 *               - products
 *               - total
 *               - shippingAddress
 *               - paymentMethod
 *             properties:
 *               user:
 *                 type: string
 *               products:
 *                 type: array
 *                 items:
 *                   type: object
 *               total:
 *                 type: number
 *               shippingAddress:
 *                 type: string
 *               paymentMethod:
 *                 type: string
 *     responses:
 *       201:
 *         description: Order created successfully
 *       400:
 *         description: Validation error
 *       500:
 *         description: Error creating order
 */
export const createOrder = async (req: Request, res: Response) => {
  try {
    const { user, products, total, shippingAddress, paymentMethod } = req.body
    const createdBy = user // Assuming user is authenticated and _id is available

    if (!createdBy) {
      return res.status(400).json({ message: "User ID is required" })
    }

    // Decrease stock for each product
    for (const item of products) {
      const product = await Product.findById(item.product)

      if (!product) {
        return res.status(400).json({ message: `Product not found for ID: ${item.product}` })
      }

      if (product.stock < item.quantity) {
        return res.status(400).json({ message: `Insufficient stock for product: ${product.name}` })
      }

      product.stock -= item.quantity
      await product.save()
    }

    const newOrder = new Order({ user, products, total, shippingAddress, paymentMethod, createdBy })
    await newOrder.save()

    // Invalidate cache
    redisClient.del(ORDER_CACHE_KEY)

    res.status(201).json({ message: "Order created successfully", order: newOrder })
  } catch (error: any) {
    if (error.name === "ValidationError") {
      res.status(400).json({ message: "Validation error", errors: error.errors })
    } else {
      res.status(500).json({ message: "Error creating order", error })
    }
  }
}

/**
 * @swagger
 * /api/v1/orders:
 *   get:
 *     summary: Get all orders
 *     tags: [Orders]
 *     responses:
 *       200:
 *         description: A list of orders
 *       500:
 *         description: Error fetching orders
 */
export const getOrders = async (req: Request, res: Response) => {
  try {
    // Check if orders are cached
    const cachedOrders = await redisClient.get(ORDER_CACHE_KEY)
    if (cachedOrders) {
      return res.status(200).json({ orders: JSON.parse(cachedOrders) })
    }
    const orders = await Order.find()
    // Cache the orders
    redisClient.set(ORDER_CACHE_KEY, JSON.stringify(orders), "EX", 60 * 60)
    res.status(200).json({ orders })
  } catch (error) {
    res.status(500).json({ message: "Error fetching orders", error })
  }
}

/**
 * @swagger
 * /api/v1/orders/{id}:
 *   get:
 *     summary: Get order by ID
 *     tags: [Orders]
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: string
 *         required: true
 *         description: The order ID
 *     responses:
 *       200:
 *         description: Order found
 *       404:
 *         description: Order not found
 *       500:
 *         description: Error fetching order
 */
export const getOrderById = async (req: Request, res: Response) => {
  try {
    const { id } = req.params
    const order = await Order.findById(id)
    if (!order) {
      return res.status(404).json({ message: "Order not found" })
    }
    res.status(200).json({ order })
  } catch (error) {
    res.status(500).json({ message: "Error fetching order", error })
  }
}

/**
 * @swagger
 * /api/v1/orders/{id}:
 *   put:
 *     summary: Update order by ID
 *     tags: [Orders]
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: string
 *         required: true
 *         description: The order ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               products:
 *                 type: array
 *                 items:
 *                   type: object
 *               total:
 *                 type: number
 *               shippingAddress:
 *                 type: string
 *               paymentMethod:
 *                 type: string
 *     responses:
 *       200:
 *         description: Order updated successfully
 *       400:
 *         description: Validation error
 *       404:
 *         description: Order not found
 *       500:
 *         description: Error updating order
 */
export const updateOrder = async (req: Request, res: Response) => {
  try {
    const { id } = req.params
    const { products, total, shippingAddress, paymentMethod } = req.body
    const updatedOrder = await Order.findByIdAndUpdate(
      id,
      { products, total, shippingAddress, paymentMethod },
      { new: true, runValidators: true }
    )
    if (!updatedOrder) {
      return res.status(404).json({ message: "Order not found" })
    }
    // Invalidate cache
    redisClient.del(ORDER_CACHE_KEY)
    res.status(200).json({ message: "Order updated successfully", order: updatedOrder })
  } catch (error: any) {
    if (error.name === "ValidationError") {
      res.status(400).json({ message: "Validation error", errors: error.errors })
    } else {
      res.status(500).json({ message: "Error updating order", error })
    }
  }
}

/**
 * @swagger
 * /api/v1/orders/{id}:
 *   delete:
 *     summary: Delete order by ID
 *     tags: [Orders]
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: string
 *         required: true
 *         description: The order ID
 *     responses:
 *       200:
 *         description: Order deleted successfully
 *       404:
 *         description: Order not found
 *       500:
 *         description: Error deleting order
 */
export const deleteOrder = async (req: Request, res: Response) => {
  try {
    const { id } = req.params
    const deletedOrder = await Order.findByIdAndDelete(id)
    if (!deletedOrder) {
      return res.status(404).json({ message: "Order not found" })
    }
    // Invalidate cache
    redisClient.del(ORDER_CACHE_KEY)
    res.status(200).json({ message: "Order deleted successfully" })
  } catch (error) {
    res.status(500).json({ message: "Error deleting order", error })
  }
}

/**
 * @swagger
 * /api/v1/orders/import:
 *   post:
 *     summary: Import multiple orders
 *     tags: [Orders]
 *     responses:
 *       201:
 *         description: Orders imported successfully
 *       400:
 *         description: Validation error
 *       500:
 *         description: Error importing orders
 */
export const importOrders = async (req: Request, res: Response) => {
  try {
    const orderInstances = []

    // Iterate through each order in the mock data
    for (const order of OrderMockData) {
      const products = order.products
      let total = 0

      // Fetch prices for each product and calculate the total
      for (const item of products) {
        const product = await Product.findById(item.product)
        if (product) {
          total += product.price * item.quantity // Calculate total price
        } else {
          return res.status(400).json({ message: `Product not found for ID: ${item.product}` })
        }
      }

      // Create the order instance with total price
      orderInstances.push({
        _id: order._id.$oid,
        user: order.user,
        products: order.products,
        shippingAddress: order.shippingAddress,
        paymentMethod: order.paymentMethod,
        status: order.status,
        total // Add total to the order instance
      })
    }

    // Insert all orders into the database
    await Order.insertMany(orderInstances)

    // Invalidate cache
    redisClient.del(ORDER_CACHE_KEY)
    res.status(201).json({ message: "Orders imported successfully", orders: orderInstances })
  } catch (error: any) {
    if (error.name === "ValidationError") {
      res.status(400).json({ message: "Validation error", errors: error.errors })
    } else {
      res.status(500).json({ message: "Error importing orders", error })
    }
  }
}
