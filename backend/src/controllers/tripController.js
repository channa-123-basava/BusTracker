const Trip = require('../models/Trip');
const Bus = require('../models/Bus');
const User = require('../models/User');
const Notification = require('../models/Notification');
const Route = require('../models/Route');
const { sendSuccess, sendError } = require('../utils/response');

const calculateDistanceKm = (lat1, lon1, lat2, lon2) => {
  const toRad = (value) => (value * Math.PI) / 180;
  const earthRadiusKm = 6371;
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  const a = Math.sin(dLat / 2) ** 2 + Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon / 2) ** 2;
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return earthRadiusKm * c;
};

const shouldSendTripAlert = (trip, type) => {
  if (!trip.lastAlertType || trip.lastAlertType !== type) return true;
  if (!trip.lastAlertAt) return true;
  return Date.now() - new Date(trip.lastAlertAt).getTime() > 10 * 60 * 1000;
};

const createTripNotification = async ({ trip, bus, route, type, title, message, io }) => {
  const students = await User.find({ assignedBus: bus._id, role: 'student' });
  const studentIds = students.map((student) => student._id);
  const notification = await Notification.create({
    title,
    message,
    type,
    recipients: studentIds,
    bus: bus._id,
    trip: trip._id,
  });

  if (io) {
    io.to(`bus_${bus._id}`).emit('new_notification', notification);
    io.to(`bus_${bus._id}`).emit('trip_status_update', { type, notification });
    io.to('admin_room').emit('new_notification', notification);
  }

  await Trip.findByIdAndUpdate(trip._id, {
    lastAlertType: type,
    lastAlertAt: new Date(),
  });

  return notification;
};

// @desc    Start a trip (driver)
// @route   POST /api/trips/start
// @access  Private (driver)
const startTrip = async (req, res) => {
  try {
    const driver = await User.findById(req.user._id);
    const today = new Date();
    today.setHours(12, 0, 0, 0);

    const todayAssignment = driver.assignmentHistory?.find((entry) => {
      const entryDate = entry.assignedDate ? new Date(entry.assignedDate) : null;
      return entryDate && entryDate.toDateString() === today.toDateString();
    });

    const assignedBusId = todayAssignment?.bus || driver.assignedBusDriver;

    if (!assignedBusId) {
      return sendError(res, 'No bus assigned to you for today. Contact admin.', 400);
    }

    const bus = await Bus.findById(assignedBusId).populate('assignedRoute');
    if (!bus) return sendError(res, 'Bus not found.', 404);
    if (bus.status !== 'active') return sendError(res, 'Bus status must be active to start a trip.', 400);
    if (!bus.assignedRoute) return sendError(res, 'No route assigned to your bus.', 400);
    if (bus.isOnTrip) return sendError(res, 'Bus is already on a trip.', 400);

    const { tripType, scheduledStartTime, latitude, longitude } = req.body;

    const trip = await Trip.create({
      bus: bus._id,
      driver: driver._id,
      route: bus.assignedRoute._id,
      status: 'ongoing',
      tripType: tripType || 'morning',
      startTime: new Date(),
      scheduledStartTime: scheduledStartTime ? new Date(scheduledStartTime) : new Date(),
      currentLocation: { latitude, longitude, updatedAt: new Date() },
    });

    // Update bus and driver status
    await Bus.findByIdAndUpdate(bus._id, {
      isOnTrip: true,
      currentLocation: { latitude, longitude, updatedAt: new Date() },
    });
    await User.findByIdAndUpdate(driver._id, { isOnTrip: true });

    const io = req.app.get('io');
    const notification = await createTripNotification({
      trip,
      bus,
      route: bus.assignedRoute,
      type: 'trip_started',
      title: 'Bus Trip Started',
      message: `Bus ${bus.busNumber} has started its trip. Route: ${bus.assignedRoute.routeName}`,
      io,
    });

    if (io) {
      io.to(`bus_${bus._id}`).emit('trip_started', {
        trip,
        bus: { _id: bus._id, busNumber: bus.busNumber },
        notification,
      });
      io.to('admin_room').emit('trip_started', { trip, bus });
    }

    const populatedTrip = await Trip.findById(trip._id)
      .populate('bus', 'busNumber registrationNumber')
      .populate('driver', 'name phone')
      .populate('route', 'routeName source destination');

    return sendSuccess(res, { trip: populatedTrip }, 'Trip started successfully.', 201);
  } catch (error) {
    return sendError(res, error.message);
  }
};

