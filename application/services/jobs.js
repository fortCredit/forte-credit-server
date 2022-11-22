/* eslint-disable no-underscore-dangle */
const schedule = require('node-cron');
// const mailScheduler = require('./mailer');
const TargetSavings = require('../models/TargetSavings.model');
const FixedSavings = require('../models/FixedSavings.model');
const Transaction = require('../models/Transaction.model');
const { chargeAuthorize } = require('./transaction-service');
const { INTERESTRATES } = require('../config');
const logger = require('../utils/logger');
// const pnScehuler = require('../utils/pn');
const { RETRYFREQ } = require('../config');

const runSavings = async (savings) => {
  savings.forEach(async (plan) => {
    let paystackStatus = '';
    let paystackReference = '';
    let newTranx;
    // TODO: integrate paystack here
    const autoCharge = await chargeAuthorize(plan.card, plan.amount);
    if (autoCharge.status === 'success') {
      paystackStatus = 'COMPLETED';
      paystackReference = autoCharge.reference;

      newTranx = new Transaction();
      newTranx.user = plan.user;
      newTranx.transactionStatus = paystackStatus;
      newTranx.savingsID = plan._id;
      newTranx.savings = 'TARGET-SAVINGS';
      newTranx.paystackReference = paystackReference;
      newTranx.transactionType = 'CREDIT';
      newTranx.description = 'AUTO-SAVE';
      newTranx.amount = plan.amount;
    } else paystackStatus = 'FAILED';
    // log transaction

    if (paystackStatus === 'FAILED') {
      // set next trial to next 6 hrs
      const errorCode = 400;
      newTranx.failedDueTo = autoCharge.gateway_response || errorCode;
      const d = new Date();
      logger.trace(`<<<< Transaction failed retry in ${RETRYFREQ} hrs`);
      const next6hrs = d.setTime(d.getTime() + (RETRYFREQ * 60 * 60 * 1000));
      await TargetSavings.findOneAndUpdate({ _id: plan._id }, {
        nextSavingDate: next6hrs,
        toRetry: true,
      });
      newTranx.toRetry = next6hrs;
    } else {
      // Confirm this is not last transaction
      let next = 1;
      let updateTargetInterest;
      if (plan.frequency === 'WEEKLY') next = 7;
      else if (plan.frequency === 'MONTHLY') next = 31;
      const today = new Date();
      const nextInv = today.setDate(today.getDate() + next);
      // const previousDate = today.setDate(today.getDate() - next);
      // const checkHour = (24 - today.getHours);
      // console.log(checkHour);
      // if (previousDate) {
      //   const totalSavings = !plan.totalSavingsTillDate ? 0 : plan.totalSavingsTillDate;
      //   // const daysLeft = plan.daysLeft - 1;
      //   updateTargetInterest = ((INTERESTRATES['TARGET-SAVINGS'] / 360) * totalSavings);
      // }

      await TargetSavings.findOneAndUpdate({ _id: plan._id }, {
        nextSavingDate: nextInv,
        interestRate: updateTargetInterest,
        toRetry: false,
        $inc: {
          totalSavingsTillDate: plan.amount,
          daysLeft: -1,
        },
      });
      logger.trace('<<<< Transaction completed successfully');
    }
    await newTranx.save();
  });
};

