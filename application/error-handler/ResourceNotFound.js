class ResourceNotFound extends Error {
  constructor(resource, query) {
    super(`Resource ${resource} was not found.`);

    // assign the error class name in your custom error (as a shortcut)
    this.name = this.constructor.name;
    this.data = { resource, query };

    // capturing the stack trace keeps the reference to your error class
    Error.captureStackTrace(this, this.constructor);

    // you may also assign additional properties to your error
  }
}

module.exports = ResourceNotFound;
