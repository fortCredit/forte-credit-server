const http = require('got');

const makerequest = async (method, url, body = {}, headers = {}) => http(url, {
  method,
  json: body,
  responseType: 'json',
  retry: 0,
  headers,
});

module.exports = makerequest;
