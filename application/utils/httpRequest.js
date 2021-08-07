const got = require('got');

exports.request = async (url, options) => got(url, options);
