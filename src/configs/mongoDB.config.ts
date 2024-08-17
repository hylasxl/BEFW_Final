import mongoose from "mongoose"
import { configDotenv } from "dotenv"
configDotenv()

export const connectDatabase = async () => {
  let MONGOOSE_URI: string = ""
  let environmentType: string = "Development"
  if (process.env.NODE_ENV === "development") {
    MONGOOSE_URI = String(process.env.MONGO_CONNECTION_STRING_DEV)
    environmentType = "Development Environment"
    console.log(environmentType)
  } else if (process.env.NODE_ENV === "production") {
    environmentType = "Production Environment"
    MONGOOSE_URI = String(process.env.MONGO_CONNECTION_STRING_PRODUCTION)
    console.log(environmentType)
  }
  await mongoose
    .connect(MONGOOSE_URI)
    .then(() => {
      console.log(`${environmentType} Database Connect Successfully`)
    })
    .catch((err) => {
      console.error(`${environmentType} Database Connection Error: ${err}`)
    })
}
