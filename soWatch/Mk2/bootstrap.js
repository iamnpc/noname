"use strict";

const {classes: Cc, interfaces: Ci, results: Cr, utils: Cu} = Components;
Cu.import("resource:///modules/CustomizableUI.jsm"); //Require Gecko 29 and later
Cu.import('resource://gre/modules/osfile.jsm'); //Require Gecko 27 and later
Cu.import('resource://gre/modules/Downloads.jsm'); //Require Gecko 26 and later
Cu.import('resource://gre/modules/NetUtil.jsm'); //Promise chain that require Gecko 25 and later

var Utilities = {}, Logs= {}, PlayerRules = {}, FilterRules = {}, RefererRules = {};

// Services.jsm like thing. better performance and compatibility
// 仿Services.jsm,不过更好用
var Services = {
  io: Cc["@mozilla.org/network/io-service;1"].getService(Ci.nsIIOService),
  obs: Cc['@mozilla.org/observer-service;1'].getService(Ci.nsIObserverService),
  prefs: Cc['@mozilla.org/preferences-service;1'].getService(Ci.nsIPrefService).QueryInterface(Ci.nsIPrefBranch),
  sss: Cc['@mozilla.org/content/style-sheet-service;1'].getService(Ci.nsIStyleSheetService),
  strings: Cc["@mozilla.org/intl/stringbundle;1"].getService(Ci.nsIStringBundleService),
};

