var EXPORTED_SYMBOLS = ["PLAYERS","FILTERS","REFERERS"];

var aURI = 'chrome://antiadsplayer3/content';
var PLAYERS = {
/**  -------------------------------------------------------------------------------------------------------  */
  'youku_loader': {
    'object': aURI + '/loader.swf',
    'target': /http:\/\/static\.youku\.com\/.*\/v\/swf\/loaders?\.swf/i
  },
  'youku_player': {
    'object': aURI + '/player.swf',
    'target': /http:\/\/static\.youku\.com\/.*\/v\/swf\/q?player.*\.swf/i
  },
/**  -------------------------------------------------------------------------------------------------------  */
  'tudou_portal': {
    'object': aURI + '/tudou.swf',
    'target': /http:\/\/js\.tudouui\.com\/bin\/lingtong\/PortalPlayer.*\.swf/i
  },
/*
  'tudou_olc': {
    'object': 'http://js.tudouui.com/bin/player2/olc.swf',
    'target': /http:\/\/js\.tudouui\.com\/bin\/player2\/olc.+\.swf/i
  },
  'tudou_social': {
    'object': aURI + '/sp.swf',
    'target': /http:\/\/js\.tudouui\.com\/bin\/lingtong\/SocialPlayer.*\.swf/i
  },
*/
/**  -------------------------------------------------------------------------------------------------------  */
  'iqiyi5': {
    'object': aURI + '/iqiyi5.swf',
    'target': /http:\/\/www\.iqiyi\.com\/common\/flashplayer\/\d+\/MainPlayer.*\.swf/i
  },
  'iqiyi_out': {
    'object': aURI + '/iqiyi_out.swf',
    'target': /https?:\/\/www\.iqiyi\.com\/(common\/flash)?player\/\d+\/(Share)?Player.*\.swf/i
  },
/**  -------------------------------------------------------------------------------------------------------  */
  'pps': {
    'object': aURI + '/iqiyi.swf',
    'target': /http:\/\/www\.iqiyi\.com\/common\/flashplayer\/\d+\/PPSMainPlayer.*\.swf/i
  },
  'pps_out': {
    'object': aURI + '/pps.swf',
    'target': /http:\/\/www\.iqiyi\.com\/player\/cupid\/common\/pps_flvplay_s\.swf/i
  },
/**  -------------------------------------------------------------------------------------------------------  */
/*
  'letv': {
    'object': aURI + '/letv.swf',
    'target': /http:\/\/.*\.letv(cdn)?\.com\/.*(new)?player\/((SDK)?Letv|swf)Player\.swf/i
  },
  'letv_skin': {
    'object': 'http://player.letvcdn.com/p/201407/24/15/newplayer/1/SSLetvPlayer.swf',
    'target': /http:\/\/player\.letvcdn\.com\/p\/((?!15)\d+\/){3}newplayer\/1\/S?SLetvPlayer\.swf/i
  },
*/
/**  -------------------------------------------------------------------------------------------------------  */
/*
  'sohu': {
    'object': aURI + '/sohu_live.swf',
    'target': /http:\/\/(tv\.sohu\.com\/upload\/swf\/(p2p\/)?\d+|(\d+\.){3}\d+\/webplayer)\/Main\.swf/i
  },
*/
/**  -------------------------------------------------------------------------------------------------------  */
/*
  'pptv': {
    'object': aURI + '/pptv.in.Ikan.swf',
    'target': /http:\/\/player.pplive.cn\/ikan\/.*\/player4player2\.swf/i
  },
  'pptv_live': {
    'object': aURI + '/pptv.in.Live.swf',
    'target': /http:\/\/player.pplive.cn\/live\/.*\/player4live2\.swf/i
  },
*/
/**  -------------------------------------------------------------------------------------------------------  */
  '17173': {
    'object': aURI + '/17173.in.Vod.swf',
    'target': /http:\/\/f\.v\.17173cdn\.com\/\d+\/flash\/Player_file\.swf/i
  },
  '17173_out': {
    'object': aURI + '/17173.out.Vod.swf',
    'target': /http:\/\/f\.v\.17173cdn\.com\/(\d+\/)?flash\/Player_file_(custom)?out\.swf/i
  },
  '17173_live': {
    'object': aURI + '/17173.in.Live.swf',
    'target': /http:\/\/f\.v\.17173cdn\.com\/\d+\/flash\/Player_stream(_firstpage)?\.swf/i
  },
  '17173_live_out': {
    'object': aURI + '/17173.out.Live.swf',
    'target': /http:\/\/f\.v\.17173cdn\.com\/\d+\/flash\/Player_stream_(custom)?Out\.swf/i
  },
/**  -------------------------------------------------------------------------------------------------------  */
  'ku6': {
    'object': aURI + '/ku6_in_player.swf',
    'target': /http:\/\/player\.ku6cdn\.com\/default\/(\w+\/){2}\d+\/player\.swf/i
  },
  'ku6_out': {
    'object': aURI + '/ku6_out_player.swf',
    'target': /http:\/\/player\.ku6cdn\.com\/default\/out\/\d+\/player\.swf/i
  },
/**  -------------------------------------------------------------------------------------------------------  */
  'baidu': {
    'object': aURI + '/baidu.call.swf',
    'target': /http:\/\/list\.video\.baidu\.com\/swf\/advPlayer\.swf/i
  },
};

