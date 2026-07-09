require('dotenv').config();
const connectDB = require('../src/config/db');
const User = require('../src/models/User');

const main = async () => {
  const newEmail = process.argv[2] || process.env.NEW_ADMIN_EMAIL || 'admin@college.edu';
  const newPassword = process.argv[3] || process.env.NEW_ADMIN_PASSWORD || 'Anshuanurag123';

  if (!newEmail || !newPassword) {
    console.error('Usage: node scripts/resetAdminAccount.js <newEmail> <newPassword>');
    process.exit(1);
  }

  await connectDB();

  let admin = await User.findOne({ role: 'admin' }).select('+password');

  if (admin) {
    admin.email = newEmail;
    admin.password = newPassword;
    await admin.save();
    console.log('Admin credentials updated successfully.');
  } else {
    admin = await User.create({
      name: 'System Administrator',
      email: newEmail,
      password: newPassword,
      role: 'admin',
      phone: '+91 9876543210',
    });
    console.log('Admin account created successfully.');
  }

  console.log(`Admin email: ${newEmail}`);
  console.log(`Admin password: ${newPassword}`);
  process.exit(0);
};

main().catch((err) => {
  console.error('Error resetting admin account:', err.message || err);
  process.exit(1);
});
