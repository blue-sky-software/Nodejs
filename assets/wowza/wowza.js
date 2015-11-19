var request = require('ajax-request');
var parseXML = require('xml-parser');
var httprequest = require('request');
var wowza_config = require('../basic/config.js');

/* getApplicationlist */
exports.getApplicationlist = function(ip, user, pass, server, vhost, returncb)
{
	var ret = "Fail";
	var requesturl = 'http://' + user + ':' + pass + '@' + ip + ':' + wowza_config.config_port + '/v2/servers/' + server + '/vhosts/' + vhost + '/applications';
	request({
			url: requesturl,
			method: 'GET',
		}, function(err, res, body) {
			if (err == null)
			{
				var json = parseXML(body).root.children;
				if (json[1].content != -1)
					ret = "Success";
				returncb(ret, json);
			}
	});
}

/* deleteApplicationlist */
exports.deleteApplication = function(ip, user, pass, server, vhost, appname, returncb)
{
	var ret = "Fail";
	var requesturl = 'http://' + user + ':' + pass + '@' + ip + ':' + wowza_config.config_port + '/v2/servers/' + server + '/vhosts/' + vhost + '/applications/' + appname;
	request({
			url: requesturl,
			method: 'DELETE',
		}, function(err, res, body) {
			if (err == null)
			{
				var json = parseXML(body).root.children;
				if (json[1].content != -1)
					ret = "Success";
				returncb(ret, json);
			}
	});
}


/* setApplicationlist */
exports.setApplication = function(ip, user, pass, server, vhost, appname, returncb)
{
	var ret = "Fail";
	var requesturl = 'http://' + user + ':' + pass + '@' + ip + ':' + wowza_config.config_port + '/v2/servers/' + server + '/vhosts/' + vhost + '/applications/' + appname;
	request({
			url: requesturl,
			method: 'POST',
			data: {
					"restURI": requesturl,
					"name": appname,
					"appType": "Live",
					"clientStreamReadAccess": "*",
					"clientStreamWriteAccess": "*",
					"description": 'this application created by client',
					"streamConfig": {
						"restURI": requesturl + "/streamconfiguration",
						"streamType": "live"
					},
					"maxRTCPWaitTime": 12000,
				}, 
		}, function(err, res, body) {
			if (err == null)
			{
				var json = parseXML(body).root.children;
				var jsonpass = json[0];
				ret = "Exist";
				if (jsonpass['name'] == 'success')
				{
					ret = "Fail";
					if (jsonpass['content'] == 'true')
						ret = "Success";
				}
				console.log(ret);
				if (ret === "Sucess")
				{
					returncb(ret, json[1]['content']);
				}
				else
				{
					returncb(ret, json);
				}
			}
	});
}

/* deletApplicationlist */
exports.deleteApplication = function(ip, user, pass, server, vhost, appname, returncb)
{
	var ret = "Fail";
	var requesturl = 'http://' + user + ':' + pass + '@' + ip + ':' + wowza_config.config_port + '/v2/servers/' + server + '/vhosts/' + vhost + '/applications/' + appname;
	request({
			url: requesturl,
			method: 'DELETE',
		}, function(err, res, body) {
			if (err == null)
			{
				var json = parseXML(body).root.children;
				var jsonpass = json[0];
				ret = "Exist";
				if (jsonpass['name'] == 'success')
				{
					ret = "Fail";
					if (jsonpass['content'] == 'true')
						ret = "Success";
				}
				returncb(ret, json[1]);
			}
	});
}

/* getStreamfile */
exports.getStreamfile = function(ip, user, pass, server, vhost, appname, returncb)
{
	var ret = "Fail";
	var requesturl = 'http://' + user + ':' + pass + '@' + ip + ':' + wowza_config.config_port + '/v2/servers/' + server + '/vhosts/' + vhost + '/applications/' + appname + '/streamfiles';
	request({
			url: requesturl,
			method: 'GET',
		}, function(err, res, body) {
			if (err == null)
			{
				var json = parseXML(body).root.children;
				if (json[1].content != -1)
					ret = "Success";
				returncb(ret, json);
			}
	});
}

