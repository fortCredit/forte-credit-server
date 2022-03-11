/* eslint-disable func-names */
/* eslint-disable no-unused-expressions */
/* eslint-disable no-underscore-dangle */
const response = require('../utils/responseAdapter');
const logger = require('../utils/logger');

const {
  requiredFieldValidator,
} = require('../utils/validators');
const fortVestService = require('../services/fortvestService');

// VALIDATE BVN
// SEND TOKEN TO BVN REG NUM
// ACTUAL REGISTER
function getFuncName() {
  return getFuncName.caller.name;
}

const addFortvestPlan = async (req, res) => {
  const correlationID = req.header('x-correlation-id');
  const user = req.user._id;
  try {
    logger.trace(`${correlationID}: <<<<<<-- Started ${getFuncName()} flow -->>>>>>`);

    logger.trace(`${correlationID}: Run Validation on required fields `);
    await requiredFieldValidator(
      ['planType', 'frequency', 'amount', 'savingsLength', 'startDate', 'card'],
      Object.keys(req.body),
      req.body,
      correlationID,
    );
    const {
      planType,
      isAutomated,
      frequency,
      amount,
      savingsLength,
      card,
      startDate,
      targetTitle,
      targetReason,
      targetAmount,
    } = req.body;
    logger.trace(`${correlationID}: Validation Successful`);
    const planObj = {};
    planObj.planType = planType.toUpperCase();
    planObj.isAutomated = isAutomated;
    planObj.frequency = frequency;
    planObj.amount = amount;
    planObj.savingsLength = savingsLength;
    planObj.nextInvestmentDate = new Date(startDate);
    planObj.user = user;
    planObj.card = card;
    planObj.targetAmount = targetAmount;
    planObj.targetReason = targetReason;
    planObj.targetTitle = targetTitle;
    const responseData = await fortVestService.addFortvestPlan(planObj, correlationID);

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
    const responseData = await fortVestService.getFortvestPlan(user, correlationID);

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
    const responseData = await fortVestService
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
    const responseData = await fortVestService
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
    const responseData = await fortVestService.withdrawal(withdrawObj, correlationID);

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

exports.totalSavings = async (req, res) => {
  const correlationID = req.header('x-correlation-id');
  const userID = req.user._id;
  try {
    const responseData = await fortVestService.totalSavings(userID, correlationID);
    logger.trace(`${correlationID}: ${responseData.message}`);
    return res.json(response.success(responseData.data, responseData.message));
  } catch (err) {
    logger.debug(`${correlationID}: ${err}`);
    const message = err.message || 'Something Failed';
    const error = {
      data: err.data || {},
      name: err.name || 'UnknownError',
      message,
    };
    return res.json(response.error(error, message));
  }
};

// const activateAutoSave = async (req, res) => {
//   const correlationID = req.header('x-correlation-id');
//   const user = req.user._id;
//   try {
//     logger.trace(`${correlationID}: Validation Successful`);
//     const responseData = await fortVestService.activateAutoSave(user, correlationID);

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

const activateAutoSave = async (req, res) => {
  const correlationID = req.header('x-correlation-id');
  const user = req.user._id;
  try {
    logger.trace(`${correlationID}: <<<<<<-- Started update autosave status flow -->>>>>>`);
    // let autosaveStatus = '';
    // if (req.originalUrl.includes('autosave')) autosaveStatus = 'ACTIVE';
    // else autosaveStatus = 'INACTIVE';

    logger.trace(`${correlationID}: >>>> Call to FortvestService.activate Autosave Status()`);
    const responseData = await fortVestService.activateAutoSave(
      user, correlationID,
    );

    logger.trace(`${correlationID}: ${responseData.message}`);
    return res.json(response.success(responseData.data, responseData.message));
  } catch (err) {
    logger.debug(`${correlationID}: ${err}`);
    const message = err.message || 'Something Failed';
    const error = {
      data: err.data || {},
      name: err.name || 'UnknownError',
      message,
    };
    return res.json(response.error(error, message));
  }
};

module.exports = {
  addFortvestPlan,
  getFortvestPlan,
  getPlanTranxHistory,
  filterTranxHistory,
  withdrawal,
  activateAutoSave,
};
