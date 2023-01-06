/* eslint-disable no-underscore-dangle */
/* eslint-disable func-names */
const bcrypt = require('bcryptjs');
// const { APP } = require('../config/index');
const User = require('../models/User.model');
const TargetSavings = require('../models/TargetSavings.model');
const FixedSavings = require('../models/FixedSavings.model');
const Transaction = require('../models/Transaction.model');
const logger = require('../utils/logger');
const {
  UserAlreadyExistsError,
  InvalidCredentialsError,
} = require('../error-handler/index');

function getFuncName() {
  return getFuncName.caller.name;
}
// register flow
// userOBJ is user object sent from controller
exports.register = async (userOBJ, correlationID) => {
  // confirm user does not exist
  const isExist = await User.findOne({ email: userOBJ.email });
  if (isExist) {
    throw new UserAlreadyExistsError(userOBJ.email);
  }

  const newUser = new User(userOBJ);
  const salt = await bcrypt.genSalt(10);
  newUser.role = userOBJ.role.toUpperCase();
  newUser.isVerified = true;
  newUser.password = await bcrypt.hash(userOBJ.password, salt);
  await newUser.save();
  const regUser = await newUser.generateAuthToken();

  logger.trace(`${correlationID}: <<<< Exiting saManagementService.register()`);
  const response = {};
  response.data = regUser;
  response.message = 'Register successful';
  response.success = true;
  return response;
};

