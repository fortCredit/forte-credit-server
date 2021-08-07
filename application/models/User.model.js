/* eslint-disable func-names */
/* eslint-disable no-console */
/* eslint-disable no-underscore-dangle */
const mongoose = require('mongoose');

// const { Schema } = mongoose;

const mailScheduler = require('../utils/mailer');
const autoIncrementModelID = require('./Counter.model');
const sendInbox = require('../services/inbox-service').addInbox;

const { ROLES, PROJECTNAME, ACCOUNT_TYPES } = require('../config/index');

const UserSchema = mongoose.Schema({
  userID: {
    type: String,
  },
  firstName: {
    type: String,
    required: true,
  },
  lastName: {
    type: String,
    required: true,

  },
  country: {
    type: String,
    required: true,

  },
  accountType: {
    type: String,
    enum: ACCOUNT_TYPES,
  },
  bvn: {
    type: String,
    max: 10,
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
  profileimage: {
    type: String,
  },
  role: {
    type: String,
    enum: ROLES,
    default: 'CUSTOMER',
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
UserSchema.pre('save', function (next) {
  if (!this.isNew) {
    next();
    return;
  }
  autoIncrementModelID('applicationCount', 'userID', this, next, 'BIDNG');
});
UserSchema.post('save', function (doc, next) {
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

module.exports = mongoose.model('user', UserSchema);
