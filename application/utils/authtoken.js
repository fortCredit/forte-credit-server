const jwt = require('jsonwebtoken');
const User = require('../models/User.model');
const { JWTSECRET } = require('../config');

module.exports = {

  async updateToken(id) {
    // Generate an auth token for the user
    try {
      const jwtToken = jwt.sign({ _id: id }, JWTSECRET);
      console.log(id);
      const updateUser = await User
        .findOneAndUpdate({ _id: id }, { $set: { token: jwtToken } }, { new: true });
      console.log(updateUser);
      return updateUser;
    } catch (err) {
      return console.log(err);
    }
  },

};
// authenticate user requests
