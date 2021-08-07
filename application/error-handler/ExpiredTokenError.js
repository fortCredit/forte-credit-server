class ExpiredTokenError extends Error {
  constructor(token) {
    super(
      `Token validation failed for ${token}. Token does not exist or is expired`,
    );
    // assign the error class name in your custom error (as a shortcut)
    this.name = this.constructor.name.toUpperCase();
    this.data = { token };
    // capturing the stack trace keeps the reference to your error class
    Error.captureStackTrace(this, this.constructor);
    // you may also assign additional properties to your error
  }
}

module.exports = ExpiredTokenError;
