import { Redis, RedisOptions } from "ioredis"
import { configDotenv } from "dotenv"
configDotenv()

const redisConfig: RedisOptions = {
  host: process.env.REDIS_HOST || "127.0.0.1",
  port: Number(process.env.REDIS_PORT) || 16676,
  password: process.env.REDIS_PASSWORD || undefined
}

const redisClient = new Redis(redisConfig)

export default redisClient
