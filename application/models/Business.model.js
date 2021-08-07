/* eslint-disable func-names */
/* eslint-disable no-console */
/* eslint-disable no-underscore-dangle */
const mongoose = require('mongoose');

// const { Schema } = mongoose;

const mailScheduler = require('../utils/mailer');
const autoIncrementModelID = require('./Counter.model');
const sendInbox = require('../services/inbox-service').addInbox;

const { ROLES, PROJECTNAME, ACCOUNT_TYPES } = require('../config/index');

const BusinessSchema = mongoose.Schema({
  businessID: {
    type: String,
  },
  businessName: {
    type: String,
  },
  cacNumber: {
    type: String,
    required: true,
    unique: [true, 'Business with the same cac number already exists'],

  },
  accountType: {
    type: String,
    enum: ACCOUNT_TYPES,
    default: 'CORPORATE',
  },
  bvn: {
    type: String,
    max: 10,
  },
  businessEmail: {
    type: String,
    required: true,
    lowercase: true,
    unique: [true, 'Business with email already exists'],
  },
  businessAddress: {
    type: String,
    lowercase: true,
  },
  businessPhone: {
    type: String,
  },
  password: {
    type: String,
    required: true,
  },
  profileimage: {
    type: String,
  },
  role: {
    type: String,
    enum: ROLES,
    default: 'BUSINESS',
    uppercase: true,
  },
  // company: [{
  //   type: Schema.Types.ObjectId,
  //   ref: 'company',
  //   required: true,
  // }],
  deleted: {
    type: Boolean,
    default: false,
    select: false,
  },
}, {
  timestamps: true,
});
BusinessSchema.pre('save', function (next) {
  if (!this.isNew) {
    next();
    return;
  }
  autoIncrementModelID('applicationCount', 'userID', this, next, 'BIDNG');
});
BusinessSchema.post('save', function (doc, next) {
  // schedule mail service
  const templateType = 'WELCOMEMAIL';
  mailScheduler.sendMail(
    {
      fullName: this.fullName.split(' ')[0] || '',
      templateType,
      userID: this._id.toString(),
      email: this.email,
    },
  );
  const data = {
    body: {
      title: `Welcome to ${PROJECTNAME}`,
      body: `You are welcome to ${PROJECTNAME}. A team of brilliant people. You are here because you are simply the brightest and best`,
      user: this._id,
    },
  };
  sendInbox(data, {});
  next();
});

module.exports = mongoose.model('user', BusinessSchema);
