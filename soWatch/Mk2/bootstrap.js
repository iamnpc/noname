const {classes: Cc, interfaces: Ci, results: Cr, utils: Cu} = Components;
Cu.import("resource:///modules/CustomizableUI.jsm"); //Require Geck 29 and later
Cu.import('resource://gre/modules/osfile.jsm'); //Require Geck 27 and later
Cu.import('resource://gre/modules/Downloads.jsm'); //Require Geck 26 and later
Cu.import('resource://gre/modules/NetUtil.jsm'); //Promise chain that require Gecko 25 and later

var Services = {
  os: Cc['@mozilla.org/observer-service;1'].getService(Ci.nsIObserverService),
  sss: Cc['@mozilla.org/content/style-sheet-service;1'].getService(Ci.nsIStyleSheetService),
  io: Cc["@mozilla.org/network/io-service;1"].getService(Ci.nsIIOService),
  prefs: Cc['@mozilla.org/preferences-service;1'].getService(Ci.nsIPrefBranch),
};

// You can customize the dir name to store .swf files
// 你可以自行修改保存 .swf 文件的文件夹名字。
var aPath = OS.Path.join(OS.Constants.Path.profileDir, 'soWatch');
var aURI = OS.Path.toFileURI(aPath);
// You can add more domains for now. example: google for player moded by 15536900, github for catcat520
// 现在方便添加更多的服务器了，如：为15536900破解的播放器使用google，而catcat520使用github
var aURL_google = 'https://haoutil.googlecode.com/svn/trunk/player/testmod/';
var aURL_github = 'https://github.com/jc3213/Anti-ads-Solution/releases/download/6666/';

