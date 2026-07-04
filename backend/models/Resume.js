const mongoose = require('mongoose');

const ResumeSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    default: 'Candidate'
  },
  roleTarget: {
    type: String,
    required: true
  },
  experience: {
    type: String,
    default: '1-2 Years'
  },
  skills: {
    type: [String],
    default: []
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

module.exports = mongoose.model('Resume', ResumeSchema);
