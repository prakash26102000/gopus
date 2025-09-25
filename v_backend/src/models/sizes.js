'use strict';
const {
  Model
} = require('sequelize');

module.exports = (sequelize, DataTypes) => {
  class sizes extends Model {
    static associate(models) {
      // Associations are defined in models/index.js to avoid duplicates
    }
  }
  
  sizes.init({
    product_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: 'productdescription',
        key: 'id'
      }
    },
    size_type: {
      type: DataTypes.ENUM('clothing', 'shoes', 'weight', 'custom'),
      allowNull: false,
      comment: 'Type of size: clothing (S,M,L), shoes (4,5,6), weight (kg), or custom'
    },
    size_value: {
      type: DataTypes.STRING,
      allowNull: false,
      comment: 'The actual size value (e.g., "M", "42", "2.5kg")'
    },
    display_order: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 0,
      comment: 'Order in which sizes should be displayed'
    },
    is_available: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: true,
      comment: 'Whether this size is currently available'
    },
    price: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: true,
      comment: 'Price for this specific size (if different from base product price)'
    },
    mrp: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: true,
      comment: 'MRP for this specific size (if different from base product MRP)'
    },
    price_modifier_type: {
      type: DataTypes.ENUM('fixed', 'percentage', 'none'),
      allowNull: false,
      defaultValue: 'none',
      comment: 'How price is calculated: fixed price, percentage of base price, or use base price'
    },
    price_modifier_value: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: true,
      comment: 'Value for price calculation (fixed amount or percentage)'
    }
  }, {
    sequelize,
    modelName: 'sizes',
    tableName: 'sizes',
    timestamps: true
  });
  
  return sizes;
};