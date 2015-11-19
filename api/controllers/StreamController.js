var request = require('request');
var parseString = require('xml2js').parseString;
var fs = require('fs');
var wowza = require('./../../assets/wowza/wowza.js');
var config = require('./../../assets/basic/config.js');
var basic_func = require('./../../assets/basic/date.js');
var is = require('is_js');
var AWS = require('aws-sdk');
var s3 = new AWS.S3();

module.exports = {
  create: function(req, res) {
    var owner = req.params.id || null;
    res.locals.owner = owner;
    res.locals.url = req.url;

    CameraModel
        .find()
        .exec(function(err, modellist) {
          res.locals.modellist = modellist;
          return res.view();
        });

  },

  doCreate: function(req, res) {
    console.log("--- doCreate ---");
    // console.log(req.url);
    var owner = req.allParams().id || '';

    if(typeof req.body === 'undefined') {
      return res.redirect('stream/create/' + owner);
    }

    var returnUrl = '/dashboard';
    if (req.session.user.isAdmin && owner !== 'null') {
      returnUrl = '/admin/cameraSettings/' + owner;
    }

    if(owner === 'null') 
      owner = res.locals.user.id;

    var ip_address = basic_func.getIPAddress();

    /* rtmp://admin:admin@192.168.1.105:81/video1/h.264/720p.sdp */
/*
    var stream_url_str = 'rtmp://' + req.body.cameraAdmin + ':' + req.body.cameraPass + '@' 
        + req.body.ip + ':' + req.body.port + '/video1/h.264/720p.sdp';
*/

    /* rtsp://wowza_ip:1935/vod/mp4:sample.mp4 */
    var live_url_str = 'rtmp://' + config.server_ip + ':1935/vod/mp4:sample.mp4';

    /* http://server_ip:port/camera_id*/
    var public_url_str = 'http://ip_address:port/public/camera_id';
    
    /* http://server_ip:port/notify*/
    var notify_url_str = 'http://server_ip:port/notify';
	
    var data = {
      cameraModel: req.body.cameraModel || '',
      description: req.body.description || '',
      ip:req.body.ip || '',
      port: req.body.port || '',
      cameraAdmin: req.body.cameraAdmin || '',
      cameraPass: req.body.cameraPass || '',
      phoneNumber: req.body.phoneNumber || '',
      url: req.body.cameraUrl || '',
      owner: owner,
      recDays: '4',
      recordable: 'On',

      live_url: live_url_str || '',
      public_url: public_url_str || '',
      notify_url: notify_url_str || '',
      camera_status: 'Init',
      notify_timoeout: 0,
      content_expiretime: 0,
    };
    
    Stream
      .create(data)
      .exec(function(err, created) {
        if(err) console.log(err);
	if (!err)
	{
		/* wowza configuration : create new application for ip camera */
	    wowza.setApplication(config.server_ip, config.user_id, config.user_pass, 
			config.default_server, config.default_vhost, created.id,
			function(code, data){
			    if (code == config.code_success)
				{
                    var camera_newstatus = 'ApplicationActive';
					console.log('Application Create Success!');

                    /* update notify, public url */
                    created.notify_url = 'http://'+ip_address+':'+sails.config.port+'/notify/cameraid/'+created.id;
                    created.public_url = 'http://'+ip_address+':'+sails.config.port+'/public/cameraid/'+created.id;
                   
                    /* ipcamera motion detect setting */
                    var requesturl = 'http://' +created.ip+':'+created.port+'/setmd.xml?user='+created.cameraAdmin+
                        '&password='+created.cameraPass+
                        '&Enable=1&HttpAlarm=1&Sensitivity=30&Duration=30'+
                        '&WeekHourCfg=ffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffff'+
                        '&Mask0='+config.mask0+'&Mask1='+config.mask1+'&Mask2='+config.mask2;
                    request({
                        url: requesturl,
                        method: 'GET',
                    }, function(err, res, body) {
                        if (err == null)
                        {
                            requesturl = 'http://' +created.ip+':'+created.port+'/sethttpalarm.xml?user='+created.cameraAdmin+
                                '&password='+created.cameraPass+
                                '&url=' + created.notify_url;
                            request({
                                url: requesturl,
                                method: 'GET',
                            }, function(err, res, body) {
                                if (err == null)
                                {
                                }
                            });
                        }
                    });

 
					/* wowza configuration : create stream file*/
                    created.live_url = 'rtmp://' + config.server_ip + ':1935/' + created.id + '/' + created.id + '.stream';
                    wowza.setStreamfile(config.server_ip, config.user_id, config.user_pass,
                        config.default_server, config.default_vhost, created.id, created.url,
                            function(code, data){
                                if (code == config.code_success)
                                {
                                    created.camera_status = 'CameraLiveActive';
                                    console.log('Streamfile Create Success!');
                                    wowza.connectStreamfile(config.server_ip, config.user_id, config.user_pass,
                                        config.default_server, config.default_vhost, created.id,
                                        function(code, data){
                                            if (code == config.code_fail)
                                            {
                                                console.log('Streamfile Connect Fail!');
                                                created.camera_status = 'CameraLiveInactive';
                                            }
                                            else
                                            {
                                                console.log('Streamfile Connect Success!');
                                            }
                                                
                                            /* update database */
                                            Stream.update({id: created.id },{live_url:created.live_url, 
                                                notify_url:created.notify_url,
                                                public_url:created.public_url,
                                                camera_status:created.camera_status})     
                                                .exec(function afterwards(err, updated){
                    					console.log("---End doCreate ---");
	        					return res.redirect(returnUrl);
						});
                                        });
                                }
                                else
                                {
                                    created.camera_status = 'CameraLiveInactive';
                                    console.log('Streamfile Create Fail!');

                                    /* update database */
                                    Stream.update({id: created.id },{live_url:created.live_url, 
                                        notify_url:created.notify_url,
                                        public_url:created.public_url,
                                        camera_status:created.camera_status})     
                                        .exec(function afterwards(err, updated){
                    				console.log("---End doCreate ---");
        					return res.redirect(returnUrl);
					});
                                }
                        });
				}
				else
				{
                    created.camera_status = 'ApplicationInactive';
					console.log('Application Create Fail!');
                    /* update database */
                    Stream.update({id: id },{camera_status:created.camera_status}) 
                        .exec(function afterwards(err, updated){if (err) {console.log(err);}
                            console.log(updated[0].camera_status);});
                    console.log("---End doCreate ---");
        			return res.redirect(returnUrl);
				}
			});
	}
	else
	{
        	return res.redirect(returnUrl);
	}
      });
  },

  proxy: function(req, res) {
    var path = req.query.path || '';

    if(!path.length) {
      return res.status(500);
    }

    request(path, function(err, response, body) {
      if(!body) {
        return res.json({ data: {} });
      }
      parseString(body, function (err, result) {
        return res.json({ data: result });
      });
    });
  },

  records: function(req, res) {
    var id = req.params.id || null;
    var moment = require('moment');

    if(!id) {
      return res.redirect('/dashboard');
    }
    var today = new Date().getTime();
    

    res.locals.sid = id;
    res.locals.date = moment(today).format('MM-DD-YYYY');
    res.locals.fromTime = '0:00';
    res.locals.toTime = '23:59';
    res.locals.assets_pre_path = 'http://s3.amazonaws.com/'+config.amazonbucketname+'/';


    if(req.body !== undefined) {
      var date = req.body.dateToday;
      var from = req.body.fromTime;
      var to = req.body.toTime;

      res.locals.date = date;
      res.locals.fromTime = from;
      res.locals.toTime = to;

      var datefrom = date + ', ' + from;
      var dateto = date + ', ' + to;

      var startDate = new Date(datefrom).getTime();
      var endDate = new Date(dateto).getTime();


      Stream
        .findById(id)
        .populate('records')
        // .where({ start_time: { '>=': startDate }, start_time: { '<=': endDate } })
        .exec(function(err, streams) {

          if(err || !res) {
            return res.redirect('/dashboard');
          }

          var aryRecords = [];
          var index = 0;
          streams[0].records.forEach(function(record) {
            if(record.start_time >= startDate && record.start_time <= endDate && record.record_status == 'Alive') {
              aryRecords[index++] = record;
            }
          });

          res.locals.moment = moment;
          res.locals.stream = streams[0];
          if(date === '' && from === '' && to === '')
            res.locals.aryRecords = streams[0].records;
          else
            res.locals.aryRecords = aryRecords;
          return res.view();
        });
    }
    else
    {
      Stream
        .findById(id)
        .populate('records')
        .exec(function(err, streams) {
          if(err || !res) {
            return res.redirect('/dashboard');
          }


          var aryRecords = [];
          var index = 0;
          streams[0].records.forEach(function(record) {
            if(record.record_status == 'Alive') {
              aryRecords[index++] = record;
            }
          });

          res.locals.moment = moment;
          res.locals.stream = streams[0];
          res.locals.aryRecords = aryRecords;
          return res.view();
        });
    }
  },

  r: function(req, res) {
      var img = fs.readFileSync('./api/records/' + req.params.id + '.gif');
     res.writeHead(200, {'Content-Type': 'image/gif' });
     res.end(img, 'binary');
  },

  settings: function(req, res) {
    var id = req.params.id || null;

    if(!id) {
      return res.redirect('/dashboard');
    }

    Stream
      .findById(id)
      .exec(function(err, streams) {
        if(err || !res) {
          return res.redirect('/dashboard');
        }
        res.locals.baseUrl = req.baseUrl;
        res.locals.stream = streams[0];
        return res.view();
      });
  },

  updateSettings: function(req, res) {
    var id = req.params.id || null;

    if(!id) {
      return res.redirect('/dashboard');
    }

    Stream
      .findById(id)
      .exec(function(err, streams) {
        if(err || !res) {
          return res.redirect('/dashboard');
        }

        streams[0].phoneNumber = req.body.phonenumber || '';
        // streams[0].recDays = req.body.recDays || '';
        // streams[0].recordable = req.body.recordable || '';

        streams[0].save(function() {
          return res.redirect('/stream/settings/' + req.params.id);
        });
      });

  },

  'delete': function(req, res) {
    var sid = req.allParams().id || '';
    var uid = req.allParams().uid || null;

    var returnUrl = '/dashboard';

    if (req.session.user.isAdmin && uid !== null) {
      returnUrl = '/admin/cameraSettings/' + uid;
    }

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
                            .exec(function(err) {
                            console.log('ShareUser entry delete');
                          });

	                       console.log('Stream entry delete!');
                        return res.redirect(returnUrl);
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

  }
};

