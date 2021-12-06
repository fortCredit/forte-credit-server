/* eslint-disable no-underscore-dangle */
/* eslint-disable func-names */
const Fortvest = require('../models/Fortvest.model');
const User = require('../models/User.model');
const Transaction = require('../models/Transaction.model');
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
  if (planType === 'FIXED-INVEST') {
    if (amount < 50000000) throw new Error('Sorry, the minimum deposit amount for fixed invest is N500,000.00');
    if (investmentLength < 90) throw new Error('Sorry, the minimum duration for fixed invest is 90 days');
  } else if (planType === 'TARGET-INVEST') {
    if (amount < 50000) throw new Error('Sorry, the minimum deposit amount for target invest is N500.00');
  } else if (planType === 'HIGH-YIELD') {
    if (amount < 10000000) throw new Error('Sorry, the minimum deposit amount for high yield is N100,000.00');
    if (investmentLength < 365) throw new Error('Sorry, the minimum duration for high yield is 1 year');
  }
  const startDate = new Date(nextInvestmentDate);
  const investMentEndDate = startDate.setDate(startDate.getDate() + (investmentLength));
  const newPlan = new Fortvest(investmentObj);
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
  logger.trace(`${correlationID}: <<<< Entering fortVestService.${getFuncName}`);
  const getUserPlan = await Fortvest.find({ user });
  logger.trace(`${correlationID}: <<<< Exiting fortVestService.${getFuncName}`);
  const response = {};
  response.data = getUserPlan;
  response.message = 'User Plan retrieved successfully';
  response.success = true;
  return response;
};

const getPlanTranxHistory = async (user, investment, correlationID) => {
  logger.trace(`${correlationID}: <<<< Entering fortVestService.${getFuncName}`);
  const getTransactonHistory = await Transaction.find({ user, investment });
  logger.trace(`${correlationID}: <<<< Exiting fortVestService.${getFuncName}`);
  const response = {};
  response.data = getTransactonHistory;
  response.message = 'Transaction History retrieved successfully';
  response.success = true;
  return response;
};
module.exports = {
  addFortvestPlan,
  getFortvestPlan,
  getPlanTranxHistory,
};