// @desc    Update live location (driver)
// @route   PUT /api/trips/:id/location
// @access  Private (driver)
const updateLocation = async (req, res) => {
  try {
    const { latitude, longitude, speed } = req.body;
    const trip = await Trip.findById(req.params.id);
    if (!trip) return sendError(res, 'Trip not found.', 404);
    if (trip.driver.toString() !== req.user._id.toString()) {
      return sendError(res, 'Not authorized.', 403);
    }
    if (trip.status !== 'ongoing') {
      return sendError(res, 'Trip is not active.', 400);
    }

    const location = { latitude, longitude, updatedAt: new Date() };

    // Add to log (keep last 500 entries)
    await Trip.findByIdAndUpdate(trip._id, {
      currentLocation: location,
      $push: {
        locationLog: {
          $each: [{ latitude, longitude, speed: speed || 0, timestamp: new Date() }],
          $slice: -500,
        },
      },
    });

    // Update bus current location
    await Bus.findByIdAndUpdate(trip.bus, { currentLocation: location });
    // Update driver current location
    await User.findByIdAndUpdate(req.user._id, { currentLocation: location });

    const io = req.app.get('io');
    const route = await Route.findById(trip.route);
    const bus = await Bus.findById(trip.bus);
    const destination = route?.destination;
    let nextAlert = null;

    if (destination?.latitude && destination?.longitude) {
      const distanceToDestination = calculateDistanceKm(latitude, longitude, destination.latitude, destination.longitude);
      const elapsedMinutes = trip.startTime ? Math.round((Date.now() - new Date(trip.startTime).getTime()) / 60000) : 0;
      const expectedDuration = route?.estimatedDuration || 30;
      const etaMinutes = route?.distance && route.estimatedDuration
        ? Math.max(1, Math.round((distanceToDestination / (route.distance / Math.max(route.estimatedDuration / 60, 1))) * 60))
        : null;

      if (distanceToDestination <= 0.8 && shouldSendTripAlert(trip, 'bus_arrived')) {
        nextAlert = {
          type: 'bus_arrived',
          title: 'Bus Reached College',
          message: `Bus ${trip.bus} has reached ${destination.name || 'college'}.`,
        };
      } else if (etaMinutes !== null && etaMinutes <= 5 && shouldSendTripAlert(trip, 'bus_arriving_soon')) {
        nextAlert = {
          type: 'bus_arriving_soon',
          title: 'Bus Arriving in 5 Minutes',
          message: `Bus ${trip.bus} is arriving in about ${etaMinutes} minutes.`,
        };
      } else if ((speed || 0) < 5 && elapsedMinutes >= 10 && shouldSendTripAlert(trip, 'bus_delayed')) {
        nextAlert = {
          type: 'bus_delayed',
          title: 'Bus Delayed',
          message: `Bus ${trip.bus} is running late. Please expect a delay.`,
        };
      }
    }

    if (nextAlert) {
      await createTripNotification({
        trip,
        bus,
        route,
        type: nextAlert.type,
        title: nextAlert.title,
        message: nextAlert.message,
        io,
      });
    }

    if (io) {
      io.to(`bus_${trip.bus}`).emit('location_update', {
        tripId: trip._id,
        busId: trip.bus,
        latitude,
        longitude,
        speed: speed || 0,
        updatedAt: new Date(),
      });
      io.to('admin_room').emit('location_update', {
        tripId: trip._id,
        busId: trip.bus,
        latitude,
        longitude,
      });
    }

    return sendSuccess(res, { location }, 'Location updated.');
  } catch (error) {
    return sendError(res, error.message);
  }
};

// @desc    End a trip (driver)
// @route   PUT /api/trips/:id/end
// @access  Private (driver)
const endTrip = async (req, res) => {
  try {
    const trip = await Trip.findById(req.params.id).populate('bus route');
    if (!trip) return sendError(res, 'Trip not found.', 404);
    if (trip.driver.toString() !== req.user._id.toString()) {
      return sendError(res, 'Not authorized.', 403);
    }
    if (trip.status !== 'ongoing') {
      return sendError(res, 'Trip is not active.', 400);
    }

    await Trip.findByIdAndUpdate(trip._id, { status: 'completed', endTime: new Date() });
    await Bus.findByIdAndUpdate(trip.bus._id, { isOnTrip: false, $unset: { currentLocation: '' } });
    await User.findByIdAndUpdate(req.user._id, { isOnTrip: false, $unset: { currentLocation: '' } });

    const io = req.app.get('io');
    const notification = await createTripNotification({
      trip,
      bus: trip.bus,
      route: trip.route,
      type: 'trip_ended',
      title: 'Bus Trip Ended',
      message: `Bus ${trip.bus.busNumber} has reached its destination. Trip completed.`,
      io,
    });

    if (io) {
      io.to(`bus_${trip.bus._id}`).emit('trip_ended', { tripId: trip._id, busId: trip.bus._id, notification });
      io.to('admin_room').emit('trip_ended', { tripId: trip._id, busId: trip.bus._id });
    }

    return sendSuccess(res, { trip }, 'Trip ended successfully.');
  } catch (error) {
    return sendError(res, error.message);
  }
};

// @desc    Get all trips
// @route   GET /api/trips
// @access  Private (admin)
const getAllTrips = async (req, res) => {
  try {
    const { status, busId } = req.query;
    const filter = {};
    if (status) filter.status = status;
    if (busId) filter.bus = busId;
    const trips = await Trip.find(filter)
      .populate('bus', 'busNumber registrationNumber')
      .populate('driver', 'name phone')
      .populate('route', 'routeName source destination')
      .sort({ createdAt: -1 })
      .limit(50);
    return sendSuccess(res, { trips, count: trips.length }, 'Trips fetched.');
  } catch (error) {
    return sendError(res, error.message);
  }
};

// @desc    Get driver's current/latest trip
// @route   GET /api/trips/my-trip
// @access  Private (driver)
const getMyTrip = async (req, res) => {
  try {
    const trip = await Trip.findOne({ driver: req.user._id, status: 'ongoing' })
      .populate('bus', 'busNumber registrationNumber color')
      .populate('route');
    return sendSuccess(res, { trip }, trip ? 'Active trip found.' : 'No active trip.');
  } catch (error) {
    return sendError(res, error.message);
  }
};

// @desc    Get trip by bus for students
// @route   GET /api/trips/bus/:busId
// @access  Private (student)
const getTripByBus = async (req, res) => {
  try {
    const trip = await Trip.findOne({ bus: req.params.busId, status: 'ongoing' })
      .populate('bus', 'busNumber color currentLocation')
      .populate('driver', 'name phone')
      .populate('route');
    return sendSuccess(res, { trip }, trip ? 'Active trip found.' : 'No active trip for this bus.');
  } catch (error) {
    return sendError(res, error.message);
  }
};

module.exports = { startTrip, updateLocation, endTrip, getAllTrips, getMyTrip, getTripByBus };
