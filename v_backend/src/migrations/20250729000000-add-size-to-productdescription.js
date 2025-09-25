'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.addColumn('productdescription', 'size', {
      type: Sequelize.STRING,
      allowNull: true,
      defaultValue: null,
      comment: 'Comma-separated list of available sizes'
    });
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.removeColumn('productdescription', 'size');
  }
};
