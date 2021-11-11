/* eslint-disable func-names */
/* eslint-disable no-unused-expressions */
/* eslint-disable no-underscore-dangle */
const response = require('../utils/responseAdapter');
const logger = require('../utils/logger');

const {
  requiredFieldValidator,
} = require('../utils/validators');
const cardService = require('../services/card-service');

// VALIDATE BVN
// SEND TOKEN TO BVN REG NUM
// ACTUAL REGISTER
function getFuncName() {
  return getFuncName.caller.name;
}

const initializeCardReg = async (req, res) => {
  const correlationID = req.header('x-correlation-id');
  const userID = req.user._id;
  try {
    logger.trace(`${correlationID}: <<<<<<-- Started ${getFuncName()} flow -->>>>>>`);

    logger.trace(`${correlationID}: Run Validation on required fields `);
    await requiredFieldValidator(
      ['email'],
      Object.keys(req.body),
      req.body,
      correlationID,
    );
    const { email } = req.body;
    const responseData = await cardService.addNewCardInit({ userID, email }, correlationID);

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

const completeCardReg = async (req, res) => {
  const correlationID = req.header('x-correlation-id');
  const userID = req.user._id;
  try {
    logger.trace(`${correlationID}: <<<<<<-- Started ${getFuncName()} flow -->>>>>>`);

    logger.trace(`${correlationID}: Run Validation on required fields `);
    await requiredFieldValidator(
      ['transactionID', 'paystackRef'],
      Object.keys(req.body),
      req.body,
      correlationID,
    );
    const { transactionID, paystackRef } = req.body;
    const verifyObj = { transactionID, paystackRef, userID };
    const responseData = await cardService.addNewCardComplete(verifyObj, correlationID);

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

const getAllCards = async (req, res) => {
  const correlationID = req.header('x-correlation-id');
  const userID = req.user._id;
  try {
    logger.trace(`${correlationID}: <<<<<<-- Started ${getFuncName()} flow -->>>>>>`);

    logger.trace(`${correlationID}: Run Validation on required fields `);
    const responseData = await cardService.getAllCards(userID, correlationID);

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

const makeCardDefault = async (req, res) => {
  const correlationID = req.header('x-correlation-id');
  const userID = req.user._id;
  try {
    logger.trace(`${correlationID}: <<<<<<-- Started ${getFuncName()} flow -->>>>>>`);
    logger.trace(`${correlationID}: Run Validation on required fields `);
    await requiredFieldValidator(
      ['cardID'],
      Object.keys(req.body),
      req.body,
      correlationID,
    );

    const { cardID } = req.body;
    logger.trace(`${correlationID}: Run Validation on required fields `);
    const responseData = await cardService.makeCardDefault(userID, cardID, correlationID);

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

const removeCard = async (req, res) => {
  const correlationID = req.header('x-correlation-id');
  try {
    logger.trace(`${correlationID}: <<<<<<-- Started ${getFuncName()} flow -->>>>>>`);
    logger.trace(`${correlationID}: Run Validation on required fields `);
    await requiredFieldValidator(
      ['cardID'],
      Object.keys(req.body),
      req.body,
      correlationID,
    );

    const { cardID } = req.body;
    logger.trace(`${correlationID}: Run Validation on required fields `);
    const responseData = await cardService.removeCard(cardID, correlationID);

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

const getSingle = async (req, res) => {
  const correlationID = req.header('x-correlation-id');
  try {
    logger.trace(`${correlationID}: <<<<<<-- Started ${getFuncName()} flow -->>>>>>`);
    logger.trace(`${correlationID}: Run Validation on required fields `);
    await requiredFieldValidator(
      ['cardID'],
      Object.keys(req.body),
      req.body,
      correlationID,
    );

    const { cardID } = req.body;
    logger.trace(`${correlationID}: Run Validation on required fields `);
    const responseData = await cardService.getSingle(cardID, correlationID);

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
  initializeCardReg,
  completeCardReg,
  makeCardDefault,
  removeCard,
  getAllCards,
  getSingle,
};
