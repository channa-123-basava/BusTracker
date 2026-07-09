const { verifyToken } = require('../utils/jwt');
const User = require('../models/User');

const initializeSocket = (io) => {
  // Auth middleware for socket connections
  io.use(async (socket, next) => {
    try {
      const token = socket.handshake.auth?.token || socket.handshake.headers?.authorization?.split(' ')[1];
      if (!token) return next(new Error('Authentication required'));
      const decoded = verifyToken(token);
      const user = await User.findById(decoded.id).select('-password');
      if (!user) return next(new Error('User not found'));
      socket.user = user;
      next();
    } catch (err) {
      next(new Error('Invalid token'));
    }
  });

  io.on('connection', (socket) => {
    const user = socket.user;
    console.log(`Socket connected: ${user.name} (${user.role}) [${socket.id}]`);

    // Join personal room
    socket.join(`user_${user._id}`);

    // Role-based room joining
    if (user.role === 'admin') {
      socket.join('admin_room');
      console.log(`Admin joined admin_room`);
    }

    if (user.role === 'student' && user.assignedBus) {
      socket.join(`bus_${user.assignedBus}`);
      console.log(`Student joined bus_${user.assignedBus}`);
    }

    if (user.role === 'driver' && user.assignedBusDriver) {
      socket.join(`bus_${user.assignedBusDriver}`);
      console.log(`Driver joined bus_${user.assignedBusDriver}`);
    }

    // Driver: manually join bus room
    socket.on('join_bus_room', (busId) => {
      socket.join(`bus_${busId}`);
      console.log(`${user.name} joined bus_${busId}`);
    });

    // Student: track specific bus
    socket.on('track_bus', (busId) => {
      socket.join(`bus_${busId}`);
      socket.emit('tracking_started', { busId, message: `Now tracking bus ${busId}` });
    });

    socket.on('stop_tracking', (busId) => {
      socket.leave(`bus_${busId}`);
      socket.emit('tracking_stopped', { busId });
    });

    // Driver: send location update via socket (alternative to REST)
    socket.on('driver_location_update', async (data) => {
      const { tripId, busId, latitude, longitude, speed } = data;
      const locationData = {
        tripId,
        busId,
        latitude,
        longitude,
        speed: speed || 0,
        updatedAt: new Date(),
        driverName: user.name,
      };
      // Broadcast to all in bus room
      io.to(`bus_${busId}`).emit('location_update', locationData);
      io.to('admin_room').emit('location_update', locationData);
    });

    // Ping/heartbeat
    socket.on('ping', () => {
      socket.emit('pong', { time: new Date() });
    });

    socket.on('disconnect', (reason) => {
      console.log(`Socket disconnected: ${user.name} (${reason})`);
    });
  });

  return io;
};

module.exports = initializeSocket;
