// createAdmin.js - Script to create the initial admin user
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const dotenv = require('dotenv');

dotenv.config();

// Import the User model
const User = require('./schema/User');

async function createAdminUser() {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI, {});
    console.log('Connected to MongoDB');

    // Check if admin already exists
    const existingAdmin = await User.findOne({ role: 'admin' });
    if (existingAdmin) {
      console.log('Admin user already exists:', existingAdmin.adminEmail);
      process.exit(0);
    }

    // Admin credentials (you can change these)
    const adminData = {
      adminEmail: 'admin@pubgarena.com',
      adminPassword: 'admin123', // Change this to a secure password
      name: 'Super Admin',
      role: 'admin',
      status: 'active',
      lastLoginAt: new Date(),
    };

    // Hash the password
    const hashedPassword = await bcrypt.hash(adminData.adminPassword, 12);

    // Create admin user
    const admin = await User.create({
      ...adminData,
      adminPassword: hashedPassword,
    });

    console.log('✅ Admin user created successfully!');
    console.log('Email:', admin.adminEmail);
    console.log('Password:', adminData.adminPassword); // Show the plain password for first login
    console.log('Name:', admin.name);
    console.log('Role:', admin.role);
    console.log('\n⚠️  IMPORTANT: Change the password after first login!');

  } catch (error) {
    console.error('❌ Error creating admin user:', error.message);
    process.exit(1);
  } finally {
    await mongoose.disconnect();
    console.log('Disconnected from MongoDB');
  }
}

// Run the script
createAdminUser();
