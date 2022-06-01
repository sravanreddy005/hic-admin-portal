const passport = require('passport');
const LocalStrategy = require('passport-local').Strategy;
const crypto = require('crypto');
const { Admin, HotelUsers } = require('../models/admin.model');
const { AdminModels } = require('../database')

validatePassword = (password, salt, oldHash) => {
  const hash = crypto.pbkdf2Sync(password, salt, 1000, 64, 'sha512').toString('hex');
  return hash === oldHash;
};

passport.use('admin-login', new LocalStrategy({usernameField: 'email'}, function(username, password, done) {
    // try {
    //   const data = await AdminModels.Admin.findOne({ where: {email: username} });
    //   resolve(data);
    // } catch (error) {
    //   winston.info({ 'Exception occured while fetching record from transaction_details table::': JSON.stringify(error) });
    //   reject({ error });
    // }
    // const data = await AdminModels.findOne({ where: whereData });
    AdminModels.Admin.findOne({ where: {email: username} }, async function (err, user) {
      if (err) { return done(err); }
      // Return if user not found in database
      if (!user) {
        return done(null, false, {
          responseCode: 0,
          message: 'Invalid Email Address'
        });
      }
      // Return if password is wrong
      if (!user.validPassword(password)) {
        return done(null, false, {
          responseCode: 0,
          message: 'Invalid Password'
        });
      }
            
      // If credentials are correct, return the user object
      return done(null, user);
    });
  }
));

passport.use('hotel-login', new LocalStrategy({usernameField: 'email'}, function(username, password, done) {
  try {
    HotelUsers.findOne({ email: username }, async function (err, user) {
      if (err) { return done(err); }
      // Return if user not found in database
      if (!user) {
        return done(null, false, {
          responseCode: 0,
          message: 'Invalid Email Address'
        });
      }
      // Return if password is wrong
      if (!this.validatePassword(password, user.salt, user.hash)) {
        return done(null, false, {
          responseCode: 0,
          message: 'Invalid Password'
        });
      }
            
      // If credentials are correct, return the user object
      return done(null, user);
    });
  } catch (error) {
    return done(error);
  }
  
}
));