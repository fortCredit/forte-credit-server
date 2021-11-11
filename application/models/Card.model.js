/* eslint-disable func-names */
/* eslint-disable no-console */
/* eslint-disable no-underscore-dangle */
const mongoose = require('mongoose');

const { Schema } = mongoose;

const autoIncrementModelID = require('./Counter.model');
// const sendInbox = require('../services/inbox-service').addInbox;

const CardSchema = mongoose.Schema({
  user: {
    type: Schema.Types.ObjectId,
    ref: 'user',
    required: true,
  },
  cardID: String,
  authorization: {
    authorization_code: String,
    bin: String,
    last4: String,
    exp_month: String,
    exp_year: String,
    channel: String,
    card_type: String,
    bank: String,
    country_code: String,
    brand: String,
    reusable: Boolean,
    signature: String,
    account_name: String,
  },
  authEmail: String,
  default: Boolean,
  deleted: {
    type: Boolean,
    default: false,
    select: false,
  },
}, {
  timestamps: true,
});
CardSchema.pre('find', function () {
  this.where({ deleted: false });
  this.sort({ createdAt: -1 });
});
CardSchema.pre('save', function (next) {
  if (!this.isNew) {
    next();
    return;
  }
  autoIncrementModelID('applicationCount', 'cardID', this, next, 'CRD');
});
module.exports = mongoose.model('card', CardSchema);
