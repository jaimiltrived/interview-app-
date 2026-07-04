const mongoose = require('mongoose');

const SessionSchema = new mongoose.Schema({
  roleTarget: {
    type: String,
    required: true
  },
  overallScore: {
    type: Number,
    required: true
  },
  technicalScore: {
    type: Number,
    required: true
  },
  communicationScore: {
    type: Number,
    required: true
  },
  avgWpm: {
    type: Number,
    default: 130
  },
  totalFiller: {
    type: Number,
    default: 0
  },
  avgEyeContact: {
    type: Number,
    default: 90
  },
  expression: {
    type: String,
    default: 'Confident'
  },
  questions: {
    type: [String],
    default: []
  },
  answers: {
    type: [String],
    default: []
  },
  wpmHistory: {
    type: [Number],
    default: []
  },
  eyeContactHistory: {
    type: [Number],
    default: []
  },
  fillerHistory: {
    type: [Number],
    default: []
  },
  date: {
    type: Date,
    default: Date.now
  }
});

module.exports = mongoose.model('Session', SessionSchema);
