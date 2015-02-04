const {classes: Cc, interfaces: Ci, results: Cr, utils: Cu} = Components;
Cu.import('resource://gre/modules/NetUtil.jsm');

var aURI = 'chrome://mk3-flash/content';

var Services = {
  os: Cc['@mozilla.org/observer-service;1'].getService(Ci.nsIObserverService),
  prefs: Cc['@mozilla.org/preferences-service;1'].getService(Ci.nsIPrefService).QueryInterface(Ci.nsIPrefBranch),
};

var Preferences = {
  branch: Services.prefs.getBranch('extensions.sowatchmk3.'),
  setYouku: function () {
    this.branch.setBoolPref('youku', true);
  },
  setTudou: function () {
    this.branch.setBoolPref('tudou', true);
  },
  setTudouOut: function () {
    this.branch.setBoolPref('tudou_out', false);
  },
  setQiyi: function () {
    this.branch.setBoolPref('iqiyi', true);
  },
  setPPS: function () {
    this.branch.setBoolPref('pps', true);
  },
  setLetv: function () {
    this.branch.setBoolPref('letv', false);
  },
  setSohu: function () {
    this.branch.setBoolPref('sohu', false);
  },
  setPPTV: function () {
    this.branch.setBoolPref('pptv', false);
  },
  set17173: function () {
    this.branch.setBoolPref('17173', true);
  },
  setKu6: function () {
    this.branch.setBoolPref('ku6', true);
  },
  setBaidu: function () {
    this.branch.setBoolPref('baidu', true);
  },
  setQQ: function () {
    this.branch.setBoolPref('qq', false);
  },
  set56: function () {
    this.branch.setBoolPref('56', false);
  },
  set163: function () {
    this.branch.setBoolPref('163', false);
  },
  setSina: function () {
    this.branch.setBoolPref('sina', false);
  },
  setHunanTV: function () {
    this.branch.setBoolPref('hunantv', false);
  },
  setDuowan: function () {
    this.branch.setBoolPref('duowan', false);
  },
  setDefault: function () {
    this.setYouku();
    this.setTudou();
    this.setTudouOut();
    this.setQiyi();
    this.setPPS();
    this.setLetv();
    this.setSohu();
    this.setPPTV();
    this.set17173();
    this.setKu6();
    this.setBaidu();
    this.setQQ();
    this.set56();
    this.set163();
    this.setSina();
    this.setHunanTV();
    this.setDuowan();

    this.startCheck();
  },
  observe: function (aSubject, aTopic, aData) {
    if (aTopic != 'nsPref:changed') return;
    try {
      this.branch.getBoolPref('youku');
    } catch (e) {
      this.setYouku();
    }
    try {
      this.branch.getBoolPref('tudou');
    } catch (e) {
      this.setTudou();
    }
    try {
      this.branch.getBoolPref('tudou_out');
    } catch (e) {
      this.setTudouOut();
    }
    try {
      this.branch.getBoolPref('iqiyi');
    } catch (e) {
      this.setQiyi();
    }
    try {
      this.branch.getBoolPref('pps');
    } catch (e) {
      this.setPPS();
    }
    try {
      this.branch.getBoolPref('letv');
    } catch (e) {
      this.setLetv();
    }
    try {
      this.branch.getBoolPref('sohu');
    } catch (e) {
      this.setSohu();
    }
    try {
      this.branch.getBoolPref('pptv');
    } catch (e) {
      this.setPPTV();
    }
    try {
      this.branch.getBoolPref('17173');
    } catch (e) {
      this.set17173();
    }
    try {
      this.branch.getBoolPref('ku6');
    } catch (e) {
      this.setKu6();
    }
    this.setBaidu();
    this.setQQ();
    this.set56();
    this.set163();
    this.setSina();
    this.setHunanTV();
    this.setDuowan();

    this.startCheck();
  },
  startCheck: function () {
    var Youku = this.branch.getBoolPref('youku');
    var Tudou = this.branch.getBoolPref('tudou');
    var TdOut = this.branch.getBoolPref('tudou_out');
    if (Youku == true) {
      PlayerRules['youku_loader'] = {
        'object': aURI + '/loader.swf',
        'target': /http:\/\/static\.youku\.com\/.*\/v\/swf\/loaders?\.swf/i
      };
      PlayerRules['youku_player'] = {
        'object': aURI + '/player.swf',
        'target': /http:\/\/static\.youku\.com\/.*\/v\/swf\/q?player.*\.swf/i
      };
    }
    if (Tudou == true) {
      PlayerRules['tudou_portal'] = {
        'object': aURI + '/tudou.swf',
        'target': /http:\/\/js\.tudouui\.com\/bin\/lingtong\/PortalPlayer.*\.swf/i
      };
    }
    if (TdOut == true) {
      PlayerRules['tudou_olc'] = {
        'object': 'http://js.tudouui.com/bin/player2/olc.swf',
        'target': /http:\/\/js\.tudouui\.com\/bin\/player2\/olc.+\.swf/i
      };
      PlayerRules['youku_social'] = {
        'object': aURI + '/sp.swf',
        'target': /http:\/\/js\.tudouui\.com\/bin\/lingtong\/SocialPlayer.*\.swf/i
      };
    }
    else if (Youku == false || Tudou == false || TdOut == false) {
      FilterRules['youku_tudou'] = {
        'object': 'http://valf.atm.youku.com/vf?vip=0',
        'target': /http:\/\/val[fcopb]\.atm\.youku\.com\/v.+/i
      };
    }
    var Qiyi = this.branch.getBoolPref('iqiyi');
    var PPS = this.branch.getBoolPref('pps');
    if (Qiyi == true) {
      PlayerRules['iqiyi5'] = {
        'object': aURI + '/iqiyi5.swf',
        'target': /http:\/\/www\.iqiyi\.com\/common\/flashplayer\/\d+\/MainPlayer.*\.swf/i
      };
      PlayerRules['iqiyi_out'] = {
        'object': aURI + '/iqiyi_out.swf',
        'target': /https?:\/\/www\.iqiyi\.com\/(common\/flash)?player\/\d+\/(Share)?Player.*\.swf/i
      };
	}
    if (PPS == true) {
      PlayerRules['pps'] = {
        'object': aURI + '/iqiyi.swf',
        'target': /http:\/\/www\.iqiyi\.com\/common\/flashplayer\/\d+\/PPSMainPlayer.*\.swf/i
      };
      PlayerRules['pps_out'] = {
        'object': aURI + '/pps.swf',
        'target': /http:\/\/www\.iqiyi\.com\/player\/cupid\/common\/pps_flvplay_s\.swf/i
      };
    }
    else if (Qiyi == false || PPS == false) {
      FilterRules['iqiyi_pps'] = {
        'object': 'http://www.iqiyi.com/player/cupid/common/clear.swf',
        'target': /http:\/\/www\.iqiyi\.com\/common\/flashplayer\/\d+\/((dsp)?roll|hawkeye|pause).*\.swf/i
      };
    }
    var Letv = this.branch.getBoolPref('letv');
    if (Letv == true) {
      PlayerRules['letv'] = {
        'object': aURI + '/letv.swf',
        'target': /http:\/\/.*\.letv(cdn)?\.com\/.*(new)?player\/((SDK)?Letv|swf)Player\.swf/i
      };
      PlayerRules['letv_skin'] = {
        'object': 'http://player.letvcdn.com/p/201407/24/15/newplayer/1/SSLetvPlayer.swf',
        'target': /http:\/\/player\.letvcdn\.com\/p\/((?!15)\d+\/){3}newplayer\/1\/S?SLetvPlayer\.swf/i
      };
	}
    else if (Letv == false) {
      FilterRules['letv'] = {
        'object': 'http://ark.letv.com/s',
        'target': /http:\/\/(ark|fz)\.letv\.com\/s\?ark/i
      };
    }
    var Sohu = this.branch.getBoolPref('sohu');
    if (Sohu == true) {
      PlayerRules['sohu'] = {
        'object': aURI + '/sohu_live.swf',
        'target': /http:\/\/(tv\.sohu\.com\/upload\/swf\/(p2p\/)?\d+|(\d+\.){3}\d+\/webplayer)\/Main\.swf/i
      };
	}
    else if (Sohu == false) {
      FilterRules['sohu'] = {
        'object': 'http://v.aty.sohu.com/v',
        'target': /http:\/\/v\.aty\.sohu\.com\/v\?/i
      };
    }
    var PPTV = this.branch.getBoolPref('pptv');
    if (PPTV == true) {
      PlayerRules['pptv'] = {
        'object': aURI + '/pptv.in.Ikan.swf',
        'target': /http:\/\/player.pplive.cn\/ikan\/.*\/player4player2\.swf/i
      };
      PlayerRules['pptv_live'] = {
        'object': aURI + '/pptv.in.Live.swf',
        'target': /http:\/\/player.pplive.cn\/live\/.*\/player4live2\.swf/i
      };
    }
    else if (PPTV == false) {
      FilterRules['pptv_live'] = {
        'object': 'http://de.as.pptv.com/ikandelivery/vast/draft',
        'target': /http:\/\/de\.as\.pptv\.com\/ikandelivery\/vast\/.+draft/i
      };
    }
    var v17173 = this.branch.getBoolPref('17173');
    if (v17173 == true) {
      PlayerRules['17173'] = {
        'object': aURI + '/17173.in.Vod.swf',
        'target': /http:\/\/f\.v\.17173cdn\.com\/\d+\/flash\/Player_file\.swf/i
      };
      PlayerRules['17173_out'] = {
        'object': aURI + '/17173.out.Vod.swf',
        'target': /http:\/\/f\.v\.17173cdn\.com\/(\d+\/)?flash\/Player_file_(custom)?out\.swf/i
      };
      PlayerRules['17173_live'] = {
        'object': aURI + '/17173.in.Live.swf',
        'target': /http:\/\/f\.v\.17173cdn\.com\/\d+\/flash\/Player_stream(_firstpage)?\.swf/i
      };
      PlayerRules['17173_live_out'] = {
        'object': aURI + '/17173.out.Live.swf',
        'target': /http:\/\/f\.v\.17173cdn\.com\/\d+\/flash\/Player_stream_(custom)?Out\.swf/i
      };
    }
    else if (v17173 == false) {
      FilterRules['pptv_live'] = {
        'object': 'http://17173im.allyes.com/crossdomain.xml',
        'target': /http:\/\/cdn\d+\.v\.17173\.com\/(?!crossdomain\.xml).*/i
      };
    }
    var Ku6 = this.branch.getBoolPref('ku6');
    if (Ku6 == true) {
      PlayerRules['ku6'] = {
        'object': aURI + '/ku6_in_player.swf',
        'target': /http:\/\/player\.ku6cdn\.com\/default\/(\w+\/){2}\d+\/player\.swf/i
      };
      PlayerRules['ku6_out'] = {
        'object': aURI + '/ku6_out_player.swf',
        'target': /http:\/\/player\.ku6cdn\.com\/default\/out\/\d+\/player\.swf/i
      };
    }
    else if (Ku6 == false) {
      FilterRules['ku6'] = {
        'object': 'http://p1.sdo.com',
        'target': /http:\/\/g1\.sdo\.com/i
      };
    }
    var Baidu = this.branch.getBoolPref('baidu');
    if (Baidu == true) {
      PlayerRules['baidu'] = {
        'object': aURI + '/baidu.call.swf',
        'target': /http:\/\/list\.video\.baidu\.com\/swf\/advPlayer\.swf/i
      };
    }
    else if (Baidu == false) {
      FilterRules['baidu'] = {
        'object': 'null',
        'target': null
      };
    }
    var QQ = this.branch.getBoolPref('qq');
    if (QQ == true) {
      PlayerRules['qq'] = {
        'object': aURI + '/null.swf',
        'target': null
      };
    }
    else if (QQ == false) {
      FilterRules['qq'] = {
        'object': 'http://livep.l.qq.com/livemsg',
        'target': /http:\/\/livew\.l\.qq\.com\/livemsg\?/i
      };
    }
    var v56 = this.branch.getBoolPref('56');
    if (v56 == true) {
      PlayerRules['56'] = {
        'object': aURI + '/null.swf',
        'target': null
      };
	}
    else if (v56 == false) {
      FilterRules['56'] = {
        'object': 'http://www.56.com',
        'target': /http:\/\/acs\.stat\.v-56\.com\/vml\/\d+\/ac\/ac.*\.xml/i
      };
    }
    var v163 = this.branch.getBoolPref('163');
    if (v163 == true) {
      PlayerRules['163'] = {
        'object': aURI + '/null.swf',
        'target': null
      };
    }
    else if (v163 == false) {
      FilterRules['163'] = {
        'object': 'http://v.163.com',
        'target': /http:\/\/v\.163\.com\/special\/.*\.xml/i
      };
    }
    var Sina = this.branch.getBoolPref('sina');
    if (Sina == true) {
      PlayerRules['sina'] = {
        'object': aURI + '/null.swf',
        'target': null
      };
    }
    else if (Sina == false) {
      FilterRules['sina'] = {
        'object': 'http://sax.sina.com.cn/video/newimpress',
        'target': /http:\/\/sax\.sina\.com\.cn\/video\/newimpress/i
      };
    }
    var HunanTV = this.branch.getBoolPref('hunantv');
    if (HunanTV == true) {
      PlayerRules['hunantv'] = {
        'object': aURI + '/null.swf',
        'target': null
      };
    }
    else if (HunanTV == false) {
      FilterRules['hunantv'] = {
        'object': 'http://res.hunantv.com/',
        'target': /http:\/\/image\.res\.hunantv\.com\/mediafiles\/.+\.swf/i
      };
    }
    var Duowan = this.branch.getBoolPref('duowan');
    if (Duowan == true) {
      PlayerRules['duowan'] = {
        'object': aURI + '/null.swf',
        'target': null
      };
    }
    else if (Duowan == false) {
      FilterRules['duowan'] = {
        'object': 'http://yuntv.letv.com/bcloud.swf',
        'target': /http:\/\/assets\.dwstatic\.com\/video\/vppp\.swf/i
      };
    }
  },
};

