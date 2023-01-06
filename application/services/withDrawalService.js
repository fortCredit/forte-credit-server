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
  let newWithdrawalBalance;
  let newTotalSavingsTillDate;

  const getSavings = await TargetSavings.findOne({ user, _id: savingsID });
  if (!getSavings) throw new Error('Sorry savings was not found');

  const totalSavings = (getSavings.totalSavingsTillDate + getSavings.withdrawalBalance);
  if (getSavings.totalSavingsTillDate < amount) throw new Error('Sorry, withdrawal cannot be completed as you have insufficient balance');

  if (getSavings.savingLength > getSavings.daysLeft
    && totalSavings < Number(getSavings.targetAmount)) {
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

        const breakingFee = ((2.5 / 100) * getSavings.totalSavingsTillDate);
        const newAmount = amount + breakingFee;
        newTotalSavingsTillDate = getSavings.totalSavingsTillDate - newAmount;

        const initTransfer = await initiateTransfer({ amount, recipient: recipient_code, reason: 'TARGETSAVINGS WITHDRAWAL' });
        newTransaction.withDrawalReceipt.transferCode = initTransfer.transfer_code;
        newWithdrawalBalance = getSavings.withdrawalBalance + amount;
        await newTransaction.save();
      }
      await TargetSavings.updateOne({ user, savingsID },
        {
          $set: {
            withdrawalBalance: newWithdrawalBalance,
            totalSavingsTillDate: newTotalSavingsTillDate,
          },
        });
    }
  } else if (getSavings.daysLeft === 0
    || totalSavings >= Number(getSavings.targetAmount)) {
    // set savings to inactive
    getSavings.status = 'INACTIVE';

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

        // initialize transfer
        let totalSavingsROI = (totalSavings + getSavings.interestRate);
        const initTransfer = await initiateTransfer({ amount, recipient: recipient_code, reason: 'TARGETSAVINGS WITHDRAWAL' });
        newTransaction.withDrawalReceipt.transferCode = initTransfer.transfer_code;
        totalSavingsROI -= amount;
        newTotalSavingsTillDate = totalSavingsROI;
        newWithdrawalBalance = getSavings.withdrawalBalance + amount;
      }
      await newTransaction.save();
    }
    await TargetSavings.updateOne({ user, savingsID },
      {
        $set: {
          withdrawalBalance: newWithdrawalBalance,
          totalSavingsTillDate: newTotalSavingsTillDate,
          interestRate: 0,
        },
      });
  }

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
    user, amount, accountNumber, bankCode,
  } = withdrawalObj;
  let newTransaction = {};
  let newWithdrawalBalance;
  let newTotalSavingsTillDate;

  const getSavingsInfo = await FixedSavings.findOne({ user });
  const getSavings = await FixedSavings.aggregate([
    {
      $match:
      {
        user,
      },
    },
    {
      $group:
        {
          _id: 'count',
          totalSavings: { $sum: '$totalSavingsTillDate' },
          totalInterest: { $sum: '$interestRate' },
        },
    },
  ]);

  if (!getSavings) throw new Error('Sorry!!! This user doesn\'t have an active fixed savings');

  const fixedSavings = getSavings[0].totalSavings <= 0 ? 0 : getSavings[0].totalSavings;
  const fixedSavingsinterest = getSavings[0].totalInterest <= 0 ? 0 : getSavings[0].totalInterest;

  let totalSavingsROI = (fixedSavings + fixedSavingsinterest); // N105000

  // check balance on savings
  if (fixedSavings < amount) throw new Error('Sorry, withdrawal cannot be completed as you have insufficient balance');

  // const totalWithdraw = (fixedSavings + getSavingsInfo.withdrawalBalance);

  // verify account details
  const verifyAccount = await verifyAccountNumber({ accountNumber, bankCode }, correlationID);
  if (!verifyAccount) throw new Error('Account Not Verified');
  // create transaction receipt
  const createReceipt = await createTransferReceipt(
    {
      name: verifyAccount.account_name,
      accountNumber,
      bankCode,
    },
  );

  // set savings to inactive
  if (getSavings.savingLength === getSavings.daysLeft) {
    getSavings.status = 'INACTIVE';
    await FixedSavings.updateOne({ user }, { $set: { status: 'INACTIVE' } });

    if (!createReceipt) throw new Error('Receipt cannot be created');
    const {
      // eslint-disable-next-line camelcase
      id, recipient_code, type, details,
    } = createReceipt;
    newTransaction = new Transaction({
      user,
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

    // initialize transfer
    const initTransfer = await initiateTransfer({
      amount: Math.round(totalSavingsROI).toString(),
      recipient: recipient_code,
      reason: 'FIXED-SAVINGS WITHDRAWAL',
    });

    newTransaction.withDrawalReceipt.transferCode = initTransfer.transfer_code;
    totalSavingsROI -= amount;
    getSavings.totalSavingsTillDate = totalSavingsROI;
    getSavings.interestRate = 0;
    newWithdrawalBalance = getSavingsInfo.withdrawalBalance + amount;
    await FixedSavings.updateOne({ user },
      {
        $set: {
          withdrawalBalance: newWithdrawalBalance,
          totalSavingsTillDate: totalSavingsROI,
          interestRate: 0,
        },
      });
  } else {
    const breakingFee = ((2.5 / 100) * getSavings.totalSavingsTillDate);
    const newAmount = amount + breakingFee;

    if (getSavings.totalSavingsTillDate > newAmount) {
      const initTransfer = await initiateTransfer({ amount: Math.round(amount).toString(), recipient: createReceipt.recipient_code, reason: 'FIXED-SAVINGS WITHDRAWAL' });
      newTransaction.withDrawalReceipt.transferCode = initTransfer.transfer_code;
      newWithdrawalBalance = getSavingsInfo.withdrawalBalance + newAmount;
      newTotalSavingsTillDate = getSavings.totalSavingsTillDate - newAmount;
      await FixedSavings.updateOne({ user },
        {
          $set: {
            withdrawalBalance: newWithdrawalBalance,
            totalSavingsTillDate: newTotalSavingsTillDate,
          },
        });
    } else throw new Error('Insufficient Funds');
  }
  await newTransaction.save();

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
  if (verifyRes.data.status === 'success') {
    getTransaction.transactionStatus = 'COMPLETED';
    getTransaction.save();
    message = 'Withdrawal completed';
  }
  logger.trace(`${correlationID}: <<<< Exiting withdrawalService.${getFuncName()}`);
  const response = {};
  response.data = getTransaction;
  response.message = message;
  response.success = true;
  return response;
};

module.exports = {
  initializeTargetWithdrawal,
  initializeFixedWithdrawal,
  verifyWithdrawal,
};
