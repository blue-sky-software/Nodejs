var request = require('ajax-request');
var config = require('../basic/config.js');
var homeurl = 'localhost';

function record_polling()
{
    /* Record Stop Process */
    var recordurl = homeurl + '/notify/recordPolling';
    request({
            url: recordurl,
            method: 'GET',
        }, function(err, res, body) {
    });
    
    /* Amazons3 File Check & Update */
    var updateurl = homeurl + '/notify/s3Update';
    request({
            url: updateurl,
            method: 'GET',
        }, function(err, res, body) {
    });

    /* Amazons3 File Delete */
    var deleteurl = homeurl + '/notify/s3FileDelete';
    request({
            url: deleteurl,
            method: 'GET',
        }, function(err, res, body) {
    });
    
    /* update record based on time */
	setTimeout(function() { record_polling() }, config.interval);
}

record_manage_polling = function(url){
    homeurl = url;
    /* Amazons3 File Delete */
    var deleteurl = homeurl + '/notify/restart';
    request({
            url: deleteurl,
            method: 'GET',
        }, function(err, res, body) {
    });
    record_polling();
}

exports.record_manage_polling = record_manage_polling;