// Localize debugging console logs to help improve user experience.
// 本地化Debug控制台记录以方便改善用户体验。
var uAgent = Services.prefs.getComplexValue('general.useragent.locale', Ci.nsISupportsString).data;
var aLocale = {
  'ja': {
    ext_name: 'soWatch! Mk2',
    ext_tooltip: '\u66F4\u65B0\u30C1\u30A7\u30C3\u30AF\u3092\u5B9F\u884C\u3059\u308B',
    ext_install: '\u304C\u30A4\u30F3\u30B9\u30C8\u30FC\u30EB\u3055\u308C\u307E\u3057\u305F',
    ext_uninstall: '\u304C\u30A2\u30F3\u30A4\u30F3\u30B9\u30C8\u30FC\u30EB\u3055\u308C\u307E\u3057\u305F',
    lf_outofdate: '\u306E\u6700\u65B0\u7248\u304C\u767A\u898B\u3057\u307E\u3057\u305F',
    lf_corrupted: '\u304C\u58CA\u308C\u3066\u3044\u308B\u53EF\u80FD\u6027\u304C\u3042\u308A\u307E\u3059',
    lf_ready: '\u304C\u6E96\u5099\u3067\u304D\u307E\u3057\u305F',
    lf_notexist: '\u304C\u5B58\u5728\u3057\u307E\u305B\u3093',
    rf_downloaded: '\u30C0\u30A6\u30F3\u30ED\u30FC\u30C9\u5B8C\u4E86',
    rf_timeout: '\u30EA\u30E2\u30FC\u30C8\u30B5\u30FC\u30D0\u30FC\u304C\u5FDC\u7B54\u3057\u3066\u304A\u308A\u307E\u305B\u3093',
    rf_accessfailed: '\u3078\u306E\u30A2\u30AF\u30BB\u30B9\u304C\u3067\u304D\u307E\u305B\u3093',
    rf_downfailed: '\u306E\u30C0\u30A6\u30F3\u30ED\u30FC\u30C9\u304C\u5931\u6557\u3057\u307E\u3057\u305F',
    rf_interrupted: '\u30C0\u30A6\u30F3\u30ED\u30FC\u30C9\u4E2D\u306B\u4E0D\u660E\u306A\u30A8\u30E9\u30FC\u304C\u767A\u751F\u3057\u307E\u3057\u305F',
  },
  'zh-CN': {
    ext_name: 'soWatch! Mk2',
    ext_tooltip: '\u7ACB\u5373\u68C0\u67E5\u66F4\u65B0',
    ext_install: '\u5DF2\u7ECF\u6210\u529F\u5B89\u88C5',
    ext_uninstall: '\u5DF2\u7ECF\u6210\u529F\u79FB\u9664',
    lf_outofdate: '\u5DF2\u627E\u5230\u66F4\u65B0\u7248\u672C',
    lf_corrupted: '\u6587\u4EF6\u53EF\u80FD\u5DF2\u7ECF\u635F\u574F',
    lf_ready: '\u6587\u4EF6\u5DF2\u7ECF\u5C31\u4F4D',
    lf_notexist: '\u6587\u4EF6\u4E0D\u5B58\u5728',
    rf_downloaded: '\u4E0B\u8F7D\u5B8C\u6210',
    rf_timeout: '\u8FDC\u7A0B\u670D\u52A1\u5668\u6CA1\u6709\u54CD\u5E94',
    rf_accessfailed: '\u65E0\u6CD5\u8BBF\u95EE\u8FDC\u7A0B\u6587\u4EF6',
    rf_downfailed: '\u65E0\u6CD5\u4E0B\u8F7D\u8FDC\u7A0B\u6587\u4EF6',
    rf_interrupted: '\u672A\u77E5\u539F\u56E0\u5BFC\u81F4\u4E0B\u8F7D\u4E2D\u65AD',
  },
  'zh-TW': {
    ext_name: 'soWatch! Mk2',
    ext_tooltip: '\u7ACB\u5373\u57F7\u884C\u66F4\u65B0\u6AA2\u67E5',
    ext_install: '\u5DF2\u7D93\u6210\u529F\u6DFB\u52A0',
    ext_uninstall: '\u5DF2\u7D93\u6210\u529F\u6E05\u9664',
    lf_outofdate: '\u5DF2\u767C\u73FE\u66F4\u65B0\u7248\u672C',
    lf_corrupted: '\u6587\u4EF6\u53EF\u80FD\u5DF2\u7D93\u640D\u58DE',
    lf_ready: '\u6587\u4EF6\u5DF2\u7D93\u5C31\u7DD2',
    lf_notexist: '\u6587\u4EF6\u4E0D\u5B58\u5728',
    rf_downloaded: '\u4E0B\u8F09\u6210\u529F',
    rf_timeout: '\u9060\u7A0B\u8A2A\u554F\u670D\u52D9\u5668\u6C92\u6709\u97FF\u61C9',
    rf_accessfailed: '\u7121\u6CD5\u8A2A\u554F\u9060\u7A0B\u6587\u4EF6',
    rf_downfailed: '\u7121\u6CD5\u4E0B\u8F09\u9060\u7A0B\u6587\u4EF6',
    rf_interrupted: '\u4E0B\u8F09\u4E2D\u65B7\uFF0C\u672A\u77E5\u539F\u56E0\u932F\u8AA4',
  },
  'en-US': {
    ext_name: 'soWatch! Mk2',
    ext_tooltip: 'Run update check now...',
    ext_install: 'has been installed...',
    ext_uninstall: 'has been uninstalled...',
    lf_outofdate: 'is out of date',
    lf_corrupted: 'may be corrupted',
    lf_ready: 'is ready to serve',
    lf_notexist: 'is not exist',
    rf_downloaded: 'download session complete',
    rf_timeout: 'no response from remote server',
    rf_accessfailed: 'failed to access remote file',
    rf_downfailed: 'failed to download remote file',
    rf_interrupted: 'download session has been interrupted due to unknown error',
  },
};
if (!aLocale[uAgent]) {
  console.log('Your locale is not supported');
}
var aLang = aLocale[uAgent] || aLocale['en-US'];

