/* eslint-disable no-underscore-dangle */
/* eslint-disable func-names */
const Card = require('../models/Card.model');
const transactionService = require('./transaction-service');
// const mailScheduler = require('../utils/mailer');
const logger = require('../utils/logger');
const { CARDCHARGE } = require('../config');
// const capitalizeFirstLetter = (string) => string[0].toUpperCase() + string.slice(1);
function getFuncName() {
  return getFuncName.caller.name;
}

const addNewCardInit = async (userObj, correlationID) => {
  logger.trace(`${correlationID}: <<<< Entering fortVestService.${getFuncName()}`);
  const { userID, email } = userObj;
  const transactionObj = {};
  transactionObj.transactionStatus = 'PENDING';
  transactionObj.description = 'CARDREG';
  transactionObj.user = userID;
  transactionObj.amount = CARDCHARGE;
  transactionObj.email = email;
  const initTransaction = await transactionService
    .createTransactionRecord(transactionObj, correlationID);
  logger.trace(`${correlationID}: <<<< Exiting fortVestService.${getFuncName()}`);
  const response = {};
  response.data = initTransaction.data;
  response.message = 'Initialized card registration';
  response.success = true;
  return response;
};

const addNewCardComplete = async (verifyObj, correlationID) => {
  logger.trace(`${correlationID}: <<<< Entering fortVestService.${getFuncName()}`);

  const verifyTransaction = (
    await transactionService.verifyTransaction(verifyObj, correlationID)).data;
  if (verifyTransaction.status !== 'success') throw new Error('Card registration failed! Please try again');
  // add card detatils
  const newCard = new Card();
  newCard.authorization = verifyTransaction.authorization;
  newCard.authEmail = verifyTransaction.customer.email;
  newCard.user = verifyObj.userID;
  await newCard.save();
  logger.trace(`${correlationID}: <<<< Exiting fortVestService.${getFuncName()}`);
  const response = {};
  response.data = newCard;
  response.message = 'Card registered successfully';
  response.success = true;
  return response;
};

const getAllCards = async (user, correlationID) => {
  logger.trace(`${correlationID}: <<<< Entering fortVestService.${getFuncName()}`);
  const allCards = await Card.find({ user });
  logger.trace(`${correlationID}: <<<< Exiting fortVestService.${getFuncName()}`);
  const response = {};
  response.data = allCards;
  response.message = 'Cards retrieved successfully';
  response.success = true;
  return response;
};

const makeCardDefault = async (user, cardid, correlationID) => {
  logger.trace(`${correlationID}: <<<< Entering fortVestService.${getFuncName()}`);
  await Card.updateMany({ user }, { default: false });
  const setDefault = await Card.findOneAndUpdate(
    { _id: cardid, user },
    { default: true },
    { new: true },
  );
  logger.trace(`${correlationID}: <<<< Exiting fortVestService.${getFuncName()}`);
  const response = {};
  response.data = setDefault;
  response.message = 'Card set as default successfully';
  response.success = true;
  return response;
};

const removeCard = async (cardid, correlationID) => {
  logger.trace(`${correlationID}: <<<< Entering fortVestService.${getFuncName()}`);

  await Card.findOneAndUpdate({ _id: cardid }, { deleted: true });
  logger.trace(`${correlationID}: <<<< Exiting fortVestService.${getFuncName()}`);
  const response = {};
  response.data = {};
  response.message = 'Card removed successfully';
  response.success = true;
  return response;
};

const getSingle = async (user, cardid, correlationID) => {
  logger.trace(`${correlationID}: <<<< Entering fortVestService.${getFuncName()}`);

  const card = await Card.findOne({ _id: cardid });
  logger.trace(`${correlationID}: <<<< Exiting fortVestService.${getFuncName()}`);
  const response = {};
  response.data = card;
  response.message = 'Card retrieved successfully';
  response.success = true;
  return response;
};
module.exports = {
  addNewCardInit,
  addNewCardComplete,
  getAllCards,
  makeCardDefault,
  removeCard,
  getSingle,
};
