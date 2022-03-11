/* eslint-disable no-underscore-dangle */
/* eslint-disable func-names */
const Fortvest = require('../models/Fortvest.model');
const User = require('../models/User.model');
const Transaction = require('../models/Transaction.model');
const Withdraw = require('../models/Withdrawal.model');
// const mailScheduler = require('../utils/mailer');
const logger = require('../utils/logger');
const { INTERESTRATES } = require('../config');
// const capitalizeFirstLetter = (string) => string[0].toUpperCase() + string.slice(1);
function getFuncName() {
  return getFuncName.caller.name;
}

const addFortvestPlan = async (savingObj, correlationID) => {
  logger.trace(`${correlationID}: <<<< Entering fortVestService.${getFuncName()}`);

  // ensure user does not have a fortVestPlan before
  const {
    user, planType, amount, savingsLength, nextSavingDate,
    frequency, card, targetReason, targetAmount, targetTitle,
  } = savingObj;
  // get user
  const getUser = await User.findOne({ _id: user });
  // if (!getUser.accountRecord || !getUser.accountRecord.bvn)
  if (!getUser) throw new Error('Sorry, your account does not exist.');
  // const getUserPlan = await Fortvest.findOne({ user, planType, status: 'ACTIVE' });
  // if (getUserPlan) throw new Error(`Sorry!
  // You already have an active ${planType.toLowerCase()} plan`);

  const newPlan = new Fortvest(savingObj);
  if (planType === 'FIXED-SAVINGS') {
    newPlan.frequency = frequency;
    newPlan.amount = amount;
    newPlan.interestRate = INTERESTRATES['FIXED-SAVINGS'];
    newPlan.card = card;
  } else if (planType === 'TARGET-SAVINGS') {
    newPlan.targetTitle = targetTitle;
    newPlan.targetAmount = targetAmount;
    newPlan.targetReason = targetReason;
    newPlan.isAutomated = 'ACTIVE';
    newPlan.frequency = frequency;
    newPlan.amount = amount;
    newPlan.interestRate = INTERESTRATES['TARGET-SAVINGS'];
    newPlan.card = card;
  }
  const startDate = new Date(nextSavingDate);
  const savingsEndDate = startDate.setDate(startDate.getDate() + (savingsLength));
  newPlan.startDate = savingsEndDate;
  await newPlan.save();
  // TODO: Perform card transaction to activate card for recurring transaction
  logger.trace(`${correlationID}: <<<< Exiting fortVestService.${getFuncName()}`);
  const response = {};
  response.data = newPlan;
  response.message = 'New Plan Added Successfully';
  response.success = true;
  return response;
};

const getFortvestPlan = async (user, pageOpt, correlationID) => {
  logger.trace(`${correlationID}: <<<< Entering fortVestService.${getFuncName()}`);
  const planCount = await Fortvest.countDocuments({ user });
  const { page, size } = pageOpt;
  const options = {
    page: page || 1,
    limit: size || 10,
    collation: {
      locale: 'en',
    },
    async useCustomCountFn() {
      return Promise.resolve(planCount);
    },
  };
  const getUserPlan = await Fortvest.paginate({ user }, options);
  logger.trace(`${correlationID}: <<<< Exiting fortVestService.${getFuncName()}`);
  const response = {};
  response.data = getUserPlan;
  response.message = 'User Plan retrieved successfully';
  response.success = true;
  return response;
};

const getPlanTranxHistory = async (user, type, pageOpt, correlationID) => {
  const tranxType = type === 'SAVINGS' ? 'CREDIT' : 'DEBIT';
  const transactionCount = await Transaction.countDocuments({ user, transactionType: tranxType });
  const { page, size } = pageOpt;
  const options = {
    page: page || 1,
    limit: size || 10,
    collation: {
      locale: 'en',
    },
    async useCustomCountFn() {
      return Promise.resolve(transactionCount);
    },
  };
  logger.trace(`${correlationID}: <<<< Entering fortVestService.${getFuncName()}`);
  const getTransactonHistory = await Transaction.paginate(
    {
      user, transactionType: tranxType,
    }, options,
  );
  logger.trace(`${correlationID}: <<<< Exiting fortVestService.${getFuncName()}`);
  const response = {};
  response.data = getTransactonHistory;
  response.message = 'Transaction History retrieved successfully';
  response.success = true;
  return response;
};

const filterTransactionHistory = async (user, filter, pageOpt, correlationID) => {
  const transactionCount = await Transaction.countDocuments({ user, description: filter });
  const { page, size } = pageOpt;
  const options = {
    page: page || 1,
    limit: size || 10,
    collation: {
      locale: 'en',
    },
    async useCustomCountFn() {
      return Promise.resolve(transactionCount);
    },
  };
  logger.trace(`${correlationID}: <<<< Entering fortVestService.${getFuncName()}`);
  const getTransactonHistory = await Transaction.paginate({ user, description: filter }, options);
  logger.trace(`${correlationID}: <<<< Exiting fortVestService.${getFuncName()}`);
  const response = {};
  response.data = getTransactonHistory;
  response.message = 'Transaction History retrieved successfully';
  response.success = true;
  return response;
};

