import { Request, Response, NextFunction } from "express"
import redis from "~/configs/redis.config"

export const cache = (req: Request, res: Response, next: NextFunction) => {
  const key = req.originalUrl
  redis.get(key, (err, data) => {
    if (err) throw err
    if (data != null) {
      res.send(JSON.parse(data))
    } else {
      next()
    }
  })
}
