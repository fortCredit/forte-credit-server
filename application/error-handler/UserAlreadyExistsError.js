class UserAlreadyExistsError extends Error {
  constructor(email) {
    super(`User with email ${email} already exists.`);
    // assign the error class name in your custom error (as a shortcut)
    this.name = this.constructor.name.toUpperCase();
    this.data = { email };

    // capturing the stack trace keeps the reference to your error class
    Error.captureStackTrace(this, this.constructor);
    // you may also assign additional properties to your error
  }
}

module.exports = UserAlreadyExistsError;
