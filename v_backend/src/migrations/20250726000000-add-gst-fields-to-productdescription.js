'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.addColumn('productdescription', 'gst', {
      type: Sequelize.DECIMAL(5, 2),
      allowNull: false,
      defaultValue: 0.00,
      comment: 'GST percentage value (e.g., 18.00 for 18%)'
    });

    await queryInterface.addColumn('productdescription', 'gst_type', {
      type: Sequelize.ENUM('inclusive', 'exclusive'),
      allowNull: false,
      defaultValue: 'exclusive',
      comment: 'GST type: inclusive or exclusive'
    });
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.removeColumn('productdescription', 'gst_type');
    await queryInterface.removeColumn('productdescription', 'gst');
  }
};
