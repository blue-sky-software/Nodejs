var request = require('request');
var MjpegConsumer = require("mjpeg-consumer");
var fs = require ('fs');
var sharp = require('sharp');
var async = require('async');
var FileOnWrite = require("file-on-write");
var exec = require('child_process').execFile;
var rimraf = require('rimraf');

module.exports = {

  streamToGif: function(url, id, cb) {
    var location = './api/tmp/' + id;

    var consumer = new MjpegConsumer();
    var writer = new FileOnWrite({ 
      path: location,
      ext: '.jpg'
    });

    var req = request('http://217.197.157.7:7070/axis-cgi/mjpg/video.cgi?resolution=320x240')
      .pipe(consumer);

    req.pipe(writer);

    setTimeout(function() {
      req.unpipe();

      var files = fs.readdirSync(location);
      var idx = 0;

      async.eachSeries(files, function(file, cb) {
        var name = file.substring(0, file.indexOf('.jpg'));

        sharp(location + '/' + file)
          .png()
          .toFile(location + '/' + (idx++) + '.png')
          .then(function() {
            fs.unlinkSync(location + '/' + file);
            return cb();
          });

      }, function() {
        exec('python', ['./bin/gif.py', location + '/', './api/records/' + id], function() {
          sails.log.info('Record (#' + id + ') created.');
          return rimraf(location, cb);
        })
      });
    }, 30 * 1000);

  }
};