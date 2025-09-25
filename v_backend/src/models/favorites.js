'use strict';

module.exports = (sequelize, DataTypes) => {
  const favorites = sequelize.define('favorites', {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true
    },
    userId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      field: 'userId' // Maps to the 'userid' column in the database
    },
    productId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      field: 'productId' // Maps to the 'productid' column in the database
    }
  }, {
    tableName: 'favorites',
    timestamps: true
  });

  favorites.associate = function(models) {
    favorites.belongsTo(models.user, {
      foreignKey: 'userId',
      as: 'favoritedUser'
    });

    favorites.belongsTo(models.productdescription, {
      foreignKey: 'productId',
      as: 'product'
    });
  };

  return favorites;
};
