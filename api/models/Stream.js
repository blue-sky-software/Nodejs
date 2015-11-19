/**
* User.js
*
* @description :: TODO: You might write a short summary of how this model works and what it represents here.
* @docs        :: http://sailsjs.org/#!documentation/models
*/

module.exports = {

  attributes: {
    type: 'string',
    url: 'string',
    cameraModel: 'string',
    description: 'string',
    portMap: 'string',
    ip: 'string',
    vpnAddress: 'string',
    cameraAdmin: 'string',
    cameraPass: 'string',
    phoneNumber: 'string',
    macAddress: 'string',
    ftpAddress: 'string',
    port: 'string',

    recordable: 'string',
    recDays: 'string',

    live_url: 'string',
    public_url: 'string',
    notify_url: 'string',
    camera_id:  'string',
    
    camera_status: 'string',
    notify_timoeout: 'int',
    content_expiretime: 'int',

    share_urls: {
      collection: 'shareuser',
      via: 'stream'
    },

    owner: {
      model: 'user'
    },

    records: {
      collection: 'record',
      via: 'stream'
    }
  }
};

