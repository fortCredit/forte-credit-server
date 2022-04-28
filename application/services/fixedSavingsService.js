/* eslint-disable no-underscore-dangle */
/* eslint-disable func-names */
const FixedSavings = require('../models/FixedSavings.model');
const User = require('../models/User.model');
const Card = require('../models/Card.model');
const Transaction = require('../models/Transaction.model');
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

  const getFixedSavings = await FixedSavings.findOne({ user });
  let autosave;
  if (getFixedSavings) {
    autosave = await FixedSavings.findOneAndUpdate(
      { user }, savingObj, { new: true },
    );
    if (!autosave) {
      logger.error(`${correlationID}: <<<< Savings not found`);
      throw new Error('Savings not found');
    }
  } else {
    autosave = new FixedSavings(savingObj);
    autosave.frequency = frequency;
    autosave.amount = amount;
    autosave.interestRate = 0;
    autosave.card = card;
    const startDate = new Date(nextSavingDate);
    const savingsEndDate = startDate.setDate(startDate.getDate() + (savingsLength));
    autosave.startDate = savingsEndDate;
    await autosave.save();
  }
  // TODO: Perform card transaction to activate card for recurring transaction
  logger.trace(`${correlationID}: <<<< Exiting fortVestService.${getFuncName()}`);
  const response = {};
  response.data = autosave;
  response.message = 'AutoSave Settings Added Successfully';
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
    const getTotalSavings = await FixedSavings.findOne({ user: userID });
    // console.log(getTotalSavings);
    let outputObj;
    if (!getTotalSavings.totalSavingsTillDate) {
      outputObj = 0;
    } else {
      outputObj = getTotalSavings.totalSavingsTillDate;
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

    const getTotalSavings = await FixedSavings.findOne({ user });

    let updateSavings;
    // let result;

    if (getTotalSavings) {
      const totalSaving = getTotalSavings.totalSavingsTillDate;
      // if (totalSaving === null) {
      //   updateSavings = 0 + amount;
      //   result = await FixedSavings.findOne({ user });
      //   result.totalSavingsTillDate = updateSavings;
      //   result.save();
      // } else {
      updateSavings = totalSaving + amount;
      const updateInterest = (updateSavings * INTERESTRATES['FIXED-SAVINGS']);
      await FixedSavings.findOneAndUpdate(
        { user }, { totalSavingsTillDate: updateSavings, interestRate: updateInterest },
      );
      // }
    } else if (!getTotalSavings) {
      const interest = (amount * INTERESTRATES['FIXED-SAVINGS']);
      const newPlan = new FixedSavings();
      newPlan.user = user;
      newPlan.amount = amount;
      newPlan.card = card;
      newPlan.totalSavingsTillDate = amount;
      newPlan.interestRate = interest;
      await newPlan.save();
    }

    // log transaction
    paystackReference = autoCharge.reference;
    const newTranx = new Transaction();
    newTranx.user = user;
    newTranx.transactionStatus = paystackStatus;
    newTranx.savings = 'FIXED-SAVINGS';
    newTranx.paystackReference = paystackReference;
    newTranx.transactionType = 'CREDIT';
    newTranx.description = 'SAVE-NOW';
    newTranx.amount = amount;
    newTranx.save();

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
  activateAutoSave,
  listFixedSavings,
  saveNow,
  totalSavings,
};