/* updateStreamfile*/
updateStreamfile = function(ip, user, pass, server, vhost, appname, streamurl, returncb)
{
	var ret = "Fail";
	var requesturl = 'http://' + user + ':' + pass + '@' + ip + ':' + wowza_config.config_port + '/v2/servers/' + server + '/vhosts/' + vhost + '/applications/' + appname + '/streamfiles/' + appname + '/adv';
	request({
			url: requesturl,
			method: 'PUT',
			data: {
				"restURI": requesturl,
				"advancedSettings": [
						{
							"enabled": true,
							"canRemove": true,
							"name": "uri",
							"value": streamurl,
							"defaultValue": null,
							"type": "String",
							"sectionName": "Common",
							"section": null,
							"documented": true
						},
						{
							"enabled": true,
							"canRemove": true,
							"name": "streamTimeout",
							"value": 6000,
							"defaultValue": 12000,
							"type": "Integer",
							"sectionName": "Common",
							"section": null,
							"documented": true
						},
						{
							"enabled": true,
							"canRemove": true,
							"name": "reconnectWaitTime",
							"value": 3000,
							"defaultValue": 3000,
							"type": "Integer",
							"sectionName": "Common",
							"section": null,
							"documented": true
						},
						{
							"enabled": true,
							"canRemove": true,
							"name": "rtpTransportMode",
							"value": "interleave",
							"defaultValue": "interleave",
							"type": "String",
							"sectionName": "Common",
							"section": null,
							"documented": true
						},
						{
							"enabled": true,
							"canRemove": true,
							"name": "rtspValidationFrequency",
							"value": 15000,
							"defaultValue": 15000,
							"type": "Integer",
							"sectionName": "Common",
							"section": null,
							"documented": true
						},
						{
							"enabled": true,
							"canRemove": true,
							"name": "rtspFilterUnknownTracks",
							"value": false,
							"defaultValue": true,
							"type": "Boolean",
							"sectionName": "Common",
							"section": null,
							"documented": true
						},
						{
							"enabled": true,
							"canRemove": true,
							"name": "rtspStreamAudioTrack",
							"value": false,
							"defaultValue": true,
							"type": "Boolean",
							"sectionName": "Common",
							"section": null,
							"documented": true
						},
						{
							"enabled": true,
							"canRemove": true,
							"name": "rtspStreamVideoTrack",
							"value": true,
							"defaultValue": true,
							"type": "Boolean",
							"sectionName": "Common",
							"section": null,
							"documented": true
						},
						{
							"enabled": true,
							"canRemove": true,
							"name": "rtpIgnoreProfileLevelId",
							"value": true,
							"defaultValue": true,
							"type": "Boolean",
							"sectionName": "Common",
							"section": null,
							"documented": true
						},
						{
							"enabled": true,
							"canRemove": true,
							"name": "rtpIgnoreSPropParameterSets",
							"value": true,
							"defaultValue": true,
							"type": "Boolean",
							"sectionName": "Common",
							"section": null,
							"documented": true
						},
						{
							"enabled": true,
							"canRemove": true,
							"name": "rtspConnectionTimeout",
							"value": 12000,
							"defaultValue": 12000,
							"type": "Integer",
							"sectionName": "Common",
							"section": null,
							"documented": true
						}
					]
			},
		}, function(err, res, body) {
			if (err == null)
			{
				var json = parseXML(body).root.children;
				var jsonpass = json[0];
				ret = "Exist";
				if ('success' == jsonpass['name'])
				{
					ret = "Fail";
					if (jsonpass['content'] == 'true')
						ret = "Success";
				}
				returncb(ret, json[1]);

				if (ret == 'Success') /* update */
				{

				}
			}
	});
}
exports.updateStreamfile = updateStreamfile;

