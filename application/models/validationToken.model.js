const mongoose = require('mongoose');

const { Schema } = mongoose;

const ValidateSms = new Schema({
  phone: {
    type: String,
    required: true,
    unique: true,
  },
  smsToken: {
    token: Number,
    expiresAt: Date,
  },
  isValidated: false,
}, {
  timestamps: true,
});

// Export the model
const reset = mongoose.model('sms-validation-driver', ValidateSms);
module.exports = reset;
