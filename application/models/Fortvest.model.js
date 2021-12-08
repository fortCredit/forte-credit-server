/* eslint-disable func-names */
/* eslint-disable no-console */
/* eslint-disable no-underscore-dangle */
const mongoose = require('mongoose');
const {
  FORTVESTFREQ, FORTVESTPLANS, INVESTMENTSTATUS,
} = require('../config');

const { Schema } = mongoose;

const autoIncrementModelID = require('./Counter.model');

const FVSchema = mongoose.Schema({
  investmentID: String,
  user: {
    type: Schema.Types.ObjectId,
    ref: 'user',
    required: true,
  },
  planAlias: String,
  card: {
    type: Schema.Types.ObjectId,
    ref: 'card',
    required: true,
  },
  planType: {
    type: String,
    enum: FORTVESTPLANS,
  },
  isAutomated: {
    type: Boolean,
    default: false,
  },
  frequency: {
    type: String,
    enum: FORTVESTFREQ,
  },
  amount: {
    type: Number,
    min: 50000,
  },
  interestRate: Number,
  totalInvestmentTillDate: {
    type: Number,
  },
  investmentLength: {
    type: Number, // this is expected in days
  },
  investMentEndDate: {
    type: Date,
  },
  nextInvestmentDate: Date,
  toRetry: {
    type: Boolean,
    default: false,
  },
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
FVSchema.pre('save', function (next) {
  if (!this.isNew) {
    next();
    return;
  }
  autoIncrementModelID('applicationCount', 'investmentID', this, next, 'FRTVEST');
});
module.exports = mongoose.model('fortvest', FVSchema);
