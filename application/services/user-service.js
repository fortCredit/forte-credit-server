/* eslint-disable no-underscore-dangle */
/* eslint-disable func-names */
const bcrypt = require('bcryptjs');
const ejs = require('ejs');
const path = require('path');
const User = require('../models/User.model');
const Token = require('../models/RegToken.model');
const ResetPassword = require('../models/PasswordResets.model');
const logger = require('../utils/logger');
const authtoken = require('../utils/authtoken');
const FixedSavings = require('../models/FixedSavings.model');
const TargetSavings = require('../models/TargetSavings.model');

// const ValidateSms = require('../models/validationToken.model');
// const { sendsms } = require('../utils/smsservice');
const payStackService = require('./transaction-service');
const mail = require('./mail-gun');

function getFuncName() {
  return getFuncName.caller.name;
}
const {
  ExpiredTokenError,
  UserAlreadyExistsError,
  InvalidCredentialsError,
} = require('../error-handler/index');

// const capitalizeFirstLetter = (string) => string[0].toUpperCase() + string.slice(1);

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
  newUser.fullname = userOBJ.fullname;
  newUser.email = userOBJ.email.trim();
  newUser.phone = userOBJ.phone;
  newUser.referral = userOBJ.referral;
  newUser.channel = userOBJ.channel;
  const salt = await bcrypt.genSalt(10);
  newUser.password = await bcrypt.hash(userOBJ.password, salt);
  const now = new Date();
  newUser.nextPwdDue = now.setMonth(now.getMonth() + 3);
  await newUser.save();
  const regUser = await newUser.generateAuthToken();
  const verifyToken = Math.floor(100000 + Math.random() * 900000);

  // use mail service to send token to email
  logger.trace(`${correlationID}: Building mail object for mailer service`);
  logger.trace(`${correlationID}: >>>> Call to mailer service`);
  const recipient = userOBJ.email.trim();
  const emailSubject = 'Hello, From MyFortvest'; // email subject
  const emailBody = await ejs.renderFile(
    path.resolve(process.cwd(), 'application/views/register.ejs'),
    { fullName: userOBJ.fullname, token: verifyToken },
  );

  const mailContent = {
    recipient,
    data: {
      subject: emailSubject,
      body: emailBody,
    },
  };
  await mail.sendMail(mailContent);
  // persist token
  const saveToken = new Token({
    userID: regUser._id,
    token: verifyToken,
  });
  await saveToken.save();
  logger.trace(`${correlationID}: <<<< Exiting userManagementService.register()`);
  const response = {};
  response.data = regUser;
  response.message = 'Register successful';
  response.success = true;
  return response;
};

exports.requestValidationToken = async (email, host, correlationID) => {
  // confirm user does not exist
  const getUser = await User.findOne({ email });
  if (getUser.isVerified) throw new Error('This account is already verified');
  const verifyToken = Math.floor(100000 + Math.random() * 900000);
  // persist token
  const saveToken = new Token({
    userID: getUser._id,
    token: verifyToken,
  });
  await saveToken.save();

  // use mail service to send token to email
  logger.trace(`${correlationID}: Building mail object for mailer service`);
  logger.trace(`${correlationID}: >>>> Call to mailer service`);
  const recipient = getUser.email.trim();
  const emailSubject = 'Hello, From MyFortvest'; // email subject
  const emailBody = await ejs.renderFile(
    path.resolve(process.cwd(), 'application/views/verifyacct.ejs'),
    { fullName: getUser.fullname, token: verifyToken },
  );

  const mailContent = {
    recipient,
    data: {
      subject: emailSubject,
      body: emailBody,
    },
  };
  await mail.sendMail(mailContent);
  logger.trace(`${correlationID}: <<<< Exiting userManagementService.register()`);
  const response = {};
  response.data = {};
  response.message = 'Account verification requested';
  response.success = true;
  return response;
};

exports.validateAccount = async (token) => {
  const verificationToken = token;
  const getToken = await Token.findOne({ token: verificationToken });

  if (!getToken) throw new Error('Token may have expired');
  // confirm token belongs to a user
  const getUser = await User.findOne({ _id: getToken.userID });
  if (!getUser) throw new Error('No account found for this token');
  await getUser.updateOne({ isVerified: true });
  await getToken.deleteOne();
  const response = {};
  response.data = getUser;
  response.message = 'Account Validation successful';
  response.success = true;
  return response;
};

