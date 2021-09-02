const log4js = require('log4js');
const config = require('../config/index');
// const SLACK_TOKEN = 'YOUR_SLACK_TOKEN HERE';
// const SLACK_CHANNEL = 'YOUR_CHANNEL';
// const SLACK_BOT_USERNAME = 'BOT_NAME';

class FortCreditLogger {
  constructor(ServiceName) {
    this.logEngine = log4js;
    this.serviceName = ServiceName;
    const appenders = {};
    appenders[ServiceName] = { type: 'file', filename: 'fortvest.log' };
    const appendersList = [ServiceName];

    this.logEngine.configure({
      appenders,
      categories: { default: { appenders: appendersList, level: 'all' } },
    });
  }

  static getInstance(ServiceName) {
    return new FortCreditLogger(ServiceName);
  }

  static getInstance(ServiceName) {
    return new FortCreditLogger(ServiceName);
  }

  getLogInstance() {
    return this.logEngine.getLogger(this.serviceName);
  }
}

module.exports = FortCreditLogger.getInstance('USRMGT').getLogInstance();