/* setStreamfile */
exports.setStreamfile = function(ip, user, pass, server, vhost, appname, streamurl, returncb)
{
	var ret = "Fail";
	var requesturl = 'http://' + user + ':' + pass + '@' + ip + ':' + wowza_config.config_port + '/v2/servers/' + server + '/vhosts/' + vhost + '/applications/' + appname + '/streamfiles/' + appname;
	request({
			url: requesturl,
			method: 'POST',
			data: {
				"restURI": requesturl,
				"streamFiles": [
						{
							"id": appname,
							"href": requesturl,
						}
					]
				},
		}, function(err, res, body) {
			if (err == null)
			{
				var json = parseXML(body).root.children;
				var jsonpass = json[0];
				ret = "Exist";
				if ('success' == jsonpass['name'])
				{
					ret = "Fail";
					if (jsonpass['content'] == 'true')
						ret = "Success";
				}
				//returncb(ret, json[1]);

				if (ret == 'Success') /* update */
				{
					updateStreamfile(ip, user, pass, server, vhost, appname, streamurl, returncb);
				}
                else
                    returncb(ret, json[1]);
			}
	});
}

/* deleteStreamfile */
exports.deleteStreamfile = function(ip, user, pass, server, vhost, appname, returncb)
{
	var ret = "Fail";
	var requesturl = 'http://' + user + ':' + pass + '@' + ip + ':' + wowza_config.config_port + '/v2/servers/' + server + '/vhosts/' + vhost + '/applications/' + appname + '/streamfiles/' + appname;
	request({
			url: requesturl,
			method: 'DELETE',
		}, function(err, res, body) {
			if (err == null)
			{
				var json = parseXML(body).root.children;
				var jsonpass = json[0];
				ret = "Exist";
				if ('success' == jsonpass['name'])
				{
					ret = "Fail";
					if (jsonpass['content'] == 'true')
						ret = "Success";
				}
				returncb(ret, json[1]);
			}
	});
}

/* connectStreamfile */
exports.connectStreamfile = function(ip, user, pass, server, vhost, appname, returncb)
{
	var ret = "Fail";
	//http://localhost:8087/v2/servers/_defaultServer_/vhosts/_defaultVHost_/streamfiles/metallica/actions/connect?connectAppName=testlive&appInstance=_definst_&mediaCasterType=rtp
	var requesturl ='http://'+user+':'+pass+'@'+ip+':'+wowza_config.config_port+'/v2/servers/'+server+'/vhosts/'+vhost+'/streamfiles/'+appname+'/actions/connect?connectAppName='+appname+"&appInstance=_definst_&mediaCasterType=rtp";
	request({
			url: requesturl,
			method: 'PUT',
		}, function(err, res, body) {
			if (err == null)
			{
				var json = parseXML(body).root.children;
				var jsonpass = json[0];
				ret = "Exist";
				if ('success' == jsonpass['name'])
				{
					ret = "Fail";
					if (jsonpass['content'] == 'true')
						ret = "Success";
				}
				returncb(ret, body);
			}
	});
}

/* recordStart */
exports.recordStart = function(ip, user, pass, appname, streamname, path, filename, returncb)
{
	//http://admin:admin@localhost:8086/livestreamrecord?app=testlive&streamname=testlive.stream&action=startRecording&outputFile=steve.mp4&outputPath=C://content
	var ret = "Fail";
	var requesturl='http://'+ip+':'+wowza_config.record_port+'/livestreamrecord?app='+appname+'&streamname='+streamname+'&action=startRecording&option=appen&outputFile='+filename+'&outputPath='+path;
	httprequest.get(requesturl, {'auth': {'user': user,'pass': pass,'sendImmediately': false}}).on('response', function(response) {
		if (response.statusCode == 200)
			ret = "Success";
		returncb(ret, response.statusCode);
	});
}

/* recordStop */
exports.recordStop = function(ip, user, pass, appname, streamname, returncb)
{
	var ret = "Fail";
	//http://admin:admin@localhost:8086/livestreamrecord?app=testlive&streamname=testlive.stream&action=stopRecording
	var requesturl='http://'+ip+':'+wowza_config.record_port+'/livestreamrecord?app='+appname+'&streamname='+streamname+'&action=stopRecording';
	httprequest.get(requesturl, {'auth': {'user': user,'pass': pass,'sendImmediately': false}}).on('response', function(response) {
		if (response.statusCode == 200)
			ret = "Success";
		returncb(ret, response.statusCode);
	});
}

