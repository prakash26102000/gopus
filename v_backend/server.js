require('dotenv').config();

const express = require('express');
const cors = require('cors');
const routes = require('./src/routes');
const cookieParser = require("cookie-parser");
const { sequelize } = require('./src/models');
const categoryRoutes = require('./src/routes/categoryRoutes');
const productRoutes = require('./src/routes/productRoutes');
const bannerRoutes = require('./src/routes/bannerRoutes')
const cartRoutes = require('./src/routes/cartRouter')
const orderRoutes = require('./src/routes/orderRouter')
const addressRoutes = require('./src/routes/addressRoutes');
const profileRoutes = require('./src/routes/profileRoutes');
const userprofile = require('./src/models/userprofile');
const reviewRoutes = require('./src/routes/reviewRoutes');
const {productreview} = require('./src/models/productreview');
const favoritesRoutes = require('./src/routes/favoritesRoutes'); // Import the favorites routes
const shippingRoutes = require('./src/routes/shippingRoutes'); // Import the shipping routes




const path = require('path');
// const { default: UserProfile } = require('../v_Frontend/src/customer/pages/userprofile');




const app = express();
const PORT = process.env.PORT;


app.use(cors({
  origin: ['http://localhost:5173','*'],
  methods: 'GET,HEAD,PUT,PATCH,POST,DELETE',
  allowedHeaders: 'Content-Type,Authorization',
  credentials: true
}));


app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());


app.use('/uploads', express.static(path.join(__dirname, 'src/uploads')));
console.log('Static files are being served from:', path.join(__dirname, 'src/uploads'));
app.use(express.static(path.join(__dirname, 'public')));

// Mount public reviews early to bypass any upstream auth logic in aggregated routers
app.use('/api/reviews', reviewRoutes);

// Aggregated routers
app.use('/api', routes);
app.use('/api', categoryRoutes);
app.use('/api', productRoutes);
app.use('/api/banner', bannerRoutes);
app.use('/api/cart',cartRoutes);
app.use('/api/orders',orderRoutes) 
app.use('/api/addresses',addressRoutes)
app.use('/api/', profileRoutes);
// Avoid duplicate mount of product routes at '/api/products' to prevent conflicts
// app.use('/api/products', productRoutes);
app.use('/api/userprofile/picture', profileRoutes); // Use the profile routes
app.use('/api/favorites', favoritesRoutes); // Use the favorites routes
app.use('/api/shipping', shippingRoutes); // Use the shipping routes







app.get("*",(req,res)=>{
  res.sendFile(path.join(__dirname,"/public/index.html"))
})

const startServer = async () => {
  try {
    await sequelize.authenticate();
    console.log('Database connection has been established successfully 👌.');
    
    app.listen(PORT, () => {
      console.log(`Server is running on port ${PORT}`);
    });
  } catch (error) {
    console.error('Unable to connect to the database:', error);
  }
};

startServer();