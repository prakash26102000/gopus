'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.bulkInsert('roles', [
      {
        name: 'admin',
        description: 'Administrator with full access',
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        name: 'customer',
        description: 'Regular customer with limited access',
        createdAt: new Date(),
        updatedAt: new Date()
      }
    ], {});
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.bulkDelete('roles', null, {});
  }
};