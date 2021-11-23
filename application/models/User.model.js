/* eslint-disable func-names */
/* eslint-disable no-console */
/* eslint-disable no-underscore-dangle */
const mongoose = require('mongoose');
const jwt = require('jsonwebtoken');
const { JWTSECRET } = require('../config');

// const { Schema } = mongoose;

const mailScheduler = require('../utils/mailer');
const autoIncrementModelID = require('./Counter.model');
// const sendInbox = require('../services/inbox-service').addInbox;

const UserSchema = mongoose.Schema({
  userID: {
    type: String,
  },
  fullName: {
    type: String,
    required: true,
  },
  email: {
    type: String,
    required: true,
    lowercase: true,
    unique: [true, 'User with email already exists'],
  },
  phone: {
    type: String,
    unique: [true, 'User with phone number already exists'],
  },
  password: {
    type: String,
    required: true,
  },
  referral: {
    type: String,
  },
  channel: {
    type: String,
  },
  token: {
    type: String,
  },
  nextPwdDue: Date,
  pwdDue: Boolean,
  gender: {
    type: String,
    enum: ['MALE', 'FEMALE'],
  },
  dateOfBirth: Date,
  homeAddress: String,
  accountRecord: {
    accountNumber: String,
    bankName: String,
    bankCode: String,
    bvn: String,
  },
  profileImage: String,
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
  deleted: {
    type: Boolean,
    default: false,
    select: false,
  },
}, {
  timestamps: true,
});
UserSchema.pre('save', function (next) {
  if (!this.isNew) {
    next();
    return;
  }
  autoIncrementModelID('applicationCount', 'userID', this, next, 'FTV');
});
UserSchema.post('save', function (doc, next) {
  // schedule mail service
  const templateType = 'WELCOMEMAIL';
  mailScheduler.sendMail(
    {
      fullname: this.fullname.split(' ')[0] || '',
      templateType,
      userID: this._id.toString(),
      email: this.email,
    },
  );
  next();
});

UserSchema.methods.generateAuthToken = async function () {
  // Generate an auth token for the user
  try {
    const user = this;
    const token = jwt.sign({ _id: user._id }, JWTSECRET);
    user.token = token;
    await user.save();
    return user;
  } catch (err) {
    return console.log(err);
  }
};
module.exports = mongoose.model('user', UserSchema);
