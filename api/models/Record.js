module.exports = {

    record_name:    'string',
    start_time:     'string',
    end_time:       'string',
    thumb_path:     'string',
    s3_asset_path:  'string',
    record_status:  'string',
    live_time:      'string',
    s3_property:    'string',
    stream_id:    'string',

    attributes: {
        stream: {
            model: 'stream'
        },

    processing: 'boolean'
  }
};

