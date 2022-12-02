/* eslint-disable func-names */
/* eslint-disable no-unused-expressions */
/* eslint-disable no-underscore-dangle */
const response = require('../utils/responseAdapter');
const logger = require('../utils/logger');
const {
  requiredFieldValidator,
} = require('../utils/validators');
const adminManagementService = require('../services/superadminservice');

// insight for error logging credit: https://blog.bitsrc.io/logging-best-practices-for-node-js-applications-8a0a5969b94c
// register flow
exports.register = async (req, res) => {
  const correlationID = req.header('x-correlation-id');
  try {
    logger.trace(`${correlationID}: <<<<<<-- Started register flow -->>>>>>`);
    const {
      email,
      password,
      fullname,
      phone,
    } = req.body;

    logger.trace(`${correlationID}: Run Validation on required fields `);
    await requiredFieldValidator(
      ['email', 'password', 'phone'],
      Object.keys(req.body),
      correlationID,
    );
    logger.trace(`${correlationID}: Validation Successful`);
    const userObj = {};
    userObj.email = email;
    userObj.password = password;
    userObj.fullname = fullname;
    userObj.phone = phone;

    if (!fullname) userObj.fullname = 'Super Admin';

    userObj.role = 'SUPERADMIN';
    logger.trace(`${correlationID}: >>>> Call to adminManagementService.register()`);
    const responseData = await adminManagementService.register(userObj, correlationID);

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
      correlationID,
    );
    logger.trace(`${correlationID}: Validation successful`);

    const loginCred = { email, password };
    logger.trace(`${correlationID}:>>>>  Call to adminManagementService.login()`);
    const loginUser = await adminManagementService.login(loginCred, correlationID);
    logger.trace(` ${correlationID}: User with id ${loginUser.data._id} logged in successfully.`);
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

exports.changePassword = async function (req, res) {
  const correlationID = req.header('x-correlation-id');
  if (req.body) {
    try {
      logger.trace(`${correlationID}: <<<<<<--Started Actual reset password flow-->>>>>>`);
      const { userid, newPassword } = req.body;
      await requiredFieldValidator(
        ['userid', 'newPassword'],
        Object.keys(req.body),
        correlationID,
      );
      logger.trace(`${correlationID}: Validation successful`);
      logger.trace(`${correlationID}: >>>> Call to userManagementService.changepwd()`);
      const changePwd = await
      adminManagementService.changePwd(userid, newPassword, correlationID);
      logger.trace(`${correlationID}: Password Reset Successful`);
      return res.json(response.success(changePwd.data, changePwd.message));
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
      logger.trace(`${correlationID}: >>>> Call to adminManagementService.getUSer()`);
      const serviceResponse = await
      adminManagementService.getUser(userID, correlationID);
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

exports.createAdmin = async (req, res) => {
  const correlationID = req.header('x-correlation-id');
  try {
    logger.trace(`${correlationID}: <<<<<<-- Started create admin flow -->>>>>>`);
    const {
      email,
      password,
      fullname,
      phone,
    } = req.body;

    logger.trace(`${correlationID}: Run Validation on required fields `);
    await requiredFieldValidator(
      ['email', 'password', 'phone'],
      Object.keys(req.body),
      correlationID,
    );
    logger.trace(`${correlationID}: Validation Successful`);
    const userObj = {};
    userObj.email = email;
    userObj.password = password;
    userObj.fullname = fullname;
    userObj.phone = phone;

    if (!fullname) userObj.fullname = 'Admin';

    userObj.role = 'ADMIN';
    logger.trace(`${correlationID}: >>>> Call to adminManagementService.register()`);
    const responseData = await adminManagementService.createAdmin(userObj, correlationID);

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

exports.getVerifiedUsers = async function (req, res) {
  const correlationID = req.header('x-correlation-id');
  if (req.body) {
    try {
      logger.trace(`${correlationID}: <<<<<<--Started get user flow-->>>>>>`);
      logger.trace(`${correlationID}: Validation successful`);
      logger.trace(`${correlationID}: >>>> Call to userManagementService.getUSers()`);
      const serviceResponse = await
      adminManagementService.getVerifiedUsers(correlationID);
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

exports.getNonVerifiedUsers = async function (req, res) {
  const correlationID = req.header('x-correlation-id');
  if (req.body) {
    try {
      logger.trace(`${correlationID}: <<<<<<--Started get user flow-->>>>>>`);
      logger.trace(`${correlationID}: Validation successful`);
      logger.trace(`${correlationID}: >>>> Call to userManagementService.getUSers()`);
      const serviceResponse = await
      adminManagementService.getNonVerifiedUsers(correlationID);
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

exports.getCustomer = async function (req, res) {
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
      logger.trace(`${correlationID}: >>>> Call to adminManagementService.getUSer()`);
      const serviceResponse = await
      adminManagementService.getCustomer(userID, correlationID);
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

exports.deleteCustomer = async function (req, res) {
  const correlationID = req.header('x-correlation-id');
  // const userid = req.user._id;
  if (req.body) {
    try {
      logger.trace(`${correlationID}: <<<<<<--Started delete profile flow-->>>>>>`);
      const {
        customerID,
      } = req.body;
      // build update object
      const updateObj = {};
      if (customerID) updateObj.deleted = 'true';
      logger.trace(`${correlationID}: >>>> Call to userManagementService.deleteCustomer()`);
      const serviceResponse = await
      adminManagementService.deleteCustomer(customerID, updateObj, correlationID);
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

exports.getCustomerSavings = async function (req, res) {
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
      logger.trace(`${correlationID}: >>>> Call to adminManagementService.getUSer()`);
      const serviceResponse = await
      adminManagementService.getCustomerSavings(userID, correlationID);
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

exports.getTotalSavings = async (req, res) => {
  const correlationID = req.header('x-correlation-id');
  try {
    const responseData = await adminManagementService.getTotalSavings(correlationID);
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

exports.getTotalTargetSavings = async (req, res) => {
  const correlationID = req.header('x-correlation-id');
  try {
    const responseData = await adminManagementService.getTotalTargetSavings(correlationID);
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

exports.getTotalFixedSavings = async (req, res) => {
  const correlationID = req.header('x-correlation-id');
  try {
    const responseData = await adminManagementService.getTotalFixedSavings(correlationID);
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
