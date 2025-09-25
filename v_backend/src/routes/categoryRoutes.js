const express = require('express');
const router = express.Router();
const categoryController = require('../controllers/categoryController');

router.post('/subcategories', categoryController.createSubCategories);
router.get('/subcategories/', categoryController.getsub);
router.get('/categories', categoryController.getcat);
router.put('/subcategories/:id', categoryController.updatesubcategory);
router.delete('/subcategories/:id', categoryController.deletesubcategory);
router.delete('/categories/:id', categoryController.deletemaincategory);


module.exports = router;


//post http://localhost:3000/api/subcategories
//get http://localhost:3000/api/categories
//get http://localhost:3000/api/subcategories
//get http://localhost:3000/api/subcategories/{id}
//put http://localhost:3000/api/subcategories/{id}
//delete http://localhost:3000/api/subcategories/{id}