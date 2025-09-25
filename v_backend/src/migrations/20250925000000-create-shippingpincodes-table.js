'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('shippingpincodes', {
      id: {
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
        type: Sequelize.INTEGER
      },
      pincode: {
        type: Sequelize.STRING(10),
        allowNull: false,
        unique: true
      },
      amount: {
        type: Sequelize.DECIMAL(10, 2),
        allowNull: false,
        defaultValue: 0
      },
      is_active: {
        type: Sequelize.BOOLEAN,
        allowNull: false,
        defaultValue: true
      },
      createdAt: {
        allowNull: false,
        type: Sequelize.DATE
      },
      updatedAt: {
        allowNull: false,
        type: Sequelize.DATE
      }
    });

    await queryInterface.addIndex('shippingpincodes', ['pincode'], {
      unique: true,
      name: 'uniq_shippingpincodes_pincode'
    });
    await queryInterface.addIndex('shippingpincodes', ['is_active']);
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.dropTable('shippingpincodes');
  }
};
