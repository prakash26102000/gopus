'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.addColumn('orders', 'fullname', {
      type: Sequelize.STRING,
      allowNull: true,
    });
    await queryInterface.addColumn('orders', 'phonenumber', {
      type: Sequelize.STRING,
      allowNull: true,
    });
    await queryInterface.addColumn('orders', 'email', {
      type: Sequelize.STRING,
      allowNull: true,
    });
    await queryInterface.addColumn('orders', 'city', {
      type: Sequelize.STRING,
      allowNull: true,
    });
    await queryInterface.addColumn('orders', 'state', {
      type: Sequelize.STRING,
      allowNull: true,
    });
    await queryInterface.addColumn('orders', 'country', {
      type: Sequelize.STRING,
      allowNull: true,
    });
    await queryInterface.addColumn('orders', 'pincode', {
      type: Sequelize.STRING,
      allowNull: true,
    });
    await queryInterface.addColumn('orders', 'trackingid', {
      type: Sequelize.STRING,
      allowNull: true,
    });
    await queryInterface.addColumn('orders', 'couriercompany', {
      type: Sequelize.STRING,
      allowNull: true,
    });
    await queryInterface.addColumn('orders', 'rejectreason', {
      type: Sequelize.STRING,
      allowNull: true,
    });
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.removeColumn('orders', 'fullname');
    await queryInterface.removeColumn('orders', 'phonenumber');
    await queryInterface.removeColumn('orders', 'email');
    await queryInterface.removeColumn('orders', 'city');
    await queryInterface.removeColumn('orders', 'state');
    await queryInterface.removeColumn('orders', 'country');
    await queryInterface.removeColumn('orders', 'pincode');
    await queryInterface.removeColumn('orders', 'trackingid');
    await queryInterface.removeColumn('orders', 'couriercompany');
    await queryInterface.removeColumn('orders', 'rejectreason');
  }
};
