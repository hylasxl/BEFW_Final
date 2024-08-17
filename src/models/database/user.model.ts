import { Schema, model, Document } from "mongoose"

export interface IUser extends Document {
  username: string
  email: string
  password: string
  name: string
  address?: string
  phoneNumber?: string
  gender?: "male" | "female"
  role: "customer" | "admin"
}

const userSchema = new Schema<IUser>(
  {
    username: {
      type: String,
      required: [true, "Username is required"],
      unique: true,
      minlength: [3, "Username must be at least 3 characters long"]
    },
    email: {
      type: String,
      required: [true, "Email is required"],
      unique: true,
      match: [/^\S+@\S+\.\S+$/, "Please use a valid email address"]
    },
    password: {
      type: String,
      required: [true, "Password is required"],
      minlength: [8, "Password must be at least 8 characters long"]
    },
    name: { type: String, required: [true, "Name is required"] },
    address: { type: String, required: [false, "Address is required"] },
    phoneNumber: {
      type: String,
      required: [false, "Phone number is required"],
      match: [/^\d{10,15}$/, "Phone number must be between 10 and 15 digits"]
    },
    gender: { type: String, enum: ["male", "female", "other"], required: [false, "Gender is required"] },
    role: { type: String, enum: ["customer", "admin"], default: "customer" }
  },
  { timestamps: true }
)

export const User = model<IUser>("User", userSchema)
