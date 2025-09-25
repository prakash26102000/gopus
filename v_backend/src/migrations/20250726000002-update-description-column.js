'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    // First, update any null descriptions to empty string
    await queryInterface.sequelize.query(`
      UPDATE productdescription 
      SET description = '' 
      WHERE description IS NULL
    `);

    // Then modify the column to not allow nulls and set default
    await queryInterface.changeColumn('productdescription', 'description', {
      type: Sequelize.TEXT,
      allowNull: false,
      defaultValue: ''
    });
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.changeColumn('productdescription', 'description', {
      type: Sequelize.TEXT,
      allowNull: true
    });
  }
};
