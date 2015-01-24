const {classes: Cc, interfaces: Ci, results: Cr, utils: Cu} = Components;
Cu.import('resource://gre/modules/osfile.jsm'); //Require Geck 27 and later
Cu.import('resource://gre/modules/Downloads.jsm'); //Require Geck 26 and later
Cu.import('resource://gre/modules/NetUtil.jsm'); //Coded with Promise chain that require Gecko 25 and later

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
//Check if remote file is online and then check for update.
//优先检查远程文件是否响应，再检查文件是否需要更新。
  aSync: function (aLink, aFile) {
    var aClient = Cc['@mozilla.org/xmlextras/xmlhttprequest;1'].createInstance(Ci.nsIXMLHttpRequest);
    aClient.open('HEAD', aLink, true);
    aClient.timeout = 30000;
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
          aCommon.aDownload(aLink, aFile, aSize);
        } else if (aSize != info.size) {
          console.log(aFile + aLang.lf_corrupted);
          aCommon.aDownload(aLink, aFile, aSize);
        } else {
          console.log(aFile + aLang.lf_ready);
        }
      }, function onFailure(reason) {
        if (reason instanceof OS.File.Error && reason.becauseNoSuchFile) {
          console.log(aFile + aLang.lf_notexist);
          aCommon.aDownload(aLink, aFile, aSize);
        }
      });
    }
  },
// Now download _aap temp file instead of overwrite original .swf file
// 现在会先下载 _aap 临时文件而不是直接覆盖原文件
  aDownload: function (aLink, aFile, aSize) {
    var aTemp = aFile + '_aap';
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
          aCommon.aDownload(aLink, aFile, aSize);
        }
      });
    }, function onFailure() {
      console.log(aLink + aLang.rf_downfailed);
      OS.File.remove(aTemp);
    });
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
//Synchronize only when enabled.
//仅在扩展为启用状态时才检查是否.swf更新
  for (var i in PLAYERS) {
    var rule = PLAYERS[i];
    if (rule['remote']) {
      var aLink = rule['remote'];
      var aFile = OS.Path.fromFileURI(rule['object']);
      aCommon.aSync(aLink, aFile);
    }
  };
  aCommon.register();
}

function shutdown(data, reason) {
  aRun.unregister();
}

function install(data, reason) {
//Only create when add-on is installed.
//仅在安装扩展时才创建aPath文件夹。
  if (reason == ADDON_INSTALL) {
    OS.File.makeDir(aPath);
    console.log('Anti-ads Player MK2' + aLang.ext_install);
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
  if (reason == ADDON_UNINSTALL) {
    OS.File.removeDir(aPath);
    console.log('Anti-ads Player MK2' + aLang.ext_uninstall);
  }
}