exports.login = async function (loginCred, correlationID) {
  logger.trace(`${correlationID}: Querying db for user with ${loginCred.email}`);
  const user = await User.findOne({ email: loginCred.email, role: 'SUPERADMIN' });
  if (!user) {
    throw new InvalidCredentialsError(`Admin with email: ${loginCred.email} does not exist`);
  }
  const isMatch = await bcrypt.compare(loginCred.password, user.password);

  if (!isMatch) {
    throw new InvalidCredentialsError('Password mismatch');
  }
  user.password = undefined;
  user.createdAt = undefined;
  user.updateAt = undefined;
  logger.trace(`${correlationID}: <<<< Exiting userManagementService.login()`);
  const response = {};
  response.data = user;
  response.message = 'Login Success';
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

exports.createAdmin = async (userOBJ, correlationID) => {
  // confirm user does not exist
  const isExist = await User.findOne({ email: userOBJ.email });
  if (isExist) {
    throw new UserAlreadyExistsError(userOBJ.email);
  }

  const newUser = new User(userOBJ);
  const salt = await bcrypt.genSalt(10);
  newUser.role = userOBJ.role.toUpperCase();
  newUser.isVerified = true;
  newUser.password = await bcrypt.hash(userOBJ.password, salt);
  await newUser.save();
  const regUser = await newUser.generateAuthToken();

  logger.trace(`${correlationID}: <<<< Exiting saManagementService.register()`);
  const response = {};
  response.data = regUser;
  response.message = 'Register successful';
  response.success = true;
  return response;
};

exports.getVerifiedUsers = async (correlationID) => {
  // confirm user does not exist
  const findUser = await User.find({ isVerified: 'true', deleted: 'false' });
  logger.trace(`${correlationID}: <<<< Exiting userManagementService.getUser()`);
  const response = {};
  response.data = findUser;
  response.message = 'Users retrieved successfully';
  response.success = true;
  return response;
};

exports.getNonVerifiedUsers = async (correlationID) => {
  // confirm user does not exist
  const findUser = await User.find({ isVerified: 'false', deleted: 'false' });
  logger.trace(`${correlationID}: <<<< Exiting userManagementService.getUser()`);
  const response = {};
  response.data = findUser;
  response.message = 'Users retrieved successfully';
  response.success = true;
  return response;
};

exports.getCustomer = async (userid, correlationID) => {
  // confirm user does not exist
  const findUser = await User.findOne({ _id: userid, deleted: 'false' });
  logger.trace(`${correlationID}: <<<< Exiting adminManagementService.getUser()`);
  const response = {};
  response.data = findUser;
  response.message = 'User retrieved successfully';
  response.success = true;
  return response;
};

exports.deleteCustomer = async (customerID, updateObj, correlationID) => {
  // confirm user does not exist
  const deleteUser = await User.findOneAndUpdate(
    { _id: customerID }, updateObj, { new: true },
  );
  if (!deleteUser) {
    logger.error(`${correlationID}: <<<< User not found`);
    throw new Error('User not found');
  }
  logger.trace(`${correlationID}: <<<< Exiting userManagementService.deleteCustomer()`);
  const response = {};
  response.data = deleteUser;
  response.message = 'Deleted successful';
  response.success = true;
  return response;
};

exports.getCustomerSavings = async (userid, correlationID) => {
  // confirm user does not exist
  const findUser = await TargetSavings.findOne({ user: userid });
  logger.trace(`${correlationID}: <<<< Exiting adminManagementService.getUser()`);
  const response = {};
  response.data = findUser;
  response.message = 'User retrieved successfully';
  response.success = true;
  return response;
};

exports.getTotalSavings = async (correlationID) => {
  let getTargetSavings;
  let getFixedSavings;
  logger.trace(`${correlationID}: <<<< Entering TotalSavingsService.${getFuncName()}`);
  try {
    getTargetSavings = await TargetSavings.aggregate([
      // {
      //   $match:
      //   {
      //     user: userID,
      //   },
      // },
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
      // {
      //   $match:
      //   {
      //     user: userID,
      //   },
      // },
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

exports.getTotalTargetSavings = async (correlationID) => {
  logger.trace(`${correlationID}: <<<< Entering TargetSavingsService.${getFuncName()}`);
  try {
    const getTotalSavings = await TargetSavings.aggregate([
      {
        $group:
          {
            _id: 'count',
            totalSavings: { $sum: '$totalSavingsTillDate' },
          },
      },
    ]);

    let outputObj;
    if (getTotalSavings <= 0) {
      outputObj = 0;
    } else {
      outputObj = getTotalSavings[0].totalSavings;
    }
    logger.trace(`${correlationID}: <<<< Exiting TargetSavingsService.${getFuncName()}`);
    const response = {};
    response.data = outputObj;
    response.message = 'Total TargetSavings retrieved Successfully';
    response.success = true;
    return response;
  } catch (err) {
    throw new Error(err.message);
  }
};

exports.getTotalFixedSavings = async (correlationID) => {
  logger.trace(`${correlationID}: <<<< Entering FixedSavingsService.${getFuncName()}`);
  try {
    const getTotalSavings = await FixedSavings.aggregate([
      {
        $group:
          {
            _id: 'count',
            totalSavings: { $sum: '$totalSavingsTillDate' },
          },
      },
    ]);

    let outputObj;
    if (getTotalSavings <= 0) {
      outputObj = 0;
    } else {
      outputObj = getTotalSavings[0].totalSavings;
    }
    logger.trace(`${correlationID}: <<<< Exiting FixedSavingsService.${getFuncName()}`);
    const response = {};
    response.data = outputObj;
    response.message = 'Total FixedSavings retrieved Successfully';
    response.success = true;
    return response;
  } catch (err) {
    throw new Error(err.message);
  }
};

exports.getFixedSavingsWithdrawals = async (correlationID) => {
  logger.trace(`${correlationID}: <<<< Entering GetFixedSavingsWithdrawals.${getFuncName()}`);
  try {
    const listOfFixedSavingsWithdrwals = await Transaction.find({ savings: 'FIXED-SAVINGS', description: 'WITHDRAWAL', transactionStatus: 'PENDING' });
    if (!listOfFixedSavingsWithdrwals) throw new Error('No Record Found');
    logger.trace(`${correlationID}: <<<< Exiting userManagementService.getUser()`);
    const response = {};
    response.data = listOfFixedSavingsWithdrwals;
    response.message = 'Fixed Savings Withdrawals Retrieved Successfully';
    response.success = true;
    return response;
  } catch (err) {
    throw new Error(err.message);
  }
};

exports.getTargetSavingsWithdrawals = async (correlationID) => {
  logger.trace(`${correlationID}: <<<< Entering GetTargetSavingsWithdrawals.${getFuncName()}`);
  try {
    const listOfTargetSavingsWithdrwals = await Transaction.find({ savings: 'TARGET-SAVINGS', description: 'WITHDRAWAL', transactionStatus: 'PENDING' });
    if (!listOfTargetSavingsWithdrwals) throw new Error('No Record Found');
    logger.trace(`${correlationID}: <<<< Exiting userManagementService.getUser()`);
    const response = {};
    response.data = listOfTargetSavingsWithdrwals;
    response.message = 'Target Savings Withdrawals Retrieved Successfully';
    response.success = true;
    return response;
  } catch (err) {
    throw new Error(err.message);
  }
};
