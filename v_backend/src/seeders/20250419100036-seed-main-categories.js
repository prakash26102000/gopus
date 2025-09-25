'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.bulkInsert('maincategories', [
      { name: 'Electronics', createdAt: new Date(), updatedAt: new Date() },
      { name: 'Fashion', createdAt: new Date(), updatedAt: new Date() },
      { name: 'Home & Kitchen', createdAt: new Date(), updatedAt: new Date() },
      { name: 'Beauty Care', createdAt: new Date(), updatedAt: new Date() },
      { name: 'Groceries', createdAt: new Date(), updatedAt: new Date() },
      { name: 'Medical products', createdAt: new Date(), updatedAt: new Date() },
      { name: 'Stationery', createdAt: new Date(), updatedAt: new Date() },
      { name: 'Baby Products', createdAt: new Date(), updatedAt: new Date() },
      { name: 'Motors', createdAt: new Date(), updatedAt: new Date() }
    ]);
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.bulkDelete('maincategories', null, {});
  }
};
