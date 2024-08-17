import mongoose from "mongoose"
import axios from "axios"
import { Product } from "~/models/database/product.model"
import { connectDatabase } from "~/configs/mongoDB.config"

async function fetchImageLinks(searchQuery: string): Promise<string[]> {
  try {
    const apiKey = "AIzaSyDK6CiYKoueV5BdPwcvdgQXVLCYFZqvLso"
    const cx = "54d90d7eae3a94b48"
    const searchType = "image"

    const response = await axios.get("https://www.googleapis.com/customsearch/v1", {
      params: {
        key: apiKey,
        cx: cx,
        q: searchQuery,
        searchType: searchType
      }
    })

    return response.data.items.map((item: any) => item.link)
  } catch (error) {
    console.error("Error fetching image links:", error)
    return []
  }
}

async function updateProductImages() {
  try {
    await mongoose
      .connect("mongodb://localhost:27017/BE_FW_Final")
      .then(() => {
        console.log(`Database Connect Successfully`)
      })
      .catch((err) => {
        console.error(`Database Connection Error: ${err}`)
      })
    const products = await Product.find()

    for (const product of products) {
      const imageLinks = await fetchImageLinks(product.name)

      if (imageLinks.length > 0) {
        product.images.push(...imageLinks)
        await product.save()

        console.log(`Product ${product._id} (${product.name}) updated with ${imageLinks.length} new images.`)
      } else {
        console.log(`No images found for product ${product._id} (${product.name}).`)
      }
    }

    console.log("Product image update completed.")
  } catch (error) {
    console.error("Error updating product images:", error)
  } finally {
    await mongoose.disconnect()
  }
}

// Run the update script
updateProductImages()