// Player Rules: You can delete ['remote'] if you don't like to keep synchronize.
// 播放器规则： 删除['remote']项后将不能进行播放器的更新了.
var PLAYERS = {
/**  -------------------------------------------------------------------------------------------------------  */
  'youku_loader': {
    'object': aURI + '/loader.swf',
    'remote': aURL_google + 'loader.swf',
    'target': /http:\/\/static\.youku\.com\/.*\/v\/swf\/loaders?\.swf/i
  },
  'youku_player': {
    'object': aURI + '/player.swf',
    'remote': aURL_google + 'player.swf',
    'target': /http:\/\/static\.youku\.com\/.*\/v\/swf\/q?player.*\.swf/i
  },
/**  -------------------------------------------------------------------------------------------------------  */
  'tudou_portal': {
    'object': aURI + '/tudou.swf',
    'remote': aURL_google + 'tudou.swf',
    'target': /http:\/\/js\.tudouui\.com\/bin\/lingtong\/PortalPlayer.*\.swf/i
  },
  'tudou_olc': {
    'object': 'http://js.tudouui.com/bin/player2/olc.swf',
    'target': /http:\/\/js\.tudouui\.com\/bin\/player2\/olc.+\.swf/i
  },
  'tudou_social': {
    'object': aURI + '/sp.swf',
    'remote': aURL_google + 'sp.swf',
    'target': /http:\/\/js\.tudouui\.com\/bin\/lingtong\/SocialPlayer.*\.swf/i
  },
/**  -------------------------------------------------------------------------------------------------------  */
  'iqiyi5': {
    'object': aURI + '/iqiyi5.swf',
    'remote': aURL_google + 'iqiyi5.swf',
    'target': /http:\/\/www\.iqiyi\.com\/common\/flashplayer\/\d+\/MainPlayer.*\.swf/i
  },
  'iqiyi_out': {
    'object': aURI + '/iqiyi_out.swf',
    'remote': aURL_google + 'iqiyi_out.swf',
    'target': /https?:\/\/www\.iqiyi\.com\/(common\/flash)?player\/\d+\/(Share)?Player.*\.swf/i
  },
/**  -------------------------------------------------------------------------------------------------------  */
  'pps': {
    'object': aURI + '/iqiyi.swf',
    'remote': aURL_google + 'iqiyi.swf',
    'target': /http:\/\/www\.iqiyi\.com\/common\/flashplayer\/\d+\/PPSMainPlayer.*\.swf/i
  },
  'pps_out': {
    'object': aURI + '/pps.swf',
    'remote': aURL_google + 'pps.swf',
    'target': /http:\/\/www\.iqiyi\.com\/player\/cupid\/common\/pps_flvplay_s\.swf/i
  },
/**  -------------------------------------------------------------------------------------------------------  */
  'letv': {
    'object': aURI + '/letv.swf',
    'remote': aURL_google + 'letv.swf',
    'target': /http:\/\/.*\.letv(cdn)?\.com\/.*(new)?player\/((SDK)?Letv|swf)Player\.swf/i
  },
  'letv_skin': {
    'object': 'http://player.letvcdn.com/p/201407/24/15/newplayer/1/SSLetvPlayer.swf',
    'target': /http:\/\/player\.letvcdn\.com\/p\/((?!15)\d+\/){3}newplayer\/1\/S?SLetvPlayer\.swf/i
  },
/**  -------------------------------------------------------------------------------------------------------  */
  'sohu': {
    'object': aURI + '/sohu_live.swf',
    'remote': aURL_google + 'sohu_live.swf',
    'target': /http:\/\/(tv\.sohu\.com\/upload\/swf\/(p2p\/)?\d+|(\d+\.){3}\d+\/webplayer)\/Main\.swf/i
  },
/**  -------------------------------------------------------------------------------------------------------  */
  'pptv': {
    'object': aURI + '/pptv.in.Ikan.swf',
    'remote': aURL_github + 'pptv.in.Ikan.swf',
    'target': /http:\/\/player.pplive.cn\/ikan\/.*\/player4player2\.swf/i
  },
  'pptv_live': {
    'object': aURI + '/pptv.in.Live.swf',
    'remote': aURL_github + 'pptv.in.Live.swf',
    'target': /http:\/\/player.pplive.cn\/live\/.*\/player4live2\.swf/i
  },
/**  -------------------------------------------------------------------------------------------------------  */
  '17173': {
    'object': aURI + '/17173.in.Vod.swf',
    'remote': aURL_github + '17173.in.Vod.swf',
    'target': /http:\/\/f\.v\.17173cdn\.com\/\d+\/flash\/Player_file\.swf/i
  },
  '17173_out': {
    'object': aURI + '/17173.out.Vod.swf',
    'remote': aURL_github + '17173.out.Vod.swf',
    'target': /http:\/\/f\.v\.17173cdn\.com\/(\d+\/)?flash\/Player_file_(custom)?out\.swf/i
  },
  '17173_live': {
    'object': aURI + '/17173.in.Live.swf',
    'remote': aURL_github + '17173.in.Live.swf',
    'target': /http:\/\/f\.v\.17173cdn\.com\/\d+\/flash\/Player_stream(_firstpage)?\.swf/i
  },
  '17173_live_out': {
    'object': aURI + '/17173.out.Live.swf',
    'remote': aURL_github + '17173.out.Live.swf',
    'target': /http:\/\/f\.v\.17173cdn\.com\/\d+\/flash\/Player_stream_(custom)?Out\.swf/i
  },
/**  -------------------------------------------------------------------------------------------------------  */
  'ku6': {
    'object': aURI + '/ku6_in_player.swf',
    'remote': aURL_github + 'ku6_in_player.swf',
    'target': /http:\/\/player\.ku6cdn\.com\/default\/(\w+\/){2}\d+\/player\.swf/i
  },
  'ku6_out': {
    'object': aURI + '/ku6_out_player.swf',
    'remote': aURL_github + 'ku6_out_player.swf',
    'target': /http:\/\/player\.ku6cdn\.com\/default\/out\/\d+\/player\.swf/i
  },
/**  -------------------------------------------------------------------------------------------------------  */
  'baidu': {
    'object': aURI + '/baidu.call.swf',
    'remote': aURL_github + 'baidu.call.swf',
    'target': /http:\/\/list\.video\.baidu\.com\/swf\/advPlayer\.swf/i
  },
};

