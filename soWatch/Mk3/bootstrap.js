"use strict";

const {classes: Cc, interfaces: Ci, results: Cr, utils: Cu} = Components;
Cu.import('resource:///modules/CustomizableUI.jsm');
Cu.import('resource://gre/modules/NetUtil.jsm');

var Utilities = {}, PlayerRules = {}, FilterRules = {}, RefererRules = {};

var Services = {
  io: Cc['@mozilla.org/network/io-service;1'].getService(Ci.nsIIOService),
  obs: Cc['@mozilla.org/observer-service;1'].getService(Ci.nsIObserverService),
  prefs: Cc['@mozilla.org/preferences-service;1'].getService(Ci.nsIPrefService).QueryInterface(Ci.nsIPrefBranch),
  sss: Cc['@mozilla.org/content/style-sheet-service;1'].getService(Ci.nsIStyleSheetService),
  strings: Cc['@mozilla.org/intl/stringbundle;1'].getService(Ci.nsIStringBundleService),
};

var aURI = 'chrome://sowatchmk3/content/soWatch/';  //文件存放在content/soWatch文件夹中
var aURL = 'https://bitbucket.org/kafan15536900/haoutil/src/master/player/testmod/'; // bitbucket链接

var PrefBranch = Services.prefs.getBranch('extensions.sowatchmk3.');
var PrefValue = {
 'remote': {
    get: function () {
      return PrefBranch.getBoolPref('remote_access.enable');
    },
    set: function () {
      PrefBranch.setBoolPref('remote_access.enable', false);
    },
  },
 'youku': {
    get: function () {
      return PrefBranch.getCharPref('defined_rule.youku');
    },
    set: function () {
      PrefBranch.setCharPref('defined_rule.youku', 'player');
    },
  },
  'tudou': {
    get: function () {
      return PrefBranch.getCharPref('defined_rule.tudou');
    },
    set: function () {
      PrefBranch.setCharPref('defined_rule.tudou', 'player');
    },
  },
  'iqiyi': {
    get: function () {
      return PrefBranch.getCharPref('defined_rule.iqiyi');
    },
    set: function () {
      PrefBranch.setCharPref('defined_rule.iqiyi', 'player');
    },
  },
  'pps': {
    get: function () {
      return PrefBranch.getCharPref('defined_rule.pps');
    },
    set: function () {
      PrefBranch.setCharPref('defined_rule.pps', 'player');
    },
  },
  'letv': {
    get: function () {
      return PrefBranch.getCharPref('defined_rule.letv');
    },
    set: function () {
      PrefBranch.setCharPref('defined_rule.letv', 'filter');
    },
  },
  'sohu': {
    get: function () {
      return PrefBranch.getCharPref('defined_rule.sohu');
    },
    set: function () {
      PrefBranch.setCharPref('defined_rule.sohu', 'filter');
    },
  },
  'pptv': {
    get: function () {
      return PrefBranch.getCharPref('defined_rule.pptv');
    },
    set: function () {
      PrefBranch.setCharPref('defined_rule.pptv', 'player');
    },
  },
  'ku6': {
    get: function () {
      return PrefBranch.getCharPref('defined_rule.ku6');
    },
    set: function () {
      PrefBranch.setCharPref('defined_rule.ku6', 'filter');
    },
  },
  '56': {
    get: function () {
      return PrefBranch.getCharPref('defined_rule.56');
    },
    set: function () {
      PrefBranch.setCharPref('defined_rule.56', 'filter');
    },
  },
  'qq': {
    get: function () {
      return PrefBranch.getCharPref('defined_rule.qq');
    },
    set: function () {
      PrefBranch.setCharPref('defined_rule.qq', 'filter');
    },
  },
  '163': {
    get: function () {
      return PrefBranch.getCharPref('defined_rule.163');
    },
    set: function () {
      PrefBranch.setCharPref('defined_rule.163', 'filter');
    },
  },
  'sina': {
    get: function () {
      return PrefBranch.getCharPref('defined_rule.sina');
    },
    set: function () {
      PrefBranch.setCharPref('defined_rule.sina', 'filter');
    },
  },
  'duowan': {
    get: function () {
      return PrefBranch.getCharPref('defined_rule.duowan');
    },
    set: function () {
      PrefBranch.setCharPref('defined_rule.duowan', 'filter');
    },
  },
  'youku_referer': {
    get: function () {
      return PrefBranch.getBoolPref('spoof_referer.youku');
    },
    set: function () {
      PrefBranch.setBoolPref('spoof_referer.youku', true);
    },
  },
  'iqiyi_referer': {
    get: function () {
      return PrefBranch.getBoolPref('spoof_referer.iqiyi');
    },
    set: function () {
      PrefBranch.setBoolPref('spoof_referer.iqiyi', true);
    },
  },
};
var Preferences = {
// 移除参数设置
  remove: function () {
    Services.prefs.deleteBranch('extensions.sowatchmk3.');
  },
// 恢复默认设置(暂时未添加)
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
  manifest: function () {
    var Youku = PrefValue['youku'].get();
    var Tudou = PrefValue['tudou'].get();
    if ((Youku == 'filter' && Tudou == 'none') || (Youku == 'none' && Tudou == 'filter')) {
      PrefBranch.setCharPref('defined_rule.youku', 'filter');
      PrefBranch.setCharPref('defined_rule.tudou', 'filter');
    }
    var Qiyi = PrefValue['iqiyi'].get();
    var PPS = PrefValue['pps'].get();
    if ((Qiyi == 'filter' && PPS == 'none') || (Qiyi == 'none' && PPS == 'filter')) {
      PrefBranch.setCharPref('defined_rule.iqiyi', 'filter');
      PrefBranch.setCharPref('defined_rule.pps', 'filter');
    }
    for (var i in PrefValue) {
      if (i == 'remote') {
        var aRemote = PrefValue['remote'].get();
        if (aRemote == true) {
          Utilities.remote = true;
        } else {
          Utilities.remote = false;
        }
      } else if (i == 'youku_referer') {
        var YoukuReferer = PrefValue['youku_referer'].get();
        if (YoukuReferer == true) {
          Utilities[i] = true;
          RuleResolver['youku'].refererOn();
        } else {
          Utilities[i] = false;
          RuleResolver['youku'].refererOff();
        }
      } else if (i == 'iqiyi_referer') {
        var QiyiReferer = PrefValue['iqiyi_referer'].get();
        if (QiyiReferer == true) {
          Utilities[i] = true;
          RuleResolver['iqiyi'].refererOn();
        } else {
          Utilities[i] = false;
          RuleResolver['iqiyi'].refererOff();
        }
      } else {
        var rule = PrefValue[i];
        var resolver = RuleResolver[i];
        if (rule.get() == 'player') {
          Utilities[i] = 'player';
          resolver.playerOn();
        } else if (rule.get() == 'filter') {
          Utilities[i] = 'filter';
          resolver.playerOff();
          resolver.filterOn();
        } else if (rule.get() == 'none'){
          Utilities[i] = 'none';
          resolver.playerOff();
          resolver.filterOff();
        } else {
          rule.set();
        }
      }
    }
  },
};

