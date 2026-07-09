const mongoose = require('mongoose');

const stopSchema = new mongoose.Schema({
  name: { type: String, required: true },
  latitude: { type: Number, required: true },
  longitude: { type: Number, required: true },
  estimatedTime: { type: String }, // e.g. "08:30 AM"
  order: { type: Number, required: true },
});

const routeSchema = new mongoose.Schema(
  {
    routeName: {
      type: String,
      required: [true, 'Route name is required'],
      trim: true,
    },
    routeNumber: {
      type: String,
      required: [true, 'Route number is required'],
      unique: true,
      trim: true,
    },
    source: {
      name: { type: String, required: true },
      latitude: { type: Number, required: true },
      longitude: { type: Number, required: true },
    },
    destination: {
      name: { type: String, required: true },
      latitude: { type: Number, required: true },
      longitude: { type: Number, required: true },
    },
    stops: [stopSchema],
    distance: { type: Number }, // in km
    estimatedDuration: { type: Number }, // in minutes
    isActive: { type: Boolean, default: true },
    departureTime: { type: String }, // "08:00 AM"
    returnTime: { type: String },    // "05:00 PM"
    // GeoJSON path for map display
    path: [
      {
        latitude: { type: Number },
        longitude: { type: Number },
      },
    ],
  },
  { timestamps: true }
);

module.exports = mongoose.model('Route', routeSchema);
