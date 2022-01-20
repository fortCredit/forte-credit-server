const APISERVICE = require('../utils/api-service');
const logger = require('../utils/logger');
const Transaction = require('../models/Transaction.model');
const Card = require('../models/Card.model');

const { PAYSTACK_SECRET } = require('../config');

exports.verifyBVN = async (reqBody, correlationID) => {
  try {
    logger.trace(
      `${correlationID}: >>>> Entering transactionCordService.matchBVN()`,
    );
    const url = 'https://api.paystack.co/bvn/match';
    const headers = {
      authorization: `Bearer ${PAYSTACK_SECRET}`,
      'content-type': 'application/json',
      'cache-control': 'no-cache',
    };
    logger.trace(
      `${correlationID}: >>>> call to  paystack api `,
    );
    const paystackBvnResponse = (await APISERVICE.requestCustom(correlationID, 'PAYSTACK', url, headers, reqBody, 'post'));
    if (!paystackBvnResponse.status) {
      throw new Error('An error occured when initializing transaction');
    }
    const response = {};
    response.data = paystackBvnResponse.data;
    response.message = '';
    return response;
  } catch (err) {
    throw new Error(err.message);
  }
};

exports.createTransactionRecord = async (transactionObj, correlationID) => {
  logger.trace(
    `${correlationID}: >>>> Entering transactionCordService.createTransactionRecord()`,
  );
  try {
    const createTransaction = new Transaction(transactionObj);
    await createTransaction.save();
    logger.trace(
      `${correlationID}: >>>> Transaction record created successfully`,
    );
    const response = {};
    response.data = createTransaction;
    response.message = 'Transaction initiated successfully';
    return response;
  } catch (err) {
    logger.debug(
      `${correlationID}: >>>> creation of transaction record failed due to ${err.message}`,
    );
    throw new Error(err.message);
  }
};

exports.completeTransaction = async (transactionID, correlationID) => {
  // confirm wallet does not exist already for this user
  logger.trace(
    `${correlationID}: >>>> Entering transactionCordService.retryTransaction()`,
  );
  try {
    let getTransaction = await Transaction.findOne({ _id: transactionID });
    if (!getTransaction) {
      logger.trace(
        `${correlationID}: >>>> Transaction with ID ${transactionID} not found`,
      );
      throw new Error(`Transaction with ID ${transactionID} not found`);
    }
    if (getTransaction.transactionStatus === 'COMPLETED') {
      logger.trace(
        `${correlationID}: >>>> Transaction with ID ${transactionID} already completed`,
      );
      throw new Error(`Transaction with ID ${transactionID} already completed`);
    }

    getTransaction = await Transaction.findOneAndUpdate({ _id: transactionID },
      { mobileStatus: 'COMPLETED' }, { new: true });
    logger.trace(
      `${correlationID}: >>>> Transaction completed created successfully`,
    );
    logger.trace(
      `${correlationID}: >>>> Logging transaction`,
    );
    logger.trace(
      `${correlationID}: >>>> Logged transaction`,
    );
    const response = {};
    response.data = getTransaction;
    response.message = 'Transaction completed Successfully';
    return response;
  } catch (err) {
    logger.debug(
      `${correlationID}: >>>> completion of transaction record failed due to ${err.message}`,
    );
    throw new Error(err.message);
  }
};

exports.getTransactionByID = async (queryObj, correlationID) => {
  // confirm wallet does not exist already for this user
  logger.trace(
    `${correlationID}: >>>> Entering transactionCordService.retryTransaction()`,
  );
  try {
    const { transactionID, userid } = queryObj;
    const getTransaction = await Transaction.findOne({ _id: transactionID, user: userid });
    if (!getTransaction) {
      logger.trace(
        `${correlationID}: >>>> Transaction with ID ${transactionID} not found`,
      );
      throw new Error(`Transaction with ID ${transactionID} not found`);
    }
    const response = {};
    response.data = getTransaction;
    response.message = 'Transaction retrieved Successfully';
    return response;
  } catch (err) {
    logger.debug(
      `${correlationID}: >>>> retrieval of transaction record failed due to ${err.message}`,
    );
    throw new Error(err.message);
  }
};

