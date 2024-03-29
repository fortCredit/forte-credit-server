/* eslint-disable func-names */
/* eslint-disable no-unused-expressions */
/* eslint-disable no-underscore-dangle */
const response = require('../utils/responseAdapter');
const logger = require('../utils/logger');

const {
  requiredFieldValidator,
} = require('../utils/validators');
const targetSavingsService = require('../services/targetSavingsService');

// VALIDATE BVN
// SEND TOKEN TO BVN REG NUM
// ACTUAL REGISTER
function getFuncName() {
  return getFuncName.caller.name;
}

const createTargetSavings = async (req, res) => {
  const correlationID = req.header('x-correlation-id');
  const user = req.user._id;
  try {
    logger.trace(`${correlationID}: <<<<<<-- Started ${getFuncName()} flow -->>>>>>`);

    logger.trace(`${correlationID}: Run Validation on required fields `);
    await requiredFieldValidator(
      ['frequency', 'amount', 'savingsLength', 'startDate', 'card'],
      Object.keys(req.body),
      req.body,
      correlationID,
    );
    const {
      isAutomated,
      frequency,
      amount,
      savingsLength,
      card,
      startDate,
      targetTitle,
      targetReason,
      targetAmount,
      image,
    } = req.body;
    logger.trace(`${correlationID}: Validation Successful`);
    const planObj = {};
    planObj.isAutomated = isAutomated;
    planObj.frequency = frequency;
    planObj.amount = amount;
    planObj.savingsLength = savingsLength;
    planObj.nextSavingDate = new Date(startDate);
    planObj.user = user;
    planObj.card = card;
    planObj.targetAmount = targetAmount;
    planObj.targetReason = targetReason;
    planObj.targetTitle = targetTitle;
    planObj.image = image;
    const responseData = await targetSavingsService.createTargetSavings(planObj, correlationID);

    logger.trace(`${correlationID}: ${responseData}`);
    return res.json(response.success(responseData.data, responseData.message));
  } catch (err) {
    logger.debug(`${correlationID}: ${err}`);
    const error = {};
    let message = '';
    err.data ? (error.data = err.data) : (error.data = {});
    err.name ? (error.name = err.name) : (error.name = 'UnknownError');
    err.message ? (message = err.message) : (message = 'Something Failed');
    return res.json(response.error(error, message));
  }
};

const topUp = async (req, res) => {
  const correlationID = req.header('x-correlation-id');
  const user = req.user._id;
  try {
    logger.trace(`${correlationID}: <<<<<<-- Started ${getFuncName()} flow -->>>>>>`);

    logger.trace(`${correlationID}: Run Validation on required fields `);
    await requiredFieldValidator(
      ['amount', 'card', 'targetSavingsID'],
      Object.keys(req.body),
      req.body,
      correlationID,
    );
    const {
      amount,
      card,
      targetSavingsID,

    } = req.body;
    logger.trace(`${correlationID}: Validation Successful`);
    const planObj = {};
    // planObj.planType = planType.toUpperCase();
    planObj.card = card;
    planObj.amount = amount;
    planObj.user = user;
    planObj.targetSavingsID = targetSavingsID;
    const responseData = await targetSavingsService.topUp(planObj, correlationID);

    logger.trace(`${correlationID}: ${responseData}`);
    return res.json(response.success(responseData.data, responseData.message));
  } catch (err) {
    logger.debug(`${correlationID}: ${err}`);
    const error = {};
    let message = '';
    err.data ? (error.data = err.data) : (error.data = {});
    err.name ? (error.name = err.name) : (error.name = 'UnknownError');
    err.message ? (message = err.message) : (message = 'Something Failed');
    return res.json(response.error(error, message));
  }
};

const getFortvestPlan = async (req, res) => {
  const correlationID = req.header('x-correlation-id');
  const user = req.user._id;
  try {
    const responseData = await targetSavingsService.getFortvestPlan(user, correlationID);

    logger.trace(`${correlationID}: ${responseData.message}`);
    return res.json(response.success(responseData.data, responseData.message));
  } catch (err) {
    logger.debug(`${correlationID}: ${err}`);
    const error = {};
    let message = '';
    err.data ? (error.data = err.data) : (error.data = {});
    err.name ? (error.name = err.name) : (error.name = 'UnknownError');
    err.message ? (message = err.message) : (message = 'Something Failed');
    return res.json(response.error(error, message));
  }
};

const getPlanTranxHistory = async (req, res) => {
  const correlationID = req.header('x-correlation-id');
  const user = req.user._id;
  try {
    const { page, size, type } = req.params;
    const responseData = await targetSavingsService
      .getPlanTranxHistory(user, type.toUpperCase(), { page, size }, correlationID);

    logger.trace(`${correlationID}: ${responseData.message}`);
    return res.json(response.success(responseData.data, responseData.message));
  } catch (err) {
    logger.debug(`${correlationID}: ${err}`);
    const error = {};
    let message = '';
    err.data ? (error.data = err.data) : (error.data = {});
    err.name ? (error.name = err.name) : (error.name = 'UnknownError');
    err.message ? (message = err.message) : (message = 'Something Failed');
    return res.json(response.error(error, message));
  }
};

