const db = require('./src/models');
const Product = db.productdescription;

async function checkProductsWithSizes() {
    try {
        console.log('Checking products with sizes...');
        
        // Check products that have size information
        const productsWithSizes = await Product.findAll({
            where: {
                size: {
                    [db.Sequelize.Op.ne]: null,
                    [db.Sequelize.Op.ne]: ''
                }
            },
            attributes: ['id', 'productname', 'size'],
            limit: 10
        });
        
        console.log(`Found ${productsWithSizes.length} products with sizes:`);
        productsWithSizes.forEach(product => {
            console.log(`- Product ${product.id}: "${product.productname}" - sizes: "${product.size}"`);
        });
        
        // Check all products to see size field
        const allProducts = await Product.findAll({
            attributes: ['id', 'productname', 'size'],
            limit: 10,
            order: [['id', 'DESC']]
        });
        
        console.log(`\nRecent products (last 10):`);
        allProducts.forEach(product => {
            console.log(`- Product ${product.id}: "${product.productname}" - size: "${product.size || 'NULL'}"`);
        });
        
    } catch (error) {
        console.error('Error checking products:', error);
    } finally {
        await db.sequelize.close();
    }
}

checkProductsWithSizes();