// Filter Rules: May work for most site.
// 过滤规则： 大多数网站都能正常工作。
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

//Referer rule： Help resolve problems with HTTP Referer.
//引用头规则： 用于解决HTTP引用头导致的问题。
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

var Download = {
// Check for remote files then synchronize local files.
// 检查远程文件，再检查文件是否需要更新。
  check: function (aLink, aFile) {
    var aClient = Cc['@mozilla.org/xmlextras/xmlhttprequest;1'].createInstance(Ci.nsIXMLHttpRequest);
    aClient.open('HEAD', aLink, true);
    aClient.timeout = 30000;
    aClient.ontimeout = function () {
      console.log(aLink + '\n' + aLang.rf_timeout);
    }
    aClient.send();
    aClient.onload = function () {
      var aDate = new Date(aClient.getResponseHeader('Last-Modified'));
      var aSize = new Number(aClient.getResponseHeader('Content-Length'));
      OS.File.stat(aFile).then(function onSuccess(info) {
        if (aSize == null || aSize < 10000) {
          console.log(aLink + '\n' + aLang.rf_accessfailed);
        } else if (aDate > info.lastModificationDate) {
          console.log(aFile + '\n' + aLang.lf_outofdate);
          Download.fetch(aLink, aFile, aSize);
        } else if (aSize != info.size) {
          console.log(aFile + '\n' + aLang.lf_corrupted);
          Download.fetch(aLink, aFile, aSize);
        } else {
          console.log(aFile + '\n' + aLang.lf_ready);
        }
      }, function onFailure(reason) {
        if (reason instanceof OS.File.Error && reason.becauseNoSuchFile) {
          console.log(aFile + '\n' + aLang.lf_notexist);
          Download.fetch(aLink, aFile, aSize);
        }
      });
    }
  },
// Download remote file with _sw as temp file, then check and overwrite.
// 下载远程文件至 _sw 临时文件,然后检查下载的文件是否完整,再覆盖文件
  fetch: function (aLink, aFile, aSize) {
    var aTemp = aFile + '_sw';
    Downloads.fetch(aLink, aTemp, {
      isPrivate: true
    }).then(function onSuccess() {
      OS.File.stat(aTemp).then(function onSuccess(info) {
        if (aSize == info.size) {
          console.log(aLink + '\n' + aLang.rf_downloaded);
          OS.File.move(aTemp, aFile);
        } else {
          console.log(aLink + '\n' + aLang.rf_interrupted);
          OS.File.remove(aTemp);
          Download.fetch(aLink, aFile, aSize);
        }
      });
    }, function onFailure() {
      console.log(aLink + '\n' + aLang.rf_downfailed);
      OS.File.remove(aTemp);
    });
  },
// Start download
// 开始下载
  start: function () {
    for (var i in PLAYERS) {
      var rule = PLAYERS[i];
      if (rule['remote']) {
        var aLink = rule['remote'];
        var aFile = OS.Path.fromFileURI(rule['object']);
        Download.check(aLink, aFile);
      }
    }
  },
};