const withdrawal = async (withdrawObj, correlationID) => {
  logger.trace(`${correlationID}: <<<< Entering fortVestService.${getFuncName()}`);

  // Check if user does not have an existing Plan
  const {
    user, amount, planType,
  } = withdrawObj;
  // get user
  const getUser = await User.findOne({ _id: user });
  if (!getUser.accountRecord) throw new Error('Sorry, your account record needs to be completed first.');

  // get user plan type
  const getUserPlan = await Fortvest.findOne({ user, planType });
  if (!getUserPlan) throw new Error('Sorry, wrong plan. Kindly contact support');

  // get user total investment
  const getTotalInvestment = await Fortvest.find({ user });
  const balance = (getTotalInvestment[0].totalInvestmentTillDate);
  if (amount > balance) throw new Error('Sorry you don\'t have enough money in your investment plan');

  // New Balance after withdrawal
  const newBalance = balance - amount;

  // Create new instance of withdrawal
  const withdraw = new Withdraw(withdrawObj);
  // withdraw.planType = getUserPlan.planType;
  withdraw.bankName = getUser.accountRecord.bankName;
  withdraw.accountNumber = getUser.accountRecord.accountNumber;
  withdraw.balance = newBalance;
  await withdraw.save();

  logger.trace(`${correlationID}: <<<< Exiting fortVestService.${getFuncName()}`);
  const response = {};
  response.data = withdraw;
  response.message = 'Completed, your withdrawal application has been completed';
  response.success = true;
  return response;
};

// const activateAutoSave = async (user, correlationID) => {
//   logger.trace(`${correlationID}: <<<< Entering fortVestService.${getFuncName()}`);

//   const autosaveStatus = await Fortvest.findOne(
// { user, planType: 'FIXED-SAVINGS' }).sort({ _id: -1 });

//   let changeStatus = '';
//   if (autosaveStatus.isAutomated === 'ACTIVE') {
//     changeStatus = await Fortvest.UpdateOne({ user },
//       { $set: { isAutomated: 'ACTIVE' } });
//   }
//   changeStatus = await Fortvest.updateOne({ user },
//     { $set: { isAutomated: 'INACTIVE' } });

//   // TODO: Perform card transaction to activate card for recurring transaction
//   logger.trace(`${correlationID}: <<<< Exiting fortVestService.${getFuncName()}`);
//   const response = {};
//   response.data = changeStatus;
//   response.message = 'AutoSave Activated Successfully';
//   response.success = true;
//   return response;
// };

const activateAutoSave = async (
  user,
  // autosaveStatus,
  correlationID,
) => {
  try {
    logger.trace(
      `${correlationID}: <<<< entering updateAutosaveStatus() service`,
    );
    const autosaveStatus = await Fortvest.findOne(
      { user, planType: 'FIXED-SAVINGS' },
    ).sort({ _id: -1 });

    let updateAutosaveStatus = '';
    if (autosaveStatus.isAutomated === 'ACTIVE') {
      updateAutosaveStatus = await Fortvest.findOneAndUpdate(
        { user },
        { isAutomated: 'INACTIVE' },
        { new: true },
      ).sort({ _id: -1 });
    } else {
      updateAutosaveStatus = await Fortvest.findOneAndUpdate(
        { user },
        { isAutomated: 'ACTIVE' },
        { new: true },
      ).sort({ _id: -1 });
    }
    logger.trace(
      `${correlationID}: <<<< exiting updateAutosaveStatus() service`,
    );
    const response = {};
    response.message = 'Data updated successful';
    response.data = updateAutosaveStatus;
    response.success = true;
    return response;
  } catch (err) {
    throw new Error(err.message);
  }
};

const listTargetSavings = async (user, pageOpt, correlationID) => {
  logger.trace(`${correlationID}: <<<< Entering fortVestService.${getFuncName()}`);
  const targetPlan = await Fortvest.countDocuments({ user, planType: 'TARGET-SAVINGS' });
  const { page, size } = pageOpt;
  const options = {
    page: page || 1,
    limit: size || 10,
    collation: {
      locale: 'en',
    },
    async useCustomCountFn() {
      return Promise.resolve(targetPlan);
    },
  };
  const targetSavingsPlan = await Fortvest.paginate({ user, planType: 'TARGET-SAVINGS' }, options);
  logger.trace(`${correlationID}: <<<< Exiting fortVestService.${getFuncName()}`);
  const response = {};
  response.data = targetSavingsPlan;
  response.message = 'Target Savings retrieved successfully';
  response.success = true;
  return response;
};

module.exports = {
  addFortvestPlan,
  getFortvestPlan,
  getPlanTranxHistory,
  filterTransactionHistory,
  withdrawal,
  activateAutoSave,
  listTargetSavings,
};
