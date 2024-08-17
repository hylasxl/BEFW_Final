import { User } from "~/models/database/user.model"

declare namespace Express {
  export interface Request {
    user?: User
  }
}
