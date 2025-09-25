const express = require("express");
const router = express.Router();
const cartController = require("../controllers/cartController");
const { isAuthenticated } = require('../middlewares/authMiddleware');


router.post("/add",isAuthenticated,cartController.addToCart);
//post http://localhost:3000/api/cart/add
router.post("/remove",isAuthenticated,cartController.removeFromCart);
//post http://localhost:3000/api/cart/remove
router.post("/update",isAuthenticated,cartController.updateCart);
//post http://localhost:3000/api/cart/update
router.get("/get",isAuthenticated,cartController.getCart);
//get http://localhost:3000/api/cart/get
router.get("/test",cartController.testCart);
//get http://localhost:3000/api/cart/test

module.exports = router;