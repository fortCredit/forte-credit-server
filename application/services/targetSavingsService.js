/* eslint-disable no-underscore-dangle */
/* eslint-disable func-names */
const TargetSavings = require('../models/TargetSavings.model');
const User = require('../models/User.model');
const Card = require('../models/Card.model');
const Transaction = require('../models/Transaction.model');
// const mailScheduler = require('../utils/mailer');
const logger = require('../utils/logger');
const { INTERESTRATES } = require('../config');
const { chargeAuthorize } = require('./transaction-service');
// const capitalizeFirstLetter = (string) => string[0].toUpperCase() + string.slice(1);
function getFuncName() {
  return getFuncName.caller.name;
}

const createTargetSavings = async (savingObj, correlationID) => {
  logger.trace(`${correlationID}: <<<< Entering TargetSavingsService.${getFuncName()}`);
  const {
    user, amount, savingsLength, nextSavingDate,
    frequency, card, targetReason, targetAmount, image, targetTitle,
  } = savingObj;
  // get user
  const getUser = await User.findOne({ _id: user });
  if (!getUser) throw new Error('Sorry, your account does not exist.');

  const newPlan = new TargetSavings(savingObj);
  newPlan.targetTitle = targetTitle;
  newPlan.targetAmount = targetAmount;
  newPlan.targetReason = targetReason;
  newPlan.isAutomated = 'ACTIVE';
  newPlan.frequency = frequency;
  newPlan.amount = amount;
  newPlan.interestRate = INTERESTRATES['TARGET-SAVINGS'];
  newPlan.card = card;
  newPlan.image = image;
  // newPlan.startDate = new Date(nextSavingDate);
  const startDate = new Date(nextSavingDate);
  const savingsEndDate = startDate.setDate(startDate.getDate() + (savingsLength));
  newPlan.startDate = savingsEndDate;
  await newPlan.save();
  // TODO: Perform card transaction to activate card for recurring transaction
  logger.trace(`${correlationID}: <<<< Exiting TargetSavingsService.${getFuncName()}`);
  const response = {};
  response.data = newPlan;
  response.message = 'Target Savings Added Successfully';
  response.success = true;
  return response;
};

const getTargetSavingsPlan = async (user, pageOpt, correlationID) => {
  logger.trace(`${correlationID}: <<<< Entering TargetSavingsService.${getFuncName()}`);
  const planCount = await TargetSavings.countDocuments({ user });
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
  const getUserPlan = await TargetSavings.paginate({ user }, options);
  logger.trace(`${correlationID}: <<<< Exiting TargetSavingsService.${getFuncName()}`);
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
  logger.trace(`${correlationID}: <<<< Entering TargetSavingsService.${getFuncName()}`);
  const getTransactonHistory = await Transaction.paginate(
    {
      user, transactionType: tranxType,
    }, options,
  );
  logger.trace(`${correlationID}: <<<< Exiting TargetSavingsService.${getFuncName()}`);
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
  logger.trace(`${correlationID}: <<<< Entering TargetSavingsService.${getFuncName()}`);
  const getTransactonHistory = await Transaction.paginate({ user, description: filter }, options);
  logger.trace(`${correlationID}: <<<< Exiting TargetSavingsService.${getFuncName()}`);
  const response = {};
  response.data = getTransactonHistory;
  response.message = 'Transaction History retrieved successfully';
  response.success = true;
  return response;
};

const listTargetSavings = async (user, pageOpt, correlationID) => {
  logger.trace(`${correlationID}: <<<< Entering TargetSavingsService.${getFuncName()}`);
  const targetPlan = await TargetSavings.countDocuments({ user });
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
  const targetSavingsPlan = await TargetSavings.paginate({ user }, options);
  logger.trace(`${correlationID}: <<<< Exiting TargetSavingsService.${getFuncName()}`);
  const response = {};
  response.data = targetSavingsPlan;
  response.message = 'Target Savings retrieved successfully';
  response.success = true;
  return response;
};

const topUp = async (planObj, correlationID) => {
  logger.trace(`${correlationID}: <<<< Entering TargetSavingsService.${getFuncName()}`);
  try {
    const {
      user, amount, card, targetSavingsID,
    } = planObj;
    const getCard = await Card.findOne({ _id: card, user });
    if (!getCard) throw new Error('No Card Found, Kindly Add a Card');

    // const reqBody = { email: getUser.email, amount, authorizationId };
    const getTargetSavings = await TargetSavings.findOne(
      { _id: targetSavingsID, user },
    );
    if (getTargetSavings.totalSavingsTillDate === getTargetSavings.targetAmount) {
      await TargetSavings.findOneAndUpdate(
        { _id: targetSavingsID, user }, { status: 'INACTIVE' },
      );
      throw new Error('You Have Reached Your Target Amount');
    } else {
      let paystackStatus = '';
      let paystackReference = '';

      const autoCharge = await chargeAuthorize(getCard._id, amount);
      if (autoCharge.status === 'success') {
        paystackStatus = 'SUCCESSFUL';
      } else paystackStatus = 'FAILED';

      const updateSavings = getTargetSavings.totalSavingsTillDate + amount;
      const result = await TargetSavings.findOneAndUpdate(
        { _id: targetSavingsID, user }, { totalSavingsTillDate: updateSavings },
      );

      if (!result) throw new Error('Kindly Select a Target Savings to Top-Up');
      // log transaction
      paystackReference = autoCharge.reference;
      const newTranx = new Transaction();
      newTranx.user = user;
      newTranx.transactionStatus = paystackStatus;
      newTranx.savings = 'TARGET-SAVINGS';
      newTranx.savingsID = targetSavingsID;
      newTranx.paystackReference = paystackReference;
      newTranx.transactionType = 'CREDIT';
      newTranx.description = 'TOP-UP';
      newTranx.amount = amount;
      newTranx.save();

      logger.trace(`${correlationID}: <<<< Exiting TargetSavingsService.${getFuncName()}`);
      const response = {};
      response.data = newTranx;
      response.message = 'Transaction Made Successfully';
      response.success = true;
      return response;
    }
  } catch (err) {
    throw new Error(err.message);
  }
};

const totalSavings = async (userID, correlationID) => {
  logger.trace(`${correlationID}: <<<< Entering TargetSavingsService.${getFuncName()}`);
  try {
    const getTotalSavings = await TargetSavings.aggregate([
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
    // if (getTotalSavings <= 0) throw new Error('No Savings, Kindly Fund your account');
    const outputObj = getTotalSavings[0].count;
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
module.exports = {
  createTargetSavings,
  getTargetSavingsPlan,
  getPlanTranxHistory,
  filterTransactionHistory,
  listTargetSavings,
  topUp,
  totalSavings,
};
