'use strict';
const {
  Model
} = require('sequelize');
module.exports = (sequelize, DataTypes) => {
  class orders extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate(models) {
      // define association here
    }
  }
  orders.init({
    userid: DataTypes.INTEGER,
    paymentmode: DataTypes.STRING,
    status: DataTypes.STRING,
    address: DataTypes.TEXT,
    fullname : DataTypes.STRING,
    phonenumber : DataTypes.STRING,
    email : DataTypes.STRING,
    city : DataTypes.STRING,
    state : DataTypes.STRING,
    country : DataTypes.STRING,
    pincode : DataTypes.STRING,
    trackingid : DataTypes.STRING,
    couriercompany : DataTypes.STRING,
    rejectreason : DataTypes.STRING,
    shippingcharge: DataTypes.DECIMAL(10, 2),
    

  }, {
    sequelize,
    modelName: 'orders',
    tableName: 'orders',
  });
  return orders;
};