import express from "express"
import { addToCart, updateCart, getUserCart, removeFromCart, clearCart, mergeCartData } from "./CartController.js"
import authUser from "../../middlewares/auth.js"
import { validateCartAdd, validateCartUpdate, validateCartRemove } from "../../middlewares/validate.js"
import { authenticatedLimiter } from "../../middlewares/rateLimiter.js"

const cartRouter = express.Router()

cartRouter.post('/get', authUser, authenticatedLimiter, getUserCart)
cartRouter.post('/add', authUser, authenticatedLimiter, validateCartAdd, addToCart)
cartRouter.post('/update', authUser, authenticatedLimiter, validateCartUpdate, updateCart)
cartRouter.post('/remove', authUser, authenticatedLimiter, validateCartRemove, removeFromCart)
cartRouter.post('/clear', authUser, authenticatedLimiter, clearCart)
cartRouter.post('/merge', authUser, authenticatedLimiter, mergeCartData)

export default cartRouter
