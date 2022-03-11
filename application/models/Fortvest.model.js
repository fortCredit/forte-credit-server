/* eslint-disable func-names */
/* eslint-disable no-console */
/* eslint-disable no-underscore-dangle */
const mongoose = require('mongoose');
const mongoosePaginate = require('mongoose-paginate-v2');

const {
  FORTVESTFREQ, FORTVESTPLANS, SAVINGSSTATUS,
} = require('../config');

const { Schema } = mongoose;

const autoIncrementModelID = require('./Counter.model');

const FVSchema = mongoose.Schema({
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
  planType: {
    type: String,
    enum: FORTVESTPLANS,
  },
  isAutomated: {
    type: String,
    enum: ['INACTIVE', 'ACTIVE'],
    default: 'INACTIVE',
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
  },
  savingsLength: {
    type: Number, // this is expected in days
  },
  balanceWithROI: Number, // after investment has ended, this is totalInestment + ROI
  withdrawalBalance: Number, // withdrawable balance, will reduce with withdrawals
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
FVSchema.plugin(mongoosePaginate);

FVSchema.pre('save', function (next) {
  if (!this.isNew) {
    next();
    return;
  }
  autoIncrementModelID('applicationCount', 'savingsID', this, next, 'FRTVEST');
});
module.exports = mongoose.model('fortvest', FVSchema);