exports.paystackInit = async (reqBody, correlationID) => {
  try {
    logger.trace(
      `${correlationID}: >>>> Entering transactionCordService.paystackInit()`,
    );
    const url = 'https://api.paystack.co/transaction/initialize';
    const headers = {
      authorization: `Bearer ${process.env.PAYSTACK_SECRET}`,
      'content-type': 'application/json',
      'cache-control': 'no-cache',
    };
    logger.trace(
      `${correlationID}: >>>> call to  paystack api `,
    );
    const paystackInitResponse = (await APISERVICE.requestCustom(correlationID, 'PAYSTACK', url, headers, reqBody, 'post')).data;
    if (paystackInitResponse.status) {
      // update transaction status
      const transactionObj = {};
      // transactionObj.transactionID = reqBody.transactionID;
      transactionObj.amount = reqBody.amount;
      transactionObj.tripID = reqBody.tripID;
      transactionObj.paystackReference = paystackInitResponse.data.reference;
      transactionObj.transactionStatus = 'PENDING';
      transactionObj.user = reqBody.user;
      const newTransaction = new Transaction(transactionObj);
      await newTransaction.save();
    } else {
      throw new Error('An error occured when initializing transaction');
    }
    const response = {};
    response.data = paystackInitResponse.data;
    response.message = '';
    return response;
  } catch (err) {
    throw new Error(err.message);
  }
};

// verify transaction with paystack reference

exports.verifyTransaction = async (reqObj, correlationID) => {
  try {
    logger.trace(
      `${correlationID}: >>>> Entering transactionCordService.verifyTransaction()`,
    );
    const { transactionID } = reqObj;
    const { paystackRef, userID } = reqObj;
    // set pay stack request options
    const url = `https://api.paystack.co/transaction/verify/${paystackRef}`;
    const headers = {
      authorization: `Bearer ${process.env.PAYSTACK_SECRET}`,
      'cache-control': 'no-cache',
    };
    // confirm transaction is not completed already
    const getTransaction = await Transaction.findOne({ transactionID, transactionStatus: 'COMPLETED' });
    if (getTransaction) throw new Error('Transaction completed already!');
    logger.trace(
      `${correlationID}: <<<<< call to  paystack api`,
    );
    const paystackVerifyResponse = (await APISERVICE.request(correlationID, 'PAYSTACK', url, headers, {}, 'get')).data;
    // check that transaction exists else, create
    const updateObj = { paystackReference: paystackRef, user: userID };
    if (paystackVerifyResponse.data.status === 'success') {
      // update transaction status
      updateObj.transactionStatus = 'COMPLETED';
      updateObj.amount = paystackVerifyResponse.data.amount;
      const findTranx = await Transaction.findOne({ transactionID });

      if (findTranx) {
        await findTranx.updateOne(updateObj);
      } else {
        const newTrax = new Transaction(updateObj);
        await newTrax.save();
      }

      logger.trace(
        `${correlationID}: >>>> Logging transaction`,
      );
      const response = {};
      response.data = paystackVerifyResponse.data;
      response.message = 'Transaction verification completed';
      return response;
    }
    throw new Error('Transaction failed');
  } catch (err) {
    throw new Error(err.message);
  }
};

exports.chargeAuthorize = async (card, amount, correlationID) => {
  try {
    logger.trace(
      `${correlationID}: >>>> Entering transactionCordService.chargeAuthorize()`,
    );
    // set pay stack request options
    const url = 'https://api.paystack.co/transaction/charge_authorization';
    const headers = {
      authorization: `Bearer ${process.env.PAYSTACK_SECRET}`,
      'cache-control': 'no-cache',
    };
    logger.trace(
      `${correlationID}: <<<<< call to  paystack api`,
    );
    const getCard = await Card.findOne({ _id: card });
    if (getCard) {
      if (getCard.authorization) {
        const body = {};
        body.authorization_code = getCard.authorization.authorization_code;
        body.email = getCard.authEmail;
        body.amount = amount;
        const paystackVerifyResponse = (await APISERVICE.requestCustom(correlationID, 'PAYSTACK', url, headers, body, 'post')).data;
        return paystackVerifyResponse.data;
      }
    }
    return false;
  } catch (err) {
    throw new Error(err.message);
  }
};

