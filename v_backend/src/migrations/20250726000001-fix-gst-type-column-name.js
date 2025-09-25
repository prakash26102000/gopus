'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    // First, remove the gst_type column if it exists (from the previous failed migration)
    try {
      await queryInterface.removeColumn('productdescription', 'gst_type');
    } catch (error) {
      console.log('gst_type column did not exist, continuing...');
    }

    // Then rename gstType to gst_type
    try {
      await queryInterface.renameColumn('productdescription', 'gstType', 'gst_type');
    } catch (error) {
      console.log('Failed to rename column, it might not exist. Creating new column...');
      // If renaming fails, add the new column
      await queryInterface.addColumn('productdescription', 'gst_type', {
        type: Sequelize.ENUM('inclusive', 'exclusive'),
        allowNull: false,
        defaultValue: 'exclusive'
      });
    }
  },

  async down(queryInterface, Sequelize) {
    // Revert back to original name
    await queryInterface.renameColumn('productdescription', 'gst_type', 'gstType');
  }
};
