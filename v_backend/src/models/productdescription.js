'use strict';
const {
  Model
} = require('sequelize');
module.exports = (sequelize, DataTypes) => {  class productdescription extends Model {
    static associate(models) {
      // Associations are defined in models/index.js to avoid duplicates
    }
  }  productdescription.init({
    category: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: 'maincategories',
        key: 'id'
      }
    },
    subcategory: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: 'subcategories',
        key: 'id'
      }
    },
    productname: {
      type: DataTypes.STRING,
      allowNull: false
    },
    brand: {
      type: DataTypes.STRING,
      allowNull: false
    },
    price: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: false
    },
    mrp: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: true,
      comment: 'Maximum Retail Price'
    },
    rating: {
      type: DataTypes.FLOAT,
      defaultValue: 0
    },
    description: {
      type: DataTypes.TEXT,
      allowNull: false,
      defaultValue: '',  // Set default value to empty string
      validate: {
        notNull: true   // Ensures the value is not null
      }
    },
    gst: {
      type: DataTypes.DECIMAL(5,2),
      allowNull: false,
      defaultValue: 0.00,
      comment: 'GST percentage value (e.g., 18.00 for 18%)'
    },
    gst_type: {
      type: DataTypes.ENUM('inclusive', 'exclusive'),
      allowNull: false,
      defaultValue: 'exclusive',
      comment: 'GST type: inclusive or exclusive'
    },
    size: {
      type: DataTypes.STRING,
      allowNull: true,
      defaultValue: null,
      comment: 'Comma-separated list of available sizes'
    }
  }, {
    sequelize,
    modelName: 'productdescription',
    tableName: 'productdescription',
  });
    return productdescription;
  };