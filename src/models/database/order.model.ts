// src/models/Order.ts
import { Schema, model, Document } from "mongoose"

export interface IOrder extends Document {
  user: Schema.Types.ObjectId
  products: { product: Schema.Types.ObjectId; quantity: number }[]
  total: number
  status: "pending" | "shipped" | "delivered" | "canceled"
  shippingAddress: string
  paymentMethod: string
  createdBy?: Schema.Types.ObjectId
}

const orderSchema = new Schema<IOrder>(
  {
    user: { type: Schema.Types.ObjectId, ref: "User", required: [true, "User is required"] },
    products: [
      {
        product: { type: Schema.Types.ObjectId, ref: "Product", required: [true, "Product is required"] },
        quantity: { type: Number, required: [true, "Quantity is required"], min: [1, "Quantity must be at least 1"] }
      }
    ],
    total: { type: Number, required: [true, "Total is required"], min: [0, "Total must be a positive number"] },
    status: { type: String, enum: ["pending", "shipped", "delivered", "canceled"], default: "pending" },
    shippingAddress: { type: String, required: [true, "Shipping address is required"] },
    paymentMethod: { type: String, required: [true, "Payment method is required"] },
    createdBy: { type: Schema.Types.ObjectId, ref: "User", required: false }
  },
  { timestamps: true }
)

export const Order = model<IOrder>("Order", orderSchema)
