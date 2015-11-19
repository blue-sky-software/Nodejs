/**
 * AdminController
 *
 * @description :: Server-side logic for managing admins
 * @help        :: See http://links.sailsjs.org/docs/controllers
 */

var async = require('async');
var is = require('is_js');
var request = require('request');
var config = require('./../../assets/basic/config.js');
var wowza = require('./../../assets/wowza/wowza.js');
var AWS = require('aws-sdk');
var s3 = new AWS.S3();

module.exports = {
	


  /**
   * `AdminController.index()`
   */
  index: function (req, res) {
    return res.redirect('/admin/users');
  },

  users: function(req, res) {
    var perPage = 15;
    var page = 1;

    if(typeof req.query.page !== 'undefined') {
      page = parseInt(req.query.page);
    }

    async.waterfall([
      function count(cb) {
        User.count(cb);
      },

      function getPages(count, cb) {
        var pages = Math.ceil(count / perPage);

        if(page > pages) {
          page = pages;
        } else if(page < 1) {
          page = 1;
        }

        res.locals.totalUsers = count;
        
        res.locals.page = page;
        res.locals.pages = pages;
        res.locals.backPage = (page === 1 ? -1 : (page - 1));
        res.locals.nextPage = (page >= pages ? -1 : (page + 1));

        cb(null);
      }
    ], function() {
      User
        .find()
        .paginate({page: page, limit: perPage})
        // .limit(perPage)
        .exec(function(err, users) {
          res.locals.users = users;
          return res.view();
        });
    });
  },

  createUser: function(req, res) {
    if(typeof req.body !== 'undefined') {
      var username = req.body.username;
      var password = req.body.password;
      var fullname = req.body.fullname;
      var email = req.body.email;
      var phonenumber = req.body.phonenumber;

      if(is.string(username) && username.length 
        && is.string(password) && password.length
        && is.string(fullname) && fullname.length
        && is.string(email) && email.length
        && is.string(phonenumber) && phonenumber.length) {
        async.waterfall([
          function exists(cb) {
            User
              .count({ username: username})
              .exec(function(err, count) {
                if(err) return cb('admin.create_user');
                if(count > 0) return cb('admin.create_exists');
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
                phonenumber: phonenumber,
                isAdmin: false,
                isActive: true,
              })
              .exec(function(err) {
                if(err) return cb('admin.create_user');
                return cb(null);
              });
          }
        ], function(err) {
          if(err) {
            res.locals.error = err;
          } else {
            res.locals.success = true;
          }

          return res.view();
        });

        return;
      }
    }
    res.locals.error = 'admin.create_invalidparam';
    return res.view();
  },

  deleteUser: function(req, res) {
    var id = req.allParams().id || null;
    if(id === null) {
      return res.redirect('/admin/users');
    }

    User
       .findOne()
              .where({ id: id })
              .populate('streams')
              .exec(function(err, user) {
		user.streams.forEach(function(stream){

		var sid = stream.id;
		wowza.deleteStreamfile(config.server_ip, config.user_id, config.user_pass,
        	config.default_server, config.default_vhost, sid,
        	function(code, data){
        	console.log('Stream file delete!');
        	wowza.deleteApplication(config.server_ip, config.user_id, config.user_pass,
        	    config.default_server, config.default_vhost, sid,
        	    function(code, data){
        	        console.log('Application delete!');
        	        Stream
        	            .destroy({ id: sid || '<empty>' })
        	            .exec(function(err) {
				ShareUser
					.destroy({stream: sid || '<empty>'})
					.exec(function(err) {console.log('ShareUser entry delete');});
	      	                console.log('Stream entry delete!');
        	            });
                	Record
                 	 .find()
                 	 .where({ stream_id: sid})
                 	 .exec(function(err, records) {
                        	records.forEach(function(record) {
                        if (!config.debug_mode)
                        {
                            var params = {
                                Bucket: config.amazonbucketname,
                                Key: record.record_name,
                            }
                            s3.deleteObject(params, function (err, data) {});
                        }
                                	Record
                                 	 .destroy({id : record.id})
                                 	 .exec(function(err) {});
                        	});
                	});
        	    });
        	});


		});
            });


    User
      .destroy({ id: id })
      .exec(function() {
        	console.log('User delete!');
      		return res.redirect('/admin/users');
      });

  },

  activeUser: function(req, res) {
    var id = req.params.id || null;
    console.log('activeUser ' + id);

    if(id === null) {
      return res.redirect('/admin/users');
    }

    User
      .update({id: id },{isActive:'true'})
      .exec(function afterwards(err, updated){
        if (err) {
        }
        return res.redirect('/admin/users');
        console.log('Updated user to have name ' + updated[0].username);
    });
  },

  inactiveUser: function(req, res) {
    var id = req.params.id || null;
    console.log('activeUser ' + id);

    if(id === null) {
      return res.redirect('/admin/users');
    }

    User
      .update({id: id },{isActive:'false'})
      .exec(function afterwards(err, updated){
        if (err) {
        }
        return res.redirect('/admin/users');
        console.log('Updated user to have name ' + updated[0].username);
    });
  },

  cameraSettings: function(req, res) {

    var user = res.locals.user;
    var uid = null;

    if(user.isAdmin) {
      uid = req.params.id || null;
    }

    User
      .findById(uid)
      .populate('streams')
      .exec(function(err, users) {
        if(!users.length) {
          return res.redirect(user.isAdmin ? '/admin/users' : '/dashboard');
        }

        res.locals.suser = users[0];
        return res.view();
      });
  },

  doRecordable: function(req, res) {

    var sid = req.allParams().sid || null;
    var uid = req.allParams().uid || null;

    Stream
      .findById(sid)
      .exec(function(err, streams) {
        if(err || !res) {
          return res.redirect('/admin/cameraSettings/' + uid);
        }

        streams[0].recordable = (streams[0].recordable === 'on')?'off':'on';

                    /* ipcamera motion detect setting */
        var requesturl;
	if (streams[0].recordable === 'on')
		requesturl = 'http://'+streams[0].ip+':'+streams[0].port+'/setmd.xml?user='+streams[0].cameraAdmin+
       			'&password='+streams[0].cameraPass+'&Enable=1&HttpAlarm=1&Sensitivity=30&Duration='+config.interval+
			'&Mask0='+config.mask0+'&Mask1='+config.mask1+'&Mask2='+config.mask2;
	else
		requesturl = 'http://'+streams[0].ip+':'+streams[0].port+'/setmd.xml?user='+streams[0].cameraAdmin+
       			'&password='+streams[0].cameraPass+'&Enable=0&HttpAlarm=0&Sensitivity=30&Duration='+config.interval+
			'&Mask0='+config.mask0+'&Mask1='+config.mask1+'&Mask2='+config.mask2;
        request({url: requesturl, method: 'GET'}, function(err, res, body) {});

        streams[0].save(function() {
          return res.redirect('/admin/cameraSettings/' + uid);
        });
      });
  },

  doRecordDays: function(req, res) {

    var sid = req.allParams().sid || null;
    var uid = req.allParams().uid || null;
    var status = req.allParams().val || null;

    Stream
      .findById(sid)
      .exec(function(err, streams) {
        if(err || !res) {
          return res.redirect('/admin/cameraSettings/' + uid);
        }

        streams[0].recDays = status || '';

        streams[0].save(function() {
          return res.redirect('/admin/cameraSettings/' + uid);
        });
      });
  },

  addCameraModel: function(req, res) {
    var cameraid = req.body.cameraid;
    var returnUrl = req.body.returnUrl;

    var data = {
      name: cameraid || '',
    };

    CameraModel
      .create(data)
      .exec(function(err, created) {
        if(err) console.log(err);
      });

    return res.redirect(returnUrl);
  },

  saveCameraModel: function(req, res) {
    var returnUrl = req.body.returnUrl;

    var shared = req.body.shared;

    CameraModel
      .destroy()
      .exec(function deleteCB(err){
        
        if(shared != undefined) {
          shared.forEach(function(cameramodel, index) {
            var data = {
              name: cameramodel || '',
            };
            CameraModel
              .create(data)
              .exec(function(err, created) {
            });
          });

        }
        return res.redirect(returnUrl);
      });
  },

};

