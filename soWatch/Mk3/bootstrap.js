const {classes: Cc, interfaces: Ci, results: Cr, utils: Cu} = Components;
Cu.import('resource://gre/modules/NetUtil.jsm');

var aURI = 'chrome://mk3-flash/content';

var Services = {
  os: Cc['@mozilla.org/observer-service;1'].getService(Ci.nsIObserverService),
  prefs: Cc['@mozilla.org/preferences-service;1'].getService(Ci.nsIPrefService).QueryInterface(Ci.nsIPrefBranch),
};

var PrefBranch = Services.prefs.getBranch('extensions.sowatchmk3.enable_player_rule.');
var PrefValue = {
 'youku': {
    get: function () {
      return PrefBranch.getBoolPref('youku');
    },
    set: function () {
      PrefBranch.setBoolPref('youku', true);
    },
  },
  'tudou': {
    get: function () {
      return PrefBranch.getBoolPref('tudou');
    },
    set: function () {
      PrefBranch.setBoolPref('tudou', true);
    },
  },
  'iqiyi': {
    get: function () {
      return PrefBranch.getBoolPref('iqiyi');
    },
    set: function () {
      PrefBranch.setBoolPref('iqiyi', true);
    },
  },
  'pps': {
    get: function () {
      return PrefBranch.getBoolPref('pps');
    },
    set: function () {
      PrefBranch.setBoolPref('pps', true);
    },
  },
  'letv': {
    get: function () {
      return PrefBranch.getBoolPref('letv');
    },
    set: function () {
      PrefBranch.setBoolPref('letv', false);
    },
  },
  'sohu': {
    get: function () {
      return PrefBranch.getBoolPref('sohu');
    },
    set: function () {
      PrefBranch.setBoolPref('sohu', false);
    },
  },
  'pptv': {
    get: function () {
      return PrefBranch.getBoolPref('pptv');
    },
    set: function () {
      PrefBranch.setBoolPref('pptv', false);
    },
  },
  '17173': {
    get: function () {
      return PrefBranch.getBoolPref('17173');
    },
    set: function () {
      PrefBranch.setBoolPref('17173', true);
    },
  },
  'ku6': {
    get: function () {
      return PrefBranch.getBoolPref('ku6');
    },
    set: function () {
      PrefBranch.setBoolPref('ku6', false);
    },
  },
};
var Preferences = {
  setDefault: function () {
    for (var i in PrefValue) {
      var rule = PrefValue[i];
      rule.set();
    }
  },
  pending: function () {
    for (var i in PrefValue) {
      var rule = PrefValue[i];
      try {
        rule.get();
      } catch(e) {
        rule.set();
      }
    }
    this.manifest();
  },
  observe: function (aSubject, aTopic, aData) {
    if (aTopic != 'nsPref:changed') return;
    this.pending();
  },
  manifest: function () {
    var Youku = PrefValue['youku'].get();
    if (Youku == true) {
      RuleResolver['youku'].playerOn();
    } else {
      RuleResolver['youku'].playerOff();
    }
    var Tudou = PrefValue['tudou'].get();
    if (Tudou == true) {
      RuleResolver['tudou'].playerOn();
    } else {
      RuleResolver['tudou'].playerOff();
    }
    var Qiyi = PrefValue['iqiyi'].get();
    if (Qiyi == true) {
      RuleResolver['iqiyi'].playerOn();
    } else {
      RuleResolver['iqiyi'].playerOff();
    }
    var PPS = PrefValue['pps'].get();
    if (PPS == true) {
      RuleResolver['pps'].playerOn();
    } else {
      RuleResolver['pps'].playerOff();
    }
    var Letv = PrefValue['letv'].get();
    if (Letv == true) {
      RuleResolver['letv'].playerOn();
	}
    else {
      RuleResolver['letv'].playerOff();
    }
    var Sohu = PrefValue['sohu'].get();
    if (Sohu == true) {
      RuleResolver['sohu'].playerOn();
	} else {
      RuleResolver['sohu'].playerOff();
    }
    var PPTV = PrefValue['pptv'].get();
    if (PPTV == true) {
      RuleResolver['pptv'].playerOn();
	} else {
      RuleResolver['pptv'].playerOff();
    }
    var v17173 = PrefValue['17173'].get();
    if (v17173 == true) {
      RuleResolver['17173'].playerOn();
    } else {
      RuleResolver['17173'].playerOff();
    }
    var Ku6 = PrefValue['ku6'].get();
    if (Ku6 == true) {
      RuleResolver['ku6'].playerOn();
    } else {
      RuleResolver['ku6'].playerOff();
    }
  },
};

