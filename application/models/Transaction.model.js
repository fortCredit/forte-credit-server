/* eslint-disable func-names */
/* eslint-disable no-console */
/* eslint-disable no-underscore-dangle */
const mongoose = require('mongoose');
const mongoosePaginate = require('mongoose-paginate-v2');

// const { Schema } = mongoose;
const autoIncrementModelID = require('./Counter.model');
const { TRANSACTIONSTATUS, TRANSACTIONDESC, TRANSACTIONTYPE } = require('../config');

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
    enum: ['SAVE-NOW', 'AUTO-SAVE', 'TOP-UP'],
  },
  transactionType: {
    type: String,
    enum: TRANSACTIONTYPE,
  },
  transactionStatus: {
    type: String,
    enum: TRANSACTIONSTATUS,
    default: 'PENDING',
  },
  savings: {
    type: String,
    enum: TRANSACTIONDESC,
  },
  savingsID: String,
  // savings: {
  //   type: Schema.Types.ObjectId,
  //   ref: 'fortvest',
  // },
  failedDueTo: String,
  toRetry: Date,
  paystackReference: {
    type: String,
  },
  withDrawalReceipt: {
    id: String,
    recipient_code: String,
    paystackType: String,
    transferCode: String,
    details: {
      account_number: String,
      account_name: String,
      bank_code: String,
      bank_name: String,
    },
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

TransactionSchema.plugin(mongoosePaginate);

TransactionSchema.pre('find', function () {
  this.where({ deleted: false });
  this.populate('investment');
  this.sort({ createdAt: -1 });
});

module.exports = mongoose.model('transaction', TransactionSchema);
