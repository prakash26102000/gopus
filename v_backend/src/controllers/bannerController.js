const db = require('../models');  // Import the db object
const Banner = db.banner;  // Get the banner model from db object

exports.createbanner = async (req, res) => {
  try {
    if (!req.files || req.files.length === 0) {
      return res.status(400).json({ error: 'No images uploaded' });
    }

    const bannersData = req.files.map((file, index) => ({
      bannerimageurl: `banners/${file.filename}`,
      ordernumber: index + 1,
      bannertitle: req.body.bannerTitle
    }));

    const createdBanners = await Banner.bulkCreate(bannersData);

    return res.status(201).json({ 
      success: true,
      message: 'Banners uploaded successfully', 
      data: createdBanners 
    });
  } catch (error) {
    console.error('Error uploading banners:', error);
    return res.status(500).json({ 
      success: false,
      error: 'Banner upload failed', 
      details: error.message 
    });
  }
};

exports.getbanners = async(req,res)=>{
  try{
    const getbanner = await Banner.findAll({
      order: [
        ['isactive', 'DESC'], // Active banners first
        ['ordernumber', 'ASC'], // Then by order number
        ['createdAt', 'DESC'] // Then by creation date (newest first)
      ]
    });
    
    if(!getbanner || getbanner.length === 0){
      return res.status(200).json({
        success: true,
        message: "No banners found",
        data: []
      });
    }
    
    return res.status(200).json({
      success: true,
      message: "Banners fetched successfully", 
      data: getbanner
    });
  } catch(error){
    console.error('Error fetching banners:', error);
    return res.status(500).json({ 
      success: false,
      error: 'Failed to fetch banners', 
      details: error.message 
    });
  }
}

exports.deletebanner = async (req,res)=>{
  try{
    const banner = await Banner.findByPk(req.params.id);
    if(!banner){
      return res.status(404).json({
        success: false,
        message: "Banner not found"
      });
    }
    await banner.destroy();
    return res.status(200).json({
      success: true,
      message: "Banner deleted successfully"
    });
  }catch(error){
    console.error('Error deleting banner:', error);
    return res.status(500).json({ 
      success: false,
      error: 'Failed to delete banner', 
      details: error.message 
    });
  }
}


exports.updatebanner = async (req, res) => {
  const { id } = req.params;

  const t = await Banner.sequelize.transaction();

  try {
    // Check if banner exists
    const banner = await Banner.findByPk(id);
    if (!banner) {
      await t.rollback();
      return res.status(404).json({ 
        success: false,
        message: 'Banner not found' 
      });
    }

    // Set all banners to inactive
    await Banner.update({ isactive: false }, { where: {}, transaction: t });

    // Activate the specified banner
    await Banner.update({ isactive: true }, { where: { id }, transaction: t });

    await t.commit();
    return res.status(200).json({ 
      success: true,
      message: "Banner updated successfully" 
    });

  } catch (error) {
    await t.rollback();
    console.error('Error updating banner:', error);
    return res.status(500).json({ 
      success: false,
      error: 'Failed to update banner', 
      details: error.message 
    });
  }
};