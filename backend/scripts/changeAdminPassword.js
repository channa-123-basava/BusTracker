require('dotenv').config();
const connectDB = require('../src/config/db');
const User = require('../src/models/User');

const main = async () => {
  const newPassword = process.argv[2] || process.env.NEW_ADMIN_PASSWORD;
  if (!newPassword) {
    console.error('Usage: node scripts/changeAdminPassword.js <newPassword>');
    process.exit(1);
  }

  await connectDB();

  const admin = await User.findOne({ email: 'admin@college.edu' }).select('+password');
  if (!admin) {
    console.error('Admin user not found. You may need to run the seeder (node seed.js) first.');
    process.exit(1);
  }

  admin.password = newPassword;
  await admin.save();
  console.log('Admin password updated successfully.');
  process.exit(0);
};

main().catch((err) => {
  console.error('Error updating admin password:', err.message || err);
  process.exit(1);
});
