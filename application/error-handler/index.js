/* eslint-disable global-require */
// the general exports
module.exports = {
  /**
     *  port
     */
  APIAccessError: require('./APIAccessError'),
  ExpiredTokenError: require('./ExpiredTokenError'),
  InvalidCredentialsError: require('./InvalidCredentialsError'),
  ResourceNotFound: require('./ResourceNotFound'),
  ThirdPartyError: require('./ThirdPartyError'),
  TokenGenerationError: require('./TokenGenerationError'),
  UserAlreadyExistsError: require('./UserAlreadyExistsError'),
};
