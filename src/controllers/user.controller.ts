// src/controllers/UserController.ts
import { Request, Response } from "express"
import bcrypt from "bcryptjs"
import { User } from "~/models/database/user.model"
import redisClient from "../configs/redis.config"

const CACHE_EXPIRATION = 60 * 5 // Cache expiration time in seconds (5 minutes)

/**
 * @swagger
 * /api/v1/users:
 *   get:
 *     summary: Retrieve a list of all users
 *     tags: [Users]
 *     responses:
 *       200:
 *         description: Users retrieved successfully
 *       500:
 *         description: Error retrieving users
 */
export const getAllUsers = async (req: Request, res: Response) => {
  try {
    // Check cache first
    const cachedUsers = await redisClient.get("users")
    if (cachedUsers) {
      return res.status(200).json({ message: "Users retrieved from cache", users: JSON.parse(cachedUsers) })
    }

    // If not in cache, get from database
    const users = await User.find()

    // Update cache
    await redisClient.set("users", JSON.stringify(users), "EX", CACHE_EXPIRATION)

    res.status(200).json({ message: "Users retrieved successfully", users })
  } catch (error) {
    res.status(500).json({ message: "Error retrieving users", error })
  }
}

/**
 * @swagger
 * /api/v1/users:
 *   post:
 *     summary: Create a new user
 *     tags: [Users]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - username
 *               - password
 *               - email
 *             properties:
 *               username:
 *                 type: string
 *               password:
 *                 type: string
 *               email:
 *                 type: string
 *               gender:
 *                 type: string
 *               age:
 *                 type: number
 *               name:
 *                 type: string
 *               address:
 *                 type: string
 *               role:
 *                 type: string
 *     responses:
 *       201:
 *         description: User created successfully
 *       500:
 *         description: Error creating user
 */
export const createUser = async (req: Request, res: Response) => {
  try {
    const { username, password, email, gender, age, name, address, role } = req.body
    const hashedPassword = await bcrypt.hash(password, 10)
    const newUser = new User({ username, password: hashedPassword, email, gender, age, name, address, role })
    await newUser.save()

    // Update cache
    await redisClient.set(`user:${newUser._id}`, JSON.stringify(newUser))

    res.status(201).json({ message: "User created successfully", user: newUser })
  } catch (error) {
    res.status(500).json({ message: "Error creating user", error })
  }
}

/**
 * @swagger
 * /api/v1/users/{id}:
 *   get:
 *     summary: Retrieve a user by ID
 *     tags: [Users]
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: string
 *         required: true
 *         description: The user ID
 *     responses:
 *       200:
 *         description: User retrieved successfully
 *       404:
 *         description: User not found
 *       500:
 *         description: Error retrieving user
 */
export const getUser = async (req: Request, res: Response) => {
  const userId = req.params.id
  try {
    // Check cache first
    const cachedUser = await redisClient.get(`user:${userId}`)
    if (cachedUser) {
      return res.status(200).json({ message: "User retrieved from cache", user: JSON.parse(cachedUser) })
    }

    // If not in cache, get from database
    const user = await User.findById(userId)
    if (!user) {
      return res.status(404).json({ message: "User not found" })
    }

    // Update cache
    await redisClient.set(`user:${userId}`, JSON.stringify(user))

    res.status(200).json({ message: "User retrieved successfully", user })
  } catch (error) {
    res.status(500).json({ message: "Error retrieving user", error })
  }
}

/**
 * @swagger
 * /api/v1/users/{id}:
 *   put:
 *     summary: Update a user by ID
 *     tags: [Users]
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: string
 *         required: true
 *         description: The user ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               password:
 *                 type: string
 *               gender:
 *                 type: string
 *               age:
 *                 type: number
 *               name:
 *                 type: string
 *               address:
 *                 type: string
 *               role:
 *                 type: string
 *     responses:
 *       200:
 *         description: User updated successfully
 *       404:
 *         description: User not found
 *       500:
 *         description: Error updating user
 */
export const updateUser = async (req: Request, res: Response) => {
  const userId = req.params.id
  const { password, ...updates } = req.body

  try {
    if (password) {
      updates.password = await bcrypt.hash(password, 10)
    }

    const updatedUser = await User.findByIdAndUpdate(userId, updates, { new: true })
    if (!updatedUser) {
      return res.status(404).json({ message: "User not found" })
    }

    // Update cache
    await redisClient.set(`user:${userId}`, JSON.stringify(updatedUser))

    res.status(200).json({ message: "User updated successfully", user: updatedUser })
  } catch (error) {
    res.status(500).json({ message: "Error updating user", error })
  }
}

/**
 * @swagger
 * /api/v1/users/{id}:
 *   delete:
 *     summary: Delete a user by ID
 *     tags: [Users]
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: string
 *         required: true
 *         description: The user ID
 *     responses:
 *       200:
 *         description: User deleted successfully
 *       404:
 *         description: User not found
 *       500:
 *         description: Error deleting user
 */
export const deleteUser = async (req: Request, res: Response) => {
  const userId = req.params.id
  try {
    const deletedUser = await User.findByIdAndDelete(userId)
    if (!deletedUser) {
      return res.status(404).json({ message: "User not found" })
    }

    // Remove from cache
    await redisClient.del(`user:${userId}`)

    res.status(200).json({ message: "User deleted successfully", user: deletedUser })
  } catch (error) {
    res.status(500).json({ message: "Error deleting user", error })
  }
}
