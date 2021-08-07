const sqs = require('./sqs');
const config = require('../config/index');
const logger = require('./logger');

module.exports = {

  async sendMail(msgObj) {
    try {
      logger.trace('Scheduling message');

      const params = {
        // Remove DelaySeconds parameter and value for FIFO queues
        DelaySeconds: 10,
        MessageBody: JSON.stringify(msgObj),
        QueueUrl: config.SQSQUEUEURL,
      };

      // eslint-disable-next-line no-unused-vars
      sqs.sendMessage(params, (err, data) => {
        if (err) {
          logger.error(`Message schedule failed due to: ${err}`);
        } else {
          logger.trace('Message schedule successful');
        }
      });
      return true;
    } catch (err) {
      logger.debug(`An error occurred sending the mail with metadata: ${err}`);
      const message = 'An error occurred sending the mail';
      return message;
    }
  },
};
