import Redis from "ioredis"
import dotenv from "dotenv"

dotenv.config()

const redis = new Redis({
  host: process.env.REDIS_HOST || "127.0.0.1",
  port: Number(process.env.REDIS_PORT) || 16676,
  password: process.env.REDIS_PASSWORD || undefined
})

async function flushRedis() {
  try {
    await redis.flushdb()
    console.log("All keys deleted from Redis database")
    process.exit(0)
  } catch (error) {
    console.error("Error flushing Redis database:", error)
    process.exit(1)
  }
}

flushRedis()
