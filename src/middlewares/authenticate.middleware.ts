import { Request, Response, NextFunction } from "express"
import jwt, { JwtPayload } from "jsonwebtoken"
import { config } from "dotenv"

config()

export const authenticateJWT = (req: Request, res: Response, next: NextFunction) => {
  const token = req.cookies.accessToken

  if (token) {
    jwt.verify(token, process.env.JWT_ACCESS_TOKEN_SECRET!, (err: any, user: any) => {
      if (err) {
        return res.status(403).json({ message: "Forbidden" })
      }
      req.user = user as JwtPayload & { _id: string }
      next()
    })
  } else {
    res.status(401).json({ message: "Unauthorized" })
  }
}