var FileIO = {
  link: function (aMode) {
    if (aMode == 1) return aURI;
    if (aMode == 0) return aURL;
  },
  path: function () {
    if (Utilities.remote == true) return this.link();
    return aURI;
  },
};

// Add toolbar ui for quick management
// 添加工具栏界面以快速管理设置
var Toolbar = {
  css: Services.io.newURI('data:text/css;base64,QC1tb3otZG9jdW1lbnQgdXJsKCJjaHJvbWU6Ly9icm93c2VyL2NvbnRlbnQvYnJvd3Nlci54dWwiKSB7DQogICNzb3dhdGNobWszLWJ1dHRvbiB7DQogICAgbGlzdC1zdHlsZS1pbWFnZTogdXJsKGRhdGE6aW1hZ2UvcG5nO2Jhc2U2NCxpVkJPUncwS0dnb0FBQUFOU1VoRVVnQUFBQkFBQUFBUUNBWUFBQUFmOC85aEFBQUNta2xFUVZSNDJxMlRYVWhUWVJqSGowSDJSVXpiNW5IVGl5ejd1RFJNYlp0bWlSTXNzUzRzdWxEQ0pKUHBSZEowNTV5ZE02ZWhsS2EyQ3lsU0RMTUlFZ3BkZ1NoVVFtV2ZrS01ydS9ER2RKdGpPaithenJQejcyeEhwVkVSUVMvOGVlSGwrZitlNTNtZjl5V0kvN2s4MWZJRW5sV2VnQ2xXQmlPeEEyZUk2SDhDOU9WdnFWaW9WUUpjdkI4Y0thQWx4WTZGYVVNZ0VORDgxUXhXbmh1MHhNL0FFbzhJTmUwSEF0OGhybEZSdTM4MWxoT2JZVlljRm9QOTZ5YWVVOEZ4TlJmOWQyem92OWVMd0tvQXo0c3U4RGJkUklCU3BFWUFCZ3FpRDQ0VzczenZ2YUlJbFI0R3pMYmxvTlcraEdjT0FhL0dCZFE5RVRBL3Z3aFBjeVo0TStsYnBwVEpHNEM2WThUV2gvblIxM2lXQkZnSklGaFVxR2w4Q1gyTGdEeFJPZGNGREk3eFdIbmVMclZsSm5zajIrRGl5c05tUm9VVlRvMmgrdk00M3VBTEcwUEtibHpHbzFFL01HS1RBTFRLRzNrSGxyam1NSUJXSTJoTmhIOXVCbWRidmNpeStuQzBmaDc2QmcrK2VZTkFaNEhVcGhnSFNoYTd6b2dTQWRZd2dFb1F5eFAzUGdQY2M2dm9HRnhDNjlNbGpFL3o0Z3c2MTdOTFlzbXhuMGFvTEpvdzdJSmdDcEhWRXVTV0huaDlHM2gzRjdoZmpBVXVHVDdtZ0pTRVV2R3JyRHhuQXpCN09TYm1jZUcyeGFsS3hWcUFXc3BpWHBONE4xL29QSHlrQ2tQbmZoUHo0Rk1tNDc2Z1laemxHNUNPYkNMTlVTcnJEcHRGZmFCUDQ0MnBDSjlOSnpGRWxjSk9WV0NBdWRUVlJObEt0R2JucVhUV21hUmpYRjJSMDZnak5nazBPUnpLYml5ajRUYnVFZHFwTnJHMUJGVFJkaFJRanA1MG96Tkp3N2tQNldobm1aWngzZmpkeTl3ZVpPS3NWWWFiWDd2MXhMNkx6SEFQejVEVjU2aTM0eVhNU0tXR211TEU4dnUwTmE2OU9zYlorY2UvY1lTYUZ0ODlvcVNkSU5KcUpsTlNUVjVaUnUxa29wWjJhYkxvbWV3TXhrWCtBTThudlJtVWd4cVdBQUFBQUVsRlRrU3VRbUNDKTsNCiAgfQ0KICAjc293YXRjaG1rMy1idXR0b25bY3VpLWFyZWF0eXBlPSJtZW51LXBhbmVsIl0sDQogICAgdG9vbGJhcnBhbGV0dGVpdGVtW3BsYWNlPSJwYWxldHRlIl0gPiAjc293YXRjaG1rMy1idXR0b24gew0KICAgIGxpc3Qtc3R5bGUtaW1hZ2U6IHVybChkYXRhOmltYWdlL3BuZztiYXNlNjQsaVZCT1J3MEtHZ29BQUFBTlNVaEVVZ0FBQUNBQUFBQWdDQVlBQUFCemVucjBBQUFHQWtsRVFWUjQydTJYZTB4VFZ4ekg2d09kRXg4SXRFVmNOcmRzbVZrMEprYWx0Qlh3TmFaekdqZmlvbTdSUmRsOEVFR0gzQ2ZGNlFTbW02SWhNQ1BHT1RkbkpjNEgyVFQ0bUpJTWg4eTVxZmlhSWlpMGxKZGk1ZG5lNzg2OXR3OUtTOFV0SnY2eGsveHlldy8zbk8vbi9NN3Y5enNIaGVMLzlxdzJnMExSdTJGMWNBSTQxVTQ3cDl3TU9sUXY5dDlNVVBRSFBlZzFKSWVxbnlwQS9EaEZ3TTdKL1pvcVZ3NERVdFdTMlRqVkhZRlgyYVRmdk9vT0RJcm5ueXBFMGZ4QVkxMVNpQXVncTltTlMwejJxa3ZsQU03YjdmWWQ1RG5UYURUMitjL0NNQXdlWnVkVVI3b1Q5ckpkYzREV0pvak5aclBkSUkvWWZ5L09LVjhCcjdyZFkzR25XUzF3Tm9FMDhraDdjbkZHcVlLNHQzNkU3THdhTjZoUk9MWmFpNzJycG1MUHF1azRrZjZocUNxck4xUUF1OThEOHBmQmZtak5Pakp0cjU3cTk3S3p5aFAreEszY0N6aTZKZ2FuOW01RjRTOS80V0N4RmNaekhUaDVvUkgxRDJXQXB0cHFGS1hQZzhETFl3Uk9XUWhxU05CajFXMk1jaUdKY25Td3ltNEJpamJNeGUyYnQvRFZNUUc1cHdXY3ZDcWc2SWFBL0ZJQlRMNkFQeXBrQ0V2NVZWeG54cmpHRVlqaThrV0s1L3dDSEprejRFSjJWQURPdkI4b0QrUzlBVG9LTTVGZUlHQnlwZ0RqZVFGWFRaQ3NwRnpBZ2x3QjgzTUVWTlRKRUg4ZjNkNWw2NVNaZmdHeWRMMDM1VVlIb0pseWVJRDFBWkQySXBJeWZwTUFSSnVkSmVEZDdRS21maUc0K3I3ODJTNEJXQnN0YU9QRE8zbEIzUVkyT054dkRGeUxINUlyRGVDSTBjTjlic05OUXd5bVo3UzZCTHRhWEZhekt4dHNXelR1c1V3WVNHcXpmcjNneW4wMkRLQThBV3g4R0k3eGl4Rzd6dFN0ZVBUR2RzeEliM1FCWU1zRTl4emlnbGgxc1Y4QVVtWnJuTFNnd2wxeFlHRmV4djdrbWRpY2N4dzZ0Z2JSbjdkNWljZGsyS0ZQYmNCSE9ROWs4YlpIZ01HOUJlS0NCRWJkM0syNFpia2lzTE83SkFEUkUrUzlkZU1iYUxVK2dLV0pDQm5xQ0lRRlVldWJKVkhueXZXcDlSTGM3ak90TXNDVkFyZTR1QkRIZlBVSmlzRStBVnFvb1MrNUJyQU9nTTV4Y091c05PK2VzMjBTZ0NqVzFSWmxONkdsM1ZHUWRyNERyL21rWi9CNFk1ekMrN3k0VDRxRjF3QnBrS012T3dab2I1SG1QbGpTZ1JrWjk2SGphb2xaTU1uUWdOUURMYmoveUNGZXVxZkw2b2ZMYzNIT2VGSmU5RjJNZUZXVEt3dWNBT0pnWjAzNGRnSFpXNnU4eFIwQ3lxb0VYS3dVVUc4VjNJRjMrVEE1QlViQWF6dkZlY1NGaVF2aVFtbmZXY0NyZnBXQ0xqSEVUUzF0UlpnYll1dEU0Tkloa21QdDhHam1NbEwvbDN1bUxkdDVJVEtFalZWZEVTODF2Z0ZZNWFZMlJvbThLZjFnU3duekd1eDBvV1RyUndKZnh3SjVzNEZOWXoyRS8rUmpjWTZaNjBOY2JRVWZOTHI3MDVBUGlib1dINFR0a3dKd1oxbHdsd2tjRUtJM3VHNE9MRTUyK1Q0NkdUbDB1c2U0MzVtM1FiUGZGZXFZR29Ob2tiUjVxYStUc2xmeHdrR1hSSUFUY1lHZTIrQVRwcE4xK2phZlRzUXVLczBGYk9QVmxWT1lDa0ZMbVhrOVhSc1ZrV0tlSldhTmhqVk44UEpDL3JUK3IyN1Q5VG1TRXgzUTJySlc1UWVnZXp0TXI4QTNERWZxUHlsc3ZDb2RLVUZEZEt5NVVzdWFJNXc2SW9BSTQrOVczSmZFUTVxSEY0aDdIN0VqcFp3L2xMSWNLK2tDTEtVTGNTdEZqODFVRmhiVHA1Rk1INENSU2NKYzlrS21lTE9lUU4vVFJGTG1mV01URzRmcWFWT29LS3BoYXQ0VTU0aWtUT1A5bHVhN1NZb0JKR3F2dXlBSXdLbDVneVNBeS9RMHFlOHpPZzlwOUM0SUtlR3dVeU1ReDVTQ29mZmlMYVpzdzhTMVZkTWlxR3BXWVVCdmFkVmNiVFR4eEdrdFUxTVN5WmhNRXhQcUIvZmdqaGc4aWtSdm5RUkJBSFpNN2ljQmxIMGNBb0ZWMi9LWWRXUy9EUzR2cldCK1FncjlBNWJReDAyUmpMbHNYSHlWZEhYWHNxYVZHdmF1ZkJ6SEdmdUljMmhaaTY1bmQwVTYrSFZ5a0pTSUFNWlpzZ2V5ZEgzVHdBeFVKVEJIRDJ4bHY3eE9jcjZNZk5Pd2pEM2VrVXg5L3pDRHpUNURJbjAxZ1NnWUYxOGEwSFhQSHhzRHZ1NExZSWRGbkZ3eU9sRWNUTENrRk5JeTVvMDYyc3c1UHlMdjU0bndqK1FwVlRzQ3NFMUxtL2RITWpWVzBpZG5BU05uUVdUeXZiRlBmSE1lODZsNUlKbVFpamFnci9nZVFabW5hdWxxdmZQdkdzb2NyNldxRjJocGk5N3BiZzFWblVqNlBuSFdBS2tPVU5VZlBCUC9nLzREQVlCaWczZFp1RGtBQUFBQVNVVk9SSzVDWUlJPSk7DQogIH0NCn0=', null, null),
  addIcon: function () {
    CustomizableUI.createWidget({
      id: 'sowatchmk3-button',
      type: 'custom',
      defaultArea: CustomizableUI.AREA_NAVBAR,
      onBuild: function (aDocument) {
        var aLists = {
          'default': {
            label: Utilities.strings.GetStringFromName('setDefaultLabel'),
            tooltiptext: Utilities.strings.GetStringFromName('setDefaultDescription'),
          },
          S1: null,
          'remote': {
            label: Utilities.strings.GetStringFromName('remoteAccessLabel'),
            tooltiptext: Utilities.strings.GetStringFromName('remoteAccessDescription'),
          },
          S2: null,
          'youku_referer': {
            label: 'Youku Referer',
            tooltiptext: 'Youku Referer',
          },
          'iqiyi_referer': {
            label: 'iQiyi Referer',
            tooltiptext: 'iQiyi Referer',
          },
          S3: null,
        };

        var xLists = {
          'youku': {
            label: 'Youku.com',
            tooltiptext: 'Youku.com',
          },
          'tudou': {
            label: 'Tudou.com',
            tooltiptext: 'Tudou.com',
          },
          'iqiyi': {
            label: 'iQiyi.com',
            tooltiptext: 'iQiyi.com',
          },
          'pps': {
            label: 'PPS.tv',
            tooltiptext: 'PPS.tv',
          },
          'letv': {
            label: 'Letv.com',
            tooltiptext: 'Letv.com',
          },
          'sohu': {
            label: 'Sohu.com',
            tooltiptext: 'Sohu.com',
          },
          'pptv': {
            label: 'PPTV.com',
            tooltiptext: 'PPTV.com',
          },
          'ku6': {
            label: 'Ku6.com',
            tooltiptext: 'Ku6.com',
          },
          '56': {
            label: '56.com',
            tooltiptext: '56.com',
          },
          'qq': {
            label: 'QQ.com',
            tooltiptext: 'QQ.com',
          },
          '163': {
            label: '163.com',
            tooltiptext: '163.com',
          },
          'sina': {
            label: 'Sina.com.cn',
            tooltiptext: 'Sina.com.cn',
          },
          'duowan': {
            label: 'Duowan.com',
            tooltiptext: 'Duowan.com',
          },
        };

        var nLists = {
          'player': {
            label: Utilities.strings.GetStringFromName('rulePlayerLabel'),
            tooltiptext: Utilities.strings.GetStringFromName('rulePlayerDescription'),
          },
          'filter': {
            label: Utilities.strings.GetStringFromName('ruleFilterLabel'),
            tooltiptext: Utilities.strings.GetStringFromName('ruleFilterDescription'),
          },
          'none': {
            label: Utilities.strings.GetStringFromName('ruleNoneLabel'),
            tooltiptext: Utilities.strings.GetStringFromName('ruleNoneDescription'),
          },
        };

        var aMenu = aDocument.createElement('toolbarbutton');
        aMenu.setAttribute('id', 'sowatchmk3-button');
        aMenu.setAttribute('class', 'toolbarbutton-1');
        aMenu.setAttribute('type', 'menu');
        aMenu.setAttribute('label', 'soWatch! mk3');
        aMenu.setAttribute('tooltiptext', Utilities.strings.GetStringFromName('extTooltip'));

        var aPopup = aDocument.createElement('menupopup');
        aPopup.setAttribute('id', 'sowatchmk3-popup');
        aPopup.addEventListener('click', this.onClick, false);
        aPopup.addEventListener('popupshowing', this.onPopup, false);
        aMenu.appendChild(aPopup);

        for (var i in aLists) {
          if (i.length < 3) {
            var aSeparator = aDocument.createElement('menuseparator');
            aPopup.appendChild(aSeparator);
          } else {
            var aItem = aDocument.createElement('menuitem');
            aItem.setAttribute('id', 'sowatchmk3-' + i);
            aItem.setAttribute('label', aLists[i].label);
            aItem.setAttribute('tooltiptext', aLists[i].tooltiptext);
            aItem.setAttribute('class', 'menuitem-iconic');
            if (i == 'remote' || i == 'youku_referer' || i == 'iqiyi_referer') aItem.setAttribute('type', 'checkbox');
            aPopup.appendChild(aItem);
          }
        }

        for (var x in xLists) {
          var xItem = aDocument.createElement('menu');
          xItem.setAttribute('id', 'sowatchmk3-' + x);
          xItem.setAttribute('label', xLists[x].label);
          xItem.setAttribute('tooltiptext', xLists[x].tooltiptext);
          xItem.setAttribute('type', 'menu');
          aPopup.appendChild(xItem);

          var xPopup = aDocument.createElement('menupopup');
          xPopup.setAttribute('id', 'sowatchmk3-popup-' + x);
          xItem.appendChild(xPopup);

          for (var n in nLists) {
            var nItem = aDocument.createElement('menuitem');
            nItem.setAttribute('id', 'sowatchmk3-' + x + '-' + n);
            nItem.setAttribute('label', nLists[n].label);
            nItem.setAttribute('tooltiptext', nLists[n].tooltiptext);
            nItem.setAttribute('type', 'radio');
            nItem.setAttribute('name', x);
            if ((x == '56' || x == 'qq' || x == '163' || x == 'sina' || x == 'duowan') && n == 'player') nItem.setAttribute('disabled', 'true');
            xPopup.appendChild(nItem);
          }
        }

        return aMenu;
      },
      onClick: function (aEvent) {
        for (var i in Utilities) {
          if (i == 'strings') continue;
          else if (i == 'remote' || i == 'youku_referer' || i == 'iqiyi_referer') {
            switch (aEvent.target.id) {
              case 'sowatchmk3-default':
                Preferences.setDefault();
                break;
              case 'sowatchmk3-remote':
                if (Utilities.remote == true) {
                  PrefBranch.setBoolPref('remote_access.enable', false);
                  } else {
                  PrefBranch.setBoolPref('remote_access.enable', true);
                  }
                break;
              case 'sowatchmk3-youku_referer':
                if (Utilities.youku_referer == true) {
                  PrefBranch.setBoolPref('spoof_referer.youku', false);
                  } else {
                  PrefBranch.setBoolPref('spoof_referer.youku', true);
                  }
                break;
              case 'sowatchmk3-iqiyi_referer':
                if (Utilities.iqiyi_referer == true) {
                  PrefBranch.setBoolPref('spoof_referer.iqiyi', false);
                  } else {
                  PrefBranch.setBoolPref('spoof_referer.iqiyi', true);
                  }
                break;
            }  
          } else {
            switch (aEvent.target.id) {
              case 'sowatchmk3-' + i + '-player':
                PrefBranch.setCharPref('defined_rule.' + i, 'player');
                break;
              case 'sowatchmk3-' + i + '-filter':
                PrefBranch.setCharPref('defined_rule.' + i, 'filter');
                break;
              case 'sowatchmk3-' + i + '-none':
                PrefBranch.setCharPref('defined_rule.' + i, 'none');
                break;
            }
          }
        }
      },
      onPopup: function (aEvent) {
        switch (aEvent.target.id) {
          case 'sowatchmk3-popup':
            if (Utilities.remote == true) {
              aEvent.target.childNodes[2].setAttribute('checked', 'true');
            } else {
            aEvent.target.childNodes[2].setAttribute('checked', 'false');
            }
            if (Utilities.youku_referer == true) {
              aEvent.target.childNodes[4].setAttribute('checked', 'true');
            } else {
              aEvent.target.childNodes[4].setAttribute('checked', 'false');
            }
            if (Utilities.iqiyi_referer == true) {
              aEvent.target.childNodes[5].setAttribute('checked', 'true');
            } else {
              aEvent.target.childNodes[5].setAttribute('checked', 'false');
            }
            break;

        }
        for (var i in Utilities) {
          switch (aEvent.target.id) {
            case 'sowatchmk3-popup-' + i:
            break;
          }
        }
      },
    });
    Services.sss.loadAndRegisterSheet(this.css, Services.sss.AUTHOR_SHEET);
  },
  removeIcon: function () {
    Services.sss.unregisterSheet(this.css, Services.sss.AUTHOR_SHEET);
    CustomizableUI.destroyWidget('sowatchmk3-button');
  },
};

// 以下用来细化规则，土豆css代码因为跟破解播放器有关，如果原版播放器则会出现上下黑边，所以和播放器规则合并在一起。
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
// Special codes for iQiyi.com, doesn't work any more.
// 爱奇艺专用代码,目前并未派上任何用场
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

//判断是否是SWF文件，总感觉意义不太大
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

function startup(aData, aReason) {
  Utilities.strings = Services.strings.createBundle('chrome://sowatchmk3/locale/global.properties?' + Math.random());
  RuleExecution.iqiyi();
  Preferences.pending();
  Toolbar.addIcon();
  Observers.startUp();
}

function shutdown(aData, aReason) {
  Toolbar.removeIcon();
  Observers.shutDown();
}

function install(aData, aReason) {
}

function uninstall(aData, aReason) {
  if (aReason == ADDON_UNINSTALL) {
    Preferences.remove();
  }
}
