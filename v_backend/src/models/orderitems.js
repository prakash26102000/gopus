'use strict';
const {
  Model
} = require('sequelize');
module.exports = (sequelize, DataTypes) => {
  class orderitems extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate(models) {
      // define association here
    }
  }
  orderitems.init({
    orderid: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: 'orders',
        key: 'id'
      }
    },
    productid: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: 'productdescription',
        key: 'id'
      }
    },
    quantity: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 1
    },
    priceatpurchase: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: false
    },
    selectedSize: {
      type: DataTypes.STRING,
      allowNull: true,
      comment: 'Selected size for fashion products (e.g., S, M, L, XL, 32, 34, etc.)'
    }
  }, {
    sequelize,
    modelName: 'orderitems',
    tableName: 'orderitems',
    timestamps: true
  });
  return orderitems;
};