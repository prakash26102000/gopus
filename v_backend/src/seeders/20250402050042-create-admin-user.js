'use strict';
const bcrypt = require('bcryptjs');
require('dotenv').config();

module.exports = {
  up: async (queryInterface, Sequelize) => {
    // Get the admin role id
    const [roles] = await queryInterface.sequelize.query(
      `SELECT id FROM roles WHERE name = 'admin';`
    );
    
    const adminRoleId = roles[0]?.id || 1;
    
    await queryInterface.bulkInsert('users', [
      {
        firstname: 'Admin',
        lastname: 'User',
        email: process.env.ADMIN_EMAIL || 'admin@google.com',
        password: await bcrypt.hash(process.env.ADMIN_PASSWORD || 'Admin@123', 10),
        roleid: adminRoleId,
        isactive: true,
        createdAt: new Date(),
        updatedAt: new Date()
      }
    ], {});
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.bulkDelete('users', { email: process.env.ADMIN_EMAIL || 'admin@google.com' }, {});
  }
};