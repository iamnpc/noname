const {classes: Cc, interfaces: Ci, results: Cr, utils: Cu} = Components;
Cu.import("resource:///modules/CustomizableUI.jsm"); //Require Geck 29 and later
Cu.import('resource://gre/modules/osfile.jsm'); //Require Geck 27 and later
Cu.import('resource://gre/modules/Downloads.jsm'); //Require Geck 26 and later
Cu.import('resource://gre/modules/NetUtil.jsm'); //Coded with Promise chain that require Gecko 25 and later
Cu.import('resource://gre/modules/Services.jsm'); //Now as a work round for ToobarIcon

//Localization code for console logs.Non-Latin characters must be transcoded into UTF-8 code.
//控制台记录的本地化代码。非拉丁文字必须转换成UTF-8代码。
var uAgent = Cc['@mozilla.org/preferences-service;1'].getService(Ci.nsIPrefBranch).getComplexValue('general.useragent.locale', Ci.nsISupportsString).data;
var aLocale = {
  'ja': {
    lf_outofdate: ' \u306E\u6700\u65B0\u7248\u304C\u767A\u898B\u3057\u307E\u3057\u305F',
    lf_corrupted: ' \u304C\u58CA\u308C\u3066\u3044\u308B\u53EF\u80FD\u6027\u304C\u3042\u308A\u307E\u3059',
    lf_ready: ' \u304C\u6E96\u5099\u3067\u304D\u307E\u3057\u305F',
    lf_notexist: ' \u304C\u5B58\u5728\u3057\u307E\u305B\u3093',
    lf_downloaded: ' \u30C0\u30A6\u30F3\u30ED\u30FC\u30C9\u5B8C\u4E86',
    rf_timeout: ' \u30EA\u30E2\u30FC\u30C8\u30B5\u30FC\u30D0\u30FC\u304C\u5FDC\u7B54\u3057\u3066\u304A\u308A\u307E\u305B\u3093',
    rf_accessfailed: ' \u3078\u306E\u30A2\u30AF\u30BB\u30B9\u304C\u3067\u304D\u307E\u305B\u3093',
    rf_downfailed: ' \u306E\u30C0\u30A6\u30F3\u30ED\u30FC\u30C9\u304C\u5931\u6557\u3057\u307E\u3057\u305F',
    rf_interrupted: ' \u30C0\u30A6\u30F3\u30ED\u30FC\u30C9\u4E2D\u306B\u4E0D\u660E\u306A\u30A8\u30E9\u30FC\u304C\u767A\u751F\u3057\u307E\u3057\u305F',
    ext_install: ' \u304C\u30A4\u30F3\u30B9\u30C8\u30FC\u30EB\u3055\u308C\u307E\u3057\u305F',
    ext_uninstall: ' \u304C\u30A2\u30F3\u30A4\u30F3\u30B9\u30C8\u30FC\u30EB\u3055\u308C\u307E\u3057\u305F',
    ext_name: 'Anti-ads Player Mk2',
    ext_tooltip: '\u66F4\u65B0\u30C1\u30A7\u30C3\u30AF\u3092\u5B9F\u884C\u3059\u308B',
  },
  'zh-CN': {
    lf_outofdate: ' \u5DF2\u627E\u5230\u66F4\u65B0\u7248\u672C',
    lf_corrupted: ' \u6587\u4EF6\u53EF\u80FD\u5DF2\u7ECF\u635F\u574F',
    lf_ready: ' \u6587\u4EF6\u5DF2\u7ECF\u5C31\u4F4D',
    lf_notexist: ' \u6587\u4EF6\u4E0D\u5B58\u5728',
    lf_downloaded: ' \u4E0B\u8F7D\u5B8C\u6210',
    rf_timeout: ' \u8FDC\u7A0B\u670D\u52A1\u5668\u6CA1\u6709\u54CD\u5E94',
    rf_accessfailed: ' \u65E0\u6CD5\u8BBF\u95EE\u8FDC\u7A0B\u6587\u4EF6',
    rf_downfailed: ' \u65E0\u6CD5\u4E0B\u8F7D\u8FDC\u7A0B\u6587\u4EF6',
    rf_interrupted: ' \u672A\u77E5\u539F\u56E0\u5BFC\u81F4\u4E0B\u8F7D\u4E2D\u65AD',
    ext_install: ' \u5DF2\u7ECF\u6210\u529F\u5B89\u88C5',
    ext_uninstall: ' \u5DF2\u7ECF\u6210\u529F\u79FB\u9664',
    ext_name: 'Anti-ads Player Mk2',
    ext_tooltip: '\u7ACB\u5373\u68C0\u67E5\u66F4\u65B0',
  },
  'zh-TW': {
    lf_outofdate: ' \u5DF2\u767C\u73FE\u66F4\u65B0\u7248\u672C',
    lf_corrupted: ' \u6587\u4EF6\u53EF\u80FD\u5DF2\u7D93\u640D\u58DE',
    lf_ready: ' \u6587\u4EF6\u5DF2\u7D93\u5C31\u7DD2',
    lf_notexist: ' \u6587\u4EF6\u4E0D\u5B58\u5728',
    lf_downloaded: ' \u4E0B\u8F09\u6210\u529F',
    rf_timeout: ' \u9060\u7A0B\u8A2A\u554F\u670D\u52D9\u5668\u6C92\u6709\u97FF\u61C9',
    rf_accessfailed: ' \u7121\u6CD5\u8A2A\u554F\u9060\u7A0B\u6587\u4EF6',
    rf_downfailed: ' \u7121\u6CD5\u4E0B\u8F09\u9060\u7A0B\u6587\u4EF6',
    rf_interrupted: ' \u4E0B\u8F09\u4E2D\u65B7\uFF0C\u672A\u77E5\u539F\u56E0\u932F\u8AA4',
    ext_install: ' \u5DF2\u7D93\u6210\u529F\u6DFB\u52A0',
    ext_uninstall: ' \u5DF2\u7D93\u6210\u529F\u6E05\u9664',
    ext_name: 'Anti-ads Player Mk2',
    ext_tooltip: '\u7ACB\u5373\u57F7\u884C\u66F4\u65B0\u6AA2\u67E5',
  },
  'en-US': {
    lf_outofdate: ' is out of date',
    lf_corrupted: ' may be corrupted',
    lf_ready: ' is ready to serve',
    lf_notexist: ' is not exist',
    lf_downloaded: ' download session complete',
    rf_timeout: ' no response from remote server',
    rf_accessfailed: ' failed to access remote file',
    rf_downfailed: ' failed to download remote file',
    rf_interrupted: ' download session has been interrupted due to unknown error',
    ext_install: ' has been installed...',
    ext_uninstall: ' has been uninstalled...',
    ext_name: 'Anti-ads Player Mk2',
    ext_tooltip: 'Run update check now...',
  },
};
if (!aLocale[uAgent]) {
  console.log('Your locale is not supported');
}
var aLang = aLocale[uAgent] || aLocale['en-US'];

