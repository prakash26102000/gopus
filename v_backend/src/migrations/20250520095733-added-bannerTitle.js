'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.addColumn('banners', 'bannertitle', {
      type: Sequelize.STRING,
      allowNull: true,
    });
    
    // Add isactive column if not already added
    await queryInterface.addColumn('banners', 'isactive', {
      type: Sequelize.BOOLEAN,
      allowNull: false,
      defaultValue: false
    }).catch(error => {
      // If column already exists, this will catch the error and continue
      console.log('isactive column might already exist:', error.message);
    });
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.removeColumn('banners', 'bannertitle');
    await queryInterface.removeColumn('banners', 'isactive').catch(error => {
      console.log('Could not remove isactive column:', error.message);
    });
  }
};
