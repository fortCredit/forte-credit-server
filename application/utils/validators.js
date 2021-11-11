const logger = require('./logger');
const MissingFieldError = require('../error-handler/MissingFieldError');

exports.enumTypesValidator = async (inputValue, enumValues, correlationID) => {
  if (!inputValue) {
    logger.debug(`${correlationID}: Required Fields Validation failed`);
    throw new MissingFieldError([inputValue]);
  }
  const inputValueFormatted = inputValue.toUpperCase();
  if (!enumValues.includes(inputValueFormatted)) {
    throw new Error(`Invalid entry for enum values ${enumValues}`);
  }
};

exports.requiredFieldValidator = async (expectedFields, enteredFields, body, correlationID) => {
  // if no field was entered
  if (enteredFields.length === 0) {
    logger.debug(`${correlationID}: Required Fields Validation failed`);
    throw new MissingFieldError(expectedFields);
  }
  // check for expected fields
  expectedFields.forEach((field) => {
    if (!enteredFields.includes(field) || body[field] === '') {
      logger.debug(`${correlationID}: Required Fields Validation failed`);
      throw new MissingFieldError(expectedFields);
    }
  });

  return true;
};

exports.bvnValidator = async (inputValue, correlationID) => {
  // ensure password is greater than 6 digits
  if (inputValue.length !== 11) {
    logger.debug(`${correlationID}: Password Validation failed`);
    throw new Error('Sorry, the entered BVN entered is not 11 numbers. Please check and retry.');
  }
};
