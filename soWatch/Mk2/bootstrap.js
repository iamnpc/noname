const {classes: Cc, interfaces: Ci, results: Cr, utils: Cu} = Components;
Cu.import("resource:///modules/CustomizableUI.jsm"); //Require Gecko 29 and later
Cu.import('resource://gre/modules/osfile.jsm'); //Require Gecko 27 and later
Cu.import('resource://gre/modules/Downloads.jsm'); //Require Gecko 26 and later
Cu.import('resource://gre/modules/NetUtil.jsm'); //Promise chain that require Gecko 25 and later

// Services.jsm like thing. better performance and compatibility
// 仿Services.jsm,不过更好用
var Services = {
  io: Cc["@mozilla.org/network/io-service;1"].getService(Ci.nsIIOService),
  obs: Cc['@mozilla.org/observer-service;1'].getService(Ci.nsIObserverService),
  prefs: Cc['@mozilla.org/preferences-service;1'].getService(Ci.nsIPrefService).QueryInterface(Ci.nsIPrefBranch),
  sss: Cc['@mozilla.org/content/style-sheet-service;1'].getService(Ci.nsIStyleSheetService),
  strings: Cc["@mozilla.org/intl/stringbundle;1"].getService(Ci.nsIStringBundleService),
};

// Import localizeable debug logs
// 加载本地化Debug记录
var Logs = Services.strings.createBundle('chrome://sowatchmk2/locale/global.properties?' + Math.random());

// User preferences to toggle functions. may be modifed later
// 设置用户参数以实现各种功能的开关,这里可能会改写
var PrefBranch = Services.prefs.getBranch('extensions.sowatchmk2.');
var PrefValue = {
 'remote': {
    get: function () {
      return PrefBranch.getBoolPref('access_remote.enable');
    },
    set: function () {
      PrefBranch.setBoolPref('access_remote.enable', false);
    },
  },
 'autoupdate': {
    get: function () {
      return PrefBranch.getBoolPref('autoupdate.enable');
    },
    set: function () {
      PrefBranch.setBoolPref('autoupdate.enable', false);
    },
  },
  'lastdate': {
    get: function () {
      return PrefBranch.getIntPref('autoupdate.lastdate');
    },
    set: function () {
      PrefBranch.setIntPref('autoupdate.lastdate', Date.now() / 1000);
    },
  },
  'period': {
    get: function () {
      return PrefBranch.getIntPref('autoupdate.period');
    },
    set: function () {
      PrefBranch.setIntPref('autoupdate.period', 7);
    },
  },
  'directory': {
    get: function () {
      return PrefBranch.getCharPref('autoupdate.file_directory');
    },
    set: function () {
      PrefBranch.setCharPref('autoupdate.file_directory', OS.Path.join(OS.Constants.Path.profileDir, 'soWatch'));
    },
  },
  'hosting': {
    get: function () {
      return PrefBranch.getCharPref('autoupdate.file_hosting');
    },
    set: function () {
      PrefBranch.setCharPref('autoupdate.file_hosting', 'http://your.domain/soWatch/'); //用户设定catcat520所修改的播放器服务器
    },
  },
};
var Preferences = {
// Remove all prefs from app.
// 移除所有参数设置
  remove: function () {
    Services.prefs.deleteBranch('extensions.sowatchmk2.');
  },
// Restore default preferences, not in use now.
// 恢复默认参数, 暂未使用。
  setDefault: function () {
    for (var i in PrefValue) {
      var rule = PrefValue[i];
      rule.set();
    }
  },
// Check preferences, set to PrefValue if not exist.
// 检查参数,如果不存在或值为空则重设默认。
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
// If use_remote is true set autoupdate to false.If autoupdate is false,then do nothing.
// 当use_remote为true时将autoupdate设为false的，如果autoupdate为false的话则不自动更新。
  manifest: function () {
    for (var i in RuleResolver) {
      var rule = RuleResolver[i];
      if (rule.playerOn) rule.playerOn();
      if (rule.filterOn) rule.playerOn();
      if (rule.refererOn) rule.refererOn();
    }
    var aRemote = PrefValue['use_remote'].get();
    if (aRemote == true) PrefValue['enable'].set(); // 使用远程服务器的时候强制停止自动更新
    var aUpdate = PrefValue['enable'].get();
    if (aUpdate == false) return;
    var aDate = PrefValue['lastdate'].get();
    var aPeriod = PrefValue['period'].get();
    if (aDate + aPeriod * 86400 > Date.now() / 1000) return; // 如果当前时间>上一次检查时间与更新周期的和则不更新。
    PrefValue['lastdate'].set(); // 更新完毕后将现在的时间写入上次更新时间。
    Download.start();
  },
};
Preferences.pending();

