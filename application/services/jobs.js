/* eslint-disable no-underscore-dangle */
const schedule = require('node-cron');
// const mailScheduler = require('./mailer');
const Fortvest = require('../models/Fortvest.model');
const Transaction = require('../models/Transaction.model');
const { chargeAuthorize } = require('./transaction-service');
const logger = require('../utils/logger');
// const pnScehuler = require('../utils/pn');
const { RETRYFREQ } = require('../config');

const runInvestments = async (investments) => {
  investments.forEach(async (plan) => {
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
    newTranx.investment = plan._id;
    newTranx.paystackReference = paystackReference;
    newTranx.transactionType = 'CREDIT';
    newTranx.description = plan.planType;
    newTranx.amount = plan.amount;
    if (paystackStatus === 'FAILED') {
      // set next trial to next 6 hrs
      newTranx.failedDueTo = autoCharge.gateway_response;
      const d = new Date();
      logger.trace(`<<<< Transaction failed retry in ${RETRYFREQ} hrs`);
      const next6hrs = d.setTime(d.getTime() + (RETRYFREQ * 60 * 60 * 1000));
      await Fortvest.findOneAndUpdate({ _id: plan._id }, {
        nextInvestmentDate: next6hrs,
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
      await Fortvest.findOneAndUpdate({ _id: plan._id }, {
        nextInvestmentDate: nextInv,
        toRetry: false,
        $inc: { totalInvestmentTillDate: plan.amount },
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
    const duePlans = await Fortvest.find({ nextInvestmentDate: { $gte: (day), $lt: (night) }, status: 'ACTIVE' });
    await runInvestments(duePlans);
  } catch (err) {
    logger.error(`<<<< Job failed due tols ${err}`);
  }
};

const deactivatePlans = async () => {
  try {
    const d = new Date();
    await Fortvest.updateMany({ investMentEndDate: { $lt: (d) }, status: 'ACTIVE', toRetry: false }, { status: 'INACTIVE' });
  } catch (err) {
    logger.error(`<<<< Job failed due tols ${err}`);
  }
};

const handleFailure = async () => {
  try {
    // pick investments meant to have been run since yesterday
    const d = new Date();
    const yesterday = d.setDate(d.getDate() - 1);
    const e = new Date();
    const day = e.setUTCHours(0, 0, 0, 0);
    const failedPlans = await Fortvest.find({ nextInvestmentDate: { $gte: (yesterday), $lt: (day) }, status: 'ACTIVE' });
    await runInvestments(failedPlans);
  } catch (err) {
    logger.error(`<<<< Job failed due tols ${err}`);
  }
};

exports.job = async () => {
  // this runs every 5 HRS '0 */5 * * *'
  schedule.schedule('*/10 * * * * *', async () => {
    getDuePlans();
  });
  // this runs every 12am '0 0 * * *'
  schedule.schedule('* * * * *', async () => {
    deactivatePlans();
    handleFailure();
  });
};
