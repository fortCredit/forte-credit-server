class ThirdPartyError extends Error {
  constructor(error) {
    super(error.message);
    // assign the error class name in your custom error (as a shortcut)
    this.name = this.constructor.name.toUpperCase();
    this.data = { error };

    // capturing the stack trace keeps the reference to your error class
    Error.captureStackTrace(this, this.constructor);

    // you may also assign additional properties to your error
  }
}

module.exports = ThirdPartyError;