const filterTranxHistory = async (req, res) => {
  const correlationID = req.header('x-correlation-id');
  const user = req.user._id;
  try {
    const { page, size, filter } = req.params;
    const responseData = await targetSavingsService
      .filterTransactionHistory(user, filter.toUpperCase(), { page, size }, correlationID);

    logger.trace(`${correlationID}: ${responseData.message}`);
    return res.json(response.success(responseData.data, responseData.message));
  } catch (err) {
    logger.debug(`${correlationID}: ${err}`);
    const error = {};
    let message = '';
    err.data ? (error.data = err.data) : (error.data = {});
    err.name ? (error.name = err.name) : (error.name = 'UnknownError');
    err.message ? (message = err.message) : (message = 'Something Failed');
    return res.json(response.error(error, message));
  }
};

const withdrawal = async (req, res) => {
  const correlationID = req.header('x-correlation-id');
  const user = req.user._id;
  try {
    logger.trace(`${correlationID}: <<<<<<-- Started ${getFuncName()} flow -->>>>>>`);

    logger.trace(`${correlationID}: Run Validation on required fields `);
    await requiredFieldValidator(
      ['amount', 'investmentID', 'planType'],
      Object.keys(req.body),
      req.body,
      correlationID,
    );
    const {
      investmentID,
      planType,
      amount,
      bankName,
      accountNumber,
    } = req.body;
    logger.trace(`${correlationID}: Validation Successful`);
    const withdrawObj = {};
    withdrawObj.planType = planType.toUpperCase();
    withdrawObj.amount = amount;
    withdrawObj.bankName = bankName;
    withdrawObj.accountNumber = accountNumber;
    withdrawObj.investmentID = investmentID;
    withdrawObj.user = user;
    const responseData = await targetSavingsService.withdrawal(withdrawObj, correlationID);

    logger.trace(`${correlationID}: ${responseData}`);
    return res.json(response.success(responseData.data, responseData.message));
  } catch (err) {
    logger.debug(`${correlationID}: ${err}`);
    const error = {};
    let message = '';
    err.data ? (error.data = err.data) : (error.data = {});
    err.name ? (error.name = err.name) : (error.name = 'UnknownError');
    err.message ? (message = err.message) : (message = 'Something Failed');
    return res.json(response.error(error, message));
  }
};

const totalSavings = async (req, res) => {
  const correlationID = req.header('x-correlation-id');
  const userID = req.user._id;
  try {
    const responseData = await targetSavingsService.totalSavings(userID, correlationID);
    logger.trace(`${correlationID}: ${responseData}`);
    return res.json(response.success(responseData.data, responseData.message));
  } catch (err) {
    logger.debug(`${correlationID}: ${err}`);
    const error = {};
    let message = '';
    err.data ? (error.data = err.data) : (error.data = {});
    err.name ? (error.name = err.name) : (error.name = 'UnknownError');
    err.message ? (message = err.message) : (message = 'Something Failed');
    return res.json(response.error(error, message));
  }
};

// const activateAutoSave = async (req, res) => {
//   const correlationID = req.header('x-correlation-id');
//   const user = req.user._id;
//   try {
//     logger.trace(`${correlationID}: Validation Successful`);
//     const responseData = await targetSavingsService.activateAutoSave(user, correlationID);

//     logger.trace(`${correlationID}: ${responseData.message}`);
//     return res.json(response.success(responseData.data, responseData.message));
//   } catch (err) {
//     logger.debug(`${correlationID}: ${err}`);
//     const error = {};
//     let message = '';
//     err.data ? (error.data = err.data) : (error.data = {});
//     err.name ? (error.name = err.name) : (error.name = 'UnknownError');
//     err.message ? (message = err.message) : (message = 'Something Failed');
//     return res.json(response.error(error, message));
//   }
// };

const listTargetSavings = async (req, res) => {
  const correlationID = req.header('x-correlation-id');
  const user = req.user._id;
  try {
    const responseData = await targetSavingsService.listTargetSavings(user, correlationID);

    logger.trace(`${correlationID}: ${responseData.message}`);
    return res.json(response.success(responseData.data, responseData.message));
  } catch (err) {
    logger.debug(`${correlationID}: ${err}`);
    const error = {};
    let message = '';
    err.data ? (error.data = err.data) : (error.data = {});
    err.name ? (error.name = err.name) : (error.name = 'UnknownError');
    err.message ? (message = err.message) : (message = 'Something Failed');
    return res.json(response.error(error, message));
  }
};

module.exports = {
  createTargetSavings,
  getFortvestPlan,
  getPlanTranxHistory,
  filterTranxHistory,
  withdrawal,
  listTargetSavings,
  topUp,
  totalSavings,
};
