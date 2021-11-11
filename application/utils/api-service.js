const axios = require('axios');
const logger = require('./logger');

module.exports = {

  async request(correlationID, serviceKey, url, header, requestBody, method) {
    try {
      logger.trace(`${correlationID}:>>>> Entering ${serviceKey} API service`);
      const headerDetails = header;
      // set up the URL
      logger.trace(`${correlationID}: Making request to  ${url} in ${serviceKey} API service`);
      const resp = await axios({
        method,
        headers: headerDetails,
        url,
      });
      return resp;
    } catch (error) {
      logger.trace(`${correlationID}:>>>> Error in ${serviceKey} API service: ${error}`);
      throw new Error(error.message);
    }
  },
  async requestCustom(correlationID, serviceKey, url, header, requestBody, method) {
    try {
      logger.trace(`${correlationID}:>>>> Entering ${serviceKey} API service`);
      // set up the URL
      logger.trace(`${correlationID}: Making request to  ${url} in ${serviceKey} API service`);
      const resp = await axios({
        method,
        headers: header,
        url,
        data: requestBody,
      });
      return resp;
    } catch (error) {
      logger.trace(`${correlationID}:>>>> Error in ${serviceKey} API service: ${error}`);
      throw new Error(error.message);
    }
  },

};
