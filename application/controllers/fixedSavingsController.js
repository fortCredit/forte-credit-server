/* eslint-disable func-names */
/* eslint-disable no-unused-expressions */
/* eslint-disable no-underscore-dangle */
const response = require('../utils/responseAdapter');
const logger = require('../utils/logger');

const {
  requiredFieldValidator,
} = require('../utils/validators');
const fixedSavingsService = require('../services/fixedSavingsService');

// VALIDATE BVN
// SEND TOKEN TO BVN REG NUM
// ACTUAL REGISTER
function getFuncName() {
  return getFuncName.caller.name;
}

const createFixedSavings = async (req, res) => {
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
    const responseData = await fixedSavingsService.createFixedSavings(planObj, correlationID);

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

const updateFixedSavings = async (req, res) => {
  const correlationID = req.header('x-correlation-id');
  const user = req.user._id;
  try {
    logger.trace(`${correlationID}: <<<<<<-- Started ${getFuncName()} flow -->>>>>>`);
    const {
      isAutomated,
      frequency,
      amount,
      savingsLength,
      card,
      startDate,
    } = req.body;
    logger.trace(`${correlationID}: Validation Successful`);
    const planObj = {};

    if (isAutomated) planObj.isAutomated = isAutomated;
    if (frequency) planObj.frequency = frequency;
    if (amount) planObj.amount = amount;
    if (savingsLength) planObj.savingsLength = savingsLength;
    if (startDate) planObj.nextSavingDate = new Date(startDate);
    if (card) planObj.card = card;
    const responseData = await fixedSavingsService.updateFixedSavings(user, planObj, correlationID);

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

const saveNow = async (req, res) => {
  const correlationID = req.header('x-correlation-id');
  const user = req.user._id;
  try {
    logger.trace(`${correlationID}: <<<<<<-- Started ${getFuncName()} flow -->>>>>>`);

    logger.trace(`${correlationID}: Run Validation on required fields `);
    await requiredFieldValidator(
      ['amount', 'card'],
      Object.keys(req.body),
      req.body,
      correlationID,
    );
    const {
      amount,
      card,

    } = req.body;
    logger.trace(`${correlationID}: Validation Successful`);
    const planObj = {};
    // planObj.planType = planType.toUpperCase();
    planObj.card = card;
    planObj.amount = amount;
    planObj.user = user;
    const responseData = await fixedSavingsService.saveNow(planObj, correlationID);

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
    const responseData = await fixedSavingsService.getFortvestPlan(user, correlationID);

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
    const responseData = await fixedSavingsService
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
    const responseData = await fixedSavingsService
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
    const responseData = await fixedSavingsService.withdrawal(withdrawObj, correlationID);

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
    const responseData = await fixedSavingsService.totalSavings(userID, correlationID);
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
//     const responseData = await fixedSavingsService.activateAutoSave(user, correlationID);

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
    const responseData = await fixedSavingsService.activateAutoSave(
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

const listFixedSavings = async (req, res) => {
  const correlationID = req.header('x-correlation-id');
  const user = req.user._id;
  try {
    const responseData = await fixedSavingsService.listFixedSavings(user, correlationID);

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
  createFixedSavings,
  updateFixedSavings,
  getFortvestPlan,
  getPlanTranxHistory,
  filterTranxHistory,
  withdrawal,
  activateAutoSave,
  listFixedSavings,
  saveNow,
  totalSavings,
};
