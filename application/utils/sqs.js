const AWS = require('aws-sdk');

class SQS {
  static getInstance() {
    AWS.config.update({ region: 'ap-southeast-1' });
    return new AWS.SQS({ apiVersion: '2012-11-05' });
  }
}

module.exports = SQS.getInstance();
