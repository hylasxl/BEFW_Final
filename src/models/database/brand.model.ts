// src/models/Brand.ts
import { Schema, model, Document } from "mongoose"

export interface IBrand extends Document {
  name: string
  description: string
  website?: string
}

const brandSchema = new Schema<IBrand>(
  {
    name: {
      type: String,
      required: [true, "Name is required"],
      unique: true,
      minlength: [3, "Name must be at least 3 characters long"]
    },
    description: { type: String, required: [true, "Description is required"] },
    website: {
      type: String,
      required: [false, "Website is required"],
      match: [/^https?:\/\/[^\s$.?#].[^\s]*$/, "Please enter a valid URL"]
    }
  },
  { timestamps: true }
)

export const Brand = model<IBrand>("Brand", brandSchema)
