'use strict';
const { Model } = require('sequelize');
const bcrypt = require('bcryptjs');

module.exports = (sequelize, DataTypes) => {
  class user extends Model {
    static associate(models) {
      // define associations here
      // user.belongsTo(models.role, { foreignKey: 'roleid' });
      // user.hasOne(models.userprofile, { foreignKey: 'userid', as: 'profile' });
      // user.hasMany(models.productreview, { foreignKey: 'userId', as: 'reviews' });
      user.belongsTo(models.role, { foreignKey: 'roleid' });
      user.hasOne(models.userprofile, { foreignKey: 'userid', as: 'profile' });
      user.hasMany(models.productreview, { foreignKey: 'userId', as: 'reviews' });

    }

    // Method to validate password
    async comparePassword(candidatePassword) {
      return await bcrypt.compare(candidatePassword, this.password);
    }
  }

  user.init({
    firstname: {
      type: DataTypes.STRING,
      allowNull: false,
      defaultValue: "",
    },
    lastname: {
      type: DataTypes.STRING,
      allowNull: false,
      defaultValue: "",
    },
    email: {
      type: DataTypes.STRING,
      allowNull: false,
      unique: true,
      validate: {
        isEmail: true
      }
    },
    password: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    roleid: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 2, // Default role is customer
      references: {
        model: 'roles',
        key: 'id'
      }
    },
    isactive: {
      type: DataTypes.BOOLEAN,
      defaultValue: true
    },
    resetPasswordToken: {
      type: DataTypes.STRING,
      allowNull: true
    },
    resetPasswordExpires: {
      type: DataTypes.DATE,
      allowNull: true
    },
    resetOTP: {
      type: DataTypes.STRING(6),
      allowNull: true
    },
    resetOTPExpires: {
      type: DataTypes.DATE,
      allowNull: true
    }
  }, {
    sequelize,
    modelName: 'user',
    tableName: 'users',
    hooks: {
      beforeCreate: async (user) => {
        if (user.password) {
          user.password = await bcrypt.hash(user.password, 10);
        }
      },
      beforeUpdate: async (user) => {
        if (user.changed('password')) {
          user.password = await bcrypt.hash(user.password, 10);
        }
      }
    }
  });

  return user;
};
