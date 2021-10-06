/* eslint-disable global-require */
module.exports = {
  /**
   *  port
   */
  PORT: require('./port'),
  DATABASE: require('./database'),
  APP: require('./app'),
  /**
   * Credentials for the AWS Logs
   */
  AWSSERCRETACCESSKEY: process.env.AWS_SECRET_ACCESS_KEY, // access key from log role
  AWSSERCRETKEYID: process.env.AWS_ACCESS_KEY_ID, // secret key from log role
  RESPONSETEMPLATE: require('./responsetemplates/templatedata'),
  isProduction() { // function to check if production is set
    return (process.env.NODE_ENV === 'production');
  },
  // SQSQUEUEURL: 'https://sqs.ap-southeast-1.amazonaws.com/922482544618/EMAILQUEUE', // aws sqs queue comes in here
  MAILTEMPLATES: ['WELCOMEMAIL'],
  APIKEYS: {
    NOTIFAPIKEY: process.env.NOTIFAPIKEY,
  },
  SERVICEURLS: {
    NOTIFICATION: process.env.NTFSRVBASE,
  },
  USERROLES: ['CUSTOMER', 'BUSINESS', 'ADMIN'],
  ACCOUNT_TYPES: ['INDIVIDUAL', 'CORPORATE'],
  PROJECTNAME: 'MYFORTVEST.NG',
  JWTSECRET: process.env.JWTSECRET,
  PAYSTACK_SECRET: process.env.PAYSTACK_SECRET,
  FORTVESTPLANS: ['FIXED-INVEST', 'TARGET-INVEST', 'HIGH-YIELD'],
  FORTVESTFREQ: ['DAILY', 'WEEKLY', 'MONTHLY'],
  TRANSACTIONSTATUS: ['SUCCESSFUL', 'FAILED'],
  INVESTMENTSTATUS: ['ACTIVE', 'INACTIVE'],
};
