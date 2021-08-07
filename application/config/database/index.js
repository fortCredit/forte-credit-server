module.exports = {
  /**
   * mongo db connection string
   */
  MONGODB_LOCAL_URL: process.env.MONGODB_URI_LOCAL,
  MONGODB_URL: process.env.MONGODB_URI,
  JWTSECRET: process.env.JWT_TOKEN,

};
