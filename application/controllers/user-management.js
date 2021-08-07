/* eslint-disable func-names */
/* eslint-disable no-unused-expressions */
/* eslint-disable no-underscore-dangle */
const response = require('../utils/responseAdapter');
const logger = require('../utils/logger');

const {
  requiredFieldValidator,
  enumTypesValidator,
} = require('../utils/validators');
const { USERROLES } = require('../config');
const userManagementService = require('../services/user-service');

// VALIDATE BVN
// SEND TOKEN TO BVN REG NUM
// ACTUAL REGISTER
exports.validateBVN = async function (req, res) {
  const correlationID = req.header('x-correlation-id');
  try {
    logger.trace(`${correlationID}: <<<<<<-- Started BVN validation flow-->>>>>>`);
    const { bvn } = req.body;

    logger.trace(`${correlationID}: Validate required fields`);
    await requiredFieldValidator(
      ['bvn'],
      Object.keys(req.body),
      req.body,
      correlationID,
    );
    logger.trace(`${correlationID}:Required Validation successful`);

    logger.trace(`${correlationID}:>>>>  Call to userManagementService.validateBVN()`);
    const loginUser = await userManagementService.validateBVN(bvn, correlationID);
    logger.trace(` ${correlationID}: Token Valiated is not free`);
    return res.json(response.success(loginUser.data, loginUser.message));
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

exports.sendTokenToPhone = async function (req, res) {
  const correlationID = req.header('x-correlation-id');
  try {
    logger.trace(`${correlationID}: <<<<<<-- Send token to phone flow-->>>>>>`);
    const { phone } = req.body;

    logger.trace(`${correlationID}: Validate required fields`);
    await requiredFieldValidator(
      ['phone'],
      Object.keys(req.body),
      req.body,
      correlationID,
    );
    logger.trace(`${correlationID}:Required Validation successful`);

    logger.trace(`${correlationID}:>>>>  Call to userManagementService.sendTokenToPhone()`);
    const sendDatatoAgent = await userManagementService.sendTokenToPhone(phone, correlationID);
    logger.trace(` ${correlationID}: Token sent successfully`);
    return res.json(response.success(sendDatatoAgent.data, sendDatatoAgent.message));
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

exports.register = async (req, res) => {
  const correlationID = req.header('x-correlation-id');
  try {
    logger.trace(`${correlationID}: <<<<<<-- Started register flow -->>>>>>`);
    const {
      firstname,
      lastName,
      email,
      password,
      country,
      accountType,
      bvn,
      phone,
      profileimage,
      role,
    } = req.body;

    logger.trace(`${correlationID}: Run Validation on required fields `);
    await requiredFieldValidator(
      ['password', 'email', 'phone', 'country'],
      Object.keys(req.body),
      req.body,
      correlationID,
    );
    if (role) enumTypesValidator(role, USERROLES, correlationID);
    logger.trace(`${correlationID}: Validation Successful`);
    const userObj = {};
    userObj.firstname = firstname;
    userObj.lastName = lastName;
    userObj.country = country;
    userObj.email = email.toLowerCase();
    userObj.profileimage = profileimage;
    userObj.phone = phone;
    userObj.password = password;
    userObj.accountType = accountType;
    userObj.bvn = bvn;

    userObj.role = role.toUpperCase();

    logger.trace(`${correlationID}: >>>> Call to userManagementService.register()`);
    const responseData = await userManagementService.register(userObj, correlationID);

    logger.trace(`${correlationID}: User with id ${responseData.data._id} registered successfully.`);
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

exports.login = async function (req, res) {
  const correlationID = req.header('x-correlation-id');
  try {
    logger.trace(`${correlationID}: <<<<<<-- Started login flow-->>>>>>`);
    const { email, password } = req.body;

    logger.trace(`${correlationID}: Validate required fields`);
    await requiredFieldValidator(
      ['email', 'password'],
      Object.keys(req.body),
      req.body,
      correlationID,
    );
    logger.trace(`${correlationID}: Validation successful`);

    const loginCred = { email: email.toLowerCase(), password };
    logger.trace(`${correlationID}:>>>>  Call to userManagementService.login()`);
    const loginUser = await userManagementService.login(loginCred, correlationID);
    logger.trace(` ${correlationID}: Staff with id ${loginUser.data._id} logged in successfully.`);
    return res.json(response.success(loginUser.data, loginUser.message));
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

// //password reset flow
exports.resetRequest = async function (req, res) {
  const correlationID = req.header('x-correlation-id');
  try {
    logger.trace(`${correlationID}: <<<<<<--Started Password Reset Request flow-->>>>>>`);
    const { email } = req.body;
    await requiredFieldValidator(
      ['email'],
      Object.keys(req.body),
      req.body,
      correlationID,
    );
    logger.trace(`${correlationID}: Validation successful`);
    const requestObj = {};
    requestObj.email = email.toLowerCase();
    logger.trace('>>>> Call to userManagementService.resetRequest()');
    const passwordResetRequest = await userManagementService
      .resetRequest(requestObj, correlationID);
    return res.json(response.success(passwordResetRequest.data, passwordResetRequest.message));
  } catch (err) {
    logger.debug(`${correlationID}: ${err}`);
    const error = {};
    let message = '';
    err.data ? (error.data = err.data) : (error.data = {});
    err.name ? error.name = err.name : error.name = 'UnknownError';
    err.message ? message = err.message : message = 'Something Failed';
    return res.json(response.error(error, message));
  }
};

exports.validateToken = async function (req, res) {
  const correlationID = req.header('x-correlation-id');
  try {
    logger.trace(`${correlationID}: <<<<<<--Started Password Reset Token Validation flow-->>>>>>`);
    logger.trace(`${correlationID}: Validate required fields`);
    const { token } = req.body;
    if (!token) {
      logger.debug(`${correlationID}: A required field is missing`);
      const error = {
        title: 'Missing required field(s)',
        details: 'Missing required field(s)',
      };
      const message = 'Ensure all required field(s) are filled';
      return res.json(response.error(error, message));
    }
    logger.trace(`${correlationID}: >>>> Call to userManagementService.validateToken()`);
    const validateToken = await userManagementService.validateToken(token, correlationID);
    logger.trace(`${correlationID}: Token validation completed`);
    return res.json(response.success(validateToken.data, validateToken.message));
  } catch (err) {
    logger.trace(`${correlationID}: ${err}`);
    const error = {};
    let message = '';
    err.data ? error.data = err.data : error.data = {};
    err.name ? error.name = err.name : error.name = 'UnknownError';
    err.message ? message = err.message : message = 'Something Failed';
    return res.json(response.error(error, message));
  }
};

exports.resetPassword = async function (req, res) {
  const correlationID = req.header('x-correlation-id');
  if (req.body) {
    try {
      logger.trace(`${correlationID}: <<<<<<--Started Actual reset password flow-->>>>>>`);
      const { token, newPassword } = req.body;
      if (!(token && newPassword)) {
        logger.trace(`${correlationID}: Missing required field`);
        const error = {
          title: 'Missing required field(s)',
          details: 'Missing required field(s)',
        };
        const message = 'Ensure all required field(s) are filled';
        return res.json(response.error(error, message));
      }
      logger.trace(`${correlationID}: >>>> Call to userManagementService.resetPassword()`);
      const resetPassword = await
      userManagementService.resetPassword(token, newPassword, correlationID);
      logger.trace(`${correlationID}: Password Reset Successful`);
      return res.json(response.success(resetPassword.data, resetPassword.message));
    } catch (err) {
      logger.trace(`${correlationID}: ${err}`);
      const error = {};
      let message = '';
      err.data ? error.data = err.data : error.data = {};
      err.name ? error.name = err.name : error.name = 'UnknownError';
      err.message ? message = err.message : message = 'Something Failed';
      return res.json(response.error(error, message));
    }
  } else {
    const error = {
      title: 'Bad Request',
      detail: 'Kindly check the documentation for this API',
    };
    const message = 'Failed, Bad Request';
    return res.json(response.error([], error, message));
  }
};

exports.getUser = async function (req, res) {
  const correlationID = req.header('x-correlation-id');
  if (req.body) {
    try {
      logger.trace(`${correlationID}: <<<<<<--Started get user flow-->>>>>>`);

      const { userID } = req.body;
      await requiredFieldValidator(
        ['userID'],
        Object.keys(req.body),
        correlationID,
      );
      logger.trace(`${correlationID}: Validation successful`);
      logger.trace(`${correlationID}: >>>> Call to userManagementService.getUSer()`);
      const serviceResponse = await
      userManagementService.getUser(userID, correlationID);
      return res.json(response.success(serviceResponse.data, serviceResponse.message));
    } catch (err) {
      logger.trace(`${correlationID}: ${err}`);
      const error = {};
      let message = '';
      err.data ? error.data = err.data : error.data = {};
      err.name ? error.name = err.name : error.name = 'UnknownError';
      err.message ? message = err.message : message = 'Something Failed';
      return res.json(response.error(error, message));
    }
  } else {
    const error = {
      title: 'Bad Request',
      detail: 'Kindly check the documentation for this API',
    };
    const message = 'Failed, Bad Request';
    return res.json(response.error(error, message));
  }
};

exports.updateProfile = async function (req, res) {
  const correlationID = req.header('x-correlation-id');
  const userid = req.header('x-user-id');
  if (req.body) {
    try {
      logger.trace(`${correlationID}: <<<<<<--Started update profile flow-->>>>>>`);
      const {
        phone, profileimage,
      } = req.body;
      // build update object
      const updateObj = {};
      if (phone) updateObj.phone = phone;
      if (profileimage) updateObj.profileimage = profileimage;
      logger.trace(`${correlationID}: >>>> Call to userManagementService.updateProfile()`);
      const serviceResponse = await
      userManagementService.updateProfile(userid, updateObj, correlationID);
      return res.json(response.success(serviceResponse.data, serviceResponse.message));
    } catch (err) {
      logger.trace(`${correlationID}: ${err}`);
      const error = {};
      let message = '';
      err.data ? error.data = err.data : error.data = {};
      err.name ? error.name = err.name : error.name = 'UnknownError';
      err.message ? message = err.message : message = 'Something Failed';
      return res.json(response.error(error, message));
    }
  } else {
    const error = {
      title: 'Bad Request',
      detail: 'Kindly check the documentation for this API',
    };
    const message = 'Failed, Bad Request';
    return res.json(response.error(error, message));
  }
};
