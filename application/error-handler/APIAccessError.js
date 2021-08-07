const InvalidCredentialsError = require('./InvalidCredentialsError');

class APIAccessError extends InvalidCredentialsError {
}

module.exports = APIAccessError;
