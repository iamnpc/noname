const {classes: Cc, interfaces: Ci, results: Cr, utils: Cu} = Components;
Cu.import("resource:///modules/CustomizableUI.jsm"); //Require Gecko 29 and later
Cu.import('resource://gre/modules/osfile.jsm'); //Require Gecko 27 and later
Cu.import('resource://gre/modules/Downloads.jsm'); //Require Gecko 26 and later
Cu.import('resource://gre/modules/NetUtil.jsm'); //Promise chain that require Gecko 25 and later

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
  path: function () {
    return OS.Path.toFileURI(this.extDir) + '/';
  },
// Add your domain here.
// 在这里添加你的服务器，
  google: 'https://haoutil.googlecode.com/svn/trunk/player/testmod/',
  guodafanli: 'http://opengg.guodafanli.com/swf/kafan/',
};
var aURI = FileIO.path();
var aURL_google = FileIO.google;
var aURL_github = FileIO.guodafanli;

var Services = {
  obs: Cc['@mozilla.org/observer-service;1'].getService(Ci.nsIObserverService),
  sss: Cc['@mozilla.org/content/style-sheet-service;1'].getService(Ci.nsIStyleSheetService),
  io: Cc["@mozilla.org/network/io-service;1"].getService(Ci.nsIIOService),
  strings: Cc["@mozilla.org/intl/stringbundle;1"].getService(Ci.nsIStringBundleService),
  prefs: Cc['@mozilla.org/preferences-service;1'].getService(Ci.nsIPrefService).QueryInterface(Ci.nsIPrefBranch),
};

// User preferences to toggle functions.
// 设置用户参数以实现各种功能的开关
var PrefBranch = {
  'autoupdate': Services.prefs.getBranch('extensions.sowatchmk2.autoupdate.'),
};
var PrefValue = {
 'enable': {
    get: function () {
      return PrefBranch['autoupdate'].getBoolPref('enable');
    },
    set: function () {
      PrefBranch['autoupdate'].setBoolPref('enable', false);
    },
  },
  'lastdate': {
    get: function () {
      return PrefBranch['autoupdate'].getIntPref('lastdate');
    },
    set: function () {
      PrefBranch['autoupdate'].setIntPref('lastdate', Date.now() / 1000);
    },
  },
  'period': {
    get: function () {
      return PrefBranch['autoupdate'].getIntPref('period');
    },
    set: function () {
      PrefBranch['autoupdate'].setIntPref('period', 7);
    },
  },
};
var Preferences = {
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
// Observe preference changes
// 监视参数变化
  observe: function (aSubject, aTopic, aData) {
    if (aTopic != 'nsPref:changed') return;
    this.pending();
  },
// If use_remote is true set autoupdate to false.If autoupdate is false,then do nothing.
// 当use_remote为true时将autoupdate设为false的，如果autoupdate为false的话则不自动更新。
  manifest: function () {
    var aUpdate = PrefValue['enable'].get();
    if (aUpdate == false) return;
    var aDate = PrefValue['lastdate'].get();
    var aPeriod = PrefValue['period'].get();
    if (aDate + aPeriod * 86400 > Date.now() / 1000) return; // 如果当前时间>上一次检查时间与更新周期的和则不更新。
    PrefValue['lastdate'].set(); // 更新完毕后将现在的时间写入上次更新时间。
    Download.start();
  },
};

