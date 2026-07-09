const mongoose = require('mongoose');

const locationLogSchema = new mongoose.Schema({
  latitude: { type: Number, required: true },
  longitude: { type: Number, required: true },
  timestamp: { type: Date, default: Date.now },
  speed: { type: Number, default: 0 },
});

const tripSchema = new mongoose.Schema(
  {
    bus: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Bus',
      required: true,
    },
    driver: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    route: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Route',
      required: true,
    },
    status: {
      type: String,
      enum: ['scheduled', 'ongoing', 'completed', 'cancelled'],
      default: 'scheduled',
    },
    tripType: {
      type: String,
      enum: ['morning', 'evening', 'special'],
      default: 'morning',
    },
    startTime: { type: Date },
    endTime: { type: Date },
    scheduledStartTime: { type: Date },
    locationLog: [locationLogSchema],
    currentLocation: {
      latitude: { type: Number },
      longitude: { type: Number },
      updatedAt: { type: Date },
    },
    notes: { type: String },
    isDelayed: { type: Boolean, default: false },
    delayReason: { type: String },
    lastAlertType: { type: String },
    lastAlertAt: { type: Date },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Trip', tripSchema);