const runFixedSavings = async (savings) => {
  savings.forEach(async (plan) => {
    let paystackStatus = '';
    let paystackReference = '';
    let newTranx;
    // TODO: integrate paystack here
    const autoCharge = await chargeAuthorize(plan.card, plan.amount);

    if (autoCharge.status === 'success') {
      paystackStatus = 'COMPLETED';
      // log transaction
      paystackReference = autoCharge.reference;
      newTranx = new Transaction();
      newTranx.user = plan.user;
      newTranx.transactionStatus = paystackStatus;
      newTranx.savingsID = plan._id;
      newTranx.savings = 'FIXED-SAVINGS';
      newTranx.paystackReference = paystackReference;
      newTranx.transactionType = 'CREDIT';
      newTranx.description = 'AUTO-SAVE';
      newTranx.amount = plan.amount;
    } else paystackStatus = 'FAILED';

    if (paystackStatus === 'FAILED') {
      // set next trial to next 6 hrs
      newTranx.failedDueTo = autoCharge.gateway_response;
      const d = new Date();
      logger.trace(`<<<< Transaction failed retry in ${RETRYFREQ} hrs`);
      const next6hrs = d.setTime(d.getTime() + (RETRYFREQ * 60 * 60 * 1000));
      await FixedSavings.findOneAndUpdate({ _id: plan._id }, {
        nextSavingDate: next6hrs,
        toRetry: true,
      });
      newTranx.toRetry = next6hrs;
    } else {
      // Confirm this is not last transaction
      let next = 1;
      let updateFixedInterest;
      if (plan.frequency === 'WEEKLY') next = 7;
      else if (plan.frequency === 'MONTHLY') next = 31;
      const today = new Date();
      const nextInv = today.setDate(today.getDate() + next);
      // const previousDate = today.setDate(today.getDate() - next);
      // const totalSavings = !plan.totalSavingsTillDate ? 0 : plan.totalSavingsTillDate;
      // const updateSavings = totalSavings + plan.amount;
      // if (previousDate) {
      //   const totalSavings = !plan.totalSavingsTillDate ? 0 : plan.totalSavingsTillDate;
      //   // const daysLeft = plan.daysLeft - 1;
      //   updateFixedInterest = (totalSavings * (INTERESTRATES['FIXED-SAVINGS'] / 360));
      // }

      await FixedSavings.findOneAndUpdate({ _id: plan._id }, {
        nextSavingDate: nextInv,
        interestRate: updateFixedInterest,
        toRetry: false,
        $inc: { totalSavingsTillDate: plan.amount },
      });
      logger.trace('<<<< Transaction completed successfully');
    }
    await newTranx.save();
  });
};

const checkTargetSavingsInterest = async (savings) => {
  savings.forEach(async (plan) => {
    // const next = 1;
    let updateTargetInterest;
    const today = new Date();
    const next24Hrs = plan.nextSavingDate;
    // const presentSave = plan.update
    // const previousDate = today.setDate(today.getDate() - next);
    if (next24Hrs > today) {
      const totalSavings = !plan.totalSavingsTillDate ? 0 : plan.totalSavingsTillDate;
      const totalSavedAmount = totalSavings + plan.withdrawalBalance;
      updateTargetInterest = ((INTERESTRATES['TARGET-SAVINGS'] / 365) * totalSavedAmount);
    } else console.log('could not process Interest');

    await TargetSavings.findOneAndUpdate({ _id: plan._id }, {
      interestRate: updateTargetInterest,
      toRetry: false,
    });
    logger.trace('<<<< Interest completed successfully');
  });
};

const checkFixedSavingsInterest = async (savings) => {
  savings.forEach(async (plan) => {
    // const next = 1;
    let updateFixedInterest;
    const today = new Date();
    const next24Hrs = plan.nextSavingDate;
    // const presentSave = plan.update
    // const previousDate = today.setDate(today.getDate() - next);
    if (next24Hrs > today) {
      const totalSavings = !plan.totalSavingsTillDate ? 0 : plan.totalSavingsTillDate;
      const totalSavedAmount = totalSavings + plan.withdrawalBalance;
      updateFixedInterest = ((INTERESTRATES['FIXED-SAVINGS'] / 365) * totalSavedAmount);
    } else console.log('could not process Interest');

    await FixedSavings.findOneAndUpdate({ _id: plan._id }, {
      interestRate: updateFixedInterest,
      toRetry: false,
    });
    logger.trace('<<<< Interest completed successfully');
  });
};

const getDuePlans = async () => {
  try {
    const d = new Date();
    const day = d.setUTCHours(0, 0, 0, 0);
    const e = new Date();
    const night = e.setUTCHours(23, 59, 59, 999);
    const duePlans = await TargetSavings.find({ nextSavingDate: { $gte: (day), $lt: (night) }, status: 'ACTIVE', isAutomated: 'ACTIVE' });
    const dueFixedPlans = await FixedSavings.find({ nextSavingDate: { $gte: (day), $lt: (night) }, status: 'ACTIVE', isAutomated: 'ACTIVE' });
    await runSavings(duePlans);
    await runFixedSavings(dueFixedPlans);
  } catch (err) {
    logger.error(`<<<< Job failed due tols ${err}`);
  }
};

