'use strict';
/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('productdescription', {
      id: {
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
        type: Sequelize.INTEGER
      },
      category: {
        type: Sequelize.INTEGER,
        allowNull: true,
        references: {
          model: 'maincategories',
          key: 'id'
        }
      },
      subcategory: {
        type: Sequelize.INTEGER,
        allowNull: true,
        references: {
          model: 'subcategories',
          key: 'id'
        }
      },
      productname: {
        type: Sequelize.STRING
      },
      brand: {
        type: Sequelize.STRING
      },
      price: {
        type: Sequelize.DECIMAL
      },
      rating: {
        type: Sequelize.FLOAT
      },
      description: {
        type: Sequelize.TEXT,
        allowNull: false,
        defaultValue: ''
      },
      gstType: {
        type: Sequelize.ENUM('inclusive', 'exclusive'),
        allowNull: false,
        defaultValue: 'exclusive',
        comment: 'GST type: inclusive or exclusive'
      },
      gst: {
        type: Sequelize.DECIMAL(5,2),
        allowNull: false,
        defaultValue: 0.00,
        comment: 'GST percentage value (e.g., 18.00 for 18%)'
      },
      createdAt: {
        allowNull: false,
        type: Sequelize.DATE
      },
      updatedAt: {
        allowNull: false,
        type: Sequelize.DATE
      }
    });
  },
  async down(queryInterface, Sequelize) {
    await queryInterface.dropTable('productdescription');
    await queryInterface.sequelize.query('DROP TYPE IF EXISTS "enum_productdescription_gstType";');
  }
};