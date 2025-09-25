const express = require('express');
const router = express.Router();
const {
  createReview,
  getProductReviews,
  updateReview,
  deleteReview
} = require('../controllers/reviewController');
const { isAuthenticated, tryAuthenticate } = require('../middlewares/authMiddleware');

// Explicit public alias that always works without authentication
router.get('/public/:productId', getProductReviews);
// GET http://localhost:5001/api/reviews/public/:productId

// Get reviews for a product (public route, with optional auth context)
router.get('/:productId', tryAuthenticate, getProductReviews);
// GET http://localhost:3000/api/reviews/:productId

// Protected routes
router.post('/:productId', isAuthenticated, createReview);
// POST http://localhost:3000/api/reviews/:productId
router.put('/:reviewId', isAuthenticated, updateReview);
// PUT http://localhost:3000/api/reviews/:reviewId
router.delete('/:reviewId', isAuthenticated, deleteReview);
// DELETE http://localhost:3000/api/reviews/:reviewId
// Commented out since helpfulVotes functionality was removed
// router.post('/:reviewId/helpful', isAuthenticated, voteReviewHelpful);
// POST http://localhost:3000/api/reviews/:reviewId/helpful

module.exports = router;
