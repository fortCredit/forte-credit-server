/* eslint-disable no-underscore-dangle */
const jwt = require('jsonwebtoken');
const User = require('../models/User.model');

module.exports = async (req, res, next) => {
  try {
    // Get token from header
    const token = req.header('x-auth-token');
    // Check if not token
    if (!token) {
      const response = {
        statuscode: 400,
        data: {},
        error: [],
        message: 'No token found',
      };
      return res.json(response);
    }
    const decoded = jwt.verify(token, process.env.JWTSECRET);
    const user = await User.findOne({ _id: decoded._id });

    // console.log(user);
    if (!user) {
      throw new Error();
    }
    if (!user.isVerified) throw new Error('Sorry, your account is not verified yet. Please check your email and follow the verification link');
    req.user = user;

    next();
  } catch (err) {
    const response = {
      statuscode: 501,
      data: [],
      error: [],
      message: 'Unauthorized Access',
    };
    return res.json(response);
  }
  return true;
};