var RuleResolver = {
  'youku': {
    playerOn: function () {
      PlayerRules['youku_loader'] = {
        'object': aURI + '/loader.swf',
        'target': /http:\/\/static\.youku\.com\/.*\/v\/swf\/loaders?\.swf/i
      };
      PlayerRules['youku_player'] = {
        'object': aURI + '/player.swf',
        'target': /http:\/\/static\.youku\.com\/.*\/v\/swf\/q?player.*\.swf/i
      };
	},
    playerOff: function () {
      PlayerRules['youku_loader'] = null;
      PlayerRules['youku_player'] = null;
	},
    filterOn: function () {},
    filterOff: function () {},
  },
  'tudou': {
    playerOn: function () {
      PlayerRules['tudou_portal'] = {
        'object': aURI + '/tudou.swf',
        'target': /http:\/\/js\.tudouui\.com\/bin\/lingtong\/PortalPlayer.*\.swf/i
      };
      PlayerRules['tudou_olc'] = {
        'object': 'http://js.tudouui.com/bin/player2/olc.swf',
        'target': /http:\/\/js\.tudouui\.com\/bin\/player2\/olc.+\.swf/i
      };
      PlayerRules['tudou_social'] = {
        'object': aURI + '/sp.swf',
        'target': /http:\/\/js\.tudouui\.com\/bin\/lingtong\/SocialPlayer.*\.swf/i
      };
	},
    playerOff: function () {
      PlayerRules['tudou_portal'] = null;
      PlayerRules['tudou_olc'] = null;
      PlayerRules['tudou_social'] = null;
	},
    filterOn: function () {},
    filterOff: function () {},
  },
  'iqiyi': {
    playerOn: function () {
      PlayerRules['iqiyi5'] = {
        'object': aURI + '/iqiyi5.swf',
        'target': /http:\/\/www\.iqiyi\.com\/common\/flashplayer\/\d+\/MainPlayer.*\.swf/i
      };
      PlayerRules['iqiyi_out'] = {
        'object': aURI + '/iqiyi_out.swf',
        'target': /https?:\/\/www\.iqiyi\.com\/(common\/flash)?player\/\d+\/(Share)?Player.*\.swf/i
      };
	},
    playerOff: function () {
      PlayerRules['iqiyi5'] = null;
      PlayerRules['iqiyi_out'] = null;
	},
    filterOn: function () {},
    filterOff: function () {},
  },
  'pps': {
    playerOn: function () {
      PlayerRules['pps'] = {
        'object': aURI + '/iqiyi.swf',
        'target': /http:\/\/www\.iqiyi\.com\/common\/flashplayer\/\d+\/PPSMainPlayer.*\.swf/i
      };
      PlayerRules['pps_out'] = {
        'object': aURI + '/pps.swf',
        'target': /http:\/\/www\.iqiyi\.com\/player\/cupid\/common\/pps_flvplay_s\.swf/i
      };
	},
    playerOff: function () {
      PlayerRules['pps'] = null;
      PlayerRules['pps_out'] = null;
	},
    filterOn: function () {},
    filterOff: function () {},
  },
  'letv': {
    playerOn: function () {
      PlayerRules['letv'] = {
        'object': aURI + '/letv.swf',
        'target': /http:\/\/.*\.letv(cdn)?\.com\/.*(new)?player\/((SDK)?Letv|swf)Player\.swf/i
      };
      PlayerRules['letv_skin'] = {
        'object': 'http://player.letvcdn.com/p/201407/24/15/newplayer/1/SSLetvPlayer.swf',
        'target': /http:\/\/player\.letvcdn\.com\/p\/((?!15)\d+\/){3}newplayer\/1\/S?SLetvPlayer\.swf/i
      };
	},
    playerOff: function () {
      PlayerRules['letv'] = null;
      PlayerRules['letv_skin'] = null;
	},
    filterOn: function () {},
    filterOff: function () {},
  },
  'sohu': {
    playerOn: function () {
      PlayerRules['sohu'] = {
        'object': aURI + '/sohu_live.swf',
        'target': /http:\/\/(tv\.sohu\.com\/upload\/swf\/(p2p\/)?\d+|(\d+\.){3}\d+\/webplayer)\/Main\.swf/i
      };
	},
    playerOff: function () {
      PlayerRules['sohu'] = null;
	},
    filterOn: function () {},
    filterOff: function () {},
  },
  'pptv': {
    playerOn: function () {
      PlayerRules['pptv'] = {
        'object': aURI + '/pptv.in.Ikan.swf',
        'target': /http:\/\/player.pplive.cn\/ikan\/.*\/player4player2\.swf/i
      };
      PlayerRules['pptv_live'] = {
        'object': aURI + '/pptv.in.Live.swf',
        'target': /http:\/\/player.pplive.cn\/live\/.*\/player4live2\.swf/i
      };
	},
    playerOff: function () {
      PlayerRules['pptv'] == null;
      PlayerRules['pptv_live'] == null;
	},
    filterOn: function () {},
    filterOff: function () {},
  },
  '17173': {
    playerOn: function () {
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
	},
    playerOff: function () {
      PlayerRules['17173'] = null;
      PlayerRules['17173_out'] = null;
      PlayerRules['17173_live'] = null;
      PlayerRules['17173_live_out'] = null;
	},
    filterOn: function () {},
    filterOff: function () {},
  },
  'ku6': {
    playerOn: function () {
      PlayerRules['ku6'] = {
        'object': aURI + '/ku6_in_player.swf',
        'target': /http:\/\/player\.ku6cdn\.com\/default\/(\w+\/){2}\d+\/player\.swf/i
      };
      PlayerRules['ku6_out'] = {
        'object': aURI + '/ku6_out_player.swf',
        'target': /http:\/\/player\.ku6cdn\.com\/default\/out\/\d+\/player\.swf/i
      };
	},
    playerOff: function () {
      PlayerRules['ku6'] = null;
      PlayerRules['ku6_out'] = null;
	},
    filterOn: function () {},
    filterOff: function () {},
  },
};