var Toolbar = {
// Embedded style sheet
// 内置样式表
  css: Services.io.newURI(
    'data:text/css;base64,QC1tb3otZG9jdW1lbnQgdXJsKCJjaHJvbWU6Ly9icm93c2VyL2NvbnRlbnQvYnJvd3Nlci54dWwiKSB7DQogICNtazItYnV0dG9uIHsNCiAgICBsaXN0LXN0eWxlLWltYWdlOiB1cmwoZGF0YTppbWFnZS9wbmc7YmFzZTY0LGlWQk9SdzBLR2dvQUFBQU5TVWhFVWdBQUFCQUFBQUFRQ0FZQUFBQWY4LzloQUFBQ0pFbEVRVlI0MnEyU1MyZ1RVUlNHcjRMeFRWcnptRXpxd29XVkxnVjFJVDZxb1ZFcVJUZmFoUlRFVFpDNHNWanRUREo1dEZLcExWR3lLSXFWQ3JZb1dGQnFGWXJpQzVTZ3UyYlpUVmRhc0NGdDBzWnBKelAzOTg3Y1NURVVLVUlQL0Z5NG5QUDk1OXg3Q0ZuUHlMVzc2blRGY3dhZHRVNTBrTzI0UUJ6L0JSaHQzbnhsNGFZSGlQbFV4QVNLL3YzaldKZ0phNXAyZU0xaUtLNG1JKzZiUmR5SEt0M2VCMmkvd1NMRHRHZDFZWWhzUXRSOWtDV3JsU0k5SmlKN3F3bGpEOU1ZZXpJTXJVeVIrL2dJZXZySXRDYTVEMVFCWHJVNEdqSnRPNy9ucjd2TjFpM0EzTjBBVXVNbHZNbFNmSm1pU0x5a0tCWVhrZXM3Q2owcUZKWWt6OTRWUU9JRTJmS3MyZEdyS3dLZ2NBQ05pN2pSOHduQmZvcFRUSUU3RkJPVE9wWS8zT05qUllYaDZqRmkzcEJWSEJHeEhQUGpiZGNsbk93dVdJV21HbnVXOER5akFwL1RIQ0NMK2VvM2lIdjdMSURzaDVIY0RYVitGcTJwUEk0bEN6amVWVVN3TzRjZmVRTVliT0Zqc2p4SXp0b0tZd01ESkMyQVZNZmFZK2RvR0wvbXl4aVlLQ0gxdW9TcEdaMzl3V0RGblVzUkp2LzZRcy81NmZBdTBFNlQ3T2VRKzBIZzZ3UGcyMk5ncEkwN1Iyd1RTZFRMaWl1d0FwaTdWbFB6NHV6V3haOVgzWGFDbjd0RWJiRzNzZTc0dllxSWNISFZQZ3cwa2tQWnk4NmhTaUtWUkJ0bVN4WU5JK0x0WmQzVy8zc2JFMlFqbFlWM3B2djcxaDBvZFhncEIvS3UyQTZjVzN1bFEyUWJjMHFPbkhZOEhRcVNlblBGOVlqUURsT3lxNEdzZC93QnFzV1JFYnFiWHhFQUFBQUFTVVZPUks1Q1lJST0pOw0KICB9DQogICNtazItYnV0dG9uW2N1aS1hcmVhdHlwZT0ibWVudS1wYW5lbCJdLA0KICAgIHRvb2xiYXJwYWxldHRlaXRlbVtwbGFjZT0icGFsZXR0ZSJdID4gI21rMi1idXR0b24gew0KICAgIGxpc3Qtc3R5bGUtaW1hZ2U6IHVybChkYXRhOmltYWdlL3BuZztiYXNlNjQsaVZCT1J3MEtHZ29BQUFBTlNVaEVVZ0FBQUNBQUFBQWdDQVlBQUFCemVucjBBQUFFekVsRVFWUjQydTJYZlV4VmRSakhEOHBMRklpODNYT0JXbStyNVZxdHJiSllJQzhaWTlyU1ZjeW1ybEVyR2k1bTZNekxQZWR3Y1paQW1FcU1nUTZia3Y5NFk4N1FMUnFZS1ZzVU9MTklYbE5lbXBGWDNyeGQ0TDZjKy92Mk8rZmNOKzY5WEVoeDZ3OS8yN01EWi9kNXZwL24rVDIvbDhNd2Q4Zi9kZWdZWnNuNHR0Z0M4R3lkblZmdFJWRjhxdlMrdjRBSlExSGs0OWdScjc2akFIblBNaUYxbWFIRzRROWpnR0sxYkNMUERoS0JGZVcvQlhZUU91YmVPd3JSdWpGQ1Axb1k1d0x3TnJ2K3ZSSDd0YzRCQUIxMnUvMFFmYTdWNi9WTGIxc1l1bVV4ZHA1dG5Fdll4NzVjRDVpTmtJWW9pbjMwa1gzcjRyenFVUWpzMVFXTE84MWtnSE1RT3VpajVMK0xhMVVzcExrTklHUVgxT2pUckVEVHRwZHdiT3RxMUcvTlFrdnAyNUtxb2o0K0JCeDVFMmpJaC8zazlsMDBiTkJDOVlQc25Lb2xrTGlKZndDbnRtZmcrMk1IMFB6RGJ6alJab0wrSnh2T1hKekEyRDhLZ1BIR1gyZ3QzUUFpS0Q2RVZ6VkRFeFU5cjdxb1ZXMm1YUTRicDVvVG9QV1QxM0cxL3dyMk5SSFVuaVU0MDAzUTJrZlFjSUZBMjBEd3k1QUNZUmpvUnEvMmFaY2ZoV2dieUdYdUNRalF1RDc4WW5WYUNNNjlGYUU0Q3I0QXR1WnlsSjRteUN3bjBIY1FkSTlBdHZZQmdrMjFCQnRyQ0laR0ZZZy9UbFY1VFoycVBDQkFaY3FTaXRyMEVFeHJIQlhnL0FDVVBJakNzcDlsQU1uV1ZSSzhVVVd3K2pQaWV2ZjV0M1lad0RSaGdFVkk4cWlDMmdJdU5pbGdEL1RrUmRYS0RqeTFva1MvMDlDdnkwQldtZGtsNkcwNWxkT3UxU0R1VDNiN2FoTkFsellYc0FxdXRjOGxBSnJaQUtLUWdDYmhIV1R2R3BsVFBIMlBGV3RLSjF3QTJML1NIVU5LaUZPM0JRU2cyK3gxSnkwMFNhNCtNR2dmd2ZFZGE3RzM1anVrY05lUi9xbkZSenlqekk3VTRuRzhXM05URWJkTUFUcjNGRWdKRWExNmVrNXh3eFltd3JOY01vQlVDZnEvZWMrVE1KdHV3bUNrUXJwUkNtRkEydTVwV2RTWmVXcnhtQXgzNUp4WkFiaDgyaTB1SmVLSU4xYkFMUE1MTUtOWi9wRExnWE1BZVBiQmxmTnkzUHJ6RmhsQUV2TzIzR29qWnF5T0RhbnVOZmpFazUreHordHpHTi96WXBKdUZqNE9zcFBqWFhVR1lKMlJZNTlvdDJGTjJTUlMrQnZVREZpbEcwZngxek9ZbkhLSVg2ajN5ajVSaWNVNyswbDF5ZjltSkxCRzF5cHdBa2pPemozaHEwMTBiazNLRk5zSXVxNFJYQm9tR0RNUmQrUDkvZzA5QmU2SHozUktjYVRFcElUNCtDTC9xMEJnZjVTYjdxTTRON1U4RlFsdWlBTXZBSjBuNlJxell0YjR1NHZ1LzF0bUwxdk9NeEVGUXVUWXk5S2x4ajhBcDZxd2FGVTQvSElveEowSlBzN09Fc3EyKzJIZ1lEWndlQjFROGN4c1ljRXpjMDl4dFFsQzlGTnpuNFpDWEZwUFhqU3FWb1ZnTUQvV0s0QURRcW9HUDhlQnhUdUZFLzNCVDBHcnpwajNSR3piSE5rcEFiVGtSUGdKNUEzallYNS9xd0NMZ25yWXlzVTl0NkF6dWVHVnNNZStTRm5hV0pNZVlwNzVtQTBBRU1Ba0lGb0p3dE9OVFdCTHNUTTY2bFp1eGNHMEgwcG1aU1lGNWRUelZDWkorbzNGV2hTVExOMnNiK3R1K0djaEUwNjd0dGNsU0FIT2JvaUFUY3NxdlJDZ0F2UnVVYmdvTjJQd3NTdG85NDdLRUJUZ1VHWW9qbWFGb2ZlRDVWS21vakwvdmhBVXZHUFJydWNvaW4yQ0hpVHRFa0REcStHb1NnMG1sU25CSmREZXg0cThLcDkrdkJ5bmE3NkwvbWFjY0FrVEZLeUhMdW1qaS8yWkVBUXU1c1ZmY3lQZjM1Zk1yTHo3N2JoWTQxL3dUTTBGcVZabWh3QUFBQUJKUlU1RXJrSmdnZz09KTsNCiAgfQ0KfQ==',
    null,
    null
  ),
// Add Toobar button
// 添加工具栏按钮
  addIcon: function () {
    CustomizableUI.createWidget({
      id: 'mk2-button',
      defaultArea: CustomizableUI.AREA_NAVBAR,
      label: aLang.ext_name,
      tooltiptext: aLang.ext_name + ':\n' + aLang.ext_tooltip,
      onCommand: function () {
        Download.start();
      },
    });
    Services.sss.loadAndRegisterSheet(this.css, Services.sss.AUTHOR_SHEET);
  },
// Remove Toobar button
// 移除工具栏按钮
  removeIcon: function () {
    CustomizableUI.destroyWidget('mk2-button');
    Services.sss.unregisterSheet(this.css, Services.sss.AUTHOR_SHEET);
  },
};

