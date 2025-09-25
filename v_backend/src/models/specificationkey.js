'use strict';
const {
  Model
} = require('sequelize');
module.exports = (sequelize, DataTypes) => {
  class specificationkey extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate(models) {
      // define association here
    }
  }
  specificationkey.init({
    category: DataTypes.STRING,
    subcategory: DataTypes.STRING,
    keyname: DataTypes.STRING
  }, {
    sequelize,
    modelName: 'specificationkey',
    tableName: 'specificationkeys',
  });
  return specificationkey;
};