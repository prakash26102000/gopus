const { user, productreview, orders, orderitems } = require('../models');
const { Op } = require('sequelize');

exports.createReview = async (req, res) => {
    try {
        console.log('createReview called');
        console.log('req.body:', req.body);
        console.log('req.params:', req.params);
        console.log('req.user:', req.user);
        
        const { rating, reviewText, title } = req.body;
        const { productId } = req.params;
        const userId = req.user.id;

        // Validate required fields
        if (!rating || !reviewText) {
            return res.status(400).json({ message: 'Rating and review text are required' });
        }

        if (rating < 1 || rating > 5) {
            return res.status(400).json({ message: 'Rating must be between 1 and 5' });
        }

        // Check if user has already reviewed this product
        const existingReview = await productreview.findOne({
            where: { userId, productId }
        });

        if (existingReview) {
            return res.status(400).json({ message: 'You have already reviewed this product' });
        }

        // Check if user has purchased the product
        const verifiedPurchase = await orders.findOne({
            where: {
                userid: userId,
                status: 'delivered'
            },
            include: [{
                model: orderitems,
                as: 'orderItems',
                where: { productid: productId }
            }]
        });

        // Create the review
        const review = await productreview.create({
            userId,
            productId,
            rating,
            reviewText,
            title,
            verifiedPurchase: !!verifiedPurchase
        });

        return res.status(201).json({
            message: 'Review created successfully',
            review
        });
    } catch (error) {
        console.error('Error creating review:', error);
        return res.status(500).json({ message: 'Failed to create review' });
    }
};

exports.getProductReviews = async (req, res) => {
    try {
        const { productId } = req.params;
        const { page = 1, limit = 10, sort = 'newest' } = req.query;

        const offset = (page - 1) * limit;
        let order = [['createdAt', 'DESC']]; // default sort by newest

        if (sort === 'rating') {
            order = [['rating', 'DESC']];
        }

        const reviews = await productreview.findAndCountAll({
            where: { productId },
            include: [
                {
                    model: user,
                    as: 'user',
                    attributes: ['id', 'firstname', 'lastname', 'email']
                }
            ],
            order,
            limit: parseInt(limit),
            offset: parseInt(offset)
        });

        return res.json({
            reviews: reviews.rows,
            total: reviews.count,
            totalPages: Math.ceil(reviews.count / limit),
            currentPage: parseInt(page)
        });
    } catch (error) {
        console.error('Error fetching reviews:', error);
        return res.status(500).json({ message: 'Failed to fetch reviews' });
    }
};

exports.updateReview = async (req, res) => {
    try {
        const { reviewId } = req.params;
        const { rating, reviewText, title } = req.body;
        const userId = req.user.id;

        const review = await productreview.findByPk(reviewId);
        if (!review) {
            return res.status(404).json({ message: 'Review not found' });
        }

        if (review.userId !== userId) {
            return res.status(403).json({ message: 'Unauthorized to update this review' });
        }

        await review.update({
            rating,
            reviewText,
            title
        });

        return res.json({
            message: 'Review updated successfully',
            review
        });
    } catch (error) {
        console.error('Error updating review:', error);
        return res.status(500).json({ message: 'Failed to update review' });
    }
};

exports.deleteReview = async (req, res) => {
    try {
        const { reviewId } = req.params;
        const userId = req.user.id;

        const review = await productreview.findByPk(reviewId);
        if (!review) {
            return res.status(404).json({ message: 'Review not found' });
        }

        if (review.userId !== userId) {
            return res.status(403).json({ message: 'Unauthorized to delete this review' });
        }

        await review.destroy();

        return res.json({ message: 'Review deleted successfully' });
    } catch (error) {
        console.error('Error deleting review:', error);
        return res.status(500).json({ message: 'Failed to delete review' });
    }
};

// Commented out since helpfulVotes field was removed
// exports.voteReviewHelpful = async (req, res) => {
//     try {
//         const { reviewId } = req.params;
        
//         const review = await productreview.findByPk(reviewId);
//         if (!review) {
//             return res.status(404).json({ message: 'Review not found' });
//         }

//         await review.increment('helpfulVotes');

//         return res.json({
//             message: 'Vote recorded successfully',
//             helpfulVotes: review.helpfulVotes + 1
//         });
//     } catch (error) {
//         console.error('Error voting for review:', error);
//         return res.status(500).json({ message: 'Failed to record vote' });
//     }
// };

