const { DataTypes, Model } = require('sequelize');

module.exports = (sequelize) => {
  const maincategory = sequelize.define('maincategory', {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true
    },
    name: {
      type: DataTypes.STRING,
      allowNull: false
    }
  }, {
    tableName: 'maincategories',
    timestamps: true
  });
  
  return maincategory;
};
