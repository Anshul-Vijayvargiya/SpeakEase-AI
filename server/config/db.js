// server/config/db.js
const mongoose = require('mongoose');

const connectDB = async () => {
  try {
    // This uses the variable from your .env file
    await mongoose.connect(process.env.MONGO_URI); 
    console.log('✅ MongoDB Atlas Connected');
  } catch (err) {
    console.error('❌ MongoDB Connection Error:', err.message);
    process.exit(1);
  }
};

module.exports = connectDB;
