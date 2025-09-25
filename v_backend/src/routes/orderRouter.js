const express = require("express");
const router = express.Router();

const {createOrder, getUserOrders, getAllOrders, updateOrderStatus, getUserOrderHistory, getLatestOrder, getOrderById, deleteOrder, createReview, testSizeStorage, updateOrderItemSize} = require("../controllers/orderControllers");
const {isAuthenticated} = require("../middlewares/authMiddleware")

router.post("/create", isAuthenticated, createOrder)
//post http://localhost:3000/api/orders/create
router.get("/get", isAuthenticated, getUserOrders)
//get http://localhost:3000/api/orders/get
router.get("/getall", isAuthenticated, getAllOrders)
//get http://localhost:3000/api/orders/getall
router.post("/update/:orderId", isAuthenticated, updateOrderStatus)
//post http://localhost:3000/api/orders/update/:orderId

// New routes for order history and tracking
router.get("/history", isAuthenticated, getUserOrderHistory)
//get http://localhost:3000/api/orders/history
router.get("/latest", isAuthenticated, getLatestOrder)
//get http://localhost:3000/api/orders/latest
router.get("/:orderId", isAuthenticated, getOrderById)
//get http://localhost:3000/api/orders/:orderId
router.delete("/:orderId", isAuthenticated, deleteOrder)
//delete http://localhost:3000/api/orders/:orderId
router.post('/orders/review', isAuthenticated, createReview);
router.get('/test/size-storage', isAuthenticated, testSizeStorage);
//get http://localhost:3000/api/orders/test/size-storage
router.post('/update-item-size', isAuthenticated, updateOrderItemSize);
//post http://localhost:3000/api/orders/update-item-size

module.exports = router