var PlayerRules = {};
var FilterRules = {
/**  -------------------------------------------------------------------------------------------------------  */
  'tudou_css': {
    'object': 'https://raw.githubusercontent.com/jc3213/Anti-ads-Solution/master/tudoucss/play_70.css',
    'target': /http:\/\/css\.tudouui\.com\/v3\/dist\/css\/play\/play.*\.css/i
  },
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
  'hunantv': {
    'object': 'http://res.hunantv.com/',
    'target': /http:\/\/image\.res\.hunantv\.com\/mediafiles\/.+\.swf/i
  },
/**  -------------------------------------------------------------------------------------------------------  */
  'duowan': {
    'object': 'http://yuntv.letv.com/bcloud.swf',
    'target': /http:\/\/assets\.dwstatic\.com\/video\/vppp\.swf/i
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
        try {
        var aSpec = httpChannel.originalURI.spec;
          if (rule['target'].test(aSpec)) {
            httpChannel.setRequestHeader('Referer', rule['host'], false);
          }
        } catch (e) {}
      }
    }
    if (aTopic != 'http-on-examine-response') return;
    for (var i in FilterRules) {
      var rule = FilterRules[i];
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
    PrefBranch.addObserver('', Preferences, false);
  },
  prefsOff: function () {
    PrefBranch.removeObserver('', Preferences);
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
    HttpChannel.iQiyi();
    Preferences.pending();
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
