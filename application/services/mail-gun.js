const mailgun = require('mailgun-js');
const logger = require('../utils/logger');

const DOMAIN = 'mail.fortvest.ng';
const mg = mailgun({ apiKey: process.env.MAIL_GUN_APIKEY, domain: DOMAIN });

exports.sendMail = (mailObj) => {
  const { subject, body } = mailObj.data;
  const data = {
    from: 'Joe  <mail@hspace.ng>', // sender address
    to: mailObj.recipient,
    subject,
    html: body,
  };
  mg.messages().send(data, (error, resp) => {
    if (error) {
      return logger.error(`<<<< Failed sending mail ${error}`);
    }
    return logger.trace(`<<<< Mail sent successfully  ${resp}`);
  });
};
