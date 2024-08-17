import mongoose from "mongoose"
import { Product } from "~/models/database/product.model"

async function removeAllDemoImages() {
  try {
    await mongoose
      .connect("mongodb://localhost:27017/BE_FW_Final")
      .then(() => {
        console.log(`Database Connect Successfully`)
      })
      .catch((err) => {
        console.error(`Database Connection Error: ${err}`)
      })
    console.log("Database connected successfully")

    const products = await Product.find()

    let updatedCount = 0

    for (const product of products) {
      const originalLength = product.images.length
      product.images = product.images.filter((image) => image !== "http://demo.jpg")

      if (product.images.length < originalLength) {
        await product.save()
        console.log(`Removed all instances of "http://demo.jpg" from product ${product._id} (${product.name}).`)
        updatedCount++
      } else {
        console.log(`No instances of "http://demo.jpg" found in product ${product._id} (${product.name}).`)
      }
    }

    console.log(`Image removal process completed. ${updatedCount} products were updated.`)
  } catch (error) {
    console.error("Error removing demo images:", error)
  } finally {
    await mongoose.disconnect()
  }
}

removeAllDemoImages()