var FILTERS = {
/**  -------------------------------------------------------------------------------------------------------  */
  'youku_tudou': {
    'object': 'http://valf.atm.youku.com/vf?vip=0',
    'target': /http:\/\/val[fcopb]\.atm\.youku\.com\/v.+/i
  },
/**  -------------------------------------------------------------------------------------------------------  */
  'iqiyi_pps': {
    'object': 'http://www.iqiyi.com/player/cupid/common/clear.swf',
    'target': /http:\/\/www\.iqiyi\.com\/common\/flashplayer\/\d+\/((dsp)?roll|hawkeye|pause).*\.swf/i
  },
/**  -------------------------------------------------------------------------------------------------------  */
  'letv': {
    'object': 'http://ark.letv.com/s',
    'target': /http:\/\/(ark|fz)\.letv\.com\/s\?ark/i
  },
/**  -------------------------------------------------------------------------------------------------------  */
  'pptv_pplive': {
    'object': 'http://de.as.pptv.com/ikandelivery/vast/draft',
    'target': /http:\/\/de\.as\.pptv\.com\/ikandelivery\/vast\/.+draft/i
  },
/**  -------------------------------------------------------------------------------------------------------  */
  'sohu': {
    'object': 'http://v.aty.sohu.com/v',
    'target': /http:\/\/v\.aty\.sohu\.com\/v\?/i
  },
/**  -------------------------------------------------------------------------------------------------------  */
  '17173': {
    'object': 'http://17173im.allyes.com/crossdomain.xml',
    'target': /http:\/\/cdn\d+\.v\.17173\.com\/(?!crossdomain\.xml).*/i
  },
/**  -------------------------------------------------------------------------------------------------------  */
  'ku6': {
    'object': 'http://p1.sdo.com',
    'target': /http:\/\/g1\.sdo\.com/i
  },
/**  -------------------------------------------------------------------------------------------------------  */
  'qq': {
    'object': 'http://livep.l.qq.com/livemsg',
    'target': /http:\/\/livew\.l\.qq\.com\/livemsg\?/i
  },
/**  -------------------------------------------------------------------------------------------------------  */
  '56': {
    'object': 'http://www.56.com',
    'target': /http:\/\/acs\.stat\.v-56\.com\/vml\/\d+\/ac\/ac.*\.xml/i
  },
/**  -------------------------------------------------------------------------------------------------------  */
  '163': {
    'object': 'http://v.163.com',
    'target': /http:\/\/v\.163\.com\/special\/.*\.xml/i
  },
/**  -------------------------------------------------------------------------------------------------------  */
  'sina': {
    'object': 'http://sax.sina.com.cn/video/newimpress',
    'target': /http:\/\/sax\.sina\.com\.cn\/video\/newimpress/i
  },
/**  -------------------------------------------------------------------------------------------------------  */
  'hunan': {
    'object': 'http://res.hunantv.com/',
    'target': /http:\/\/image\.res\.hunantv\.com\/mediafiles\/.+\.swf/i
  },
/**  -------------------------------------------------------------------------------------------------------  */
  'duowan': {
    'object': 'http://yuntv.letv.com/bcloud.swf',
    'target': /http:\/\/assets\.dwstatic\.com\/video\/vppp\.swf/i
  },
};

var REFERERS = {
/**  -------------------------------------------------------------------------------------------------------  */
  'youku': {
    'host': 'http://www.youku.com/',
    'target': /http:\/\/.*\.youku\.com/i
  },
/**  -------------------------------------------------------------------------------------------------------  */
  'iqiyi': {
    'host': 'http://www.iqiyi.com/',
    'target': /http:\/\/.*\.qiyi\.com/i
  },
};
