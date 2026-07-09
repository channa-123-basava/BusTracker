require('dotenv').config();
const connectDB = require('../src/config/db');
const User = require('../src/models/User');

const main = async () => {
  try {
    await connectDB();
    const users = await User.find().select('-password').lean();
    console.log('Users:');
    users.forEach((u) => {
      console.log(`- ${u.role}: ${u.email} (name: ${u.name}${u.studentId ? `, studentId: ${u.studentId}` : ''})`);
    });
    process.exit(0);
  } catch (err) {
    console.error('Error listing users:', err.message || err);
    process.exit(1);
  }
};

if (require.main === module) main();