var PlayerRules = {
  'baidu': {
    'object': aURI + '/baidu.call.swf',
    'target': /http:\/\/list\.video\.baidu\.com\/swf\/advPlayer\.swf/i
  },
};

var FilterRules = {
/**  -------------------------------------------------------------------------------------------------------  */
  'tudou_css': {
    'object': 'https://raw.githubusercontent.com/jc3213/Anti-ads-Solution/master/tudoucss/play_70.css',
    'target': /http:\/\/css\.tudouui\.com\/v3\/dist\/css\/play\/play.*\.css/i
  },
};

var RefererRules = {
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

var RefererRules = {};
var HttpChannel = {
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
      for (var i in RefererRules) {
        var rule = RefererRules[i];
        if (!rule) continue;
        try {
          if (rule['target'].test(httpChannel.originalURI.spec)) {
            httpChannel.setRequestHeader('Referer', rule['host'], false);
          }
        } catch (e) {}
      }
    }
    if (aTopic != 'http-on-examine-response') return;
    for (var i in FilterRules) {
      var rule = FilterRules[i];
      if (!rule) continue;
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
    for (var i in PlayerRules) {
      var rule = PlayerRules[i];
      if (!rule) continue;
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
    if (aIID.equals(Ci.nsISupports) || aIID.equals(Ci.nsIObserver)) return this;
    return Cr.NS_ERROR_NO_INTERFACE;
  },
  iQiyi: function () {
    var rule = PlayerRules['iqiyi'];
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
};

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
    if (aHeader.indexOf('Content-Type') !== -1) {
      if (aValue.indexOf('application/x-shockwave-flash') !== -1) {
        this._isFlash = true;
      }
    }
  },
  isFlash: function () {
    return this._isFlash;
  }
}

var Observers = {
  prefsOn: function () {
    Preferences.branch.addObserver('', Preferences, false);
  },
  prefsOff: function () {
    Preferences.branch.removeObserver('', Preferences);
  },
  httpOn: function () {
    Services.os.addObserver(HttpChannel, 'http-on-examine-response', false);
    Services.os.addObserver(HttpChannel, 'http-on-modify-request', false);
  },
  httpOff: function () {
    Services.os.removeObserver(HttpChannel, 'http-on-examine-response', false);
    Services.os.removeObserver(HttpChannel, 'http-on-modify-request', false);
  },
};

var MozApp = {
  startup: function () {
    Preferences.startCheck();
    HttpChannel.iQiyi();
    Observers.prefsOn();
    Observers.httpOn();
  },
  shutdown: function () {
    Observers.prefsOff();
    Observers.httpOff();
  },
};

function startup(data, reason) {
  MozApp.startup();
}

function shutdown(data, reason) {
  MozApp.shutdown();
}

function install(data, reason) {
}

function uninstall(data, reason) {
}
