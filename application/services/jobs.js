/* eslint-disable no-underscore-dangle */
const schedule = require('node-cron');
// const mailScheduler = require('./mailer');
const Fortvest = require('../models/Fortvest.model');
const Transaction = require('../models/Transaction.model');
const { chargeAuthorize } = require('./transaction-service');
const logger = require('../utils/logger');
// const pnScehuler = require('../utils/pn');
const { RETRYFREQ } = require('../config');

const getDuePlans = async () => {
  try {
    const d = new Date();
    const day = d.setHours(0, 0, 0, 0);
    const e = new Date();
    const night = e.setHours(23, 59, 59, 999);
    const duePlans = await Fortvest.find({ nextInvestmentDate: { $gte: (day), $lt: (night) }, status: 'ACTIVE' });
    let paystackStatus = '';
    let paystackReference = '';

    await Promise.all(duePlans.map(async (plan) => {
      // TODO: integrate paystack here
      const autoCharge = await chargeAuthorize(plan.card, plan.amount);
      if (autoCharge.status === 'success') {
        paystackStatus = 'COMPLETED';
        paystackReference = autoCharge.reference;
      } else paystackStatus = 'FAILED';
      // log transaction
      const newTranx = new Transaction();
      newTranx.user = plan.user;
      newTranx.transactionStatus = paystackStatus;
      newTranx.investment = plan._id;
      newTranx.paystackReference = paystackReference;
      newTranx.description = 'FORTVEST';
      newTranx.amount = plan.amount;
      await newTranx.save();
      if (paystackStatus === 'FAILED') {
        // set next trial to next 6 hrs
        logger.trace(`<<<< Transaction failed retry in ${RETRYFREQ} hrs`);

        const next6hrs = d.setTime(d.getTime() + (RETRYFREQ * 60 * 60 * 1000));
        await Fortvest.findOneAndUpdate({ _id: plan._id }, {
          nextInvestmentDate: next6hrs,
          toRetry: true,
        });
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
        });
        logger.trace('<<<< Transaction completed successfully');
      }
    }));
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

exports.job = async () => {
  // this runs every 5 HRS '0 */5 * * *'
  schedule.schedule('0 */5 * * *', async () => {
    getDuePlans();
  });
  // this runs every 12am '0 0 * * *'
  schedule.schedule('* * * * *', async () => {
    deactivatePlans();
  });
};