exports.login = async function (loginCred, correlationID) {
  logger.trace(`${correlationID}: Querying db for user with ${loginCred.email}`);
  const user = await User.findOne({ email: loginCred.email });
  if (!user) {
    throw new InvalidCredentialsError(`User with email: ${loginCred.email} does not exist`);
  }
  if (!user.isVerified) return { UserAlreadyExistsError, data: user.isVerified, message: 'User is not validated yet, kindly check your email.' };
  const isMatch = await bcrypt.compare(loginCred.password, user.password);
  if (!isMatch) {
    throw new InvalidCredentialsError('Password mismatch');
  }
  await authtoken.updateToken(user._id);
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
    throw new InvalidCredentialsError(`${correlationID}: User with email: ${resetObj.email} does not exist`);
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
  logger.trace(`${correlationID}: >>>> Call to mailer service`);
  const recipient = user.email.trim();
  const emailSubject = 'Hello, From Fortvest'; // email subject
  const emailBody = await ejs.renderFile(
    path.resolve(process.cwd(), 'application/views/password-reset.ejs'),
    { fullName: user.fullname, token: genToken },
  );

  const mailContent = {
    recipient,
    data: {
      subject: emailSubject,
      body: emailBody,
    },
  };
  await mail.sendMail(mailContent);

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
  const now = new Date();
  await User.findOneAndUpdate(
    {
      _id: requestData.userid,
    },
    {
      nextPwdDue: now.setMonth(now.getMonth() + 3),
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

exports.addBankDetails = async (userid, bankDetails, correlationID) => {
  try {
    const { accountNumber, bvn, bankCode } = bankDetails;
    const bvnObj = {
      bvn,
      account_number: accountNumber,
      bank_code: bankCode,
    };

    const bvnVerification = (await payStackService.verifyBVN(bvnObj, correlationID)).data;

    const userObj = {};
    if (bvnVerification.status === true) {
      if (bvnVerification.data.is_blacklisted) throw new Error('Sorry! the account number is blacklisted, you cannot continue with this process');
      userObj.bvn = bvnVerification.data.bvn;
      userObj.accountNo = bvnVerification.data.account_no;
    } else throw new Error('BVN verification failed.');
    const updateUserProfile = await User.findOneAndUpdate(
      { _id: userid },
      { accountRecord: bankDetails },
      { new: true },
    );
    logger.trace(`${correlationID}: <<<< Exiting userManagementService.getAlUsers()`);
    const response = {};
    response.data = updateUserProfile;
    response.message = 'Bank details added successfully';
    response.success = true;
    return response;
  } catch (err) {
    throw new Error(err.message);
  }
};

exports.changePwd = async (userid, newPassword, correlationID) => {
  const hashNewPassword = await bcrypt.hash(newPassword, 12);
  logger.trace(`${correlationID}: Update User data with new password`);
  const now = new Date();
  await User.findOneAndUpdate(
    {
      _id: userid,
    },
    {
      nextPwdDue: now.setMonth(now.getMonth() + 3),
      password: hashNewPassword,
    },
  );
  logger.trace(`${correlationID}: <<<< Exiting userManagementService.getAlUsers()`);
  const response = {};
  response.data = {};
  response.message = 'Password changed successfully';
  response.success = true;
  return response;
};

// tell us more about yourself
exports.bio = async (userid, updateObj, correlationID) => {
  const bio = await User.findOneAndUpdate({ _id: userid }, updateObj, { new: true });
  if (!bio) {
    logger.error(`${correlationID}: <<<< User not found`);
    throw new Error('User not found');
  }
  logger.trace(`${correlationID}: <<<< Exiting userManagementService.Bio()`);
  const response = {};
  response.data = bio;
  response.message = 'Bio Successful Added';
  response.success = true;
  return response;
};

exports.totalSavings = async (userID, correlationID) => {
  let getTargetSavings;
  let getFixedSavings;
  logger.trace(`${correlationID}: <<<< Entering TotalSavingsService.${getFuncName()}`);
  try {
    getTargetSavings = await TargetSavings.aggregate([
      {
        $match:
        {
          user: userID,
        },
      },
      {
        $group:
          {
            _id: 'count',
            totalSavings: { $sum: '$totalSavingsTillDate' },
            totalInterest: { $sum: '$interestRate' },
          },
      },
    ]);
    getFixedSavings = await FixedSavings.aggregate([
      {
        $match:
        {
          user: userID,
        },
      },
      {
        $group:
          {
            _id: 'count',
            totalSavings: { $sum: '$totalSavingsTillDate' },
            totalInterest: { $sum: '$interestRate' },
          },
      },
    ]);

    const TS = getTargetSavings <= 0 ? 0 : getTargetSavings[0].totalSavings;
    const TSI = getTargetSavings <= 0 ? 0 : getTargetSavings[0].totalInterest;
    const FS = getFixedSavings <= 0 ? 0 : getFixedSavings[0].totalSavings;
    const FSI = getFixedSavings <= 0 ? 0 : getFixedSavings[0].totalInterest;

    const outputObj = {};
    outputObj.totalSavings = (TS + FS);
    outputObj.totalInterest = (TSI + FSI);
    logger.trace(`${correlationID}: <<<< Exiting TotalSavingsService.${getFuncName()}`);
    const response = {};
    response.data = outputObj;
    response.message = 'Total Savings retrieved Successfully';
    response.success = true;
    return response;
  } catch (err) {
    throw new Error(err.message);
  }
};