const getTargetSavingsInterest = async () => {
  try {
    // const d = new Date();
    // const day = d.setUTCHours(0, 0, 0, 0);
    // const night = d.setUTCHours(23, 59, 59, 999);
    const duePlans = await TargetSavings.find({ status: 'ACTIVE' });
    await checkTargetSavingsInterest(duePlans);
  } catch (err) {
    logger.error(`<<<< Job failed due tols ${err}`);
  }
};

const getFixedSavingsInterest = async () => {
  try {
    // const d = new Date();
    // const day = d.setUTCHours(0, 0, 0, 0);
    // const night = d.setUTCHours(23, 59, 59, 999);
    const duePlans = await FixedSavings.find({ status: 'ACTIVE' });
    await checkFixedSavingsInterest(duePlans);
  } catch (err) {
    logger.error(`<<<< Job failed due tols ${err}`);
  }
};

const deactivateTargetPlans = async () => {
  try {
    const d = new Date();
    const getClosedPlans = await TargetSavings.find({ savingsEndDate: { $lt: (d) }, status: 'ACTIVE', toRetry: false });
    getClosedPlans.forEach(async (plan) => {
      const balanceWithROI = (plan.totalSavingsTillDate + plan.interestRate);
      // const getTotal = plan.totalSavingsTillDate === plan.targetAmount ? status = 'INACTIVE' : 0;
      await TargetSavings.updateOne({ _id: plan._id }, { status: 'INACTIVE', balanceWithROI, withdrawalBalance: balanceWithROI });
    });
  } catch (err) {
    logger.error(`<<<< Job failed due tols ${err}`);
  }
};

const deactivateFixedPlans = async () => {
  try {
    const d = new Date();
    const getClosedPlans = await FixedSavings.find({ savingsEndDate: { $lt: (d) }, status: 'ACTIVE', toRetry: false });
    getClosedPlans.forEach(async (plan) => {
      const balanceWithROI = (plan.totalSavingsTillDate + plan.interestRate);
      // const getTotal = plan.totalSavingsTillDate === plan.targetAmount ? status = 'INACTIVE' : 0;
      await FixedSavings.updateOne({ _id: plan._id }, { status: 'INACTIVE', balanceWithROI, withdrawalBalance: balanceWithROI });
    });
  } catch (err) {
    logger.error(`<<<< Job failed due tols ${err}`);
  }
};

const handleFailure = async () => {
  try {
    // pick savings meant to have been run since yesterday
    const d = new Date();
    let yesterday = d.setDate(d.getDate() - 1);
    yesterday = d.setUTCHours(0, 0, 0, 0);
    const e = new Date();
    const day = e.setUTCHours(0, 0, 0, 0);
    const targetFailedPlans = await TargetSavings.find({ nextSavingDate: { $gte: (yesterday), $lt: (day) }, status: 'ACTIVE' });
    const fixedFailedPlans = await FixedSavings.find({ nextSavingDate: { $gte: (yesterday), $lt: (day) }, status: 'ACTIVE' });
    await runSavings(targetFailedPlans);
    await runSavings(fixedFailedPlans);
  } catch (err) {
    logger.error(`<<<< Job failed due tols ${err}`);
  }
};

exports.job = async () => {
  // this runs every 1 HR '0 */1 * * *'
  schedule.schedule('*/1 * * * *', async () => {
    getDuePlans();
  });
  // this runs every 12am '0 0 * * *'
  schedule.schedule('0 0 * * *', async () => {
    deactivateTargetPlans();
  });
  // rund every 24 hours
  schedule.schedule('0 0 * * *', async () => {
    getTargetSavingsInterest();
  });
  schedule.schedule('0 0 * * *', async () => {
    getFixedSavingsInterest();
  });
  // this runs every 12am '0 0 * * *'
  schedule.schedule('0 0 * * *', async () => {
    deactivateFixedPlans();
  });

  // this runs every 3am '0 3 * * *'
  schedule.schedule('0 3 * * *', async () => {
    handleFailure();
  });
};