var Common = {
  getObject: function (rule, callback) {
    NetUtil.asyncFetch(rule['object'], function (inputStream, status) {
      var binaryOutputStream = Cc['@mozilla.org/binaryoutputstream;1'].createInstance(Ci['nsIBinaryOutputStream']);
      var storageStream = Cc['@mozilla.org/storagestream;1'].createInstance(Ci['nsIStorageStream']);
      var count = inputStream.available();
      var data = NetUtil.readInputStreamToString(inputStream, count);
        storageStream.init(512, count, null);
        binaryOutputStream.setOutputStream(storageStream.getOutputStream(0));
        binaryOutputStream.writeBytes(data, count);
        rule['storageStream'] = storageStream;
        rule['count'] = count;
      if (typeof callback === 'function') {
        callback();
      }
    });
  },
  getWindowForRequest: function (request) {
    if (request instanceof Ci.nsIRequest) {
      try {
        if (request.notificationCallbacks) {
          return request.notificationCallbacks.getInterface(Ci.nsILoadContext).associatedWindow;
        }
      } catch (e) {}
      try {
        if (request.loadGroup && request.loadGroup.notificationCallbacks) {
          return request.loadGroup.notificationCallbacks.getInterface(Ci.nsILoadContext).associatedWindow;
        }
      } catch (e) {}
    }
    return null;
  },
  observe: function (aSubject, aTopic, aData) {
    var httpChannel = aSubject.QueryInterface(Ci.nsIHttpChannel);

    if (aTopic == 'http-on-modify-request') {
    for (var i in REFERERS) {
      var domain = REFERERS[i];
        try {
        var URL = httpChannel.originalURI.spec;
          if (domain['target'].test(URL)) {
            httpChannel.setRequestHeader('Referer', domain['host'], false);
          }
        } catch (e) {}
      }
    }

    if (aTopic != 'http-on-examine-response') return;

    for (var i in FILTERS) {
      var rule = FILTERS[i];
      if (rule['target'].test(httpChannel.URI.spec)) {
        if (!rule['storageStream'] || !rule['count']) {
          httpChannel.suspend();
          this.getObject(rule, function () {
            httpChannel.resume();
          });
        }
        var newListener = new TrackingListener();
        aSubject.QueryInterface(Ci.nsITraceableChannel);
        newListener.originalListener = aSubject.setNewListener(newListener);
        newListener.rule = rule;
        break;
      }
    }

    var aVisitor = new HttpHeaderVisitor();
    httpChannel.visitResponseHeaders(aVisitor);
    if (!aVisitor.isFlash()) return;

    for (var i in PLAYERS) {
      var rule = PLAYERS[i];
      if (rule['target'].test(httpChannel.URI.spec)) {
        var fn = this, args = Array.prototype.slice.call(arguments);
        if (typeof rule['preHandle'] === 'function')
          rule['preHandle'].apply(fn, args);
        if (!rule['storageStream'] || !rule['count']) {
          httpChannel.suspend();
          this.getObject(rule, function () {
            httpChannel.resume();
            if (typeof rule['callback'] === 'function')
              rule['callback'].apply(fn, args);
          });
        }
        var newListener = new TrackingListener();
        aSubject.QueryInterface(Ci.nsITraceableChannel);
        newListener.originalListener = aSubject.setNewListener(newListener);
        newListener.rule = rule;
        break;
      }
    }
  },
  QueryInterface: function (aIID) {
    if (aIID.equals(Ci.nsISupports) || aIID.equals(Ci.nsIObserver))
      return this;
    return Cr.NS_ERROR_NO_INTERFACE;
  },
// Resolver for iQiyi.May not help since iQiyi uses one player now.
// 爱奇艺专用代码,似乎已经派不上用场了.
  iQiyi: function () {
    var rule = PLAYERS['iqiyi'];
    if (!rule) return;
    rule['preHandle'] = function (aSubject) {
      var wnd = this.getWindowForRequest(aSubject);
      if (wnd) {
        rule['command'] = [
          !/(^((?!baidu|61|178).)*\.iqiyi\.com|pps\.tv)/i.test(wnd.self.location.host),
          wnd.self.document.querySelector('span[data-flashplayerparam-flashurl]'),
          true
        ];
        if (!rule['command']) return;
        for (var i = 0; i < rule['command'].length; i++) {
          if (rule['command'][i]) {
            if (rule['object'] != rule['object' + i]) {
              rule['object'] = rule['object' + i];
              rule['storageStream'] = rule['storageStream' + i] ? rule['storageStream' + i] : null;
              rule['count'] = rule['count' + i] ? rule['count' + i] : null;
            }
            break;
          }
        }
      }
    };
    rule['callback'] = function () {
      if (!rule['command']) return;
      for (var i = 0; i < rule['command'].length; i++) {
        if (rule['object' + i] == rule['object']) {
          rule['storageStream' + i] = rule['storageStream'];
          rule['count' + i] = rule['count'];
          break;
        }
      }
    };
  },
}

