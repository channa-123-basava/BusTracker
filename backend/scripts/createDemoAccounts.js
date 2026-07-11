require('dotenv').config();
const connectDB = require('../src/config/db');
const User = require('../src/models/User');
const Bus = require('../src/models/Bus');

const buildAccounts = (options = {}) => {
  const adminEmail = options.adminEmail || process.argv[2] || 'admin@college.edu';
  const adminPassword = options.adminPassword || process.argv[3] || 'admin123';
  const driverEmail = options.driverEmail || process.argv[4] || 'driver@college.edu';
  const driverPassword = options.driverPassword || process.argv[5] || 'driver123';
  const studentEmail = options.studentEmail || process.argv[6] || 'student@college.edu';
  const studentPassword = options.studentPassword || process.argv[7] || 'student123';

  return [
    {
      name: 'System Administrator',
      email: adminEmail,
      password: adminPassword,
      role: 'admin',
      phone: '+91 9876543210',
    },
    {
      name: 'Ramesh Kumar',
      email: driverEmail,
      password: driverPassword,
      role: 'driver',
      phone: '+91 9876543211',
      licenseNumber: 'KA-01-20180001234',
    },
    {
      name: 'Arjun Sharma',
      email: studentEmail,
      password: studentPassword,
      role: 'student',
      phone: '+91 9876543230',
      studentId: 'CS21001',
      department: 'Computer Science',
      year: 3,
    },
  ];
};

const createDemoAccounts = async (options = {}) => {
  const accounts = buildAccounts(options);
  // Link demo users to the first available bus so the student dashboard can
  // immediately show a bus and its assigned route after sign-in.
  const demoBus = await Bus.findOne({ status: { $ne: 'inactive' } }).sort({ createdAt: 1 });

  for (const account of accounts) {
    const normalizedEmail = account.email.toLowerCase();
    const existingUser = await User.findOne({ email: normalizedEmail });

    if (existingUser) {
      existingUser.name = account.name;
      existingUser.password = account.password;
      existingUser.role = account.role;
      existingUser.phone = account.phone;
      if (account.role === 'driver') {
        existingUser.licenseNumber = account.licenseNumber;
        if (demoBus) existingUser.assignedBusDriver = demoBus._id;
      }
      if (account.role === 'student') {
        existingUser.studentId = account.studentId;
        existingUser.department = account.department;
        existingUser.year = account.year;
        if (demoBus) existingUser.assignedBus = demoBus._id;
      }
      await existingUser.save();
      console.log(`Updated ${account.role}: ${normalizedEmail}`);
    } else {
      const busAssignment = account.role === 'driver'
        ? { assignedBusDriver: demoBus?._id }
        : account.role === 'student'
          ? { assignedBus: demoBus?._id }
          : {};
      await User.create({ ...account, ...busAssignment, email: normalizedEmail });
      console.log(`Created ${account.role}: ${normalizedEmail}`);
    }
  }

  console.log('\nLogin credentials:');
  console.log(`Admin: ${accounts[0].email} / ${accounts[0].password}`);
  console.log(`Driver: ${accounts[1].email} / ${accounts[1].password}`);
  console.log(`Student: ${accounts[2].email} / ${accounts[2].password}`);
};

const main = async () => {
  await connectDB();
  await createDemoAccounts();
};

if (require.main === module) {
  main().catch((err) => {
    console.error('Error creating demo accounts:', err.message || err);
    process.exit(1);
  });
}

module.exports = { createDemoAccounts };
