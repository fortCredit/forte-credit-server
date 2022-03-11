/* eslint-disable no-underscore-dangle */
/* eslint-disable func-names */
const Fortvest = require('../models/Fortvest.model');
const Transaction = require('../models/Transaction.model');
// const mailScheduler = require('../utils/mailer');
const logger = require('../utils/logger');
const {
  verifyAccountNumber, createTransferReceipt, verifyTransfer, initiateTransfer,
} = require('./transaction-service');
// const capitalizeFirstLetter = (string) => string[0].toUpperCase() + string.slice(1);
function getFuncName() {
  return getFuncName.caller.name;
}

const initializeWithdrawal = async (withdrawalObj, correlationID) => {
  logger.trace(`${correlationID}: <<<< Entering fortVestService.${getFuncName()}`);

  // ensure user does not have a fortVestPlan before
  const {
    user, savingsID, amount, accountNumber, bankCode,
  } = withdrawalObj;
  let newTransaction = {};
  const getSavings = await Fortvest.findOne({ user, _id: savingsID });
  if (!getSavings) throw new Error('Sorry investment was not found');
  if (getSavings.status === 'INACTIVE') {
    // check balance on investment
    if (getSavings.withdrawalBalance < amount) throw new Error('Sorry, withdrawal cannot be completed as you have insufficient balance');
  } else {
    // set investment to inactive
    getSavings.status = 'INACTIVE';
    getSavings.withdrawalBalance = getSavings.totalInvestmentTillDate;
    await getSavings.save();
    if (getSavings.withdrawalBalance < amount) throw new Error('Sorry, withdrawal cannot be completed as you have insufficient balance');
  }

  // verify account details
  const verifyAccount = await verifyAccountNumber({ accountNumber, bankCode }, correlationID);
  if (verifyAccount) {
    // create transaction receipt
    const createReceipt = await createTransferReceipt(
      {
        name: verifyAccount.account_name,
        accountNumber,
        bankCode,
      },
    );

    if (createReceipt) {
      const {
        // eslint-disable-next-line camelcase
        id, recipient_code, type, details,
      } = createReceipt;
      newTransaction = new Transaction({
        user,
        savings: savingsID,
        transactionType: 'DEBIT',
        description: 'WITHDRAWAL',

      });
      const withDrawalReceipt = {
        id,
        recipient_code,
        paystackType: type,
        details: {
          account_number: details.account_number,
          account_name: details.account_name,
          bank_code: details.bank_code,
          bank_name: details.bank_name,
        },
      };
      newTransaction.withDrawalReceipt = withDrawalReceipt;
      // initialize transfer
      const initTransfer = await initiateTransfer({ amount, recipient: recipient_code, reason: 'SAVINGS WITHDRAWAL' });
      newTransaction.withDrawalReceipt.transferCode = initTransfer.transfer_code;
      await newTransaction.save();
    }
  }
  getSavings.withdrawalBalance -= amount;
  await getSavings.save();
  logger.trace(`${correlationID}: <<<< Exiting withdrawalService.${getFuncName()}`);
  const response = {};
  response.data = newTransaction;
  response.message = 'New transaction initialized successfully';
  response.success = true;
  return response;
};

const verifyWithdrawal = async (transactionID, correlationID) => {
  logger.trace(`${correlationID}: <<<< Entering fortVestService.${getFuncName()}`);
  const getTransaction = await Transaction.findOne({ transactionID });
  if (!getTransaction) throw new Error('Sorry! Withdrawal Transaction not found');
  let message = 'Withdrawal Pending';
  const verifyRes = await
  verifyTransfer(getTransaction.withDrawalReceipt.transferCode, correlationID);
  if (verifyRes.status === 'success') {
    getTransaction.status = 'COMPLETED';
    getTransaction.save();
    message = 'Withdrawal completed';
  }
  logger.trace(`${correlationID}: <<<< Exiting withdrawalService.${getFuncName()}`);
  const response = {};
  response.data = {};
  response.message = message;
  response.success = true;
  return response;
};
module.exports = {
  initializeWithdrawal,
  verifyWithdrawal,
};
