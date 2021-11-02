const APISERVICE = require('../utils/api-service');
const logger = require('../utils/logger');

const { PAYSTACK_SECRET } = require('../config');

exports.verifyBVN = async (reqBody, correlationID) => {
  try {
    logger.trace(
      `${correlationID}: >>>> Entering transactionCordService.matchBVN()`,
    );
    const url = 'https://api.paystack.co/bvn/match';
    const headers = {
      authorization: `Bearer ${PAYSTACK_SECRET}`,
      'content-type': 'application/json',
      'cache-control': 'no-cache',
    };
    // console.log(headers, reqBody)
    logger.trace(
      `${correlationID}: >>>> call to  paystack api `,
    );
    const paystackBvnResponse = (await APISERVICE.requestCustom(correlationID, 'PAYSTACK', url, headers, reqBody, 'post'));
    if (!paystackBvnResponse.status) {
      throw new Error('An error occured when initializing transaction');
    }
    const response = {};
    response.data = paystackBvnResponse.data;
    response.message = '';
    return response;
  } catch (err) {
    throw new Error(err.message);
  }
};
