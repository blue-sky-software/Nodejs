/**
 * ApiController
 *
 * @description :: Server-side logic for managing apis
 * @help        :: See http://links.sailsjs.org/docs/controllers
 */

module.exports = {
	motion: function(req, res) {
    var id = req.params.id || null;

    if(id === null) {
      return res.json({error: 'Missing Id'});
    }

    Stream
      .findOne()
      .where({ id: id })
      .exec(function(err, stream) {
        if(!stream) {
          return res.json({error: 'Invalid Id'});
        }

        Record.create({stream: stream.id, processing: true}).exec(function(err, record) {
          sails.log.info('Starting record (#' + record.id + ')');
          MJPEGService.streamToGif(stream.url, record.id, function() {
            record.processing = false;
            record.save();
          });
          return res.json({error: false});
        });
      });
  }
};

