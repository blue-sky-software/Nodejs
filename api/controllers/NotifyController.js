/**
 * NotifyController
 *
 * @description :: Server-side logic for managing notifies
 * @help        :: See http://sailsjs.org/#!/documentation/concepts/Controllers
 */

var datetostring = require('../../assets/basic/date.js');
var ffmpeg = require('../../assets/basic/ffmpeg.js');
var config = require('../../assets/basic/config.js');
var parseXML = require('xml-parser');
var AWS = require('aws-sdk');
var s3 = new AWS.S3();

var wowza = require('./../../assets/wowza/wowza.js');
var config = require('./../../assets/basic/config.js');

module.exports = {
  /**
   * `NotifyController.cameraid()`
   */
  cameraid: function (req, res) {
    var id = req.params.id || null;

    Stream
      .findOne()
      .where({ id: id })
      .exec(function(err, stream) {

      var startDate = new Date();
      console.log("notify time : " + startDate);

        if(!stream) {
          return res.json({error: 'Invalid Id'});
        }
	
        if(stream.owner.isAdmin)
        {
          return res.json({error: 'Admin User'});
        }

        if (stream.recordable === 'off')
        {
          console.log('stream_id:' + id + 'Cannot Recordable (non record camera)');
          return res.json({error: 'Cannot Recordable (non record camera)'});
        }
        
        if (stream.camera_status === 'Delete' || stream.camera_status === 'ApplicationInactive' || stream.camera_status === 'CameraLiveInactive')
        {
            console.log('stream_id:' + id + ' Inactive!');
            return res.json({error: 'Camera Inactive'});
        }

        if (stream.camera_status === 'Recording')
        {
            console.log('Notify egnore, recording Now!');
	    stream.notify_timoeout = 0;
	    Stream.update({id: stream.id },{notify_timoeout:stream.notify_timoeout})
		.exec(function afterwards(err, updated){});
		
            return res.json({error: 'Camera Recording Now'});
        }
        console.log('Recording Start!');

        /* create new record */
        var current_date = datetostring.getDateTime();
        //console.log(current_date);
        var data = {
            record_name:    stream.id + '_' + current_date + '.mp4',
            start_time:     current_date || '',
            end_time:       '',
            thumb_path:     '',
            s3_asset_path:  '',
            record_status:  'Init',
            s3_property:    'public',
            stream_id:      id,
            stream:         stream,
            processing:     true,
        };
        stream.camera_status = 'CameraRunning';

        Record
         .findOne()
         .where({ record_name: stream.id, record_status: 'Recording' })
         .exec(function(err, existrecord) {
            if (!existrecord)
            {
                Record.create(data).exec(function(err, record) {
                    if (err)
                    {
                        return res.json({info: 'Record Create Fail'});
                    }

                    /* wowza record start */
                    wowza.recordStart(config.server_ip, config.user_id, config.user_pass,
                        stream.id, stream.id+'.stream', config.dst_dir, record.record_name, function(code, data){
                            if (code == config.code_success)
                            {
                                console.log('wowza recording start');
                                console.log('stream_id:' + id + ' create record!');
                                record.record_status = 'Recording';
                                Record.update({id: record.id },{record_status:record.record_status}) 
                                 .exec(function afterwards(err, updated){});

				var thumbname = record.id + '.jpg'
		    		ffmpeg.thumbnail(stream.url, thumbname, function(thumbpath){
                                	Record.update({id: record.id },{thumb_path:thumbpath})
                                	.exec(function afterwards(err, updated){});
				});

                                stream.camera_status = 'Recording';
                                stream.notify_timoeout = 0;
                                Stream.update({id: stream.id },{camera_status:stream.camera_status, 
                                 notify_timoeout:stream.notify_timoeout})     
                                 .exec(function afterwards(err, updated){});

                                return res.json({info: 'New Record Create'});
                            }
                            else
                            {
                                stream.camera_status = 'CameraLiveActive';
                                Stream.update({id: stream.id },{camera_status:stream.camera_status})     
                                 .exec(function afterwards(err, updated){});

                                Record
                                 .destroy({id : record.id})
                                 .exec(function(err) {
                                    console.log('Record(' + record.record_name + ') Canceled!');
                                }); 

                                console.log('wowza recording start fail');
                                return res.json({info: 'Cannot Create Record'});
                            }
                        });
                });
            }
            else
            {
                console.log('Exist recording entry Now!');
                return res.json({error: 'Exist recording entry Now'});
            }
        });
      });
  },

  recordPolling: function (req, res) {
    Stream
     .find()
     .exec(function(err, streams) {
        if (err)
        {
            console.log('Donot exist users');
            return res.json({
                todo: 'recordPolling processed!'
            });
        }

        var startDate = new Date();
        //console.log("polling time : " + startDate);

        streams.forEach(function(stream) {
        //console.log("polling timeout : " + stream.notify_timoeout);
	    if (stream.notify_timoeout >= config.timeoutretry || stream.recordable == 'Off')
            {
                /* update camera status */
                stream.camera_status = 'CameraRunning';
               	//console.log('camera status : ' + stream.camera_status + ' : ' + stream.id);
                Stream.update({id: stream.id },{camera_status:stream.camera_status})     
                 .exec(function afterwards(err, updated){});
                //console.log('recordPolling: Camera->CameraRunning');

                /* update record stop */
                Record
                 .find()
                 .where({ stream_id: stream.id, record_status: 'Recording' })
                 .exec(function(err, records) {
                    records.forEach(function(record) {
                        console.log('recordPolling: Record->Valid');
                        record.record_status = 'Valid';
                        record.end_time = datetostring.getDateTime();
                        record.record_name = record.stream_id+'_'+record.start_time+'.mp4';
                        Record.update({id: record.id },{record_status:record.record_status, 
                         end_time:record.end_time, record_name:record.record_name})     
                         .exec(function afterwards(err, updated){});

                        /* wowza record stop */
                        wowza.recordStop(config.server_ip, config.user_id, config.user_pass,
                         stream.id, stream.id+'.stream', function(code, data){
                            if (code == config.code_success)
                                console.log('wowza recording stop');
                            else
                                console.log('wowza recording stop fail');
                            });
                    });
                });
            }
            else
            {
                stream.notify_timoeout ++;
                Stream.update({id: stream.id },{notify_timoeout:stream.notify_timoeout})     
                 .exec(function afterwards(err, updated){});
            }
            
        });
        
        return res.json({
            todo: 'recordPolling processed!'
        });
    });
  },

  s3Update: function (req, res) {

    Record
     .find()
     .exec(function(err, records) {
        if (err)
        {
            console.log('Donot exist records');
            return res.json({
                todo: 's3Update processed!'
            });
        }
        else
        {
            records.forEach(function(record) {
                //console.log('record(' + record.record_name + ')' + ' status is ' + record.record_status);
                if (record.record_status == 'Valid')
                {
                    console.log('Amazon file Check Start!');

                    record.record_status = 'InAlive';
                    /* http://s3.amazonaws.com/synccam-recordings/testlive.stream.mp4 */
                    record.s3_asset_path = 'http://s3.amazonaws.com/'+config.amazonbucketname+'/'+record.record_name;
                    Record.update({id: record.id },{record_status:record.record_status, 
                         s3_asset_path:record.s3_asset_path})     
                         .exec(function afterwards(err, updated){});

                    if (!config.debug_mode)
                    {
                        var params = {
                            Bucket: config.amazonbucketname,
                            EncodingType: 'url',
                            MaxKeys: 1,
                            Delimiter: '/',
                            Prefix: record.record_name,
                        }

                        var filename = record.record_name;
                        s3.listObjects(params, function (err, data) {
                            if(err){
                                console.log(err);
                                Record
                                 .destroy({id : record.id})
                                 .exec(function(err) {
                                    console.log('Record(' + filename + ') Deleted (Amazon s3 access error)!');
                                });
                            }
                            else
                            {
                                //console.log('amazon s3 response!');
                                if (data['Contents'].length == 1) /* exist*/
                                {
                                    console.log('find s3 file! ' + record.record_name);
                                    record.record_status = 'Alive';
                                    Record.update({id: record.id },{record_status:record.record_status})     
                                        .exec(function afterwards(err, updated){});
                                }
                                else
                                {
                                    console.log('donot find s3 file! ' + record.record_name);
                                    Record
                                     .destroy({id : record.id})
                                     .exec(function(err) {
                                        console.log('Record(' + filename + ') Deleted (s3 file invalid)!');
                                    });
                                }
                            }
                        });
                    }
                    else
                    {
                        console.log('record update in debug mode');
                        record.record_status = 'Alive';
                        Record.update({id: record.id },{record_status:record.record_status})     
                         .exec(function afterwards(err, updated){});
                    }
                }
            });
            return res.json({
                todo: 's3Update processed!'
            });
        }
    });
  },

  s3FileDelete: function (req, res) {
    Record
     .find({record_status: 'Alive'})
     //.find()
     .exec(function(err, records) {
        if (err)
        {
            console.log('Donot exist records');
            return res.json({
                todo: 's3FileDelete processed!'
            });
        }
        else
        {
            records.forEach(function(record) {
                //console.log(record.record_status);
                /* expire time check */
                var expire_time = 4;
                Stream
                 .findOne({id: record.stream_id})
                 .exec(function(err, stream) {
                    if (!err && stream)
                    {
                        expire_time = stream.recDays - '0';
                    }

                var start_time = record.start_time - '0';
                expire_time = expire_time * 24 * 3600 * 1000;
                if (config.debug_mode)
                    expire_time = 90 * 1000; /* 90 second */
             	
		        //expire_time = 90 * 1000; /* 90 second */
                expire_time = start_time + expire_time;
                
                var current_time = datetostring.getDateTime();
                var expire_file = false;
                if (expire_time < current_time)
		        {
                    expire_file = true;
                	console.log('s3 delete :' + record.record_name);
		        }

                if (expire_file)
                {
                    console.log('Amazon file Delete Start!');
                    record.record_status = 'InAlive';

                    if (!config.debug_mode)
                    {
                        var params = {
                            Bucket: config.amazonbucketname,
                            Key: record.record_name,
                        }

                        s3.deleteObject(params, function (err, data) {
                            if(err)
                                console.log(err);
                            else
                                console.log(data);
                        });
                    }
                    
                    var filename = record.record_name;
                    Record
                     .destroy({id : record.id})
                     .exec(function(err) {
                        console.log('Record(' + filename + ') Deleted!');
                    }); 
                }

                });
            });
            return res.json({
                todo: 's3FileDelete processed!'
            });
        }
    });
  },

  recordDump: function (req, res) {

    Record
     .find()
     .exec(function(err, records) {
        if (err)
        {
            console.log('Donot exist records');
            return res.json({
                todo: 'Donot exist records'
            });
        }
        else
        {
            records.forEach(function(record) {
                console.log(record);
             });
            return res.json({
                todo: 'recordDump processed!'
            });
        }
    });
  },

  recordDelete: function (req, res) {
    Record
     .destroy()
     .exec(function(err) {
    });

    return res.json({info: 'All Record Deleted'});
        return res.json({
            todo: 'recordDelete processed!'
        });
  },

  userDump: function (req, res) {
    User
     .find()
     .exec(function(err, users) {
        if (err)
        {
            console.log('Donot exist Users');
            return res.json({
                todo: 'Donot exist Users'
            });
        }
        else
        {
            users.forEach(function(user) {
                console.log(user);
             });

            Stream
             .find()
             .exec(function(err, streams) {
                console.log('--- Streams Dump ---');
                if (!err)
                {
                    streams.forEach(function(stream) {
                        console.log(stream);
                     });
                }
                else
                    console.log('Donot exist Streams');
            });

            return res.json({
                todo: 'userDump processed!'
            });
        }
    });
  },

  userDelete: function (req, res) {
    User
     .find()
     .exec(function(err, users) {
        if (!err)
        {
            users.forEach(function(user) {
                if (!user.isAdmin)
                    User
                     .destroy({id: user.id})
                     .exec(function(err) {
                    });
             });

            Stream
            .destroy()
            .exec(function(err) {
                return res.json({todo: 'userDelete processed!'});
            });
        }
        else
            return res.json({todo: 'userDelete processed!'});
    });
  },

  download: function (req, res) {
    var url = req.allParams().url || null;
    
    if (url !== null) {
        res.download(config.dst_dir + url);
    };
  },

  restart: function (req, res) {
    Record
     .find()
     .where({record_status: 'Recording' })
     .exec(function(err, records) {
        if (!err){
        records.forEach(function(record) {
        console.log('recordPolling: Record->Valid');
        record.record_status = 'Valid';
        record.end_time = datetostring.getDateTime();
        record.record_name = record.stream_id+'_'+record.start_time+'.mp4';
        Record.update({id: record.id },{record_status:record.record_status, 
         end_time:record.end_time, record_name:record.record_name})     
         .exec(function afterwards(err, updated){});
                        
        wowza.recordStop(config.server_ip, config.user_id, config.user_pass,
         record.stream_id, record.stream_id+'.stream', function(code, data){
            if (code == config.code_success)
                console.log('wowza recording stop');
            else
                console.log('wowza recording stop fail');
            });
        });
	}
	else
       		console.log('not exist');
    });
    Stream
     .find()
     .exec(function(err, streams) {
        if (!err)
        {
		streams.forEach(function(stream) {
		    if (stream.camera_status === 'Recording')
		    {
			stream.camera_status = 'CameraRunning';
			Stream.update({id: stream.id },{camera_status:stream.camera_status})
			 .exec(function afterwards(err, updated){});
		    }
		});
        }
    });
  }
};

