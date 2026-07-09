require('dotenv').config();
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const connectDB = require('./src/config/db');
const User = require('./src/models/User');
const Bus = require('./src/models/Bus');
const Route = require('./src/models/Route');

const seed = async () => {
  await connectDB();
  console.log('Seeding database...');

  // Clear existing data
  await Promise.all([User.deleteMany({}), Bus.deleteMany({}), Route.deleteMany({})]);
  console.log('Cleared existing data');

  // ── Routes ────────────────────────────────────────────────────────────────
  const routes = await Route.insertMany([
    {
      routeName: 'City Center Express',
      routeNumber: 'R-01',
      source: { name: 'College Main Gate', latitude: 12.9716, longitude: 77.5946 },
      destination: { name: 'City Bus Stand', latitude: 12.9352, longitude: 77.6244 },
      stops: [
        { name: 'Library Junction', latitude: 12.9650, longitude: 77.5980, estimatedTime: '08:15 AM', order: 1 },
        { name: 'Market Cross', latitude: 12.9580, longitude: 77.6050, estimatedTime: '08:25 AM', order: 2 },
        { name: 'Park Road', latitude: 12.9500, longitude: 77.6120, estimatedTime: '08:35 AM', order: 3 },
      ],
      distance: 8.5,
      estimatedDuration: 45,
      departureTime: '08:00 AM',
      returnTime: '05:30 PM',
      path: [
        { latitude: 12.9716, longitude: 77.5946 },
        { latitude: 12.9650, longitude: 77.5980 },
        { latitude: 12.9580, longitude: 77.6050 },
        { latitude: 12.9500, longitude: 77.6120 },
        { latitude: 12.9352, longitude: 77.6244 },
      ],
    },
    {
      routeName: 'North Campus Link',
      routeNumber: 'R-02',
      source: { name: 'College North Gate', latitude: 12.9750, longitude: 77.5900 },
      destination: { name: 'Rajajinagar Metro', latitude: 12.9900, longitude: 77.5550 },
      stops: [
        { name: 'Tech Park Junction', latitude: 12.9800, longitude: 77.5800, estimatedTime: '08:20 AM', order: 1 },
        { name: 'Malleshwaram 8th Cross', latitude: 12.9870, longitude: 77.5700, estimatedTime: '08:30 AM', order: 2 },
      ],
      distance: 6.2,
      estimatedDuration: 35,
      departureTime: '08:10 AM',
      returnTime: '05:00 PM',
      path: [
        { latitude: 12.9750, longitude: 77.5900 },
        { latitude: 12.9800, longitude: 77.5800 },
        { latitude: 12.9870, longitude: 77.5700 },
        { latitude: 12.9900, longitude: 77.5550 },
      ],
    },
  ]);
  console.log(`Created ${routes.length} routes`);

  // ── Buses ──────────────────────────────────────────────────────────────────
  const buses = await Bus.insertMany([
    {
      busNumber: 'BUS-01',
      registrationNumber: 'KA-01-AB-1234',
      capacity: 45,
      make: 'Tata',
      model: 'Starbus',
      year: 2022,
      color: '#F59E0B',
      status: 'active',
      assignedRoute: routes[0]._id,
    },
    {
      busNumber: 'BUS-02',
      registrationNumber: 'KA-01-CD-5678',
      capacity: 40,
      make: 'Ashok Leyland',
      model: 'Viking',
      year: 2021,
      color: '#3B82F6',
      status: 'active',
      assignedRoute: routes[1]._id,
    },
    {
      busNumber: 'BUS-03',
      registrationNumber: 'KA-01-EF-9012',
      capacity: 50,
      make: 'Tata',
      model: 'LPO 1623',
      year: 2023,
      color: '#10B981',
      status: 'active',
    },
  ]);
  console.log(`Created ${buses.length} buses`);

  // ── Users ──────────────────────────────────────────────────────────────────
  // Admin
  const admin = await User.create({
    name: 'System Administrator',
    email: 'admin@college.edu',
    password: 'admin123',
    role: 'admin',
    phone: '+91 9876543210',
  });
  console.log('Created admin:', admin.email);

  // Drivers
  const driver1 = await User.create({
    name: 'Ramesh Kumar',
    email: 'driver@college.edu',
    password: 'driver123',
    role: 'driver',
    phone: '+91 9876543211',
    licenseNumber: 'KA-01-20180001234',
    assignedBusDriver: buses[0]._id,
  });
  const driver2 = await User.create({
    name: 'Suresh Patil',
    email: 'driver2@college.edu',
    password: 'driver123',
    role: 'driver',
    phone: '+91 9876543212',
    licenseNumber: 'KA-01-20190005678',
    assignedBusDriver: buses[1]._id,
  });
  console.log('Created 2 drivers');

  // Update buses with driver references
  await Bus.findByIdAndUpdate(buses[0]._id, { assignedDriver: driver1._id });
  await Bus.findByIdAndUpdate(buses[1]._id, { assignedDriver: driver2._id });

  // Students
  const studentData = [
    { name: 'Arjun Sharma', email: 'student@college.edu', studentId: 'CS21001', department: 'Computer Science', year: 3, assignedBus: buses[0]._id },
    { name: 'Priya Nair', email: 'priya@college.edu', studentId: 'EC21002', department: 'Electronics', year: 2, assignedBus: buses[0]._id },
    { name: 'Rahul Singh', email: 'rahul@college.edu', studentId: 'ME21003', department: 'Mechanical', year: 4, assignedBus: buses[1]._id },
    { name: 'Ananya Reddy', email: 'ananya@college.edu', studentId: 'IT21004', department: 'Information Technology', year: 1, assignedBus: buses[1]._id },
    { name: 'Kiran Patel', email: 'kiran@college.edu', studentId: 'CE21005', department: 'Civil', year: 3, assignedBus: buses[0]._id },
  ];

  for (const s of studentData) {
    await User.create({ ...s, password: 'student123', role: 'student', phone: '+91 98765432' + Math.floor(Math.random() * 90 + 10) });
  }
  console.log(`Created ${studentData.length} students`);

  console.log('\nSeed completed successfully.\n');
  console.log('-----------------------------------------');
  console.log('  Demo Login Credentials');
  console.log('-----------------------------------------');
  console.log('  Admin:   admin@college.edu  / admin123');
  console.log('  Driver:  driver@college.edu / driver123');
  console.log('  Student: student@college.edu / student123');
  console.log('-----------------------------------------\n');

  process.exit(0);
};

seed().catch((err) => {
  console.error('Seed failed:', err);
  process.exit(1);
});
