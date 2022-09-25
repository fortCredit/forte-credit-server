/* eslint-disable no-underscore-dangle */
/* eslint-disable func-names */
// const FixedSavings = require('../models/FixedSavings.model');
const TargetSavings = require('../models/TargetSavings.model');
const FixedSavings = require('../models/FixedSavings.model');
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

const initializeTargetWithdrawal = async (withdrawalObj, correlationID) => {
  logger.trace(`${correlationID}: <<<< Entering targetSavingsService.${getFuncName()}`);

  // ensure user does not have a fortVestPlan before
  const {
    user, savingsID, amount, accountNumber, bankCode,
  } = withdrawalObj;
  let newTransaction = {};

  const getSavings = await TargetSavings.findOne({ user, _id: savingsID });
  if (!getSavings) throw new Error('Sorry savings was not found');

  const totalSavings = getSavings.totalSavingsTillDate;
  if (getSavings.daysLeft > 0 && totalSavings < getSavings.targetAmount) {
    // getSavings.withdrawalBalance = totalSavings;
    // await getSavings.save();

    // check balance on savings
    if (totalSavings < amount) throw new Error('Sorry, withdrawal cannot be completed as you have insufficient balance');
  } else {
    // set savings to inactive
    getSavings.status = 'INACTIVE';
    // getSavings.withdrawalBalance = totalSavings;
    await getSavings.save();
    // if (totalSavings < amount) throw new Error(
    // 'Sorry, withdrawal cannot be completed as you have insufficient balance');
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
        savingsID,
        amount,
        savings: 'TARGET-SAVINGS',
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
      if (totalSavings === Number(getSavings.targetAmount) || getSavings.daysLeft === 0) {
      // initialize transfer
        let totalSavingsROI = (getSavings.totalSavingsTillDate + getSavings.interestRate);
        const initTransfer = await initiateTransfer({ amount: totalSavingsROI, recipient: recipient_code, reason: 'TARGETSAVINGS WITHDRAWAL' });
        newTransaction.withDrawalReceipt.transferCode = initTransfer.transfer_code;
        totalSavingsROI -= amount;
        getSavings.totalSavingsTillDate = totalSavingsROI;
        getSavings.interestRate = 0;
        getSavings.withdrawalBalance += amount;
      } else {
        const breakingFee = ((2.5 / 100) * getSavings.totalSavingsTillDate);
        const newAmount = amount + breakingFee;
        getSavings.totalSavingsTillDate -= newAmount;

        if (getSavings.totalSavingsTillDate > 0) {
          const initTransfer = await initiateTransfer({ amount, recipient: recipient_code, reason: 'TARGETSAVINGS WITHDRAWAL' });
          newTransaction.withDrawalReceipt.transferCode = initTransfer.transfer_code;
          getSavings.withdrawalBalance += amount;
        } else throw new Error('Insufficient Funds');
      }
      await newTransaction.save();
    }
  }
  await getSavings.save();
  logger.trace(`${correlationID}: <<<< Exiting withdrawalService.${getFuncName()}`);
  const response = {};
  response.data = newTransaction;
  response.message = 'New transaction initialized successfully';
  response.success = true;
  return response;
};

const initializeFixedWithdrawal = async (withdrawalObj, correlationID) => {
  logger.trace(`${correlationID}: <<<< Entering fixedSavingsService.${getFuncName()}`);

  // ensure user does not have a fortVestPlan before
  const {
    user, savingsID, amount, accountNumber, bankCode,
  } = withdrawalObj;
  let newTransaction = {};

  const getSavings = await FixedSavings.findOne({ user, _id: savingsID });
  if (!getSavings) throw new Error('Sorry savings was not found');

  const totalSavings = getSavings.totalSavingsTillDate;
  if (totalSavings < getSavings.targetAmount) {
    // getSavings.withdrawalBalance = totalSavings;
    // await getSavings.save();

    // check balance on savings
    if (totalSavings < amount) throw new Error('Sorry, withdrawal cannot be completed as you have insufficient balance');
  } else {
    // set savings to inactive
    getSavings.status = 'INACTIVE';
    // getSavings.withdrawalBalance = totalSavings;
    await getSavings.save();
    // if (totalSavings < amount) throw new Error(
    // 'Sorry, withdrawal cannot be completed as you have insufficient balance');
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
        savingsID,
        amount,
        savings: 'FIXED-SAVINGS',
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
      if (totalSavings === Number(getSavings.targetAmount)) {
      // initialize transfer
        let totalSavingsROI = (getSavings.totalSavingsTillDate + getSavings.interestRate);
        const initTransfer = await initiateTransfer({ amount: totalSavingsROI, recipient: recipient_code, reason: 'TARGETSAVINGS WITHDRAWAL' });
        newTransaction.withDrawalReceipt.transferCode = initTransfer.transfer_code;
        totalSavingsROI -= amount;
        getSavings.totalSavingsTillDate = totalSavingsROI;
        getSavings.interestRate = 0;
        getSavings.withdrawalBalance += amount;
      } else {
        const breakingFee = ((2.5 / 100) * getSavings.totalSavingsTillDate);
        const newAmount = amount + breakingFee;
        getSavings.totalSavingsTillDate -= newAmount;

        if (getSavings.totalSavingsTillDate > 0) {
          const initTransfer = await initiateTransfer({ amount, recipient: recipient_code, reason: 'TARGETSAVINGS WITHDRAWAL' });
          newTransaction.withDrawalReceipt.transferCode = initTransfer.transfer_code;
          getSavings.withdrawalBalance += amount;
        } else throw new Error('Insufficient Funds');
      }
      await newTransaction.save();
    }
  }
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
  console.log(verifyRes);
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
  initializeTargetWithdrawal,
  initializeFixedWithdrawal,
  verifyWithdrawal,
};
