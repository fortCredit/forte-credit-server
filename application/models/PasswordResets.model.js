const mongoose = require('mongoose');

const { Schema } = mongoose;

const resetPassword = new Schema({
  userid: {
    type: String,
    required: true,
    max: 255,
  },
  token: {
    type: String,
    required: true,
    max: '6',
  },
}, {
  timestamps: true,
});

resetPassword.index({ createdAt: 1 }, { expireAfterSeconds: 180 });

// Export the model
const reset = mongoose.model('password-resets', resetPassword);
module.exports = reset;
