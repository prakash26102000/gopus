// src/routes/favoritesRoutes.js

const express = require("express");
const router = express.Router();
const favoritesController = require("../controllers/favoritesController");
const { isAuthenticated } = require("../middlewares/authMiddleware");

// ✅ POST: Add a product to the user's favorites
// Endpoint: POST /api/favorites/:productId
router.post("/:productId", isAuthenticated, favoritesController.addToFavorites);

// ✅ GET: Get all favorite products of the authenticated user
// Endpoint: GET /api/favorites
router.get("/", isAuthenticated, favoritesController.getUserFavorites);

// ✅ DELETE: Remove a product from the user's favorites
// Endpoint: DELETE /api/favorites/:productId
router.delete("/:productId", isAuthenticated, favoritesController.removeFromFavorites);

module.exports = router;
