/* eslint-disable func-names */
/* eslint-disable no-console */
/* eslint-disable no-underscore-dangle */
const mongoose = require('mongoose');
const mongoosePaginate = require('mongoose-paginate-v2');

const {
  FORTVESTFREQ, SAVINGSSTATUS,
} = require('../config');

const { Schema } = mongoose;

const autoIncrementModelID = require('./Counter.model');

const TargetSavingsSchema = mongoose.Schema({
  savingsID: String,
  user: {
    type: Schema.Types.ObjectId,
    ref: 'user',
    required: true,
  },

  card: {
    type: Schema.Types.ObjectId,
    ref: 'card',
    required: true,
  },
  isAutomated: {
    type: String,
    enum: ['INACTIVE', 'ACTIVE'],
    default: 'ACTIVE',
  },
  frequency: {
    type: String,
    enum: FORTVESTFREQ,
  },
  amount: {
    type: Number,
  },
  targetTitle: {
    type: String,
  },
  targetReason: {
    type: String,
  },
  targetAmount: {
    type: String,
  },
  interestRate: Number,
  totalSavingsTillDate: {
    type: Number,
    default: 0,
  },
  savingsLength: {
    type: Number, // this is expected in days
  },
  daysLeft: {
    type: Number, // days left to finish up your savings
  },
  balanceWithROI: Number, // after investment has ended, this is totalInestment + ROI
  withdrawalBalance: {
    type: Number, // withdrawable balance, will reduce with withdrawals
    default: 0,
  },
  savingStartDate: {
    type: Date,
  },
  savingsEndDate: {
    type: Date,
  },
  nextSavingDate: Date,
  toRetry: {
    type: Boolean,
    default: false,
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
TargetSavingsSchema.plugin(mongoosePaginate);

TargetSavingsSchema.pre('save', function (next) {
  if (!this.isNew) {
    next();
    return;
  }
  autoIncrementModelID('applicationCount', 'savingsID', this, next, 'TRSV');
});
module.exports = mongoose.model('target-savings', TargetSavingsSchema);
