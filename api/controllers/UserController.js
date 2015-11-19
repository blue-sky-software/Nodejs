/**
 * UserController
 *
 * @description :: Server-side logic for managing users
 * @help        :: See http://links.sailsjs.org/docs/controllers
 */

var is = require('is_js');
var basic_func = require('./../../assets/basic/date.js');
var config = require('./../../assets/basic/config.js');


module.exports = {

  /**
   * `UserController.dashboard()`
   */
  dashboard: function (req, res) {

    if (typeof req.session.user === 'undefined') {
      return res.redirect('/login');
    }

    var sid = req.params.id || null;
    res.locals.streamData = null;
    res.locals.shareUrl = null;
    res.locals.bsharedStream = false;

    if(req.session.user.isAdmin) {
      if(sid === null) {
        return res.redirect('/admin/users');
      }
      else
      {
        Stream
        .findOne()
        .where({id: sid})
        .exec(function(err, stream) {
            if(stream === undefined) {
              return res.redirect('/admin/users');
            }
            User
              .findOne()
              .where({ id: stream.owner })
              .populate('streams')
              .exec(function(err, user) {
                res.locals.streams = user.streams;

                ShareUser
                  .find()
                  .where({emailTo: user.email})
                  .exec(function(err, urls){
                    if(err) {} else {
                      res.locals.shareUrl = urls;
                    }

                    // if sid === null, then decide sid
                    if(sid === null) {
                      if(user.streams.length > 0) {
                        sid = user.streams[0].id;
                      } else if (urls.length > 0) {
                        sid = urls[0].stream;
                      } else {
                        return res.view();
                      }
                    }

                    Stream
                    .findOne()
                    .populate('share_urls')
                    .where({id: sid})
                    .exec(function(err, stream) {
                      res.locals.streamData = stream;
                      if(stream.owner !== user.id) {
                        res.locals.bsharedStream = true;
                      }
                      return res.view();
                    });
                  });
              });
          });
      }        
    }
    else
    {
      User
        .findOne()
        .where({ username: res.locals.user.username })
        .populate('streams')
        .exec(function(err, user) {
          res.locals.streams = user.streams;

          ShareUser
            .find()
            .where({emailTo: user.email})
            .exec(function(err, urls){
              if(err) {} else {
                res.locals.shareUrl = urls;
              }

              // if sid === null, then decide sid
              if(sid === null) {
                if(user.streams.length > 0) {
                  sid = user.streams[0].id;
                } else if (urls.length > 0) {
                  sid = urls[0].stream;
                } else {
                  return res.view();
                }
              }

              Stream
              .findOne()
              .populate('share_urls')
              .where({id: sid})
              .exec(function(err, stream) {
                res.locals.streamData = stream;
                if(stream.owner !== user.id) {
                  res.locals.bsharedStream = true;
                }
                return res.view();
              });
            });
        });
    }

  },

  doShare: function(req, res) {
    var email = req.body.emailShare;
    var sid = req.body.streamid;

    if(is.string(email)) {
      var data = {
        stream: sid || '',
        from: res.locals.user.username || '',
        emailTo: email || '',
        isShared: true
      };

      ShareUser
        .create(data)
        .exec(function(err, created) {
          if(err) {
            console.log(err);
          }
          else{
            var nodemailer = require('nodemailer');
            var transporter = nodemailer.createTransport({
                service: config.smtp_type,
                auth: {
                    user: config.auth_user,
                    pass: config.auth_password
                }
            });

            var shareUrl = 'http://' + basic_func.getIPAddress();
            shareUrl += ':' + sails.config.port;
            shareUrl += config.share_url + email;

            var mailOptions = {
                from: sails.config.globals.AuthUser,
                to: email,
                subject: 'ShareLink',
                text: 'If you want to see shared video, click as following link! ' + shareUrl
            };

            transporter.sendMail(mailOptions, function(error, info){
                if(error){
                    console.log(error);
                }else{
                    console.log('Message sent: ' + info.response);
                }
            });

          }
      });
    }
    return res.redirect('/dashboard');
  },

  doViewShare: function(req, res) {
    var shared = req.body.shared;
    var sid = req.body.streamid;

    ShareUser
      .destroy({stream:sid})
      .exec(function deleteCB(err){
        console.log('The record has been deleted');
        if(shared != undefined) {
          shared.forEach(function(url, index) {
            var data = {
              stream: sid || '',
              email: url || '',
              isShared: true
            };
            ShareUser
              .create(data)
              .exec(function(err, created) {
            });
          });
        }
      });

    return res.redirect('/dashboard');
  },

  settings: function(req, res) {
    var user = res.locals.user;
    var uid = null;

    if(user.isAdmin) {
      uid = req.params.uid || null;
    }

    User
      .findById(uid || res.locals.user.id)
      .exec(function(err, users) {
        if(!users.length) {
          return res.redirect(user.isAdmin ? '/admin/users' : '/dashboard');
        }

        res.locals.suser = users[0];
        return res.view();
      });
  },

  updateSettings: function(req, res) {
    var user = res.locals.user;
    var uid = null;

    if(user.isAdmin) {
      uid = req.params.uid || null;
    }


    var username = req.body.username;
    var password = req.body.password;
    var fullname = req.body.fullname;
    var email = req.body.email;


    User
      .findById(uid || res.locals.user.id)
      .exec(function(err, users) {

        if(err || !users.length) {
          return res.redirect(user.isAdmin ? '/admin/users' : '/dashboard');
        }

        users[0].username = username;
        users[0].password = password;
        users[0].fullname = fullname;
        users[0].email = email;

        users[0].save(function(err) {
          res.locals.suser = err ? users[0] : user;
          if(err) {
            return res.view('user/settings', { success: err ? false : true });
          } else {
            return res.redirect('/dashboard');
          }
        });
      });
  },

};

