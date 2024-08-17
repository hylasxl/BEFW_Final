// src/models/Product.ts
import { Schema, model, Document } from "mongoose"

export interface IProduct extends Document {
  name: string
  description: string
  price: number
  category: Schema.Types.ObjectId
  brand: Schema.Types.ObjectId
  stock: number
  images: string[]
  createdBy: Schema.Types.ObjectId
}

const productSchema = new Schema<IProduct>(
  {
    name: {
      type: String,
      required: [true, "Name is required"],
      minlength: [3, "Name must be at least 3 characters long"]
    },
    description: { type: String, required: [true, "Description is required"] },
    price: { type: Number, required: [true, "Price is required"], min: [0, "Price must be a positive number"] },
    category: { type: Schema.Types.ObjectId, ref: "Category", required: [true, "Category is required"] },
    brand: { type: Schema.Types.ObjectId, ref: "Brand", required: [true, "Brand is required"] },
    stock: { type: Number, required: [true, "Stock is required"], min: [0, "Stock must be a positive number"] },
    images: {
      type: [String],
      required: [true, "At least one image is required"],
      validate: [(val: string[]) => val.length > 0, "At least one image is required"]
    },
    createdBy: { type: Schema.Types.ObjectId, ref: "User", required: false }
  },
  { timestamps: true }
)

export const Product = model<IProduct>("Product", productSchema)
