const Route = require('../models/Route');
const { sendSuccess, sendError } = require('../utils/response');

const getAllRoutes = async (req, res) => {
  try {
    const routes = await Route.find();
    return sendSuccess(res, { routes, count: routes.length }, 'Routes fetched.');
  } catch (error) {
    return sendError(res, error.message);
  }
};

const getRoute = async (req, res) => {
  try {
    const route = await Route.findById(req.params.id);
    if (!route) return sendError(res, 'Route not found.', 404);
    return sendSuccess(res, { route }, 'Route fetched.');
  } catch (error) {
    return sendError(res, error.message);
  }
};

const createRoute = async (req, res) => {
  try {
    const existing = await Route.findOne({ routeNumber: req.body.routeNumber });
    if (existing) return sendError(res, 'Route number already exists.', 400);
    const route = await Route.create(req.body);
    return sendSuccess(res, { route }, 'Route created.', 201);
  } catch (error) {
    return sendError(res, error.message);
  }
};

const updateRoute = async (req, res) => {
  try {
    const route = await Route.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true,
    });
    if (!route) return sendError(res, 'Route not found.', 404);
    return sendSuccess(res, { route }, 'Route updated.');
  } catch (error) {
    return sendError(res, error.message);
  }
};

const deleteRoute = async (req, res) => {
  try {
    const route = await Route.findById(req.params.id);
    if (!route) return sendError(res, 'Route not found.', 404);
    await route.deleteOne();
    return sendSuccess(res, {}, 'Route deleted.');
  } catch (error) {
    return sendError(res, error.message);
  }
};

module.exports = { getAllRoutes, getRoute, createRoute, updateRoute, deleteRoute };