//You can customize the dir name to store .swf files
//你可以自行修改保存 .swf 文件的文件夹名字。
var aPath = OS.Path.join(OS.Constants.Path.profileDir, 'antiadsplayer2');
var aURI = OS.Path.toFileURI(aPath);
//You can add more domains easily now. example: google for player moded by 15536900, github for catcat520
//现在方便添加更多的服务器了，如：为15536900破解的播放器使用google，而catcat520使用github
var aURL_google = 'https://haoutil.googlecode.com/svn/trunk/player/testmod/';
var aURL_github = 'https://github.com/jc3213/Anti-ads-Solution/releases/download/6666/';

//Player Rules. If you can't fetch remote files, these won't be functional.
//播放器规则。如果你无法获取远程文件，它们将不会工作
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

//Filter Rules that works for most site.
//过滤规则，大多数网站都能正常工作。
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

//Http Referer rule that may help if the site report source error
//HTTP引用头规则,缓解当网站出现无法获取视频信息的问题.
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

// Add icon for Toobar button
// 为工具栏按钮添加图标
var ssService = Cc['@mozilla.org/content/style-sheet-service;1'].getService(Ci.nsIStyleSheetService);
var aIcon = '';
aIcon += '@-moz-document url("chrome://browser/content/browser.xul") {';
aIcon += '    #mk2-button {';
aIcon += '        list-style-image: url("data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABAAAAAQCAYAAAAf8/9hAAACJElEQVR42q2SS2gTURSGr4LxTVrzmEzqwoWVLgV1IT6qoVEqRTfahRTETZC4sVjtTDJ5tFKpLVGyKIqVCrYoWFBqFYriC5Sgu2bZTVdasCFt0sZpJzP3987cSTEUKUIP/Fy4nPP959x7CFnPyLW76nTFcwadtU50kO24QBz/BRht3nxl4aYHiPlUxASK/v3jWJgJa5p2eM1iKK4mI+6bRdyHKt3eB2i/wSLDtGd1YYhsQtR9kCWrlSI9JiJ7qwljD9MYezIMrUyR+/gIevrItCa5D1QBXrU4GjJtO7/nr7vN1i3A3N0AUuMlvMlSfJmiSLykKBYXkes7Cj0qFJYkz94VQOIE2fKs2dGrKwKgcACNi7jR8wnBfopTTIE7FBOTOpY/3ONjRYXh6jFi3pBVHBGxHPPjbdclnOwuWIWmGnuW8DyjAp/THCCL+eo3iHv7LIDsh5HcDXV+Fq2pPI4lCzjeVUSwO4cfeQMYbOFjsjxIztoKYwMDJC2AVMfaY+doGL/myxiYKCH1uoSpGZ39wWDFnUsRJv/6Qs/56fAu0E6T7OeQ+0Hg6wPg22NgpI07R2wTSdTLiiuwApi7VlPz4uzWxZ9X3XaCn7tEbbG3se74vYqIcHHVPgw0kkPZy86hSiKVRBtmSxYNI+LtZd3W/3sbE2QjlYV3pvv71h0odXgpB/Ku2A6cW3ulQ2Qbc0qOnHY8HQqSenPF9YjQDlOyq4Gsd/wBqsWREbqbXxEAAAAASUVORK5CYII=");';
aIcon += '    }';
aIcon += '    #mk2-button[cui-areatype="menu-panel"],';
aIcon += '        toolbarpaletteitem[place="palette"] > #mk2-button {';
aIcon += '        list-style-image: url("data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAACAAAAAgCAYAAABzenr0AAAEzElEQVR42u2XfUxVdRjHD8pLFIi83XOBWm+r5VqtrbJYIC8ZY9rSVcymrlErGi5m6MzLPedwcZZAmEqMgQ6bkv94Y87QLRqYKVsUOLNIXlNempFX3rxd4L6c+/v2O+fcN+69XEhx6w9/27MDZ/d5vp/n+T2/l8Mwd8f/degYZsn4ttgC8GydnVftRVF8qvS+v4AJQ1Hk49gRr76jAHnPMiF1maHG4Q9jgGK1bCLPDhKBFeW/BXYQOubeOwrRujFCP1oY5wLwNrv+vRH7tc4BAB12u/0Qfa7V6/VLb1sYumUxdp5tnEvYx75cD5iNkIYoin30kX3r4rzqUQjs1QWLO81kgHMQOuij5L+La1UspLkNIGQX1OjTrEDTtpdwbOtq1G/NQkvp25Kqoj4+BBx5E2jIh/3k9l00bNBC9YPsnKolkLiJfwCntmfg+2MH0PzDbzjRZoL+JxvOXJzA2D8KgPHGX2gt3QAiKD6EVzVDExU9r7qoVW2mXQ4bp5oToPWT13G1/wr2NRHUniU4003Q2kfQcIFA20Dwy5ACYRjoRq/2aZcfhWgbyGXuCQjQuD78YnVaCM69FaE4Cr4AtuZylJ4myCwn0HcQdI9AtvYBgk21BBtrCIZGFYg/TlV5TZ2qPCBAZcqSitr0EExrHBXg/ACUPIjCsp9lAMnWVRK8UUWw+jPievf5t3YZwDRhgEVI8qiC2gIuNilgD/TkRdXKDjy1okS/09Cvy0BWmdkl6G05ldOu1SDuT3b7ahNAlzYXsAqutc8lAJrZAKKQgCbhHWTvGplTPH2PFWtKJ1wA2L/SHUNKiFO3BQSg2+x1Jy00Sa4+MGgfwfEda7G35jukcNeR/qnFRzyjzI7U4nG8W3NTEbdMATr3FEgJEa16ek5xwxYmwrNcMoBUCfq/ec+TMJtuwmCkQrpRCmFA2u5pWdSZeWrxmAx35JxZAbh82i0uJeKIN1bALPMLMKNZ/pDLgXMAePbBlfNy3PrzFhlAEvO23GojZqyODanuNfjEk5+xz+tzGN/zYpJuFj4OspPjXXUGYJ2RY59ot2FN2SRS+BvUDFilG0fx1zOYnHKIX6j3yj5RicU7+0l1yf9mJLBG1ypwAkjOzj3hq010bk3KFNsIuq4RXBomGDMRd+P9/g09Be6Hz3RKcaTEpIT4+CL/q0Bgf5Sb7qM4N7U8FQluiAMvAJ0n6RqzYtb4u4vu/1tmL1vOMxEFQuTYy9Klxj8Ap6qwaFU4/HIoxJ0JPs7OEsq2+2HgYDZweB1Q8cxsYcEzc09xtQlC9FNzn4ZCXFpPXjSqVoVgMD/WK4ADQqoGP8eBxTuFE/3BT0Grzpj3RGzbHNkpAbTkRPgJ5A3jYX5/qwCLgnrYysU9t6AzueGVsMe+SFnaWJMeYp75mA0AEMAkIFoJwtONTWBLsTM66lZuxcG0H0pmZSYF5dTzVCZJ+o3FWhSTLN2sb+tu+GchE067ttclSAHOboiATcsqvRCgAvRuUbgoN2PwsSto947KEBTgUGYojmaFofeD5VKmojL/vhAUvGPRrucoin2CHiTtEkDDq+GoSg0mlSnBJdDex4q8Kp9+vByna76L/maccAkTFKyHLumji/2ZEAQu5sVfcyPf35fMrLz77bhY41/wTM0FqVZmhwAAAABJRU5ErkJggg==");';
aIcon += '    }';
aIcon += '}';
var aIconEnc = encodeURIComponent(aIcon);
var newURIParam = {
    aURL: 'data:text/css,' + aIconEnc,
    aOriginCharset: null,
    aBaseURI: null,
};
var aIconUri = Services.io.newURI(newURIParam.aURL, newURIParam.aOriginCharset, newURIParam.aBaseURI);

