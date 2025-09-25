'use strict';
const { Model } = require('sequelize');

module.exports = (sequelize, DataTypes) => {
  class ShippingPincode extends Model {
    static associate(models) {
      // No associations currently
    }
  }

  ShippingPincode.init(
    {
      pincode: {
        type: DataTypes.STRING(10),
        allowNull: false,
        unique: true,
        validate: {
          notNull: { msg: 'Pincode is required' },
          notEmpty: { msg: 'Pincode cannot be empty' },
          is: {
            args: [/^\d{6}$/],
            msg: 'Pincode must be exactly 6 digits'
          }
        }
      },
      amount: {
        type: DataTypes.DECIMAL(10, 2),
        allowNull: false,
        validate: {
          notNull: { msg: 'Amount is required' },
          isDecimal: { msg: 'Amount must be a number' },
          min: 0
        }
      },
      is_active: {
        type: DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: true
      }
    },
    {
      sequelize,
      modelName: 'shippingpincode',
      tableName: 'shippingpincodes'
    }
  );

  return ShippingPincode;
};
