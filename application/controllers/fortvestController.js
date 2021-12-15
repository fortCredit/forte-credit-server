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
      ['planType', 'isAutomated', 'frequency', 'amount', 'investmentLength', 'startDate', 'card'],
      Object.keys(req.body),
      req.body,
      correlationID,
    );
    const {
      planType,
      isAutomated,
      frequency,
      amount,
      planAlias,
      investmentLength,
      card,
      startDate,
    } = req.body;
    logger.trace(`${correlationID}: Validation Successful`);
    const planObj = {};
    planObj.planType = planType.toUpperCase();
    planObj.isAutomated = isAutomated;
    planObj.frequency = frequency;
    planObj.amount = amount;
    planObj.investmentLength = investmentLength;
    planObj.planAlias = planAlias;
    planObj.nextInvestmentDate = new Date(startDate);
    planObj.user = user;
    planObj.card = card;
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
      ['amount'],
      Object.keys(req.body),
      req.body,
      correlationID,
    );
    const {
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
module.exports = {
  addFortvestPlan,
  getFortvestPlan,
  getPlanTranxHistory,
  filterTranxHistory,
  withdrawal,
};