var aCommon = {
  oService: Cc['@mozilla.org/observer-service;1'].getService(Ci.nsIObserverService),
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
    if (aTopic == 'http-on-modify-request') {
    var httpReferer = aSubject.QueryInterface(Ci.nsIHttpChannel);
    for (var i in REFERERS) {
      var domain = REFERERS[i];
        try {
        var URL = httpReferer.originalURI.spec;
          if (domain['target'].test(URL)) {
            httpReferer.setRequestHeader('Referer', domain['host'], false);
          }
        } catch (e) {}
      }
    }

    if (aTopic != 'http-on-examine-response') return;
    var httpChannel = aSubject.QueryInterface(Ci.nsIHttpChannel);
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
          this.getObject(rule, function() {
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
  aResolver: function () {
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
//Check if remote file is online and then for update.
//优先检查远程文件是否响应，再检查文件是否需要更新。
  checkUpdate: function (aLink, aFile) {
    var aClient = Cc['@mozilla.org/xmlextras/xmlhttprequest;1'].createInstance(Ci.nsIXMLHttpRequest);
    aClient.open('HEAD', aLink, true);
    aClient.timeout = 30000;  //超时时间: 30秒
    aClient.ontimeout = function () {
      console.log(aLink + aLang.rf_timeout);
    }
    aClient.send();
    aClient.onload = function () {
      var aDate = new Date(aClient.getResponseHeader('Last-Modified'));
      var aSize = new Number(aClient.getResponseHeader('Content-Length'));
      OS.File.stat(aFile).then(function onSuccess(info) {
        if (aSize == null || aSize < 10000) {
          console.log(aLink + aLang.rf_accessfailed);
        } else if (aDate > info.lastModificationDate) {
          console.log(aFile + aLang.lf_outofdate);
          aCommon.initDownload(aLink, aFile, aSize);
        } else if (aSize != info.size) {
          console.log(aFile + aLang.lf_corrupted);
          aCommon.initDownload(aLink, aFile, aSize);
        } else {
          console.log(aFile + aLang.lf_ready);
        }
      }, function onFailure(reason) {
        if (reason instanceof OS.File.Error && reason.becauseNoSuchFile) {
          console.log(aFile + aLang.lf_notexist);
          aCommon.initDownload(aLink, aFile, aSize);
        }
      });
    }
  },
// Download remote file add _sw as temp,check for download then overwrite.
// 下载远程文件至 _sw 临时文件,然后检查下载是否完成,再覆盖文件
  initDownload: function (aLink, aFile, aSize) {
    var aTemp = aFile + '_sw';
    Downloads.fetch(aLink, aTemp, {
      isPrivate: true
    }).then(function onSuccess() {
      OS.File.stat(aTemp).then(function onSuccess(info) {
        if (aSize == info.size) {
          console.log(aFile + aLang.lf_downloaded);
          OS.File.move(aTemp, aFile);
        } else {
          console.log(aFile + aLang.rf_interrupted);
          OS.File.remove(aTemp);
          aCommon.initDownload(aLink, aFile, aSize);
        }
      });
    }, function onFailure() {
      console.log(aLink + aLang.rf_downfailed);
      OS.File.remove(aTemp);
    });
  },
// Start download
// 开始下载
  startDownload: function() {
    for (var i in PLAYERS) {
      var rule = PLAYERS[i];
      if (rule['remote']) {
        var aLink = rule['remote'];
        var aFile = OS.Path.fromFileURI(rule['object']);
        aCommon.checkUpdate(aLink, aFile);
      }
    }
  },
  register: function () {
    this.aResolver();
    this.oService.addObserver(this, 'http-on-examine-response', false);
    this.oService.addObserver(this, "http-on-modify-request", false);
  },
  unregister: function () {
    this.oService.removeObserver(this, 'http-on-examine-response', false);
    this.oService.removeObserver(this, "http-on-modify-request", false);
  }
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
  isFlash: function() {
    return this._isFlash;
  }
}

function startup(data, reason) {
// Add Toobar button
// 添加工具栏按钮
  CustomizableUI.createWidget({
    id: 'mk2-button',
    defaultArea: CustomizableUI.AREA_NAVBAR,
    label: aLang.ext_name,
    tooltiptext: aLang.ext_tooltip,
    onCommand: function() {
      aCommon.startDownload();
    },
  });
  ssService.loadAndRegisterSheet(aIconUri, ssService.AUTHOR_SHEET);
//
  aCommon.register();
}

function shutdown(data, reason) {
// Remove Toobar button
// 移除工具栏按钮
  CustomizableUI.destroyWidget('mk2-button');
  ssService.unregisterSheet(aIconUri, ssService.AUTHOR_SHEET);
  aCommon.unregister();
}

function install(data, reason) {
//Create folder and run download once when installed
//安装扩展后新建文件夹并下载破解播放器
  if (reason == ADDON_INSTALL) {
    aCommon.startDownload();
    OS.File.makeDir(aPath);
    console.log(aLang.ext_name + aLang.ext_install);
  }
//Remove useless .swf file.
//删除无用的.swf文件。
/*
  if (reason == ADDON_UPGRADE) {
    OS.File.remove(OS.Path.join(aPath, '56.in.NM.swf'));
    OS.File.remove(OS.Path.join(aPath, '56.in.TM.swf'));
    OS.File.remove(OS.Path.join(aPath, 'sohu.inyy.Lite.swf'));
    OS.File.remove(OS.Path.join(aPath, 'sohu.injs.Lite.swf'));
    OS.File.remove(OS.Path.join(aPath, 'sohu.inbj.Live.swf'));
    OS.File.remove(OS.Path.join(aPath, 'sohu.inyy+injs.Lite.s1.swf'));
  }
*/
}

function uninstall(data, reason) {
//Only delete aPath when add-on is uninstalled.
//仅在卸载扩展时才删除aPath文件夹。
function uninstall(data, reason) {
  if (reason == ADDON_UNINSTALL) {
    OS.File.removeDir(aPath);
    console.log(aLang.ext_name + aLang.ext_uninstall);
  }
}
