const Bus = require('../models/Bus');
const User = require('../models/User');
const { sendSuccess, sendError } = require('../utils/response');

// @desc    Get all buses
// @route   GET /api/buses
// @access  Private (admin)
const getAllBuses = async (req, res) => {
  try {
    const buses = await Bus.find()
      .populate('assignedRoute', 'routeName routeNumber source destination')
      .populate('assignedDriver', 'name email phone licenseNumber');
    return sendSuccess(res, { buses, count: buses.length }, 'Buses fetched successfully.');
  } catch (error) {
    return sendError(res, error.message);
  }
};

// @desc    Get single bus
// @route   GET /api/buses/:id
// @access  Private
const getBus = async (req, res) => {
  try {
    const bus = await Bus.findById(req.params.id)
      .populate('assignedRoute')
      .populate('assignedDriver', 'name email phone');
    if (!bus) return sendError(res, 'Bus not found.', 404);
    return sendSuccess(res, { bus }, 'Bus fetched successfully.');
  } catch (error) {
    return sendError(res, error.message);
  }
};

// @desc    Create bus
// @route   POST /api/buses
// @access  Private (admin)
const createBus = async (req, res) => {
  try {
    const { busNumber, registrationNumber, capacity, make, model, year, color } = req.body;
    const existing = await Bus.findOne({ $or: [{ busNumber }, { registrationNumber }] });
    if (existing) {
      return sendError(res, 'Bus number or registration number already exists.', 400);
    }
    const bus = await Bus.create({ busNumber, registrationNumber, capacity, make, model, year, color });
    return sendSuccess(res, { bus }, 'Bus created successfully.', 201);
  } catch (error) {
    return sendError(res, error.message);
  }
};

// @desc    Update bus
// @route   PUT /api/buses/:id
// @access  Private (admin)
const updateBus = async (req, res) => {
  try {
    const bus = await Bus.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true,
    }).populate('assignedRoute assignedDriver');
    if (!bus) return sendError(res, 'Bus not found.', 404);
    return sendSuccess(res, { bus }, 'Bus updated successfully.');
  } catch (error) {
    return sendError(res, error.message);
  }
};

// @desc    Delete bus
// @route   DELETE /api/buses/:id
// @access  Private (admin)
const deleteBus = async (req, res) => {
  try {
    const bus = await Bus.findById(req.params.id);
    if (!bus) return sendError(res, 'Bus not found.', 404);
    // Unassign students
    await User.updateMany({ assignedBus: bus._id }, { $unset: { assignedBus: '' } });
    // Unassign driver
    await User.updateMany({ assignedBusDriver: bus._id }, { $unset: { assignedBusDriver: '' } });
    await bus.deleteOne();
    return sendSuccess(res, {}, 'Bus deleted successfully.');
  } catch (error) {
    return sendError(res, error.message);
  }
};

// @desc    Assign route to bus
// @route   PUT /api/buses/:id/assign-route
// @access  Private (admin)
const assignRoute = async (req, res) => {
  try {
    const { routeId } = req.body;
    const bus = await Bus.findByIdAndUpdate(
      req.params.id,
      { assignedRoute: routeId },
      { new: true }
    ).populate('assignedRoute assignedDriver');
    if (!bus) return sendError(res, 'Bus not found.', 404);
    return sendSuccess(res, { bus }, 'Route assigned to bus.');
  } catch (error) {
    return sendError(res, error.message);
  }
};

// @desc    Get active (on-trip) buses for live map
// @route   GET /api/buses/active
// @access  Private
const getActiveBuses = async (req, res) => {
  try {
    const buses = await Bus.find({ isOnTrip: true })
      .populate('assignedRoute', 'routeName source destination')
      .populate('assignedDriver', 'name phone');
    return sendSuccess(res, { buses }, 'Active buses fetched.');
  } catch (error) {
    return sendError(res, error.message);
  }
};

// @desc    Get buses assigned to the current driver
// @route   GET /api/buses/driver
// @access  Private (driver)
const getDriverBuses = async (req, res) => {
  try {
    const buses = await Bus.find({ assignedDriver: req.user._id })
      .populate('assignedRoute', 'routeName routeNumber source destination')
      .populate('assignedDriver', 'name email phone licenseNumber');
    return sendSuccess(res, { buses, count: buses.length }, 'Driver buses fetched successfully.');
  } catch (error) {
    return sendError(res, error.message);
  }
};

module.exports = { getAllBuses, getBus, createBus, updateBus, deleteBus, assignRoute, getActiveBuses, getDriverBuses };
