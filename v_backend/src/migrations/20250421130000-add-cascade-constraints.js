'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    // Temporarily disable foreign key checks
    await queryInterface.sequelize.query('SET FOREIGN_KEY_CHECKS=0;');

    try {
      // Get all tables information to identify foreign keys
      const [tables] = await queryInterface.sequelize.query(`
        SELECT TABLE_NAME 
        FROM INFORMATION_SCHEMA.TABLES 
        WHERE TABLE_SCHEMA = '${queryInterface.sequelize.config.database}';
      `);
      
      // For each table, get foreign key constraints
      for (const table of tables) {
        const tableName = table.TABLE_NAME;
        
        // Get the foreign key constraints
        const [constraints] = await queryInterface.sequelize.query(`
          SELECT CONSTRAINT_NAME, TABLE_NAME, COLUMN_NAME, REFERENCED_TABLE_NAME, REFERENCED_COLUMN_NAME
          FROM INFORMATION_SCHEMA.KEY_COLUMN_USAGE
          WHERE TABLE_SCHEMA = '${queryInterface.sequelize.config.database}'
            AND TABLE_NAME = '${tableName}'
            AND REFERENCED_TABLE_NAME IS NOT NULL;
        `);
        
        // Update each foreign key to include ON DELETE CASCADE
        for (const constraint of constraints) {
          console.log(`Updating foreign key: ${constraint.CONSTRAINT_NAME} on table ${tableName}`);
          
          // Drop the existing constraint
          await queryInterface.sequelize.query(`
            ALTER TABLE \`${tableName}\`
            DROP FOREIGN KEY \`${constraint.CONSTRAINT_NAME}\`;
          `).catch(error => {
            console.error(`Error dropping constraint ${constraint.CONSTRAINT_NAME}:`, error.message);
          });
          
          // Recreate with CASCADE
          await queryInterface.sequelize.query(`
            ALTER TABLE \`${tableName}\`
            ADD CONSTRAINT \`${constraint.CONSTRAINT_NAME}\`
            FOREIGN KEY (\`${constraint.COLUMN_NAME}\`) 
            REFERENCES \`${constraint.REFERENCED_TABLE_NAME}\`(\`${constraint.REFERENCED_COLUMN_NAME}\`)
            ON DELETE CASCADE;
          `).catch(error => {
            console.error(`Error adding constraint ${constraint.CONSTRAINT_NAME}:`, error.message);
          });
        }
      }

      console.log('All foreign keys updated to include ON DELETE CASCADE');
    } finally {
      // Re-enable foreign key checks
      await queryInterface.sequelize.query('SET FOREIGN_KEY_CHECKS=1;');
    }
  },

  down: async (queryInterface, Sequelize) => {
    // No down migration provided as it would be complex to determine original state
    // If needed, create a backup before running this migration
    console.log('No down migration provided. Please restore from backup if needed.');
  }
};
