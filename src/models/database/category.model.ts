// src/models/Category.ts
import { Schema, model, Document } from "mongoose"

export interface ICategory extends Document {
  name: string
  description: string
}

const categorySchema = new Schema<ICategory>(
  {
    name: {
      type: String,
      required: [true, "Name is required"],
      minlength: [3, "Name must be at least 3 characters long"]
    },
    description: { type: String, required: [true, "Description is required"] }
  },
  { timestamps: true }
)

export const Category = model<ICategory>("Category", categorySchema)
