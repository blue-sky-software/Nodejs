var request = require('supertest');
var expect = require('chai').expect;
var uuid = require('node-uuid');

describe('MJPEG Service', function() {

  describe('#streamToGif', function() {
    this.timeout(99999999);

    it('should write MJPEG stream to a gif image', function(done) {
      MJPEGService.streamToGif('http://10.0.0.26:81/videostream.cgi?stream=1', './stream.gif', uuid.v4(), done);
    });
  });

});