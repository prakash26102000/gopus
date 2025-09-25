'use strict';
const { Model } = require('sequelize');

module.exports = (sequelize, DataTypes) => {
  class ProductReview extends Model {
    static associate(models) {
      ProductReview.belongsTo(models.productdescription, {
        foreignKey: 'productId',
        as: 'product',
        onDelete: 'CASCADE'
      });

      ProductReview.belongsTo(models.user, {
        foreignKey: 'userId',
        as: 'user',
        onDelete: 'CASCADE'
      });
      
    }
  }

  ProductReview.init({
    userId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: 'users',
        key: 'id'
      },
      validate: {
        notNull: { msg: 'User ID is required' },
        notEmpty: { msg: 'User ID cannot be empty' }
      }
    },
    productId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: 'productdescription',
        key: 'id'
      },
      validate: {
        notNull: { msg: 'Product ID is required' },
        notEmpty: { msg: 'Product ID cannot be empty' }
      }
    },
    rating: {
      type: DataTypes.INTEGER,
      allowNull: false,
      validate: {
        notNull: { msg: 'Rating is required' },
        min: {
          args: [1],
          msg: 'Rating must be at least 1'
        },
        max: {
          args: [5],
          msg: 'Rating cannot be more than 5'
        }
      }
    },
    reviewText: {
      type: DataTypes.TEXT,
      allowNull: true
    },
    title: {
      type: DataTypes.STRING,
      allowNull: true
    },
    verifiedPurchase: {
      type: DataTypes.BOOLEAN,
      defaultValue: false
    }
  }, {
    sequelize,
    modelName: 'productreview',
    tableName: 'productreviews'
  });

  return ProductReview;
};