// Localize debugging console logs to help improve user experience.
// 本地化Debug控制台记录以方便改善用户体验。
var aLocale = {
  string: Services.strings.createBundle('chrome://sowatchmk2/locale/global.properties?' + Math.random()),
  extName: function () {
    return this.string.GetStringFromName('extension_name');
  },
  extTooltip: function () {
    return this.string.GetStringFromName('extension_tooltip');
  },
  extInstall: function () {
    return this.string.GetStringFromName('extension_install');
  },
  extUninstall: function () {
    return this.string.GetStringFromName('extension_uninstall');
  },
  localOutofdate: function () {
    return this.string.GetStringFromName('local_file_out_of_date');
  },
  localCurrupted: function () {
    return this.string.GetStringFromName('local_file_currupted');
  },
  localReady: function () {
    return this.string.GetStringFromName('local_file_ready');
  },
  localNotexsit: function () {
    return this.string.GetStringFromName('local_file_not_exsit');
  },
  remoteDownloaded: function () {
    return this.string.GetStringFromName('remote_file_downloaded');
  },
  remoteTimeout: function () {
    return this.string.GetStringFromName('remote_file_time_out');
  },
  remoteAccessfailed: function () {
    return this.string.GetStringFromName('remote_file_access_failed');
  },
  remoteDownfailed: function () {
    return this.string.GetStringFromName('remote_file_download_failed');
  },
  remoteInterrupted: function () {
    return this.string.GetStringFromName('remote_file_download_interrupted');
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
  check: function (aLink, aFile) {
    var aClient = Cc['@mozilla.org/xmlextras/xmlhttprequest;1'].createInstance(Ci.nsIXMLHttpRequest);
    aClient.open('HEAD', aLink, true);
    aClient.timeout = 30000;
    aClient.ontimeout = function () {
      console.log(aLink + '\n' + aLocale.remoteTimeout());
    }
    aClient.send();
    aClient.onload = function () {
      var aDate = new Date(aClient.getResponseHeader('Last-Modified'));
      var aSize = new Number(aClient.getResponseHeader('Content-Length'));
      OS.File.stat(aFile).then(function onSuccess(info) {
        if (aSize == null || aSize < 10000) {
          console.log(aLink + '\n' + aLocale.remoteAccessfailed());
        } else if (aDate > info.lastModificationDate) {
          console.log(aFile + '\n' + aLocale.localOutofdate());
          Download.fetch(aLink, aFile, aSize);
        } else if (aSize != info.size) {
          console.log(aFile + '\n' + aLocale.localCurrupted());
          Download.fetch(aLink, aFile, aSize);
        } else {
          console.log(aFile + '\n' + aLocale.localReady());
        }
      }, function onFailure(reason) {
        if (reason instanceof OS.File.Error && reason.becauseNoSuchFile) {
          console.log(aFile + '\n' + aLocale.localNotexsit());
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
          console.log(aLink + '\n' + aLocale.remoteDownloaded());
          OS.File.move(aTemp, aFile);
        } else {
          console.log(aLink + '\n' + aLocale.remoteInterrupted());
          OS.File.remove(aTemp);
          Download.fetch(aLink, aFile, aSize);
        }
      });
    }, function onFailure() {
      console.log(aLink + '\n' + aLocale.remoteDownfailed());
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

// Player Rules: You can delete ['remote'] if you don't like to keep synchronize.
// 播放器规则： 删除['remote']项后将不能进行播放器的更新了.
var PlayerRules = {
/**  -------------------------------------------------------------------------------------------------------  */
  'youku_loader': {
    'object': aURI + 'loader.swf',
    'remote': aURL_google + 'loader.swf',
    'target': /http:\/\/static\.youku\.com\/.*\/v\/swf\/loaders?\.swf/i
  },
  'youku_player': {
    'object': aURI + 'player.swf',
    'remote': aURL_google + 'player.swf',
    'target': /http:\/\/static\.youku\.com\/.*\/v\/swf\/q?player.*\.swf/i
  },
/**  -------------------------------------------------------------------------------------------------------  */
  'tudou_portal': {
    'object': aURI + 'tudou.swf',
    'remote': aURL_google + 'tudou.swf',
    'target': /http:\/\/js\.tudouui\.com\/bin\/lingtong\/PortalPlayer.*\.swf/i
  },
  'tudou_olc': {
    'object': 'http://js.tudouui.com/bin/player2/olc.swf',
    'target': /http:\/\/js\.tudouui\.com\/bin\/player2\/olc.+\.swf/i
  },
  'tudou_social': {
    'object': aURI + 'sp.swf',
    'remote': aURL_google + 'sp.swf',
    'target': /http:\/\/js\.tudouui\.com\/bin\/lingtong\/SocialPlayer.*\.swf/i
  },
/**  -------------------------------------------------------------------------------------------------------  */
  'iqiyi5': {
    'object': aURI + 'iqiyi5.swf',
    'remote': aURL_google + 'iqiyi5.swf',
    'target': /http:\/\/www\.iqiyi\.com\/common\/flashplayer\/\d+\/MainPlayer.*\.swf/i
  },
  'iqiyi_out': {
    'object': aURI + 'iqiyi_out.swf',
    'remote': aURL_google + 'iqiyi_out.swf',
    'target': /https?:\/\/www\.iqiyi\.com\/(common\/flash)?player\/\d+\/(Share)?Player.*\.swf/i
  },
/**  -------------------------------------------------------------------------------------------------------  */
  'pps': {
    'object': aURI + 'iqiyi.swf',
    'remote': aURL_google + 'iqiyi.swf',
    'target': /http:\/\/www\.iqiyi\.com\/common\/flashplayer\/\d+\/PPSMainPlayer.*\.swf/i
  },
  'pps_out': {
    'object': aURI + 'pps.swf',
    'remote': aURL_google + 'pps.swf',
    'target': /http:\/\/www\.iqiyi\.com\/player\/cupid\/common\/pps_flvplay_s\.swf/i
  },
/**  -------------------------------------------------------------------------------------------------------  */
  'letv': {
    'object': aURI + 'letv.swf',
    'remote': aURL_google + 'letv.swf',
    'target': /http:\/\/.*\.letv(cdn)?\.com\/.*(new)?player\/((SDK)?Letv|swf)Player\.swf/i
  },
  'letv_skin': {
    'object': 'http://player.letvcdn.com/p/201407/24/15/newplayer/1/SSLetvPlayer.swf',
    'target': /http:\/\/player\.letvcdn\.com\/p\/((?!15)\d+\/){3}newplayer\/1\/S?SLetvPlayer\.swf/i
  },
/**  -------------------------------------------------------------------------------------------------------  */
  'sohu': {
    'object': aURI + 'sohu_live.swf',
    'remote': aURL_google + 'sohu_live.swf',
    'target': /http:\/\/(tv\.sohu\.com\/upload\/swf\/(p2p\/)?\d+|(\d+\.){3}\d+\/webplayer)\/Main\.swf/i
  },
/**  -------------------------------------------------------------------------------------------------------  */
  'pptv': {
    'object': aURI + 'pptv.in.Ikan.swf',
    'remote': aURL_github + 'pptv.in.Ikan.swf',
    'target': /http:\/\/player.pplive.cn\/ikan\/.*\/player4player2\.swf/i
  },
  'pptv_live': {
    'object': aURI + 'pptv.in.Live.swf',
    'remote': aURL_github + 'pptv.in.Live.swf',
    'target': /http:\/\/player.pplive.cn\/live\/.*\/player4live2\.swf/i
  },
/**  -------------------------------------------------------------------------------------------------------  */
  '17173': {
    'object': aURI + '17173.in.Vod.swf',
    'remote': aURL_github + '17173.in.Vod.swf',
    'target': /http:\/\/f\.v\.17173cdn\.com\/\d+\/flash\/Player_file\.swf/i
  },
  '17173_out': {
    'object': aURI + '17173.out.Vod.swf',
    'remote': aURL_github + '17173.out.Vod.swf',
    'target': /http:\/\/f\.v\.17173cdn\.com\/(\d+\/)?flash\/Player_file_(custom)?out\.swf/i
  },
  '17173_live': {
    'object': aURI + '17173.in.Live.swf',
    'remote': aURL_github + '17173.in.Live.swf',
    'target': /http:\/\/f\.v\.17173cdn\.com\/\d+\/flash\/Player_stream(_firstpage)?\.swf/i
  },
  '17173_live_out': {
    'object': aURI + '17173.out.Live.swf',
    'remote': aURL_github + '17173.out.Live.swf',
    'target': /http:\/\/f\.v\.17173cdn\.com\/\d+\/flash\/Player_stream_(custom)?Out\.swf/i
  },
/**  -------------------------------------------------------------------------------------------------------  */
  'ku6': {
    'object': aURI + 'ku6_in_player.swf',
    'remote': aURL_github + 'ku6_in_player.swf',
    'target': /http:\/\/player\.ku6cdn\.com\/default\/(\w+\/){2}\d+\/player\.swf/i
  },
  'ku6_out': {
    'object': aURI + 'ku6_out_player.swf',
    'remote': aURL_github + 'ku6_out_player.swf',
    'target': /http:\/\/player\.ku6cdn\.com\/default\/out\/\d+\/player\.swf/i
  },
};
// Filter Rules: May work for most site.
// 过滤规则： 大多数网站都能正常工作。
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
  'duowan': {
    'object': 'http://yuntv.letv.com/bcloud.swf',
    'target': /http:\/\/assets\.dwstatic\.com\/video\/vppp\.swf/i
  },
};
//Referer rule： Help resolve problems with HTTP Referer.
//引用头规则： 用于解决HTTP引用头导致的问题。
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

var Observers = {
  prefsOn: function () {
    for (var i in PrefBranch) {
       var rule = PrefBranch[i];
       rule.addObserver('', Preferences, false);
    }
  },
  prefsOff: function () {
    for (var i in PrefBranch) {
       var rule = PrefBranch[i];
       rule.removeObserver('', Preferences);
    }
  },
  httpOn: function () {
    Services.obs.addObserver(HttpChannel, 'http-on-examine-response', false);
    Services.obs.addObserver(HttpChannel, 'http-on-modify-request', false);
  },
  httpOff: function () {
    Services.obs.removeObserver(HttpChannel, 'http-on-examine-response', false);
    Services.obs.removeObserver(HttpChannel, 'http-on-modify-request', false);
  },
};

// Enable Add-on. Keep soWatch folder alive. Add Toolbar icon，Check for autoupdate preferences.
// 启用扩展，添加工具栏图标，确保soWatch文件夹一定存在，并检查自动更新参数。
function startup(data, reason) {
  FileIO.addFolder();
  Toolbar.addIcon();
  HttpChannel.iQiyi();
  Preferences.pending();
  Observers.prefsOn();
  Observers.httpOn();
}

function shutdown(data, reason) {
  Toolbar.removeIcon();
  Observers.prefsOff();
  Observers.httpOff();
}

// Run download at once after installed and set default autoupdate preferences.
// 安装扩展后立即下载播放器并设置默认的自动更新参数。
function install(data, reason) {
  if (reason == ADDON_INSTALL) {
    Download.start();
    console.log(aLocale.extName() + ' ' + aLocale.extInstall());
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
    console.log(aLocale.extName() + ' ' + aLocale.extUninstall());
  }
}