var FileIO = {
// You can customize the dir name to store .swf files
// 你可以自行修改保存 .swf 文件的文件夹名字。
  extDir: OS.Path.join(OS.Constants.Path.profileDir, 'soWatch'),
  addFolder: function () {
    OS.File.makeDir(this.extDir);
  },
  delFolder: function () {
    OS.File.removeDir(this.extDir);
  },
// Now bytebucket.org for 15536900's work and other for catcat520.
// 现在使用bytebucket.org链接访问15536900修改的播放器,其他的则读取用户设置
  link: function (aMod) {
    for (var i in RuleResolver) {
      if (aMod === RuleResolver[i]) {
        if (i == 'pptv' || i == '17173' || i == 'ku6') return PrefValue['hosting'].get();
        return 'https://bytebucket.org/kafan15536900/haoutil/raw/d210c02ab8cec4bb9ff3e4baa9a9009cbfabc9f4/player/testmod/'; //这里可能也会被改成用户设置
      }
    }
  },
  path: function () {
    return OS.Path.toFileURI(this.extDir) + '/';
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
// Add Toolbar button
// 添加工具栏按钮
  addIcon: function () {
    CustomizableUI.createWidget({
      id: 'sowatchmk2-button',
      defaultArea: CustomizableUI.AREA_NAVBAR,
      label: aLocale.extName(),
      tooltiptext: aLocale.extName() + ':\n' + aLocale.extTooltip(),
      onCommand: function () {
        var aRemote = PrefValue['use_remote'].get();
        if (aRemote == true) return;
        PrefValue['lastdate'].set();
        Download.start();
      },
    });
    Services.sss.loadAndRegisterSheet(this.css, Services.sss.AUTHOR_SHEET);
  },
// Remove Toolbar button
// 移除工具栏按钮
  removeIcon: function () {
    CustomizableUI.destroyWidget('sowatchmk2-button');
    Services.sss.unregisterSheet(this.css, Services.sss.AUTHOR_SHEET);
  },
};

var Download = {
// Check for remote files then synchronize local files.
// 检查远程文件，再检查文件是否需要更新。
  check: function (aLink, aFile, aName) {
    var aClient = Cc['@mozilla.org/xmlextras/xmlhttprequest;1'].createInstance(Ci.nsIXMLHttpRequest);
    aClient.open('HEAD', aLink, true);
    aClient.timeout = 30000;
    aClient.ontimeout = function () {
      console.log(aName + ' ' + Logs.GetStringFromName('remoteTimeOut'));
    }
    aClient.send();
    aClient.onload = function () {
      var aDate = new Date(aClient.getResponseHeader('Last-Modified'));
      var aSize = new Number(aClient.getResponseHeader('Content-Length'));
      OS.File.stat(aFile).then(function onSuccess(info) {
        if (aSize == null || aSize < 10000) {
          console.log(aName + ' ' + Logs.GetStringFromName('remoteAccessFailed'));
        } else if (aDate > info.lastModificationDate) {
          console.log(aName + ' ' + Logs.GetStringFromName('localOutofDate'));
          Download.fetch(aLink, aFile, aName, aSize);
        } else if (aSize != info.size) {
          console.log(aName + ' ' + Logs.GetStringFromName('localCurrupted'));
          Download.fetch(aLink, aFile, aName, aSize);
        } else {
          console.log(aName + ' ' + Logs.GetStringFromName('localReady'));
        }
      }, function onFailure(reason) {
        if (reason instanceof OS.File.Error && reason.becauseNoSuchFile) {
          console.log(aName + ' ' + Logs.GetStringFromName('localFileNotExsit'));
          Download.fetch(aLink, aFile, aName, aSize);
        }
      });
    }
  },
// Download remote file with _sw as temp file, then check and overwrite.
// 下载远程文件至 _sw 临时文件,然后检查下载的文件是否完整,再覆盖文件
  fetch: function (aLink, aFile, aSize) {
    FileIO.addFolder();  // 仅当下载时才创建文件夹
    var aTemp = aFile + '_sw';
    Downloads.fetch(aLink, aTemp, {
      isPrivate: true
    }).then(function onSuccess() {
      OS.File.stat(aTemp).then(function onSuccess(info) {
        if (aSize == info.size) {
          console.log(aName + ' ' + Logs.GetStringFromName('remoteDownloaded'));
          OS.File.move(aTemp, aFile);
        } else {
          console.log(aName + ' ' + Logs.GetStringFromName('remoteConnectInterrupted'));
          OS.File.remove(aTemp);
          Download.fetch(aLink, aFile, aName, aSize);
        }
      });
    }, function onFailure() {
      console.log(aName + ' ' + Logs.GetStringFromName('remoteFetchFailed'));
      OS.File.remove(aTemp);
    });
  },
// Start download
// 开始下载
  start: function () {
    for (var i in PlayerRules) {
      var rule = PlayerRules[i];
      if (!rule['remote']) continue;
      var aLink = rule['remote'];
      var aFile = OS.Path.fromFileURI(rule['object']);
      var aName = OS.Path.split(aFile).components[10];
      Download.check(aLink, aFile, aName);
    }
  },
};

var RuleResolver = {
  'youku': {
    playerOn: function () {
      var aMod = this;
      PlayerRules['youku_loader'] = {
        'object': FileIO.path() + 'loader.swf',
        'remote': FileIO.link(aMod) + 'loader.swf',
        'target': /http:\/\/static\.youku\.com\/.*\/v\/swf\/loaders?\.swf/i
      };
      PlayerRules['youku_player'] = {
        'object': FileIO.path() + 'player.swf',
        'remote': FileIO.link(aMod) + 'player.swf',
        'target': /http:\/\/static\.youku\.com\/.*\/v\/swf\/q?player.*\.swf/i
      };
    },
    playerOff: function () {
      PlayerRules['youku_loader'] = null;
      PlayerRules['youku_player'] = null;
    },
    filterOn: function () {
      FilterRules['youku_tudou'] = {
        'object': 'http://valf.atm.youku.com/vf?vip=0',
        'target': /http:\/\/val[fcopb]\.atm\.youku\.com\/v.+/i
      };
    },
    filterOff: function () {
      FilterRules['youku_tudou'] = null;
    },
    refererOn: function () {
      RefererRules['youku'] = {
        'object': 'http://www.youku.com/',
        'target': /http:\/\/.*\.youku\.com/i
      };
    },
    refererOff: function () {
      RefererRules['youku'] = null;
    },
  },
  'tudou': {
    playerOn: function () {
      var aMod = this;
      PlayerRules['tudou_portal'] = {
        'object': FileIO.path() + 'tudou.swf',
        'remote': FileIO.link(aMod) + 'tudou.swf',
        'target': /http:\/\/js\.tudouui\.com\/bin\/lingtong\/PortalPlayer.*\.swf/i
      };
      FilterRules['tudou_css'] = {
        'object': 'https://raw.githubusercontent.com/jc3213/Anti-ads-Solution/master/tudoucss/play_70.css',
        'target': /http:\/\/css\.tudouui\.com\/v3\/dist\/css\/play\/play.*\.css/i
      };
      PlayerRules['tudou_olc'] = {
        'object': 'http://js.tudouui.com/bin/player2/olc.swf',
        'target': /http:\/\/js\.tudouui\.com\/bin\/player2\/olc.+\.swf/i
      };
      PlayerRules['tudou_social'] = {
        'object': FileIO.path() + 'sp.swf',
        'remote': FileIO.link(aMod) + 'sp.swf',
        'target': /http:\/\/js\.tudouui\.com\/bin\/lingtong\/SocialPlayer.*\.swf/i
      };
    },
    playerOff: function () {
      PlayerRules['tudou_portal'] = null;
      FilterRules['tudou_css'] = null;
      PlayerRules['tudou_olc'] = null;
      PlayerRules['tudou_social'] = null;
    },
    filterOn: function () {
      FilterRules['youku_tudou'] = {
        'object': 'http://valf.atm.youku.com/vf?vip=0',
        'target': /http:\/\/val[fcopb]\.atm\.youku\.com\/v.+/i
      };
    },
    filterOff: function () {
      FilterRules['youku_tudou'] = null;
    },
  },
  'iqiyi': {
    playerOn: function () {
      var aMod = this;
      PlayerRules['iqiyi5'] = {
        'object': FileIO.path() + 'iqiyi5.swf',
        'remote': FileIO.link(aMod) + 'iqiyi5.swf',
        'target': /http:\/\/www\.iqiyi\.com\/common\/flashplayer\/\d+\/MainPlayer.*\.swf/i
      };
      PlayerRules['iqiyi_out'] = {
        'object': FileIO.path() + 'iqiyi_out.swf',
        'remote': FileIO.link(aMod) + 'iqiyi_out.swf',
        'target': /https?:\/\/www\.iqiyi\.com\/(common\/flash)?player\/\d+\/(Share)?Player.*\.swf/i
      };
    },
    playerOff: function () {
      PlayerRules['iqiyi5'] = null;
      PlayerRules['iqiyi_out'] = null;
    },
    filterOn: function () {
      FilterRules['iqiyi_pps'] = {
        'object': 'http://www.iqiyi.com/player/cupid/common/clear.swf',
        'target': /http:\/\/www\.iqiyi\.com\/common\/flashplayer\/\d+\/((dsp)?roll|hawkeye|pause).*\.swf/i
      };
    },
    filterOff: function () {
      FilterRules['iqiyi_pps'] = null;
    },
    refererOn: function () {
      RefererRules['iqiyi'] = {
        'object': 'http://www.iqiyi.com/',
        'target': /http:\/\/.*\.qiyi\.com/i
      };
    },
    refererOff: function () {
      RefererRules['iqiyi'] = null;
    },
  },
  'pps': {
    playerOn: function () {
      var aMod = this;
      PlayerRules['pps'] = {
        'object': FileIO.path() + 'iqiyi.swf',
        'remote': FileIO.link(aMod) + 'iqiyi.swf',
        'target': /http:\/\/www\.iqiyi\.com\/common\/flashplayer\/\d+\/PPSMainPlayer.*\.swf/i
      };
      PlayerRules['pps_out'] = {
        'object': FileIO.path() + 'pps.swf',
        'remote': FileIO.link(aMod) + 'pps.swf',
        'target': /http:\/\/www\.iqiyi\.com\/player\/cupid\/common\/pps_flvplay_s\.swf/i
      };
    },
    playerOff: function () {
      PlayerRules['pps'] = null;
      PlayerRules['pps_out'] = null;
    },
    filterOn: function () {
      FilterRules['iqiyi_pps'] = {
        'object': 'http://www.iqiyi.com/player/cupid/common/clear.swf',
        'target': /http:\/\/www\.iqiyi\.com\/common\/flashplayer\/\d+\/((dsp)?roll|hawkeye|pause).*\.swf/i
      };
    },
    filterOff: function () {
      FilterRules['iqiyi_pps'] = null;
    },
  },
  'letv': {
    playerOn: function () {
      var aMod = this;
      PlayerRules['letv'] = {
        'object': FileIO.path() + 'letv.swf',
        'remote': FileIO.link(aMod) + 'letv.swf',
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
    filterOn: function () {
      FilterRules['letv'] = {
        'object': 'http://ark.letv.com/s',
        'target': /http:\/\/(ark|fz)\.letv\.com\/s\?ark/i
      };
    },
    filterOff: function () {
      FilterRules['letv'] = null;
    },
  },
  'sohu': {
    playerOn: function () {
      var aMod = this;
      PlayerRules['sohu'] = {
        'object': FileIO.path() + 'sohu_live.swf',
        'remote': FileIO.link(aMod) + 'sohu_live.swf',
        'target': /http:\/\/(tv\.sohu\.com\/upload\/swf\/(p2p\/)?\d+|(\d+\.){3}\d+\/webplayer)\/Main\.swf/i
      };
    },
    playerOff: function () {
      PlayerRules['sohu'] = null;
    },
    filterOn: function () {
      FilterRules['sohu'] = {
        'object': 'http://v.aty.sohu.com/v',
        'target': /http:\/\/v\.aty\.sohu\.com\/v\?/i
      };
    },
    filterOff: function () {
      FilterRules['sohu'] = null;
    },
  },
  'pptv': {
    playerOn: function () {
      var aMod = this;
      PlayerRules['pptv'] = {
        'object': FileIO.path() + 'pptv.in.Ikan.swf',
        'remote': FileIO.link(aMod) + 'pptv.in.Ikan.swf',
        'target': /http:\/\/player.pplive.cn\/ikan\/.*\/player4player2\.swf/i
      };
      PlayerRules['pptv_live'] = {
        'object': FileIO.path() + 'pptv.in.Live.swf',
        'remote': FileIO.link(aMod) + 'pptv.in.Live.swf',
        'target': /http:\/\/player.pplive.cn\/live\/.*\/player4live2\.swf/i
      };
    },
    playerOff: function () {
      PlayerRules['pptv'] == null;
      PlayerRules['pptv_live'] == null;
    },
    filterOn: function () {
      FilterRules['pptv'] = {
        'object': 'http://de.as.pptv.com/ikandelivery/vast/draft',
        'target': /http:\/\/de\.as\.pptv\.com\/ikandelivery\/vast\/.+draft/i
      };
    },
    filterOff: function () {
      FilterRules['pptv'] = null;
    },
  },
  '17173': {
    playerOn: function () {
      var aMod = this;
      PlayerRules['17173'] = {
        'object': FileIO.path() + '17173.in.Vod.swf',
        'remote': FileIO.link(aMod) + '17173.in.Vod.swf',
        'target': /http:\/\/f\.v\.17173cdn\.com\/\d+\/flash\/Player_file\.swf/i
      };
      PlayerRules['17173_out'] = {
        'object': FileIO.path() + '17173.out.Vod.swf',
        'remote': FileIO.link(aMod) + '17173.out.Vod.swf',
        'target': /http:\/\/f\.v\.17173cdn\.com\/(\d+\/)?flash\/Player_file_(custom)?out\.swf/i
      };
      PlayerRules['17173_live'] = {
        'object': FileIO.path() + '17173.in.Live.swf',
        'remote': FileIO.link(aMod) + '17173.in.Live.swf',
        'target': /http:\/\/f\.v\.17173cdn\.com\/\d+\/flash\/Player_stream(_firstpage)?\.swf/i
      };
      PlayerRules['17173_live_out'] = {
        'object': FileIO.path() + '17173.out.Live.swf',
        'remote': FileIO.link(aMod) + '17173.out.Live.swf',
        'target': /http:\/\/f\.v\.17173cdn\.com\/\d+\/flash\/Player_stream_(custom)?Out\.swf/i
      };
    },
    playerOff: function () {
      PlayerRules['17173'] = null;
      PlayerRules['17173_out'] = null;
      PlayerRules['17173_live'] = null;
      PlayerRules['17173_live_out'] = null;
    },
    filterOn: function () {
      FilterRules['17173'] = {
        'object': 'http://17173im.allyes.com/crossdomain.xml',
        'target': /http:\/\/cdn\d+\.v\.17173\.com\/(?!crossdomain\.xml).*/i
      };
    },
    filterOff: function () {
      FilterRules['17173'] = null;
    },
  },
  'ku6': {
    playerOn: function () {
      var aMod = this;
      PlayerRules['ku6'] = {
        'object': FileIO.path() + 'ku6_in_player.swf',
        'remote': FileIO.link(aMod) + 'ku6_in_player.swf',
        'target': /http:\/\/player\.ku6cdn\.com\/default\/(\w+\/){2}\d+\/player\.swf/i
      };
      PlayerRules['ku6_out'] = {
        'object': FileIO.path() + 'ku6_out_player.swf',
        'remote': FileIO.link(aMod) + 'ku6_out_player.swf',
        'target': /http:\/\/player\.ku6cdn\.com\/default\/out\/\d+\/player\.swf/i
      };
    },
    playerOff: function () {
      PlayerRules['ku6'] = null;
      PlayerRules['ku6_out'] = null;
    },
    filterOn: function () {
      FilterRules['ku6'] = {
        'object': 'http://p1.sdo.com',
        'target': /http:\/\/g1\.sdo\.com/i
      };
    },
    filterOff: function () {
      FilterRules['ku6'] = null;
    },
  },
  '56': {
    playerOn: function () {},
    playerOff: function () {},
    filterOn: function () {
      FilterRules['56'] = {
        'object': 'http://www.56.com',
        'target': /http:\/\/acs\.stat\.v-56\.com\/vml\/\d+\/ac\/ac.*\.xml/i
      };
    },
    filterOff: function () {
      FilterRules['56'] = null;
    },
  },
  'qq': {
    playerOn: function () {},
    playerOff: function () {},
    filterOn: function () {
      FilterRules['qq'] = {
        'object': 'http://livep.l.qq.com/livemsg',
        'target': /http:\/\/livew\.l\.qq\.com\/livemsg\?/i
      };
    },
    filterOff: function () {
      FilterRules['qq'] = null;
    },
  },
  '163': {
    playerOn: function () {},
    playerOff: function () {},
    filterOn: function () {
      FilterRules['163'] = {
        'object': 'http://v.163.com',
        'target': /http:\/\/v\.163\.com\/special\/.*\.xml/i
      };
    },
    filterOff: function () {
      FilterRules['163'] = null;
    },
  },
  'sina': {
    playerOn: function () {},
    playerOff: function () {},
    filterOn: function () {
      FilterRules['sina'] = {
        'object': 'http://sax.sina.com.cn/video/newimpress',
        'target': /http:\/\/sax\.sina\.com\.cn\/video\/newimpress/i
      };
    },
    filterOff: function () {
      FilterRules['sina'] = null;
    },
  },
  'duowan': {
    playerOn: function () {},
    playerOff: function () {},
    filterOn: function () {
      FilterRules['duowan'] = {
        'object': 'http://yuntv.letv.com/bcloud.swf',
        'target': /http:\/\/assets\.dwstatic\.com\/video\/vppp\.swf/i
      };
    },
    filterOff: function () {
      FilterRules['duowan'] = null;
    },
  },
};

var PlayerRules = {}, FilterRules = {}, RefererRules = {};
var RuleExecution = {
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
  QueryInterface: function (aIID) {
    if (aIID.equals(Ci.nsISupports) || aIID.equals(Ci.nsIObserver)) return this;
    return Cr.NS_ERROR_NO_INTERFACE;
  },
// Spoof HTTP Referer
// 伪造HTTP Referer
  referer: function (aSubject) {
    var httpChannel = aSubject.QueryInterface(Ci.nsIHttpChannel);
    for (var i in RefererRules) {
      var rule = RefererRules[i];
      if (!rule) continue;
      if (rule['target'].test(httpChannel.originalURI.spec)) {
        httpChannel.setRequestHeader('Referer', rule['host'], false);
      }
    }
  },
// Filter XML Requests
// 拦截XML请求
  filter: function (aSubject) {
    var httpChannel = aSubject.QueryInterface(Ci.nsIHttpChannel);
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
  },
// Override Player,will support use_remote in the future
// 替换播放器,将修改来支持use_remote
  player: function (aSubject) {
    var httpChannel = aSubject.QueryInterface(Ci.nsIHttpChannel);

    var aVisitor = new HttpHeaderVisitor();
    httpChannel.visitResponseHeaders(aVisitor);
    if (!aVisitor.isFlash()) return;

    for (var i in PlayerRules) {
      var rule = PlayerRules[i];
      if (!rule) continue;
      if (rule['target'].test(httpChannel.URI.spec)) {
        var fn = this, args = Array.prototype.slice.call(arguments);
        if (typeof rule['preHandle'] === 'function') rule['preHandle'].apply(fn, args);
        if (!rule['storageStream'] || !rule['count']) {
          httpChannel.suspend();
          this.getObject(rule, function () {
            httpChannel.resume();
            if (typeof rule['callback'] === 'function') rule['callback'].apply(fn, args);
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
// 以下所有代码都是iQiyi专用并且没有支持use_remote也不打算支持了.毕竟已经没被使用了.
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
  iqiyi: function () {
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

var Observers = {
  observe: function (aSubject, aTopic, aData) {
    if (aTopic == 'nsPref:changed') {
      Preferences.pending();
    }
    if (aTopic == 'http-on-modify-request') {
      RuleExecution.referer(aSubject);
    }
    if (aTopic == 'http-on-examine-response') {
      RuleExecution.filter(aSubject);
      RuleExecution.player(aSubject);
    }
  },
  startUp: function () {
    PrefBranch.addObserver('', this, false);
    Services.obs.addObserver(this, 'http-on-examine-response', false);
    Services.obs.addObserver(this, 'http-on-modify-request', false);
  },
  shutDown: function () {
    PrefBranch.removeObserver('', this);
    Services.obs.removeObserver(this, 'http-on-examine-response', false);
    Services.obs.removeObserver(this, 'http-on-modify-request', false);
  },
};

// Enable Add-on. Add Toolbar icon，Check for autoupdate preferences.
// 启用扩展，添加工具栏图标，并检查自动更新参数。
function startup(data, reason) {
  RuleExecution.iqiyi();
  Toolbar.addIcon();
  Observers.startUp();
}

function shutdown(data, reason) {
  Toolbar.removeIcon();
  Observers.shutDown();
}

// Run download session after installed
// 安装扩展后立即下载播放器
function install(data, reason) {
  if (reason == ADDON_INSTALL) {
    Download.start();
    console.log(Logs.GetStringFromName('extName') + ' ' + Logs.GetStringFromName('extInstall'));
  }
//Remove useless files after update.
//升级后删除无用的文件。
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

// Only delete soWatch folder when uninstalled.
// 仅在卸载时才删除soWatch文件夹。
function uninstall(data, reason) {
  if (reason == ADDON_UNINSTALL) {
    FileIO.delFolder();
    Preferences.remove();
    console.log(Logs.GetStringFromName('extName') + ' ' + Logs.GetStringFromName('extUninstall'));
  }
}
