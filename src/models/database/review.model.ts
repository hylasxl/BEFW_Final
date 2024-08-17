// src/models/Review.ts
import { Schema, model, Document } from "mongoose"

export interface IReview extends Document {
  user: Schema.Types.ObjectId
  product: Schema.Types.ObjectId
  rating: number
  comment: string
  createdBy?: Schema.Types.ObjectId
}

const reviewSchema = new Schema<IReview>(
  {
    user: { type: Schema.Types.ObjectId, ref: "User", required: [true, "User is required"] },
    product: { type: Schema.Types.ObjectId, ref: "Product", required: [true, "Product is required"] },
    rating: {
      type: Number,
      required: [true, "Rating is required"],
      min: [1, "Rating must be at least 1"],
      max: [5, "Rating must be at most 5"]
    },
    comment: {
      type: String,
      required: [true, "Comment is required"],
      minlength: [10, "Comment must be at least 10 characters long"]
    },
    createdBy: { type: Schema.Types.ObjectId, ref: "User", required: true }
  },
  { timestamps: true }
)

export const Review = model<IReview>("Review", reviewSchema)
