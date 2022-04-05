/* eslint-disable no-underscore-dangle */
/* eslint-disable func-names */
const FixedSavings = require('../models/FixedSavings.model');
const User = require('../models/User.model');
const Card = require('../models/Card.model');
const Transaction = require('../models/Transaction.model');
const Withdraw = require('../models/Withdrawal.model');
// const mailScheduler = require('../utils/mailer');
const logger = require('../utils/logger');
const { chargeAuthorize } = require('./transaction-service');
const { INTERESTRATES } = require('../config');
// const capitalizeFirstLetter = (string) => string[0].toUpperCase() + string.slice(1);
function getFuncName() {
  return getFuncName.caller.name;
}

const createFixedSavings = async (savingObj, correlationID) => {
  logger.trace(`${correlationID}: <<<< Entering createFixedSavingsService.${getFuncName()}`);

  // ensure user does not have a fortVestPlan before
  const {
    user, amount, savingsLength, nextSavingDate,
    frequency, card,
  } = savingObj;
  // get user
  const getUser = await User.findOne({ _id: user });
  if (!getUser) throw new Error('Sorry, your account does not exist.');

  const newPlan = new FixedSavings(savingObj);
  newPlan.frequency = frequency;
  newPlan.amount = amount;
  newPlan.interestRate = INTERESTRATES['FIXED-SAVINGS'];
  newPlan.card = card;
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
  const getUserPlan = await FixedSavings.findOne({ user, planType });
  if (!getUserPlan) throw new Error('Sorry, wrong plan. Kindly contact support');

  // get user total investment
  const getTotalInvestment = await FixedSavings.find({ user });
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

const activateAutoSave = async (
  user,
  // autosaveStatus,
  correlationID,
) => {
  try {
    logger.trace(
      `${correlationID}: <<<< entering updateAutosaveStatus() service`,
    );
    const getUser = await User.findOne({ _id: user });
    if (!getUser) throw new Error('Sorry, your account does not exist.');

    const autosaveStatus = await FixedSavings.findOne(
      { user },
    ).sort({ _id: -1 });

    let updateAutosaveStatus = '';
    if (autosaveStatus.isAutomated === 'ACTIVE') {
      updateAutosaveStatus = await FixedSavings.findOneAndUpdate(
        { user },
        { isAutomated: 'INACTIVE' },
        { new: true },
      ).sort({ _id: -1 });
    } else {
      updateAutosaveStatus = await FixedSavings.findOneAndUpdate(
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

const listFixedSavings = async (user, pageOpt, correlationID) => {
  logger.trace(`${correlationID}: <<<< Entering fortVestService.${getFuncName()}`);
  const fixedPlan = await FixedSavings.countDocuments({ user });
  const { page, size } = pageOpt;
  const options = {
    page: page || 1,
    limit: size || 10,
    collation: {
      locale: 'en',
    },
    async useCustomCountFn() {
      return Promise.resolve(fixedPlan);
    },
  };
  const fixedSavingsPlan = await FixedSavings.paginate({ user }, options);
  logger.trace(`${correlationID}: <<<< Exiting fortVestService.${getFuncName()}`);
  const response = {};
  response.data = fixedSavingsPlan;
  response.message = 'Fixed Savings retrieved successfully';
  response.success = true;
  return response;
};

const totalSavings = async (userID, correlationID) => {
  logger.trace(`${correlationID}: <<<< Entering FixedSavingsService.${getFuncName()}`);
  try {
    const getTotalSavings = await FixedSavings.aggregate([
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
            count: { $sum: '$totalSavingsTillDate' },
          },
      },
    ]);
    const outputObj = getTotalSavings[0].count;
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

const saveNow = async (planObj, correlationID) => {
  logger.trace(`${correlationID}: <<<< Entering FixedSavingsService.${getFuncName()}`);
  try {
    const {
      user, amount, card,
    } = planObj;
    const getCard = await Card.findOne({ _id: card, user });
    if (!getCard) throw new Error('No Card Found, Kindly Add a Card');

    // const reqBody = { email: getUser.email, amount, authorizationId };

    let paystackStatus = '';
    let paystackReference = '';

    const autoCharge = await chargeAuthorize(getCard._id, amount);
    if (autoCharge.status === 'success') {
      paystackStatus = 'SUCCESSFUL';
    } else paystackStatus = 'FAILED';

    // const getTotalSavings = await FixedSavings.findOne({})
    const getTotalSavings = await FixedSavings.aggregate([
      {
        $match:
        {
          user,
        },
      },
      {
        $group:
          {
            _id: 'count',
            count: { $sum: '$totalSavingsTillDate' },
          },
      },
    ]);
    let updateSavings;
    let newTranx;
    if (getTotalSavings) {
      updateSavings = getTotalSavings[0].count + amount;
      const result = await FixedSavings.findOneAndUpdate(
        { user }, { totalSavingsTillDate: updateSavings },
      );

      if (!result) throw new Error('Kindly Select a Fixed Savings to SaveNow');
      // log transaction
      paystackReference = autoCharge.reference;
      newTranx = new Transaction();
      newTranx.user = user;
      newTranx.transactionStatus = paystackStatus;
      newTranx.savings = 'FIXED-SAVINGS';
      newTranx.paystackReference = paystackReference;
      newTranx.transactionType = 'CREDIT';
      newTranx.description = 'SAVE-NOW';
      newTranx.amount = amount;
      newTranx.save();
    }
    logger.trace(`${correlationID}: <<<< Exiting FixedSavingsService.${getFuncName()}`);
    const response = {};
    response.data = newTranx;
    response.message = 'Transaction Made Successfully';
    response.success = true;
    return response;
  } catch (err) {
    throw new Error(err.message);
  }
};

module.exports = {
  createFixedSavings,
  getPlanTranxHistory,
  filterTransactionHistory,
  withdrawal,
  activateAutoSave,
  listFixedSavings,
  saveNow,
  totalSavings,
};
