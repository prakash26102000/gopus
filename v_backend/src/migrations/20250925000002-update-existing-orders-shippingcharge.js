'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    // Update all existing orders to have a default shippingcharge of 0
    await queryInterface.bulkUpdate('orders',
      { shippingcharge: 0 },
      { shippingcharge: null }
    );

    // Also update any orders that might have undefined shippingcharge
    await queryInterface.sequelize.query(`
      UPDATE orders
      SET shippingcharge = 0
      WHERE shippingcharge IS NULL OR shippingcharge = ''
    `);
  },

  async down(queryInterface, Sequelize) {
    // This migration is not reversible as it sets default values
    // In a real scenario, you might want to make this reversible
    console.log('Migration to add default shippingcharge values is not reversible');
  }
};
