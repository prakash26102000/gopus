'use strict';
const {
  Model
} = require('sequelize');
module.exports = (sequelize, DataTypes) => {
  class productimage extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate(models) {
      // define association here
    }
  }
  productimage.init({
    productid: DataTypes.INTEGER,
    imageurl: DataTypes.STRING,
    ordernumber: DataTypes.INTEGER
  }, {
    sequelize,
    modelName: 'productimage',
    tableName: 'productimages',
  });
  return productimage;
};