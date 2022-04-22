/* eslint-disable no-underscore-dangle */
const schedule = require('node-cron');
// const mailScheduler = require('./mailer');
const TargetSavings = require('../models/TargetSavings.model');
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
    // TODO: integrate paystack here
    const autoCharge = await chargeAuthorize(plan.card, plan.amount);
    if (autoCharge.status === 'success') {
      paystackStatus = 'COMPLETED';
    } else paystackStatus = 'FAILED';
    // log transaction
    paystackReference = autoCharge.reference;
    const newTranx = new Transaction();
    newTranx.user = plan.user;
    newTranx.transactionStatus = paystackStatus;
    newTranx.savingsID = plan._id;
    newTranx.savings = 'TARGET-SAVINGS';
    newTranx.paystackReference = paystackReference;
    newTranx.transactionType = 'CREDIT';
    newTranx.description = 'AUTO-SAVE';
    newTranx.amount = plan.amount;
    if (paystackStatus === 'FAILED') {
      // set next trial to next 6 hrs
      newTranx.failedDueTo = autoCharge.gateway_response;
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
      if (plan.frequency === 'WEEKLY') next = 7;
      else if (plan.frequency === 'MONTHLY') next = 31;
      const today = new Date();
      const nextInv = today.setDate(today.getDate() + next);
      const updateSavings = plan.totalSavingsTillDate + plan.amount;
      const updateInterest = await (updateSavings * INTERESTRATES['TARGET-SAVINGS']);

      await TargetSavings.findOneAndUpdate({ _id: plan._id }, {
        nextSavingDate: nextInv,
        interestRate: updateInterest,
        toRetry: false,
        $inc: { totalSavingsTillDate: plan.amount, daysLeft: plan.savingsLength - 1 },
      });
      logger.trace('<<<< Transaction completed successfully');
    }
    await newTranx.save();
  });
};
const getDuePlans = async () => {
  try {
    const d = new Date();
    const day = d.setUTCHours(0, 0, 0, 0);
    const e = new Date();
    const night = e.setUTCHours(23, 59, 59, 999);
    const duePlans = await TargetSavings.find({ nextSavingDate: { $gte: (day), $lt: (night) }, status: 'ACTIVE', isAutomated: 'ACTIVE' });
    await runSavings(duePlans);
  } catch (err) {
    logger.error(`<<<< Job failed due tols ${err}`);
  }
};

const deactivatePlans = async () => {
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

const handleFailure = async () => {
  try {
    // pick savings meant to have been run since yesterday
    const d = new Date();
    let yesterday = d.setDate(d.getDate() - 1);
    yesterday = d.setUTCHours(0, 0, 0, 0);
    const e = new Date();
    const day = e.setUTCHours(0, 0, 0, 0);
    const failedPlans = await TargetSavings.find({ nextSavingDate: { $gte: (yesterday), $lt: (day) }, status: 'ACTIVE' });
    await runSavings(failedPlans);
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
    deactivatePlans();
  });

  // this runs every 3am '0 3 * * *'
  schedule.schedule('0 3 * * *', async () => {
    handleFailure();
  });
};
