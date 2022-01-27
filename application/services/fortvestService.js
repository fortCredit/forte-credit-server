/* eslint-disable no-underscore-dangle */
/* eslint-disable func-names */
const Fortvest = require('../models/Fortvest.model');
const User = require('../models/User.model');
const Transaction = require('../models/Transaction.model');
const Withdraw = require('../models/Withdrawal.model');
// const mailScheduler = require('../utils/mailer');
const logger = require('../utils/logger');

// const capitalizeFirstLetter = (string) => string[0].toUpperCase() + string.slice(1);
function getFuncName() {
  return getFuncName.caller.name;
}

const addFortvestPlan = async (investmentObj, correlationID) => {
  logger.trace(`${correlationID}: <<<< Entering fortVestService.${getFuncName()}`);

  // ensure user does not have a fortVestPlan before
  const {
    user, planType, amount, investmentLength, nextInvestmentDate,
  } = investmentObj;
  // get user
  const getUser = await User.findOne({ _id: user });
  if (!getUser.accountRecord || !getUser.accountRecord.bvn) throw new Error('Sorry, your account record needs to be completed first.');
  const getUserPlan = await Fortvest.findOne({ user, planType, status: 'ACTIVE' });
  if (getUserPlan) throw new Error(`Sorry! You already have an active ${planType.toLowerCase()} plan`);
  const newPlan = new Fortvest(investmentObj);

  if (planType === 'FIXED-INVEST') {
    if (amount < 50000000) throw new Error('Sorry, the minimum deposit amount for fixed invest is N500,000.00');
    if (investmentLength < 90) throw new Error('Sorry, the minimum duration for fixed invest is 90 days');
    newPlan.interestRate = 0.10;
  } else if (planType === 'TARGET-INVEST') {
    if (amount < 50000) throw new Error('Sorry, the minimum deposit amount for target invest is N500.00');
    newPlan.interestRate = 0.05;
  } else if (planType === 'HIGH-YIELD') {
    if (amount < 10000000) throw new Error('Sorry, the minimum deposit amount for high yield is N100,000.00');
    if (investmentLength < 365) throw new Error('Sorry, the minimum duration for high yield is 1 year');
    newPlan.interestRate = 0.12;
  }
  const startDate = new Date(nextInvestmentDate);
  const investMentEndDate = startDate.setDate(startDate.getDate() + (investmentLength));
  newPlan.investMentEndDate = investMentEndDate;
  await newPlan.save();
  // TODO: Perform card transaction to activate card for recurring transaction
  logger.trace(`${correlationID}: <<<< Exiting fortVestService.${getFuncName()}`);
  const response = {};
  response.data = newPlan;
  response.message = 'New Plan added successfully';
  response.success = true;
  return response;
};

const getFortvestPlan = async (user, correlationID) => {
  logger.trace(`${correlationID}: <<<< Entering fortVestService.${getFuncName()}`);
  const getUserPlan = await Fortvest.find({ user });
  logger.trace(`${correlationID}: <<<< Exiting fortVestService.${getFuncName()}`);
  const response = {};
  response.data = getUserPlan;
  response.message = 'User Plan retrieved successfully';
  response.success = true;
  return response;
};

const getPlanTranxHistory = async (user, type, pageOpt, correlationID) => {
  const tranxType = type === 'INVESTMENT' ? 'CREDIT' : 'DEBIT';
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

module.exports = {
  addFortvestPlan,
  getFortvestPlan,
  getPlanTranxHistory,
  filterTransactionHistory,
  withdrawal,
};
