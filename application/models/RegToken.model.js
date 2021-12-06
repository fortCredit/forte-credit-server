const mongoose = require('mongoose');

const TokenSchema = mongoose.Schema({
  token: String,
  userID: String,
},
{
  timestamps: true,
});
TokenSchema.index({ createdAt: 1 }, { expireAfterSeconds: 9000 });

module.exports = mongoose.model('token', TokenSchema);
