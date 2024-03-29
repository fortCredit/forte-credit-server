/* eslint-disable no-unused-expressions */
/* eslint-disable no-underscore-dangle */

const response = require('../utils/responseAdapter');
const logger = require('../utils/logger');
const withdrawalService = require('../services/withDrawalService');

const {
  requiredFieldValidator,
} = require('../utils/validators');

// wallet mgt

exports.initializeTargetWithdrawal = async (req, res) => {
  const correlationID = req.header('x-correlation-id');
  const userID = req.user._id;

  try {
    logger.trace(
      `${correlationID}: <<<<<<-- Started transaction flow -->>>>>>`,
    );
    logger.trace(`${correlationID}: Validating required fields`);
    await requiredFieldValidator(
      ['amount', 'accountNumber', 'savingsID', 'bankCode'],
      Object.keys(req.body),
      correlationID,
    );
    // validate required fields
    const {
      amount,
      savingsID,
      accountNumber,
      bankCode,
    } = req.body;
    // building transaction object
    const withdrawalObj = {};
    withdrawalObj.amount = amount;
    withdrawalObj.user = userID;
    withdrawalObj.amount = amount;
    withdrawalObj.savingsID = savingsID;
    withdrawalObj.accountNumber = accountNumber;
    withdrawalObj.bankCode = bankCode;
    const transactionDetails = await withdrawalService.initializeTargetWithdrawal(
      withdrawalObj, correlationID,
    );

    return res.json(
      response.success(transactionDetails.data, 'Withdrawal initialized successfully'),
    );
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

exports.initializeFixedWithdrawal = async (req, res) => {
  const correlationID = req.header('x-correlation-id');
  const userID = req.user._id;

  try {
    logger.trace(
      `${correlationID}: <<<<<<-- Started transaction flow -->>>>>>`,
    );
    logger.trace(`${correlationID}: Validating required fields`);
    await requiredFieldValidator(
      ['amount', 'accountNumber', 'bankCode'],
      Object.keys(req.body),
      correlationID,
    );
    // validate required fields
    const {
      amount,
      accountNumber,
      bankCode,
    } = req.body;
    // building transaction object
    const withdrawalObj = {};
    withdrawalObj.amount = amount;
    withdrawalObj.user = userID;
    withdrawalObj.accountNumber = accountNumber;
    withdrawalObj.bankCode = bankCode;
    const transactionDetails = await withdrawalService.initializeFixedWithdrawal(
      withdrawalObj, correlationID,
    );

    return res.json(
      response.success(transactionDetails.data, 'Withdrawal initialized successfully'),
    );
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

exports.verifyWithdrawal = async (req, res) => {
  const correlationID = req.header('x-correlation-id');
  try {
    logger.trace(
      `${correlationID}: <<<<<<-- Started transaction flow -->>>>>>`,
    );
    logger.trace(`${correlationID}: Validating required fields`);
    await requiredFieldValidator(
      ['transactionID'],
      Object.keys(req.body),
      correlationID,
    );
    const { transactionID } = req.body;
    const transactionDetails = await withdrawalService.verifyWithdrawal(
      transactionID, correlationID,
    );

    return res.json(
      response.success(transactionDetails.data, transactionDetails.message),
    );
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
