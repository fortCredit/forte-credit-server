/* eslint-disable no-unused-expressions */
/* eslint-disable no-underscore-dangle */

const response = require('../utils/responseAdapter');
const logger = require('../utils/logger');
const transactionManagementService = require('../services/transaction-service');
const { PAYSTACK_SECRET } = require('../config');
const {
  requiredFieldValidator,
} = require('../utils/validators');

// wallet mgt

exports.initializeTransaction = async (req, res) => {
  const correlationID = req.header('x-correlation-id');
  const userID = req.user._id;

  try {
    logger.trace(
      `${correlationID}: <<<<<<-- Started transaction flow -->>>>>>`,
    );
    logger.trace(`${correlationID}: Validating required fields`);
    await requiredFieldValidator(
      ['amount'],
      Object.keys(req.body),
      correlationID,
    );
    // validate required fields
    const {
      amount,
      email,
    } = req.body;
    // building transaction object
    const transactionObj = {};
    transactionObj.transactionStatus = 'PENDING';
    transactionObj.user = userID;
    transactionObj.amount = amount;
    transactionObj.email = email;
    const transactionDetails = await transactionManagementService.paystackInit(
      transactionObj, correlationID,
    );

    return res.json(
      response.success(transactionDetails.data, 'Transaction initialized successfully'),
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

exports.completeTransaction = async (req, res) => {
  const correlationID = req.header('x-correlation-id');
  try {
    logger.trace(
      `${correlationID}: <<<<<<-- Started complete transaction flow -->>>>>>`,
    );

    // validate required fields
    logger.trace(`${correlationID}: Validating required fields`);
    await requiredFieldValidator(
      ['transactionID'],
      Object.keys(req.body),
      correlationID,
    );
    const {
      // eslint-disable-next-line prefer-const
      transactionID,
    } = req.body;
    const serviceResponse = await transactionManagementService.completeTransaction(
      transactionID, correlationID,
    );
    logger.trace(
      `${correlationID}: Completed successfully.`,
    );

    // create transaction task and dump in queue
    return res.json(
      response.success(serviceResponse.data, serviceResponse.message),
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

exports.transactionHistory = async (req, res) => {
  const correlationID = req.header('x-correlation-id');
  const userid = req.header('x-user-id');
  try {
    logger.trace(
      `${correlationID}: <<<<<<-- Started transactions list  flow -->>>>>>`,
    );
    const serviceResponse = await transactionManagementService.transactionHistory(
      userid, correlationID,
    );

    return res.json(
      response.success(serviceResponse.data, serviceResponse.message),
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

exports.getTransactionByID = async (req, res) => {
  const correlationID = req.header('x-correlation-id');
  const userid = req.header('x-user-id');
  try {
    logger.trace(
      `${correlationID}: <<<<<<-- Started transactions list  flow -->>>>>>`,
    );
    // validate required fields
    logger.trace(`${correlationID}: Validating required fields`);
    await requiredFieldValidator(
      ['transactionID'],
      Object.keys(req.body),
      correlationID,
    );
    const { transactionID } = req.body;
    const serviceResponse = await transactionManagementService.getTransactionByID(
      { transactionID, userid }, correlationID,
    );

    return res.json(
      response.success(serviceResponse.data, serviceResponse.message),
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

// paystack verification
exports.verifyTransaction = async (req, res) => {
  const correlationID = req.header('x-correlation-id');
  const userID = req.user._id;
  try {
    logger.trace(
      `${correlationID}: <<<<<<-- Entered verify transaction flow -->>>>>>`,
    );

    // validate required fields
    logger.trace(`${correlationID}: Validating required fields`);
    await requiredFieldValidator(
      ['paystackRef'],
      Object.keys(req.body),
      correlationID,
    );
    const {
      paystackRef,
      // transactionID,
    } = req.body;
    // building transaction object
    const transactionDetails = await transactionManagementService.verifyTransaction(
      { paystackRef, userID }, correlationID,
    );

    return res.json(
      response.success(transactionDetails.data, 'Transaction verified successfully'),
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

exports.webHook = async (req, res) => {
  const correlationID = req.header('x-correlation-id');
  res.send(200);
  // const userID = req.user._id;
  try {
    logger.trace(
      `${correlationID}: <<<<<<-- Entered webhook flow -->>>>>>`,
    );
    const hash = crypto.createHmac('sha512', PAYSTACK_SECRET).update(JSON.stringify(req.body)).digest('hex');
    if (hash === req.headers['x-paystack-signature']) {
      await transactionManagementService.webHook(req.body, correlationID);
    }
  } catch (err) {
    throw new Error(err.message);
  }
};
