/* eslint-disable func-names */
/* eslint-disable no-console */
/* eslint-disable no-underscore-dangle */
const mongoose = require('mongoose');

const { Schema } = mongoose;
const autoIncrementModelID = require('./Counter.model');
const { TRANSACTIONSTATUS, TRANSACTIONDESC } = require('../config/app');

const TransactionSchema = mongoose.Schema({
  transactionID: {
    type: String,
  },
  retryCount: {
    type: Number,
    default: 0,
  },
  user: {
    type: String,
    required: true,
  },
  email: String,
  description: {
    type: String,
    enum: TRANSACTIONDESC,
  },
  transactionType: {
    type: String,
  },
  transactionStatus: {
    type: String,
    enum: TRANSACTIONSTATUS,
    default: 'PENDING',
  },
  investment: {
    type: Schema.Types.ObjectId,
    ref: 'fortvest',
  },
  paystackReference: {
    type: String,
  },
  amount: {
    type: Number,
    default: 0,
  },
  deleted: {
    type: Boolean,
    default: false,
  },
}, {
  timestamps: true,
});

TransactionSchema.pre('save', function (next) {
  if (!this.isNew) {
    next();
    return;
  }
  autoIncrementModelID('applicationCount', 'transactionID', this, next, 'FRTVST');
});

TransactionSchema.pre('find', function () {
  this.where({ deleted: false });
  this.sort({ createdAt: -1 });
});

module.exports = mongoose.model('transaction', TransactionSchema);
