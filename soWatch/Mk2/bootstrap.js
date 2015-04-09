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

// Localizable debugging logs to improve user experience
// 本地化Debug记录用于改善用户体验
var aLocale = Services.prefs.getComplexValue('general.useragent.locale', Ci.nsISupportsString).data;
var Logs = {
  'en-US': {
    extName: 'soWatch! mk2',
    extTooltip: 'Run update check now...',
    extInstall: 'has been installed...',
    extUninstall: 'has been uninstalled...',
    localOutofDate: 'is out of date',
    localCurrupted: 'may be corrupted',
    localReady: 'is ready to serve',
    localFileNotExsit: 'is not exist',
    remoteDownloaded: 'download session complete',
    remoteTimeOut: 'no response from remote server',
    remoteAccessFailed: 'failed to access remote file',
    remoteFetchFailed: 'failed to download remote file',
    remoteConnectInterrupted: 'download session has been interrupted due to unknown error',
  },
  'ja': {
    extName: 'soWatch! Mk2',
    extTooltip: '\u66F4\u65B0\u30C1\u30A7\u30C3\u30AF\u3092\u5B9F\u884C\u3059\u308B',
    extInstall: '\u304C\u30A4\u30F3\u30B9\u30C8\u30FC\u30EB\u3055\u308C\u307E\u3057\u305F',
    extUninstall: '\u304C\u30A2\u30F3\u30A4\u30F3\u30B9\u30C8\u30FC\u30EB\u3055\u308C\u307E\u3057\u305F',
    localOutofDate: '\u306E\u6700\u65B0\u7248\u304C\u767A\u898B\u3057\u307E\u3057\u305F',
    localCurrupted: '\u304C\u58CA\u308C\u3066\u3044\u308B\u53EF\u80FD\u6027\u304C\u3042\u308A\u307E\u3059',
    localReady: '\u306F\u6E96\u5099\u3067\u304D\u307E\u3057\u305F',
    localFileNotExsit: '\u304C\u5B58\u5728\u3057\u307E\u305B\u3093',
    remoteDownloaded: '\u30C0\u30A6\u30F3\u30ED\u30FC\u30C9\u5B8C\u4E86\u3057\u307E\u3057\u305F',
    remoteTimeOut: '\u30EA\u30E2\u30FC\u30C8\u30B5\u30FC\u30D0\u30FC\u304C\u5FDC\u7B54\u3057\u3066\u304A\u308A\u307E\u305B\u3093',
    remoteAccessFailed: '\u3078\u306E\u30A2\u30AF\u30BB\u30B9\u304C\u3067\u304D\u307E\u305B\u3093',
    remoteFetchFailed: '\u30C0\u30A6\u30F3\u30ED\u30FC\u30C9\u304C\u5931\u6557\u3057\u307E\u3057\u305F',
    remoteConnectInterrupted: '\u30C0\u30A6\u30F3\u30ED\u30FC\u30C9\u4E2D\u306B\u4E0D\u660E\u306A\u30A8\u30E9\u30FC\u304C\u767A\u751F\u3057\u307E\u3057\u305F',
  },
  'zh-CN': {
    extName: 'soWatch! Mk2',
    extTooltip: '\u7ACB\u5373\u68C0\u67E5\u66F4\u65B0',
    extInstall: '\u5DF2\u7ECF\u6210\u529F\u5B89\u88C5',
    extUninstall: '\u5DF2\u7ECF\u6210\u529F\u79FB\u9664',
    localOutofDate: '\u5DF2\u627E\u5230\u66F4\u65B0\u7248\u672C',
    localCurrupted: '\u6587\u4EF6\u53EF\u80FD\u5DF2\u7ECF\u635F\u574F',
    localReady: '\u6587\u4EF6\u5DF2\u7ECF\u5C31\u4F4D',
    localFileNotExsit: '\u6587\u4EF6\u4E0D\u5B58\u5728',
    remoteDownloaded: '\u4E0B\u8F7D\u5DF2\u5B8C\u6210',
    remoteTimeOut: '\u8FDC\u7A0B\u670D\u52A1\u5668\u6CA1\u6709\u54CD\u5E94',
    remoteAccessFailed: '\u65E0\u6CD5\u8BBF\u95EE\u8FDC\u7A0B\u6587\u4EF6',
    remoteFetchFailed: '\u65E0\u6CD5\u4E0B\u8F7D\u8FDC\u7A0B\u6587\u4EF6',
    remoteConnectInterrupted: '\u56E0\u672A\u77E5\u539F\u56E0\u5BFC\u81F4\u4E0B\u8F7D\u4E2D\u65AD',
  },
};
if (!Logs[aLocale]) {
  console.log('Your locale is not supported');
}
var aLog = Logs[aLocale] || Logs['en-US'];

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
      return PrefBranch.getCharPref('autoupdate.directory');
    },
    set: function () {
      PrefBranch.setCharPref('autoupdate.directory', OS.Path.join(OS.Constants.Path.profileDir, 'soWatch'));
    },
  },
  'hosting': {
    get: function () {
      return PrefBranch.getCharPref('autoupdate.hosting.user_defined');
    },
    set: function () {
      PrefBranch.setCharPref('autoupdate.hosting', 'chrome://sowatchmk2/content/'); //用户设定catcat520所修改的播放器服务器
    },
  },
 'override': {
    get: function () {
      return PrefBranch.getBoolPref('autoupdate.hosting.override');
    },
    set: function () {
      PrefBranch.setBoolPref('autoupdate.hosting.override', false);
    },
  },
  'bitbucket': {
    get: function () {
      return PrefBranch.getCharPref('autoupdate.hosting.bitbucket');
    },
    set: function () {
      PrefBranch.setCharPref('autoupdate.hosting.bitbucket', 'https://bitbucket.org/kafan15536900/haoutil/src/master/player/testmod/');
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
// If access_remote is true set autoupdate to false.If autoupdate is false,then do nothing.
// 当access_remote为true时将autoupdate设为false的，而autoupdate为false的话则不自动更新。
  manifest: function () {
    PrefValue['bitbucket'].set();  // 用户无权修改bitbucket的链接,否则将导致功能出错
    for (var i in RuleResolver) {
      var rule = RuleResolver[i];
      if (rule.playerOn) rule.playerOn();
      if (rule.filterOn) rule.playerOn();
      if (rule.refererOn) rule.refererOn();
    }
    var aRemote = PrefValue['remote'].get();
    if (aRemote == true) return PrefValue['autoupdate'].set(); // 使用远程服务器的时候强制停止自动更新
    var aUpdate = PrefValue['autoupdate'].get();
    if (aUpdate == false) return;
    var aDate = PrefValue['lastdate'].get();
    var aPeriod = PrefValue['period'].get();
    if (aDate + aPeriod * 86400 > Date.now() / 1000) return; // 如果当前时间>上一次检查时间与更新周期的和则不更新。
    PrefValue['lastdate'].set(); // 更新完毕后将现在的时间写入上次更新时间。
    Download.start();
  },
};

var FileIO = {
// You can customize the dir name to store .swf files
// 你可以自行修改保存 .swf 文件的文件夹名字。
  extDir: function () {
    return PrefValue['directory'].get();
  },
  addFolder: function () {
    OS.File.makeDir(this.extDir());
  },
  delFolder: function () {
    OS.File.removeDir(this.extDir());
  },
// Now bytebucket.org for 15536900's work and other for catcat520.
// 现在使用bytebucket.org链接访问15536900修改的播放器,其他的则读取用户设置
  link: function (aMod) {
    var aOver = PrefValue['override'].get();
    if (aOver == true) return PrefValue['hosting'].get(); //当强制使用用户设置后将只返回用户设置的链接
    for (var i in RuleResolver) {
      if (aMod === RuleResolver[i]) {
        if (i == 'pptv' || i == '17173' || i == 'ku6') return PrefValue['hosting'].get(); // 默认状况下17173,pptv,ku6等在bitbucket上并未有储存的播放器将由用户自己寻找host
        return PrefValue['bitbucket'].get(); 
      }
    }
  },
  path: function () {
    return OS.Path.toFileURI(this.extDir()) + '/';
  },
};

var Toolbar = {
// Embedded style sheet
// 内置样式表
  css: Services.io.newURI('data:text/css;base64,QC1tb3otZG9jdW1lbnQgdXJsKCJjaHJvbWU6Ly9icm93c2VyL2NvbnRlbnQvYnJvd3Nlci54dWwiKSB7DQogICNzb3dhdGNobWsyLWJ1dHRvbiB7DQogICAgbGlzdC1zdHlsZS1pbWFnZTogdXJsKGRhdGE6aW1hZ2UvcG5nO2Jhc2U2NCxpVkJPUncwS0dnb0FBQUFOU1VoRVVnQUFBQkFBQUFBUUNBWUFBQUFmOC85aEFBQUFCbUpMUjBRQS93RC9BUCtndmFlVEFBQUFDWEJJV1hNQUFBc1RBQUFMRXdFQW1wd1lBQUFBQjNSSlRVVUgzd01SQ3pZRUFwMzAvUUFBQW5CSlJFRlVPTXV0azB0SWxGRVVnTDl6LzErWlJtVWNhM0lNZ3A0a1BhQ0NKRU9VSU1xRkxRcUxwRVVQYTFPMDZVRUxTM3M0UVJ1aFFCQWtJWVdnTENzMzViZ3dSU0t5eHN5aXRCZVJVR3BtVG1aanp2L2ZGdk5QS0ZJUWRIZm4zSHMrN25jNEIvN24wV2N5WnV0VEdmbi9VaU9UZzhvOGM4L3U3TFFhZDZLS0pWTFNtem42NUJaYVB4Q2xRbjhGNkZKL05rSWJHdFBKQUJaRXh5RVFCbmdKckJPUjRja0EweWxlQXR4SC84YnhsTVc4bWx1RVphYXdIUmhvdXBnNSszWDlXMzA4T1V2T2o3NmE4b09PWFo3WEMzMkpDNzF1QTRBUmJ5WlZ5MXJJbmdkcFNWRFRxcWtvRWdiTFYrT2IrQWkyblM3bEF3TUFDcUNyNzBlOU45a0VPMmJrR1FveDlPZ2VKNjVyRHRacUhyK0g0RE1iYjI2eG8yWlVUbEVvemtsN2d3Vm93ZEpDTS9tMFdYa2tKY1llMlZhVWtXOFdwdUcwekpiQ09FQTV5a3VkQzVRMVJ2N1pxNlRLRjZLUlVheng3NHlGdjdJeHl3WGROeDNyR0VpWCtjWHBPS01JWUlNa3VPRGFmaHBLcXJsME4wSmtRck56dlE5UFp5MzBoVUM3QUszMVNmOVhPZjBwTlE3b2ZQZDVuUGxlTjBRTmVOcUl1LzhGaDlidUJkTUZEWTNRMHdUaWp2VkpFRVJ2bWpJSE56YTdkZTZDWkdiTlNIRGtOSWdOYURRRzNmWktKblFpcTFRSEFYWG1RbEFYaElBdUZRZDhHUDY1b2kvOHN5NGVoOFhEc0RXVENjdEZ2elVIUXl3R1RkL2xXclZuZVZBWGVOb0Q2YlhBWVptMkR5VVpEeEZqemJIQmZlUjdld21xTFd5enIxQ3REckJJOVpUZjFvWFB4YmJ2b0ZRUkVGVFRaanZ3TVF2RFBqZGlwL1JXMVRYTUdwS1pOU3ZOamlNamt0cmJxamVzRUMwOUtLT2lQZUN2YWcvNDM4cWZ0aXlucEQrZ3JVaXBHSzR5NEJUUUFwd0F0Z0k3Z0c2ZzhSZGw1K3R3Zm9GWThnQUFBQUJKUlU1RXJrSmdnZz09KTsNCiAgfQ0KICAjc293YXRjaG1rMi1idXR0b25bY3VpLWFyZWF0eXBlPSJtZW51LXBhbmVsIl0sDQogICAgdG9vbGJhcnBhbGV0dGVpdGVtW3BsYWNlPSJwYWxldHRlIl0gPiAjc293YXRjaG1rMi1idXR0b24gew0KICAgIGxpc3Qtc3R5bGUtaW1hZ2U6IHVybChkYXRhOmltYWdlL3BuZztiYXNlNjQsaVZCT1J3MEtHZ29BQUFBTlNVaEVVZ0FBQUNBQUFBQWdDQVlBQUFCemVucjBBQUFBQm1KTFIwUUEvd0QvQVArZ3ZhZVRBQUFBQ1hCSVdYTUFBQXNUQUFBTEV3RUFtcHdZQUFBQUIzUkpUVVVIM3dNUkN6VXU4Z3R1NkFBQUJrcEpSRUZVV01QdGwydHdYR1VaeDMvUE9XY3ZaTnNRU0RaSlU1aHBzQUtWUzNBWU81M01Wb0oyUWllTTFCbGJSNWw2b3dvcTJEQ09GeVFtcFFtaFZyRTZDTU9NbzROYUhJTFNVbWM2Q0pNV3dTNmxJNWNTNlFWb0xkaVdrTTJ0dVd5eTJUMTczc2NQWjVOc21tMGlvdzVmZkQrZDgxN084Mzh1Ly8vekh2ai8rSUNIekxYb05sVTBPclpjQ3d5aTV2ZlMxdnNTZ0drdXYxaU5HYlhiKzRmK3B3QWV1aTZnYTJxS1dWd1N5TTFvQXFRaTl6SXVyVDJSL3hTQU5kZmlWWXZDSFpGZy9wWXA0NkNtU0hmZU1hcERKL3RWOVlpcWVVUlY2LzhyRVVqZWJsdVIwbWduOElrNVQ2dUJ6RGdzV1FHM1BnVldBS0FQV0NzaWYzM2ZBTFM1UWxDOUVNczZBUlRQZlZSQmpQODRrWVMyQVFpY2w3K2hWVVEyelFmQXlYL0paa3pJQ2RudkFBdk9EZGx3SWwzSzRiRmlldDBnQnFHcVBNcU5rOGFUQ1hqMFpvaGUxcUxQM0NOeXd6MHQvellBSjJRL1A1ZnhyRm84TWJDVXhiRzFYRkRkZ0FsK0dGZWdPRERPV0JvaUlSaHpoUmQ2enFlK1p3Y1ltcldsOG9aMHNxODJ2TTN6NWl4QzNWejVPU3haZm03UGxUMTZMZldiZG5LZ3BKR3VzYVdVUk9DaVl1aWJLS0pwaDNLMEd5SVhsTFA4bXc5eU5Ga01ZZ0VzRHkySUhwcVhCVTkxalc3WjF0bkhucVBKd3FWcGxOVU45VHg4SU1xVEx5dlZVV0ZKS1ZRVXcwY1dRODhJM0wxRDZSdUJrdklxN0xwdkExTk9YNjdORmZmUFdZUVBySFIrcmtqanQrcEtFUUdNQlpZNXErNWN2cnBnUDI5ekthNm5SRUlRdEdGd0RJSU9xRUpEamZDZDFUQTJrU0c0cVp4QU9GY2JLbmlaZExHemRYQzBZQVEyN3N2ZTJYREZnb2ZFOGpkakNzRjEyRGIrYVF3UXNDR1RoV1RhTnc0Z2x2RGNvWEVBSXVFZ2R2U1M2Yk9laFIwT05zNHBSRXZMUTVlaU9RQjZkaDRNZTZTQkc2MlhzZERDQ2ZVOGtzbDAzc2V6TTFpTGtjL09wNFFycHpibjJlalBuc2V2QnE2bXErcG16TVFvYWdxRVJ3UTNOY3ppVW50NmJ1Q2RtUUNVcStZREVKN3B0QitGODhQQ0xROTJjdnN0cThnWUd6YzVnSEhUSUFJaXFQRndrMmZ3WEpmNmEzSTVQN1lIN09CcyticXBTQXJUOElmbDViTkQ2aThIVW9OWXAxOGg3RURqVFNWa1BNaW1Sc2dNSjhnTTkrS09EcURaREl1aVJYeHBaYTV4UGZ0anNIUFBadHBQcllsVUZ3U1FIWjRZeU9kOFh0NGdFSVkvZmgyQTliVU9UZXZLc0lKaE1wNU54aE5TWHBDVlY1ZndlT05DLzF6WDQzRHFsVHdGazBuT3FZajlEMjJwN0N2Y0Mxb3Fwek9meWN0bDBQTTVka2t0ZkhubjFQU0pQcDhKMVZFSVRXcnE4YjN3eURwd1F0TlI5SEptQXNaM1NzemQwcGJZVWdqQWEwRE5RREpMYVNqc0c1M2NGZkQ4a0VSS1ljMVA0YkxWTTlNMWZCbzY3NFZYTzZhYmtoSElubFZtUWU4OWFlMnBLdGdMZ0dlQm11MS9HK0xPdWdxbVdLU0FhL3NneGdaaCszb2ZWRldONzJuL2NSanBnV0JrMm5pKzU1TWpZRERHckppREJmcUg0NzFwVk9IZG9jeXM3a3ZHOWoyeWduN3Y3emtDcHcvQ3hLaHZITWg0SVg3cjNzcXZ6VGRtSG5jTVdiVStkcDIrZmlyV2xKQllVMEptQVpEV3hJSGhsSG5Yc1lTanZhbHo5QVFCMS9MQnVEbEFydTIvWjJ6d2hBQXVRWEtDWkNsRGdZWGo5YnIvcGV2MTFZNWNsRjhIWG96ZDFSMmNkU1U3MWpPeEhOaDc1TDAwUmt4aHdjdHBvYWNXeGxpZ1lCQzhuRDhCU1JPdzBoRDBNamplVHo1bG5yOXlncUlhMERYeDlvcnJVVjBMWElGdGYyZ1dnTTgvays3ZXVNOWQxYmpQRmJYTTVobFJzSlMwRStDWGNnY0pLdW1RTC9JQ0g4ZkY0VVZpUENwZjRSQTEyT0t4aTNYdDB0b1RpbmxkVzRFTndKa3Bmb3NVQVNsZ1RPYTdNbW56b2o1Y3E4eXZZR1gzb1RHMkxudUxqYnFWaTgxSmZtYjlnRHJ0cEVZUE1pNFI3cFBOZkliSDZMZWlmK3JVMVY4RGFSTDREZW5NbXdTRERpTFhnRzRBZHNYYkszYzU4OTRhTlZ1RDQ1d21hd2tJYi9mNzNlN0tNNCt4ckF3KzZUMk5oVkpMbkl3RzZKQXZjRktYRUNKZEo4Z1c0SHZ4OXNyQldGUFA1Y0J0d0pra3FRMnZ0VmQ3ODE3TEFlVGV2bTdJWGtUQXZJVXFaUXQ5Z1huNjczMnRUMVN2RDc4cHkvNmNzc09IY2N3cFk0dXhKWXR0ZVNtYmJEOUlOU29yWWsySktwQy9nT3lPdDFlMFRocWY5OGRrRmdHYXl6KzZ2N2MwZGxmWmN3L0UyeXNrMXBTd2dUWmdKTjVlOGFOWVV5SUN4SUUzZ0RpcXV4RjVFdVVYQ0E4RHE0RERPZjB4d0pEMWZnQlliYjBIdjMvaDNnN2dXTzEzMzVqVTZoUXdrcWNXQTZpbWdJbjRmWlgvUlBVMmhHYWdHOWdFYkFkK0I5d1BMUHJBZjA3L0JmakdpbDN2NG12RkFBQUFBRWxGVGtTdVFtQ0MpOw0KICB9DQp9', null, null),
// Add Toolbar button
// 添加工具栏按钮
  addIcon: function () {
    CustomizableUI.createWidget({
      id: 'sowatchmk2-button',
      defaultArea: CustomizableUI.AREA_NAVBAR,
      label: aLog.extName,
      tooltiptext: aLog.extName + ':\n' + aLog.extTooltip,
      onCommand: function () {
        var aRemote = PrefValue['remote'].get();
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
      console.log(aName + ' ' + aLog.remoteTimeOut);
    }
    aClient.send();
    aClient.onload = function () {
      var aSize = new Number(aClient.getResponseHeader('Content-Length'));
      if (aSize < 10000) return console.log(aName + ' ' + aLog.remoteAccessFailed);
      var aDate = new Date(aClient.getResponseHeader('Last-Modified'));
      OS.File.stat(aFile).then(function onSuccess(info) {
        if (aDate > info.lastModificationDate) {
          console.log(aName + ' ' + aLog.localOutofDate);
          Download.fetch(aLink, aFile, aName, aSize);
        } else if (aSize != info.size) {
          console.log(aName + ' ' + aLog.localCurrupted);
          Download.fetch(aLink, aFile, aName, aSize);
        } else {
          console.log(aName + ' ' + aLog.localReady);
        }
      }, function onFailure(reason) {
        if (reason instanceof OS.File.Error && reason.becauseNoSuchFile) {
          console.log(aName + ' ' + aLog.localFileNotExsit);
          Download.fetch(aLink, aFile, aName, aSize);
        }
      });
    }
  },
// Download remote file with _sw as temp file, then check and overwrite.
// 下载远程文件至 _sw 临时文件,然后检查下载的文件是否完整,再覆盖文件
  fetch: function (aLink, aFile, aName, aSize) {
    var aTemp = aFile + '_sw';
    Downloads.fetch(aLink, aTemp, {
      isPrivate: true
    }).then(function onSuccess() {
      OS.File.stat(aTemp).then(function onSuccess(info) {
        if (aSize == info.size) {
          console.log(aName + ' ' + aLog.remoteDownloaded);
          OS.File.move(aTemp, aFile);
        } else {
          console.log(aName + ' ' + aLog.remoteConnectInterrupted);
          OS.File.remove(aTemp);
          Download.fetch(aLink, aFile, aName, aSize);
        }
      });
    }, function onFailure() {
      console.log(aName + ' ' + aLog.remoteFetchFailed);
      OS.File.remove(aTemp);
    });
  },
// Start download
// 开始下载
  start: function () {
    FileIO.addFolder();  // 即使文件夹不存在也能自动创建避免出错
    for (var i in PlayerRules) {
      var rule = PlayerRules[i];
      if (!rule['remote']) continue;
      var aLink = rule['remote'];
      var aFile = OS.Path.fromFileURI(rule['object']);
      var aName = OS.Path.split(aFile).components[OS.Path.split(aFile).components.length - 1];
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
  getRemoteObject: function (rule, callback) {
    NetUtil.asyncFetch(rule['remote'], function (inputStream, status) {
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
    var aRemote = PrefValue['remote'].get();

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
          if (aRemote == true) {
          this.getRemoteObject(rule, function () {
            httpChannel.resume();
            if (typeof rule['callback'] === 'function') rule['callback'].apply(fn, args);
          });
          } else {
          this.getObject(rule, function () {
            httpChannel.resume();
            if (typeof rule['callback'] === 'function') rule['callback'].apply(fn, args);
          });
          }
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
function startup(aData, aReason) {
  RuleExecution.iqiyi();
  Toolbar.addIcon();
  Preferences.pending();
  Observers.startUp();
}

function shutdown(aData, aReason) {
  Toolbar.removeIcon();
  Observers.shutDown();
}

// Run download session after installed
// 安装扩展后立即下载播放器
function install(aData, aReason) {
  if (aReason == ADDON_INSTALL) {
    Download.start();
    console.log(aLog.extName + ' ' + aLog.extInstall)
  }
//Remove useless files after update.
//升级后删除无用的文件。
/*
  if (aReason == ADDON_UPGRADE) {
    OS.File.remove(OS.Path.join(aPath, '56.in.NM.swf'));
    OS.File.remove(OS.Path.join(aPath, '56.in.TM.swf'));
    OS.File.remove(OS.Path.join(aPath, 'sohu.inyy.Lite.swf'));
    OS.File.remove(OS.Path.join(aPath, 'sohu.injs.Lite.swf'));
    OS.File.remove(OS.Path.join(aPath, 'sohu.inbj.Live.swf'));
    OS.File.remove(OS.Path.join(aPath, 'sohu.inyy+injs.Lite.s1.swf'));
    OS.File.remove(OS.Path.join(aPath, '17173.in.Vod.swf'));
    OS.File.remove(OS.Path.join(aPath, '17173.out.Vod.swf'));
    OS.File.remove(OS.Path.join(aPath, '17173.in.Live.swf'));
    OS.File.remove(OS.Path.join(aPath, '17173.out.Live.swf'));
  }
*/
}

// Only delete soWatch folder when uninstalled.
// 仅在卸载时才删除soWatch文件夹。
function uninstall(aData, aReason) {
  if (aReason == ADDON_UNINSTALL) {
    FileIO.delFolder();
    Preferences.remove();
    console.log(aLog.extName + ' ' + aLog.extUninstall)
  }
}
