'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.addColumn('users', 'resetOTP', {
      type: Sequelize.STRING(6),
      allowNull: true
    });
    
    await queryInterface.addColumn('users', 'resetOTPExpires', {
      type: Sequelize.DATE,
      allowNull: true
    });
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.removeColumn('users', 'resetOTP');
    await queryInterface.removeColumn('users', 'resetOTPExpires');
  }
};