function TrackingListener() {
  this.originalListener = null;
  this.rule = null;
}
TrackingListener.prototype = {
  onStartRequest: function (request, context) {
    this.originalListener.onStartRequest(request, context);
  },
  onStopRequest: function (request, context) {
    this.originalListener.onStopRequest(request, context, Cr.NS_OK);
  },
  onDataAvailable: function (request, context) {
    this.originalListener.onDataAvailable(request, context, this.rule['storageStream'].newInputStream(0), 0, this.rule['count']);
  }
}

function HttpHeaderVisitor() {
  this._isFlash = false;
}
HttpHeaderVisitor.prototype = {
  visitHeader: function (aHeader, aValue) {
    if (aHeader.indexOf("Content-Type") !== -1) {
      if (aValue.indexOf("application/x-shockwave-flash") !== -1) {
        this._isFlash = true;
      }
    }
  },
  isFlash: function () {
    return this._isFlash;
  }
}

var MozApp = {
// Enable Add-on, keep soWatch folder alive.
// 启用扩展，确保soWatch文件夹一定存在。
  startup: function () {
    OS.File.makeDir(aPath);
    Toolbar.addIcon();
    Common.iQiyi();
    Services.os.addObserver(Common, 'http-on-examine-response', false);
    Services.os.addObserver(Common, 'http-on-modify-request', false);
  },
// Disable Add-on
// 禁用扩展
  shutdown: function () {
    Toolbar.removeIcon();
    Services.os.removeObserver(Common, 'http-on-examine-response', false);
    Services.os.removeObserver(Common, 'http-on-modify-request', false);
  },
// Run download at once after installed
// 安装扩展后立即下载播放器
  install: function () {
    OS.File.makeDir(aPath);
    Download.start();
    console.log(aLang.ext_name + ' ' + aLang.ext_install);
  },
// Only delete soWatch folder when uninstalled.
// 仅在卸载时才删除soWatch文件夹。
  uninstall: function () {
    OS.File.removeDir(aPath);
    console.log(aLang.ext_name + ' ' + aLang.ext_uninstall);
  },
/*
//Remove useless files after update.
//升级后删除无用的文件。
  upgrade: function () {
    OS.File.remove(OS.Path.join(aPath, '56.in.NM.swf'));
    OS.File.remove(OS.Path.join(aPath, '56.in.TM.swf'));
    OS.File.remove(OS.Path.join(aPath, 'sohu.inyy.Lite.swf'));
    OS.File.remove(OS.Path.join(aPath, 'sohu.injs.Lite.swf'));
    OS.File.remove(OS.Path.join(aPath, 'sohu.inbj.Live.swf'));
    OS.File.remove(OS.Path.join(aPath, 'sohu.inyy+injs.Lite.s1.swf'));
  },
*/
};

function startup(data, reason) {
  MozApp.startup();
}

function shutdown(data, reason) {
  MozApp.shutdown();
}

function install(data, reason) {
  if (reason == ADDON_INSTALL) {
    MozApp.install();
  }
/*
  else if (reason == ADDON_UPGRADE) {
    MozApp.upgrade();
  }
*/
}

function uninstall(data, reason) {
  if (reason == ADDON_UNINSTALL) {
    MozApp.uninstall();
  }
}
