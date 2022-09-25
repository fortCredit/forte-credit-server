/* eslint-disable func-names */
/* eslint-disable no-console */
/* eslint-disable no-underscore-dangle */
const mongoose = require('mongoose');
const {
  SAVINGSSTATUS,
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
  amount: {
    type: Number,
  },
  accountNumber: {
    type: String,
    required: true,
  },
  savingsID: String,
  bankName: String,
  balance: Number,
  savingType: {
    type: String,
    enum: ['TARGET-SAVINGS', 'FIXED-SAVINGS'],
  },
  status: {
    type: String,
    uppercase: true,
    enum: SAVINGSSTATUS,
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
