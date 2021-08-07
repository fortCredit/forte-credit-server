/* eslint-disable no-underscore-dangle */
/* eslint-disable func-names */
const bcrypt = require('bcryptjs');
const User = require('../models/User.model');
const ResetPassword = require('../models/PasswordResets.model');
const mailScheduler = require('../utils/mailer');
const logger = require('../utils/logger');
const ValidateSms = require('../models/validationToken.model');
const { sendsms } = require('../utils/smsservice');
const {
  ExpiredTokenError,
  UserAlreadyExistsError,
  InvalidCredentialsError,
} = require('../error-handler/index');

// const capitalizeFirstLetter = (string) => string[0].toUpperCase() + string.slice(1);

// validate bvn
exports.validateBVN = async (bvn, correlationID) => {
  // confirm user does not exist
  const isExist = await User.findOne({ bvn });
  if (isExist) {
    throw new Error('Sorry, BVN validation failed. Duplicate account suspected');
  }

  logger.trace(`${correlationID}: <<<< Exiting userManagementService.register()`);
  const response = {};
  response.data = {};
  response.message = 'Register successful';
  response.success = true;
  return response;
};

exports.sendTokenToPhone = async (phone, correlationID) => {
  try {
    const token = Math.floor(100000 + Math.random() * 900000);
    const nowDate = new Date();
    const expiresAt = nowDate.setMinutes(nowDate.getMinutes() + 30);
    const smsToken = {
      token,
      expiresAt,
    };
    await ValidateSms.findOneAndUpdate(
      { phone }, { smsToken }, { upsert: true, new: true },
    );
    // send sms to user

    const textcontent = `Hello! Your crest transfer sign up authentication code is ${token}. This expires in 5minutes`;
    await sendsms(textcontent, phone);

    logger.trace(`${correlationID}: <<<< Exiting userManagementService.registerFlow1()`);
    const response = {};
    response.data = {};
    response.message = 'Validation token sent to your phone number.';
    response.success = true;
    return response;
  } catch (err) {
    throw new Error(err);
  }
};

// register flow
exports.register = async (userOBJ, correlationID) => {
  // confirm user does not exist
  const isExist = await User.findOne({ email: userOBJ.email });
  if (isExist) {
    throw new UserAlreadyExistsError(userOBJ.email);
  }
  const phoneExist = await User.findOne({ phone: userOBJ.phone });
  if (phoneExist) {
    throw new Error('User with Phone Number already exists');
  }

  const newUser = new User();
  newUser.email = userOBJ.email.trim();
  newUser.phone = userOBJ.phone;
  newUser.country = userOBJ.country;
  newUser.accountType = 'INDIVIDUAL';
  newUser.bvn = userOBJ.bvn;

  const salt = await bcrypt.genSalt(10);
  newUser.password = await bcrypt.hash(userOBJ.password, salt);
  newUser.role = 'CUSTOMER';
  await newUser.save();

  logger.trace(`${correlationID}: <<<< Exiting userManagementService.register()`);
  const response = {};
  response.data = newUser;
  response.message = 'Register successful';
  response.success = true;
  return response;
};

exports.login = async function (loginCred, correlationID) {
  logger.trace(`${correlationID}: Querying db for user with ${loginCred.email}`);
  const user = await User.findOne({ email: loginCred.email });
  if (!user) {
    throw new InvalidCredentialsError(`Staff with email: ${loginCred.email} does not exist`);
  }
  const isMatch = await bcrypt.compare(loginCred.password, user.password);

  if (!isMatch) {
    throw new InvalidCredentialsError('Password mismatch');
  }

  user.password = undefined;
  user.createdAt = undefined;
  user.updateAt = undefined;
  const response = {};
  response.data = user;
  response.message = 'Login Success';
  response.success = true;
  return response;
};

