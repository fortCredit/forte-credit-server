const APISERVICE = require('../utils/api-service');
const logger = require('../utils/logger');

exports.sendSMS = async (phone, message, correlationID) => {
  let phoneNo;
  if (phone.startsWith('0')) {
    phoneNo = (` 234${phone.slice(1, 11)} `);
  }
  const payload = {
    to: phoneNo,
    from: 'MyFortvestNG',
    sms: message,
    type: 'plain',
    channel: 'generic',
    api_key: process.env.TERMII_API_KEY,
  };

  const url = process.env.TERMII_BASE_URL;
  const headers = {
    'Content-Type': ['application/json', 'application/json'],
  };

  logger.trace(`${correlationID}: <<<<< call to  termii api`);
  try {
    const res = (
      await APISERVICE.requestCustom(
        correlationID,
        'SMS',
        url,
        headers,
        payload,
        'post',
      )
    ).data;
    console.log(res);
  } catch (err) {
    throw new Error(err.message);
  }
};
