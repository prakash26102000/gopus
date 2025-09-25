'use strict';
const { Model } = require('sequelize');

module.exports = (sequelize, DataTypes) => {
  class role extends Model {
    static associate(models) {
      // define associations here
      role.hasMany(models.user, { foreignKey: 'roleid' });
    }
  }
  
  role.init({
    name: {
      type: DataTypes.STRING,
      allowNull: false,
      unique: true
    },
    description: {
      type: DataTypes.STRING
    }
  }, {
    sequelize,
    modelName: 'role',
    tableName: 'roles'
  });
  
  return role;
};
