const express = require('express');
const router = express.Router();
const bannerController = require('../controllers/bannerController')
const upload = require('../middlewares/multerMiddleware');

//post http://localhost:3000/api/banner/createbanner
router.post('/createbanner', upload.any(), bannerController.createbanner);
//get http://localhost:3000/api/banner/getbanner
router.get('/getbanner', bannerController.getbanners);
//delete http://localhost:3000/api/banner/deletebanner/:id
router.delete('/deletebanner/:id', bannerController.deletebanner);
//put http://localhost:3000/api/banner/updatebanner/:id
router.put('/updatebanner/:id', bannerController.updatebanner);

module.exports = router;