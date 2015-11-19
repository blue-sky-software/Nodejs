var config = {};

/* Node.js Server Info*/
config.server_externip = '52.11.84.161';        //TODO modify
config.root_path = '/home/ubuntu/final_site';   //TODO modify

/* polling */
config.interval = 30 * 1000; /* 30 second */
config.timeoutretry = 2;

/* amazon */
config.amazonbucketname = 'synccam-recordings'; //TODO modify

/* wowza */
config.config_port = '8087';
config.record_port = '8086';

/* wowza ip, account */
config.server_ip = '52.25.129.48';              //TODO modify
config.user_id = 'SyncCam01';                   //TODO modify
config.user_pass = 'Pineapple51';               //TODO modify

/* wowza info */
config.default_server = '_defaultServer_';
config.default_vhost = '_defaultVHost_';


//config.mask0 = '00000000000000000000ffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffff';
config.mask0 = 'ffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffff';
config.mask1 = '';
config.mask2 = '';

config.code_success = 'Success';
config.code_fail = 'Fail';
config.debug_mode = false;

/* amazon s3 mount dir */
config.dst_dir = '/s3mount/';

/* email info */
config.smtp_type = 'Outlook';                    //TODO modify Outlook: for outlook&hotmail account, Gmail
config.auth_user = 'jetri1989@hotmail.com';      //TODO modify
config.auth_password = 'jetri@1989';             //TODO modify
config.share_url = '/auth/sharelink/';

module.exports = config;