// User preferences to toggle functions. may be modifed later
// 设置用户参数以实现各种功能的开关,这里可能会改写
var PrefBranch = Services.prefs.getBranch('extensions.sowatchmk2.');
var PrefValue = {
 'debug': {
    get: function () {
      return PrefBranch.getBoolPref('debug.enable');
    },
    set: function () {
      PrefBranch.setBoolPref('debug.enable', false);
    },
  },
 'remote': {
    get: function () {
      return PrefBranch.getBoolPref('remote.direct_access.enable');
    },
    set: function () {
      PrefBranch.setBoolPref('remote.direct_access.enable', false);
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
      return PrefBranch.getCharPref('file.directory');
    },
    set: function () {
      PrefBranch.setCharPref('file.directory', OS.Path.join(OS.Constants.Path.profileDir, 'soWatch'));
    },
  },
  'server': {
    get: function () {
      return PrefBranch.getCharPref('remote.server.user_defined');
    },
    set: function () {
      PrefBranch.setCharPref('remote.server.user_defined', 'chrome://sowatchmk2/content/'); //用户设定catcat520所修改的播放器服务器
    },
  },
 'override': {
    get: function () {
      return PrefBranch.getBoolPref('remote.server.override');
    },
    set: function () {
      PrefBranch.setBoolPref('remote.server.override', false);
    },
  },
  'bitbucket': {
    get: function () {
      return PrefBranch.getCharPref('remote.server.bitbucket');
    },
    set: function () {
      PrefBranch.setCharPref('remote.server.bitbucket', 'https://bitbucket.org/kafan15536900/haoutil/src/master/player/testmod/');
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
    DebugLogs.analyze();
    var aDebug = PrefValue['debug'].get();
    if (aDebug == true) {
      Utilities.debug = true;
    } else {
      Utilities.debug = false;
    }
    PrefValue['bitbucket'].set();  // 用户无权修改bitbucket的链接,否则将导致功能出错
    for (var i in RuleResolver) {
      var rule = RuleResolver[i];
      if (rule.playerOn) rule.playerOn();
      if (rule.filterOn) rule.playerOn();
      if (rule.refererOn) rule.refererOn();
    }
    var aRemote = PrefValue['remote'].get();
    if (aRemote == true) {
      Utilities.remote = true;
      PrefValue['autoupdate'].set(); // 使用远程服务器的时候强制停止自动更新
    } else {
      Utilities.remote = false;
      var aUpdate = PrefValue['autoupdate'].get();
      if (aUpdate == false) return;
      var aDate = PrefValue['lastdate'].get();
      var aPeriod = PrefValue['period'].get();
      if (aDate + aPeriod * 86400 > Date.now() / 1000) return; // 如果当前时间>上一次检查时间与更新周期的和则不更新。
      QueryFiles.start(0);
    }
  },
};

// Localizable debugging logs to improve user experience
// 本地化Debug记录用于改善用户体验
var DebugLogs = {
  analyze: function () {
    Utilities.logs = Services.strings.createBundle('chrome://sowatchmk2/locale/global.properties?' + Math.random());
  },
  remoteTimeOut: function (aName) {
    if (Utilities.debug == false) return;
    console.log(aName + ' ' + Utilities.logs.GetStringFromName('remoteTimeOut'));
  },
  remoteAccessFailed: function (aName) {
    if (Utilities.debug == false) return;
    console.log(aName + ' ' + Utilities.logs.GetStringFromName('remoteAccessFailed'));
  },
  remoteFetchFailed: function (aName) {
    if (Utilities.debug == false) return;
    console.log(aName + ' ' + Utilities.logs.GetStringFromName('remoteFetchFailed'));
  },
  remoteDownloaded: function (aName) {
    if (Utilities.debug == false) return;
    console.log(aName + ' ' + Utilities.logs.GetStringFromName('remoteDownloaded'));
  },
  localNeedUpdate: function (aName) {
    if (Utilities.debug == false) return;
    console.log(aName + ' ' + Utilities.logs.GetStringFromName('localNeedUpdate'));
  },
  localFileReady: function (aName) {
    if (Utilities.debug == false) return;
    console.log(aName + ' ' + Utilities.logs.GetStringFromName('localFileReady'));
  },
  localFileNotExsit: function (aName) {
    if (Utilities.debug == false) return;
    console.log(aName + ' ' + Utilities.logs.GetStringFromName('localFileNotExsit'));
  },
  extInstall: function () {
    if (Utilities.debug == false) return;
    console.log(Utilities.logs.GetStringFromName('extInstall'));
  },
  extUninstall: function () {
    if (Utilities.debug == false) return;
    console.log(Utilities.logs.GetStringFromName('extUninstall'));
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
  link: function (aMode) {
    var aServer = PrefValue['override'].get();
    if (aServer == true || aMode == 1) return PrefValue['server'].get(); // 当强制使用用户设置后将只返回用户设置的链接
    if (aMode == 0) return PrefValue['bitbucket'].get(); // 默认状况下pptv,ku6等在bitbucket上并未有储存的播放器将由用户自己寻找host
  },
  path: function () {
    if (Utilities.remote == true) return this.link();
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
      label: 'soWatch! mk2',
      tooltiptext: 'soWatch! mk2:\n' + Utilities.logs.GetStringFromName('extTooltip'),
      onCommand: function () {
        QueryFiles.start(0);
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

var QueryFiles = {
// Check remote file size and modified date.
// 检查远程文件的大小跟修改时间
  hash: function (aMode, aLink, aFile, aName) {
    var aClient = Cc['@mozilla.org/xmlextras/xmlhttprequest;1'].createInstance(Ci.nsIXMLHttpRequest);
    aClient.open('HEAD', aLink, true);
    aClient.timeout = 10000;
    aClient.ontimeout = function () {
      DebugLogs.remoteTimeOut(aName);
    }
    aClient.send();
    aClient.onload = function () {
      var aSize = new Number(aClient.getResponseHeader('Content-Length'));
      if (aSize < 10000) return DebugLogs.remoteAccessFailed(aName);
      var aHash = aSize.toString(16);
      if (aMode == 0) {
        QueryFiles.check(aLink, aFile, aName, aHash);
      }
      if (aMode == 1) {
        QueryFiles.fetch(aLink, aFile, aName, aHash);
      }
    }
  },
// LastModifiedDate|FileSize as Hash for update。 If there‘s no hash then check file info to ensure if update is needed
// 以 最后修改日期|文件大小 为哈希以检查文件是否需要更新，如果没有参数则检查文件信息以确认是否需要更新
  check: function (aLink, aFile, aName, aDate, aSize, aHash) {
    try {
      var tHash = PrefBranch.getCharPref('file.hash.' + aName);
      if (tHash == aHash) return DebugLogs.localFileReady(aName);
      DebugLogs.localNeedUpdate(aName);
      QueryFiles.fetch(aLink, aFile, aName, aHash);
    } catch (e) {
      OS.File.stat(aFile).then(function onSuccess(aData) {
        var tSize = aData.size;
        var tHash = tSize.toString(16);
        if (tHash == aHash) {
          DebugLogs.localFileReady(aName);
          PrefBranch.setCharPref('file.hash.' + aName, aHash);
        } else {
          DebugLogs.localNeedUpdate(aName);
          QueryFiles.fetch(aLink, aFile, aName, aHash);
        }
      }, function onFailure(aReason) {
        if (aReason instanceof OS.File.Error && aReason.becauseNoSuchFile) {
          DebugLogs.localFileNotExsit(aName);
          QueryFiles.fetch(aLink, aFile, aName, aHash);
        }
      });
    }
  },
// Download remote file , then write hash to prefs.
// 下载远程文件并将哈希写入参数
  fetch: function (aLink, aFile, aName, aHash) {
    var aTemp = aFile + '_sw'; // 因为Downloads.jsm无法直接覆盖下载,因此采用下载然后覆盖文件的形式
    Downloads.fetch(aLink, aTemp, {
      isPrivate: true
    }).then(function onSuccess() {
      DebugLogs.remoteDownloaded(aName);
      OS.File.move(aTemp, aFile);
      PrefBranch.setCharPref('file.hash.' + aName, aHash);
    }, function onFailure() {
      DebugLogs.remoteFetchFailed(aName);
      OS.File.remove(aTemp);
    });
  },
// Start download
// 开始下载
  start: function () {
    if (aMode == 0 && Utilities.remote == true) return;
    FileIO.addFolder();  // 即使文件夹不存在也能自动创建避免出错
    for (var i in PlayerRules) {
      var rule = PlayerRules[i];
      if (!rule['remote']) continue;
      var aLink = rule['remote'];
      var aFile = OS.Path.fromFileURI(rule['object']);
      var aName = OS.Path.split(aFile).components[OS.Path.split(aFile).components.length - 1];
      QueryFiles.hash(aMode, aLink, aFile, aName);
    }
    PrefValue['lastdate'].set(); // 更新完毕后将现在的时间写入上次更新时间。
  },
};

var RuleResolver = {
  'youku': {
    playerOn: function () {
      PlayerRules['youku_loader'] = {
        'object': FileIO.path() + 'loader.swf',
        'remote': FileIO.link(0) + 'loader.swf',
        'target': /http:\/\/static\.youku\.com\/.*\/v\/swf\/loaders?\.swf/i
      };
      PlayerRules['youku_player'] = {
        'object': FileIO.path() + 'player.swf',
        'remote': FileIO.link(0) + 'player.swf',
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
      PlayerRules['tudou_portal'] = {
        'object': FileIO.path() + 'tudou.swf',
        'remote': FileIO.link(0) + 'tudou.swf',
        'target': /http:\/\/js\.tudouui\.com\/bin\/lingtong\/PortalPlayer.*\.swf/i
      };
      FilterRules['tudou_css'] = {
         'object': 'https://raw.githubusercontent.com/jc3213/noname/master/Misc/tudou_play_74.css',
         'target': /http:\/\/css\.tudouui\.com\/v3\/dist\/css\/play\/play_74\.css/i
      };
      PlayerRules['tudou_olc'] = {
        'object': 'http://js.tudouui.com/bin/player2/olc.swf',
        'target': /http:\/\/js\.tudouui\.com\/bin\/player2\/olc.+\.swf/i
      };
      PlayerRules['tudou_social'] = {
        'object': FileIO.path() + 'sp.swf',
        'remote': FileIO.link(0) + 'sp.swf',
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
      PlayerRules['iqiyi5'] = {
        'object': FileIO.path() + 'iqiyi5.swf',
        'remote': FileIO.link(0) + 'iqiyi5.swf',
        'target': /http:\/\/www\.iqiyi\.com\/common\/flashplayer\/\d+\/MainPlayer.*\.swf/i
      };
      PlayerRules['iqiyi_out'] = {
        'object': FileIO.path() + 'iqiyi_out.swf',
        'remote': FileIO.link(0) + 'iqiyi_out.swf',
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
      PlayerRules['pps'] = {
        'object': FileIO.path() + 'iqiyi.swf',
        'remote': FileIO.link(0) + 'iqiyi.swf',
        'target': /http:\/\/www\.iqiyi\.com\/common\/flashplayer\/\d+\/PPSMainPlayer.*\.swf/i
      };
      PlayerRules['pps_out'] = {
        'object': FileIO.path() + 'pps.swf',
        'remote': FileIO.link(0) + 'pps.swf',
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
      PlayerRules['letv'] = {
        'object': FileIO.path() + 'letv.swf',
        'remote': FileIO.link(0) + 'letv.swf',
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
      PlayerRules['sohu'] = {
        'object': FileIO.path() + 'sohu_live.swf',
        'remote': FileIO.link(0) + 'sohu_live.swf',
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
      PlayerRules['pptv'] = {
        'object': FileIO.path() + 'player4player2.swf',
        'remote': FileIO.link(0) + 'player4player2.swf',
        'target': /http:\/\/player.pplive.cn\/ikan\/.*\/player4player2\.swf/i
      };
      PlayerRules['pptv_live'] = {
        'object': FileIO.path() + 'pptv.in.Live.swf',
        'remote': FileIO.link(1) + 'pptv.in.Live.swf',
        'target': /http:\/\/player.pplive.cn\/live\/.*\/player4live2\.swf/i
      };
    },
    playerOff: function () {
      PlayerRules['pptv'] = null;
      PlayerRules['pptv_live'] = null;
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
      PlayerRules['ku6'] = {
        'object': FileIO.path() + 'ku6_in_player.swf',
        'remote': FileIO.link(1) + 'ku6_in_player.swf',
        'target': /http:\/\/player\.ku6cdn\.com\/default\/(\w+\/){2}\d+\/player\.swf/i
      };
      PlayerRules['ku6_out'] = {
        'object': FileIO.path() + 'ku6_out_player.swf',
        'remote': FileIO.link(1) + 'ku6_out_player.swf',
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

var RuleExecution = {
  getObject: function (aMode, rule, callback) {
    if (aMode == 0) {
      var aObject = rule['object'];
    }
    if (aMode == 1) {
      var aObject = rule['remote'];
    }
    NetUtil.asyncFetch(aObject, function (inputStream, status) {
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
          this.getObject(0, rule, function () {
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
          if (Utilities.remote == false) {
            this.getObject(0, rule, function () {
              httpChannel.resume();
              if (typeof rule['callback'] === 'function') rule['callback'].apply(fn, args);
            });
          } else {
            this.getObject(1, rule, function () {
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
  Preferences.pending();
  Toolbar.addIcon();
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
    QueryFiles.start(1);
    DebugLogs.extInstall();
  }
//Remove useless files after update.
//升级后删除无用的文件。
/*
  if (aReason == ADDON_UPGRADE) {
    OS.File.remove(OS.Path.join(FileIO.extDir(), '56.in.NM.swf'));
    OS.File.remove(OS.Path.join(FileIO.extDir(), '56.in.TM.swf'));
    OS.File.remove(OS.Path.join(FileIO.extDir(), 'sohu.inyy.Lite.swf'));
    OS.File.remove(OS.Path.join(FileIO.extDir(), 'sohu.injs.Lite.swf'));
    OS.File.remove(OS.Path.join(FileIO.extDir(), 'sohu.inbj.Live.swf'));
    OS.File.remove(OS.Path.join(FileIO.extDir(), 'sohu.inyy+injs.Lite.s1.swf'));
    OS.File.remove(OS.Path.join(FileIO.extDir(), '17173.in.Vod.swf'));
    OS.File.remove(OS.Path.join(FileIO.extDir(), '17173.out.Vod.swf'));
    OS.File.remove(OS.Path.join(FileIO.extDir(), '17173.in.Live.swf'));
    OS.File.remove(OS.Path.join(FileIO.extDir(), '17173.out.Live.swf'));
    OS.File.remove(OS.Path.join(FileIO.extDir(), 'pptv.in.Ikan'));
  }
*/
}

// Only delete soWatch folder when uninstalled.
// 仅在卸载时才删除soWatch文件夹。
function uninstall(aData, aReason) {
  if (aReason == ADDON_UNINSTALL) {
    FileIO.delFolder();
    Preferences.remove();
    DebugLogs.extUninstall();
  }
}
