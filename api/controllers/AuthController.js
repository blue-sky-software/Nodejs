/**
 * AuthController
 *
 * @description :: Server-side logic for managing auths
 * @help        :: See http://links.sailsjs.org/docs/controllers
 */

var is = require('is_js');

module.exports = {
	


  /**
   * `AuthController.login()`
   */
  login: function (req, res) {
    return res.view();
  },

  doLogin: function(req, res) {
    var username = req.body.username;
    var password = req.body.password;

    if(!is.string(username) || !is.string(password)) {
      return res.view('auth/login');
    }

    User
      .findOne()
      .where({ username: username, password: password })
      .exec(function(err, user) {
        if(err || !user) {
          res.locals.error = 'login_invalid';
          return res.view('auth/login');
        }

        if(!user.isActive && !user.isAdmin) {
          res.locals.error = 'block_user';
          return res.view('auth/login');
        }

        req.session.user = user;
        if(user.isAdmin) {
          return res.redirect('/admin/users');
        } else {
          return res.redirect('/dashboard');
        }
      });
  },

  signup: function (req, res) {
    return res.view();
  },

  doSignup: function(req, res) {
    if(typeof req.body !== 'undefined') {
      var username = req.body.userid;
      var fullname = req.body.username;
      var password = req.body.password;
      var confirm_password = req.body.confirm_password;      
      var email = req.body.email;
      delete req.session.user;

      if(is.string(username) && is.string(password) && is.string(confirm_password)
        && username.length > 0 && password.length > 0) {
        if(confirm_password !== password) {
          res.locals.error = 'login_invalid';
          return res.view('auth/signup');
        }

        async.waterfall([
          function exists(cb) {
            User
              .count({ username: username})
              .exec(function(err, count) {
                if(err) 
                {
                  return cb('admin.create_user');
                }

                if(count > 0) 
                {
                  return cb('admin.create_exists');
                }

                cb(null);
              });
          },

          function(cb) {
            User
              .create({
                username: username,
                password: password,
                fullname: fullname,
                email: email,
                isAdmin: false,
                isActive: true
              })
              .exec(function(err) {
                if(err) return cb('admin.create_user');
                return cb(null);
              });
          }
        ], function(err) {
          if(err) {
            res.locals.error = err;
            return res.view('auth/signup');
          } else {
            res.locals.success = true;
            return res.view('auth/login');
          }

        });
      }
    }
  },

  sharelink: function(req, res) {
    var email = req.params.id || null;

    console.log(email);

    if(req.session.user) {
        return res.redirect('/dashboard');
    }

    User
      .findOne()
      .where({ email: email })
      .exec(function(err, user) {
        console.log(user);
        if(err || !user) {
          res.locals.error = 'login_invalid';
          return res.redirect('/signup');
        }
        return res.redirect('/login');
      });

  },

  /**
   * `AuthController.logout()`
   */
  logout: function (req, res) {
    delete req.session.user;
    return res.redirect('/login');
  }
};

