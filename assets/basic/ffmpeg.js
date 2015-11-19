var config = require('./config.js');
var spawn = require('child_process').spawn;
var ffmpeg = require('fluent-ffmpeg');

exports.startrestream = function(inurl, outurl, returncb)
{
	var streamer = spawn('ffmpeg.exe', ['-re', '-i', inurl, '-an', '-vcodec', 'copy', '-strict', '2', '-f', 'flv', outurl]);
	setTimeout(function() {
		console.log('start restream');
		returncb(streamer);
	}, 1 * 1000);
}

exports.endrestream = function(streamer, returncb)
{
	setTimeout(function() {
		streamer.kill('SIGINT');
		console.log('start restream');
		returncb('ok');
	}, 1 * 1000);
}

exports.thumbnail = function(inurl, outthumb, returncb)
{
var thumbfullpath = config.root_path + '/assets/thumb/' + outthumb;
var thumbreturnpath = '/thumb/' + outthumb;
var convert = ffmpeg(inurl)
    	.output(thumbfullpath)
	.videoCodec('mjpeg')
	.noAudio()
	.frames(1)
	.format("rawvideo")
	.size('320x240')
	.on('start', function() {})
    	.on('end', function(err) {   
        	if(!err)
        	{
          		console.log('thumbnail Done');
			returncb(thumbreturnpath);
        	}
		else
		{
			console.log('error');
			returncb(thumbreturnpath);
		}
    	}).run();
}
