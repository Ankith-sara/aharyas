import express from "express"
import { addToCart, updateCart, getUserCart, removeFromCart, clearCart } from "../controllers/CartController.js"
import authUser from "../middlewares/auth.js"
import { validateCartAdd, validateCartUpdate, validateCartRemove } from "../middlewares/validate.js"
import { authenticatedLimiter } from "../middlewares/rateLimiter.js"

const cartRouter = express.Router()

cartRouter.post('/get', authUser, authenticatedLimiter, getUserCart)
cartRouter.post('/add', authUser, authenticatedLimiter, validateCartAdd, addToCart)
cartRouter.post('/update', authUser, authenticatedLimiter, validateCartUpdate, updateCart)
cartRouter.post('/remove', authUser, authenticatedLimiter, validateCartRemove, removeFromCart)
cartRouter.post('/clear', authUser, authenticatedLimiter, clearCart)

export default cartRouter