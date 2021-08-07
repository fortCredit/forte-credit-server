/* eslint-disable no-param-reassign */
const httprequest = require('../utils/webrequest');
const httpmethod = require('../utils/httpmethod');
const { SERVICEURLS, APIKEYS } = require('../config');
// register function
const URLS = {
  BASE: SERVICEURLS.NOTIFICATION,
  ADDNOTIFICATION: '/add',
};
const setupbase = async (requestData, header, url) => {
  header['x-api-key'] = APIKEYS.NOTIFAPIKEY;
  return httprequest(httpmethod.POST, url, requestData, header);
};

// Register call
const addInbox = async (requestData, header) => setupbase(
  requestData, header, URLS.BASE + URLS.ADDNOTIFICATION,
);

module.exports = {
  addInbox,
};
