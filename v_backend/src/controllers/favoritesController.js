const db = require("../models");

exports.addToFavorites = async (req, res) => {
  try {
    const userId = req.user.id;
    const productId = parseInt(req.params.productId);

    if (!Number.isInteger(productId) || productId <= 0) {
      return res.status(400).json({ message: "Invalid product ID" });
    }

    const exists = await db.favorites.findOne({
      where: { userId: userId, productId: productId },
    });

    if (!exists) {
      await db.favorites.create({ userId: userId, productId: productId });
      return res.status(200).json({ message: "Product added to favorites" });
    } else {
      return res.status(200).json({ message: "Product already in favorites" });
    }
  } catch (error) {
    console.error("Add to favorites error:", error);
    return res.status(500).json({ message: "Internal Server Error", error });
  }
};



// exports.removeFromFavorites = async (req, res) => {
//   try {
//     const userId = req.user.id;
//     const productId = parseInt(req.params.productId);

//     if (!Number.isInteger(productId) || productId <= 0) {
//       return res.status(400).json({ message: "Invalid product ID" });
//     }

//     const favorite = await db.favorites.findOne({
//       where: { user_id: userId, product_id: productId },
//     });

//     if (favorite) {
//       await favorite.destroy();
//       return res.status(200).json({ message: "Product removed from favorites" });
//     } else {
//       return res.status(404).json({ message: "Product not found in favorites" });
//     }
//   } catch (error) {
//     console.error("Remove from favorites error:", error);
//     return res.status(500).json({ message: "Internal Server Error", error });
//   }
// };
exports.getUserFavorites = async (req, res) => {
  try {
    const userId = req.user.id;

    const favorites = await db.favorites.findAll({
      where: { userId: userId },
      include: [
        {
          model: db.productdescription,
          as: 'product', 
          include: [
            {
              model: db.productimage,
              as: 'productimages', 
            }
          ]
        }
      ]
    });

    return res.status(200).json({ favorites });
  } catch (error) {
    console.error("Error fetching favorites:", error);
    return res.status(500).json({ message: "Internal Server Error", error });
  }
};
exports.removeFromFavorites = async (req, res) => {
  try {
    const userId = req.user.id;
    const productId = parseInt(req.params.productId);

    if (!Number.isInteger(productId) || productId <= 0) {
      return res.status(400).json({ message: "Invalid product ID" });
    }

    const favorite = await db.favorites.findOne({
      where: { userId: userId, productId: productId },
    });

    if (favorite) {
      await favorite.destroy();
      return res.status(200).json({ message: "Product removed from favorites" });
    } else {
      return res.status(404).json({ message: "Product not found in favorites" });
    }
  } catch (error) {
    console.error("Remove from favorites error:", error);
    return res.status(500).json({ message: "Internal Server Error", error });
  }
};