exports.verifyAccountNumber = async (accountObj, correlationID) => {
  try {
    logger.trace(
      `${correlationID}: >>>> Entering transactionCordService.verifyAccountNumber()`,
    );
    // set pay stack request options
    const { accountNumber, bankCode } = accountObj;
    const url = `https://api.paystack.co/bank/resolve?account_number=${accountNumber}&bank_code=${bankCode}`;
    const headers = {
      authorization: `Bearer ${process.env.PAYSTACK_SECRET}`,
      'cache-control': 'no-cache',
    };
    logger.trace(
      `${correlationID}: <<<<< call to  paystack api`,
    );
    const paystackVerifyResponse = (await APISERVICE.requestCustom(correlationID, 'PAYSTACK', url, headers, {}, 'get')).data;
    if (!paystackVerifyResponse) throw new Error('An error occured verifying account number');
    if (!paystackVerifyResponse.status) throw new Error('Account Number Verification failed');
    return paystackVerifyResponse.data;
  } catch (err) {
    throw new Error(err.message);
  }
};

exports.createTransferReceipt = async (receiptObj, correlationID) => {
  try {
    logger.trace(
      `${correlationID}: >>>> Entering transactionCordService.createTransferReceipt()`,
    );
    // set pay stack request options
    const { name, accountNumber, bankCode } = receiptObj;
    const url = 'https://api.paystack.co/transferrecipient';
    const headers = {
      authorization: `Bearer ${process.env.PAYSTACK_SECRET}`,
      'cache-control': 'no-cache',
    };
    logger.trace(
      `${correlationID}: <<<<< call to  paystack api`,
    );
    const body = {
      name,
      account_number: accountNumber,
      bank_code: bankCode,
      currency: 'NGN',
    };
    const paystackVerifyResponse = (await APISERVICE.requestCustom(correlationID, 'PAYSTACK', url, headers, body, 'post')).data;
    if (!paystackVerifyResponse) throw new Error('An error occured creating transfer receipt');
    if (!paystackVerifyResponse.status) throw new Error('Transfer receipt creation failed');
    return paystackVerifyResponse.data;
  } catch (err) {
    throw new Error(err.message);
  }
};

exports.initiateTransfer = async (receiptObj, correlationID) => {
  try {
    logger.trace(
      `${correlationID}: >>>> Entering transactionCordService.initiateTransfer()`,
    );
    // set pay stack request options
    const { amount, recipient, reason } = receiptObj;
    const url = 'https://api.paystack.co/transfer';
    const headers = {
      authorization: `Bearer ${process.env.PAYSTACK_SECRET}`,
      'cache-control': 'no-cache',
    };
    logger.trace(
      `${correlationID}: <<<<< call to  paystack api`,
    );
    const body = {
      source: 'balance',
      amount,
      recipient,
      reason,
    };
    const initiateTransferResponse = (await APISERVICE.requestCustom(correlationID, 'PAYSTACK', url, headers, body, 'post')).data;
    if (!initiateTransferResponse) throw new Error('An error occured creating transfer receipt');
    if (!initiateTransferResponse.status) throw new Error('Transfer receipt creation failed');
    return initiateTransferResponse.data;
  } catch (err) {
    throw new Error(err.message);
  }
};

exports.verifyTransfer = async (transfercode, correlationID) => {
  try {
    logger.trace(
      `${correlationID}: >>>> Entering transactionCordService.initiateTransfer()`,
    );
    // set pay stack request options
    const url = `https://api.paystack.co/transfer/${transfercode}`;
    const headers = {
      authorization: `Bearer ${process.env.PAYSTACK_SECRET}`,
      'cache-control': 'no-cache',
    };
    logger.trace(
      `${correlationID}: <<<<< call to  paystack api`,
    );
    const verifyResponse = (await APISERVICE.requestCustom(correlationID, 'PAYSTACK', url, headers, {}, 'get')).data;
    if (!verifyResponse) throw new Error('An error occured creating transfer receipt');
    if (!verifyResponse.status) throw new Error('Transfer receipt creation failed');
    return verifyResponse.data;
  } catch (err) {
    throw new Error(err.message);
  }
};
