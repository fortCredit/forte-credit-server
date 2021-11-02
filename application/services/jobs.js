/* eslint-disable no-underscore-dangle */
const schedule = require('node-cron');
// const mailScheduler = require('./mailer');
const Fortvest = require('../models/Fortvest.model');
const Transaction = require('../models/Transaction.model');
const logger = require('../utils/logger');
// const pnScehuler = require('../utils/pn');
// const config = require('../config');

const getDuePlans = async () => {
  try {
    const d = new Date();
    const day = d.setHours(0, 0, 0, 0);
    const night = d.setHours(23, 59, 59, 999);
    const duePlans = await Fortvest.find({ nextInvestmentDate: { $gte: (day), $lt: (night) } });
    console.log(duePlans);
    await Promise.all(duePlans.map(async (plan) => {
      // TODO: integrate paystack here
      // log transaction
      const paystackStatus = 'COMPLETED';
      const paystackReference = 'someref';

      const newTranx = new Transaction();
      newTranx.user = plan.user;
      newTranx.transactionStatus = paystackStatus;
      newTranx.investment = plan._id;
      newTranx.paystackReference = paystackReference;
      newTranx.amount = plan.amount;
      await newTranx.save();
      if (paystackStatus === 'FAILED') {
        // set next investment date to next day
        const tomorrow = d.setDate(d.getDate() + 1);
        await Fortvest.findOneAndUpdate({ _id: plan._id }, { nextInvestmentDate: tomorrow });
      } else {
        let next = 1;
        if (plan.frequency === 'WEEKLY') next = 7;
        else if (plan.frequency === 'MONTHLY') next = 31;
        const nextInv = d.setDate(d.getDate() + next);
        await Fortvest.findOneAndUpdate({ _id: plan._id }, { nextInvestmentDate: nextInv });
      }
      logger.trace('<<<< Transaction completed successfully');
      // set new nextInvestmentDate
    }));
  } catch (err) {
    logger.error(`<<<< Job failed due tols ${err}`);
  }
};

exports.job = async () => {
  schedule.schedule('* * * * * *', async () => {
    getDuePlans();
  });
};
