  const { DataTypes } = require('sequelize');

  module.exports = (sequelize, DataTypes) => {
    const subcategory = sequelize.define('subcategory', {
      id: {
        type: DataTypes.INTEGER,
        autoIncrement: true,
        primaryKey: true
      },
      name: {
        type: DataTypes.STRING,
        allowNull: false
      },
      maincategoryid: {
        type: DataTypes.INTEGER,
        allowNull: false
      }
    }, {
      tableName: 'subcategories',
      timestamps: true
    });

    // Associations will be set up in index.js

    return subcategory;
  };