// password reset flow
exports.resetRequest = async function (resetObj, correlationID) {
  logger.trace(`${correlationID}: Querying db for user with ${resetObj.email}`);
  const user = await User.findOne(resetObj);
  if (!user) {
    throw new InvalidCredentialsError(`${correlationID}: Staff with email: ${resetObj.email} does not exist`);
  }
  const genToken = Math.floor(100000 + Math.random() * 900000);
  // check if there is a reset request from this user already
  const checkUser = await ResetPassword.findOne({ userid: user._id });
  if (checkUser) {
    logger.trace(`${correlationID}: Initial reset request exists, updating token`);
    await checkUser.updateOne({ token: genToken });
  } else {
    logger.trace(`${correlationID}: Persisting new reset request`);
    const reset = new ResetPassword({
      userid: user._id,
      token: genToken,
    });
    await reset.save();
  }
  logger.trace(
    `${correlationID}: Reset requested for staff with email: ${resetObj.email} successfully`,
  );
  // use mail service to send token to email
  logger.trace(`${correlationID}: Building mail object for mailer service`);
  const templateType = 'RESETPASSWORD';
  logger.trace(`${correlationID}: >>>> Call to mailer service`);
  mailScheduler.sendMail(
    {
      templateType,
      token: genToken,
      email: resetObj.email,
      fullName: user.fullName ? user.fullName.split(' ')[0] : '',
    },
  );

  const response = {};
  response.data = [];
  response.message = 'Password reset token sent to your registered email, Kindly use this  token';
  response.success = true;
  return response;
};

exports.validateToken = async function (resetPasswordToken, correlationID) {
  // ensure token is not expired and exists
  logger.trace(`${correlationID}: Verification of token`);
  const requestData = await ResetPassword.findOne({
    token: resetPasswordToken,
  });
  if (!requestData) {
    throw new ExpiredTokenError(resetPasswordToken);
  }
  logger.trace(`${correlationID}: Token validation successful`);
  const response = {};
  response.data = [];
  response.message = 'Token Validation Successful';
  response.success = true;
  return response;
};

exports.resetPassword = async function (resetPasswordToken, newPassword, correlationID) {
  logger.trace(`${correlationID}: Verification of token`);
  const requestData = await ResetPassword.findOne({
    token: resetPasswordToken,
  });

  if (!requestData) {
    throw new ExpiredTokenError(resetPasswordToken);
  }

  // hash new password
  logger.trace(`${correlationID}: >>>> Call to bcrypt.hash() to hash new password`);
  const hashNewPassword = await bcrypt.hash(newPassword, 12);
  logger.trace(`${correlationID}: Update User data with new password`);
  await User.findOneAndUpdate(
    {
      _id: requestData.userid,
    },
    {
      password: hashNewPassword,
    },
  );
  logger.trace(`${correlationID}: Delete token info from ResetPassword collection`);
  await ResetPassword.deleteOne({
    _id: requestData._id,
  });
  logger.trace(`${correlationID}: >>> Exiting resetPassword()`);
  const response = {};
  response.data = [];
  response.message = 'Password Reset Successful';
  response.success = true;
  return response;
};

exports.updateProfile = async (userid, updateObj, correlationID) => {
  // confirm user does not exist
  const updateUser = await User.findOneAndUpdate({ _id: userid }, updateObj, { new: true });
  if (!updateUser) {
    logger.error(`${correlationID}: <<<< User not found`);
    throw new Error('User not found');
  }
  // confirm phone is unique
  if (updateObj.phone) {
    const phoneExist = await User.findOne({
      $and: [{ phone: updateObj.phone },
        { _id: { $ne: userid } }],
    });
    if (phoneExist) {
      throw new Error('User with Phone Number already exists');
    }
  }

  updateUser.password = undefined;
  logger.trace(`${correlationID}: <<<< Exiting userManagementService.updateProfile()`);
  const response = {};
  response.data = updateUser;
  response.message = 'Update successful';
  response.success = true;
  return response;
};

exports.getUser = async (userid, correlationID) => {
  // confirm user does not exist
  const findUser = await User.findOne({ _id: userid });
  logger.trace(`${correlationID}: <<<< Exiting userManagementService.getUser()`);
  const response = {};
  response.data = findUser;
  response.message = 'User retrieved successfully';
  response.success = true;
  return response;
};

exports.getAllUsers = async (correlationID) => {
  // TODO:: Paginate response
  const findUsers = await User.find({}, { password: 0, doneFirstLogin: 0, role: 0 })
    .sort({ createdAt: -1 });
  logger.trace(`${correlationID}: <<<< Exiting userManagementService.getAlUsers()`);
  const response = {};
  response.data = findUsers;
  response.message = 'User retrieved successfully';
  response.success = true;
  return response;
};
