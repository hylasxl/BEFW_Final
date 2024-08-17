import { Request, Response } from "express"
import bcrypt from "bcryptjs"
import jwt from "jsonwebtoken"
import { config } from "dotenv"
import { User } from "~/models/database/user.model"
import redisClient from "../configs/redis.config"
import UsersMockData from "../mocks/user.mock.json"
import mongoose from "mongoose"
config()

const generateAccessToken = (username: string): string => {
  return jwt.sign({ username }, process.env.JWT_ACCESS_TOKEN_SECRET!, {
    expiresIn: process.env.JWT_ACCESS_TOKEN_EXPIRATION
  })
}

const generateRefreshToken = (username: string): string => {
  const refreshToken = jwt.sign({ username }, process.env.JWT_REFRESH_TOKEN_SECRET!, {
    expiresIn: process.env.JWT_REFRESH_TOKEN_EXPIRATION
  })
  redisClient.sadd("refreshTokens", refreshToken)
  return refreshToken
}

/**
 * @swagger
 * /api/v1/auth/register:
 *   post:
 *     summary: Register a new user
 *     tags: [Authenticated]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
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
 *         description: User registered successfully
 *       500:
 *         description: Error registering user
 */
export const register = async (req: Request, res: Response) => {
  try {
    const { username, password, email, gender, age, name, address, role } = req.body
    const hashedPassword = await bcrypt.hash(password, 10)
    const newUser = new User({ username, password: hashedPassword, email, gender, age, name, address, role })
    await newUser.save()
    res.status(201).json({ message: "User registered successfully", user: newUser })
  } catch (error) {
    res.status(500).json({ message: "Error registering user", error })
  }
}

/**
 * @swagger
 * /api/v1/auth/login:
 *   post:
 *     summary: Log in a user
 *     tags: [Authenticated]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               username:
 *                 type: string
 *               password:
 *                 type: string
 *     responses:
 *       200:
 *         description: Logged in successfully
 *       401:
 *         description: Invalid credentials
 *       500:
 *         description: Error logging in
 */
export const login = async (req: Request, res: Response) => {
  try {
    const { username, password } = req.body
    const user = await User.findOne({ username })
    if (user && (await bcrypt.compare(password, user.password))) {
      const accessToken = generateAccessToken(username)
      const refreshToken = generateRefreshToken(username)
      res.cookie("accessToken", accessToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "strict",
        maxAge: 15 * 60 * 1000
      })
      res.cookie("refreshToken", refreshToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "strict",
        maxAge: 30 * 24 * 60 * 60 * 1000 // 30 days
      })
      res.json({ message: "Logged in successfully", user })
    } else {
      res.status(401).json({ message: "Invalid credentials" })
    }
  } catch (error) {
    res.status(500).json({ message: "Error logging in", error })
  }
}

/**
 * @swagger
 * /api/v1/auth/refresh-token:
 *   post:
 *     summary: Refresh access token
 *     tags: [Authenticated]
 *     responses:
 *       200:
 *         description: Access token refreshed
 *       401:
 *         description: Token is required
 *       403:
 *         description: Invalid or expired refresh token
 *       500:
 *         description: Error refreshing token
 */
export const refreshToken = (req: Request, res: Response) => {
  const token = req.cookies.refreshToken
  if (!token) return res.status(401).json({ message: "Token is required" })

  redisClient.sismember("refreshTokens", token, (err, reply) => {
    if (err || reply !== 1) return res.status(403).json({ message: "Invalid refresh token" })

    jwt.verify(token, process.env.JWT_REFRESH_TOKEN_SECRET!, (err: any, user: any) => {
      if (err || typeof user === "undefined") return res.status(403).json({ message: "Token is invalid or expired" })

      const { username } = user
      const newAccessToken = generateAccessToken(username)
      res.cookie("accessToken", newAccessToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "strict",
        maxAge: 15 * 60 * 1000 // 15 minutes
      })
      res.json({ message: "Access token refreshed" })
    })
  })
}

/**
 * @swagger
 * /api/v1/auth/logout:
 *   post:
 *     summary: Log out a user
 *     tags: [Authenticated]
 *     responses:
 *       200:
 *         description: Logged out successfully
 *       500:
 *         description: Error logging out
 */
export const logout = (req: Request, res: Response) => {
  const token = req.cookies.refreshToken
  redisClient.srem("refreshTokens", token, (err, reply) => {
    if (err) return res.status(500).json({ message: "Error logging out", error: err })
    res.clearCookie("accessToken")
    res.clearCookie("refreshToken")
    res.status(200).json({ message: "Logged out successfully" })
  })
}

/**
 * @swagger
 * /api/v1/auth/protected:
 *   get:
 *     summary: Access a protected route
 *     tags: [Authenticated]
 *     responses:
 *       200:
 *         description: This is a protected route
 */
export const protectedRoute = (req: Request, res: Response) => {
  res.json({ message: "This is a protected route", user: req.user })
}

/**
 * @swagger
 * /api/v1/auth/register-multiple:
 *   post:
 *     summary: Register multiple users from a JSON file
 *     tags: [Authenticated]
 *     responses:
 *       201:
 *         description: Users registered successfully
 *       500:
 *         description: Error registering users
 */
export const registerMultipleUsers = async (req: Request, res: Response) => {
  try {
    const registeredUsers = []

    for (const user of UsersMockData) {
      const { _id, username, password, email, gender, name, address, role } = user

      // Ensure all required fields are present
      if (!username || !password || !email || !gender || !name) {
        console.error(`Missing required fields in user: ${JSON.stringify(user)}`)
        continue // Skip this user and proceed with the next one
      }

      // Generate a unique _id if not provided
      const userId = _id.$oid || new mongoose.Types.ObjectId()

      const hashedPassword = await bcrypt.hash(password, 10)
      const newUser = new User({
        _id: userId,
        username,
        password: hashedPassword,
        email,
        gender,
        name,
        address,
        role
      })

      try {
        await newUser.save()
        registeredUsers.push(newUser)
      } catch (error) {
        console.error(`Error saving user ${username}:`, error)
        continue // Skip this user and proceed with the next one
      }
    }

    if (registeredUsers.length > 0) {
      res.status(201).json({ message: "Users registered successfully", users: registeredUsers })
    } else {
      res.status(400).json({ message: "No users were registered due to errors" })
    }
  } catch (error: any) {
    console.error("Error registering users:", error)
    res.status(500).json({ message: "Error registering users", error: error.message })
  }
}
