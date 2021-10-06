/* eslint-disable no-underscore-dangle */
/* eslint-disable func-names */
const Fortvest = require('../models/Fortvest.model');
// const mailScheduler = require('../utils/mailer');
const logger = require('../utils/logger');

// const capitalizeFirstLetter = (string) => string[0].toUpperCase() + string.slice(1);
function getFuncName() {
  return getFuncName.caller.name;
}

const addFortvestPlan = async (investmentObj, correlationID) => {
  logger.trace(`${correlationID}: <<<< Entering fortVestService.${getFuncName()}`);

  // ensure user does not have a fortVestPlan before
  const { user } = investmentObj;
  const getUserPlan = await Fortvest.findOne({ user, status: 'ACTIVE' });
  if (getUserPlan) throw new Error('Sorry! You already have an active Fortvest plan');
  const newPlan = new Fortvest(investmentObj);
  await newPlan.save();
  // TODO: Perform card transaction to activate card for recurring transaction
  logger.trace(`${correlationID}: <<<< Exiting fortVestService.${getFuncName()}`);
  const response = {};
  response.data = newPlan;
  response.message = 'New Plan added successfully';
  response.success = true;
  return response;
};

const getFortvestPlan = async (user, correlationID) => {
  logger.trace(`${correlationID}: <<<< Entering fortVestService.${getFuncName}`);
  const getUserPlan = await Fortvest.findOne({ user, status: 'ACTIVE' });
  logger.trace(`${correlationID}: <<<< Exiting fortVestService.${getFuncName}`);
  const response = {};
  response.data = getUserPlan;
  response.message = 'User Plan retrieved successfully';
  response.success = true;
  return response;
};
module.exports = {
  addFortvestPlan,
  getFortvestPlan,
};
