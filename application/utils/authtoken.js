const jwt = require('jsonwebtoken');
const User = require('../models/User.model');
const {JWTSECRET} = require('../config');

module.exports = {

    updateToken: async function(id) {
        // Generate an auth token for the user
         try{ 
            const jwtToken = jwt.sign({_id: id}, JWTSECRET);
            console.log(id)
            let updateUser = await User.findOneAndUpdate({_id:id},{$set:{token:jwtToken}},{new: true})
            console.log(updateUser)
            return updateUser;
            
        }
        catch(err){
            return console.log(err);
        }
    },
    
}
//authenticate user requests



