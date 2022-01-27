/* eslint-disable func-names */
/* eslint-disable no-console */
/* eslint-disable no-underscore-dangle */
const mongoose = require('mongoose');
const {
  FORTVESTPLANS, INVESTMENTSTATUS,
} = require('../config');

const { Schema } = mongoose;

const autoIncrementModelID = require('./Counter.model');

const WithdrawalSchema = mongoose.Schema({
  withdrawalID: String,
  user: {
    type: Schema.Types.ObjectId,
    ref: 'user',
    required: true,
  },
  planType: {
    type: String,
    enum: FORTVESTPLANS,
  },
  amount: {
    type: Number,
  },
  accountNumber: {
    type: String,
    required: true,
  },
  investmentID: String,
  bankName: String,
  balance: Number,
  status: {
    type: String,
    uppercase: true,
    enum: INVESTMENTSTATUS,
    default: 'ACTIVE',
  },
  deleted: {
    type: Boolean,
    default: false,
    select: false,
  },
}, {
  timestamps: true,
});
WithdrawalSchema.pre('save', function (next) {
  if (!this.isNew) {
    next();
    return;
  }
  autoIncrementModelID('applicationCount', 'withdrawalID', this, next, 'WTHDRW');
});
module.exports = mongoose.model('withdrawals', WithdrawalSchema);
