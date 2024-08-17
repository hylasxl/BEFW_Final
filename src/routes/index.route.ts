import initAuthenticateRoute from "./authenticate.route"
import initBrandRoutes from "./brand.route"
import initCategoryRoutes from "./category.route"
import initOrderRoutes from "./order.route"
import initProductRoutes from "./product.route"
import initReviewRoutes from "./review.route"
import initUserRoutes from "./user.route"
import { Express } from "express"
const initRoutes = (app: Express): void => {
  initAuthenticateRoute(app)
  initBrandRoutes(app)
  initCategoryRoutes(app)
  initOrderRoutes(app)
  initProductRoutes(app)
  initReviewRoutes(app)
  initUserRoutes(app)
}

export default initRoutes
