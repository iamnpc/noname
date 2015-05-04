'use strict';

const {classes: Cc, interfaces: Ci, results: Cr, utils: Cu} = Components;
Cu.import('resource:///modules/CustomizableUI.jsm'); // Require Gecko 29 and higher
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
var aURL = aURI; //用户可以自己指定远程服务器的链接
var aORG = 'https://bitbucket.org/kafan15536900/haoutil/src/master/player/testmod/'; // bitbucket链接

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
  'toolbar': {
    get: function () {
      return PrefBranch.getBoolPref('toolbar_button.enable');
    },
    set: function () {
      PrefBranch.setBoolPref('toolbar_button.enable', true);
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
      } else if (i == 'toolbar') {
        if (PrefValue[i].get() == true) {
          Toolbar.addIcon();
        } else {
          Toolbar.removeIcon();
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
    if (aMode == 1) return aURL;
    if (aMode == 0) return aORG;
  },
  path: function () {
    if (Utilities.remote == true) return this.link();
    return aURI;
  },
};

// Add toolbar ui for quick management
// 添加工具栏界面以快速管理设置
var Toolbar = {
  css: Services.io.newURI('data:text/css;base64,QC1tb3otZG9jdW1lbnQgdXJsKCJjaHJvbWU6Ly9icm93c2VyL2NvbnRlbnQvYnJvd3Nlci54dWwiKSB7DQogICNzb3dhdGNobWszLWJ1dHRvbiB7DQogICAgbGlzdC1zdHlsZS1pbWFnZTogdXJsKCdkYXRhOmltYWdlL3BuZztiYXNlNjQsaVZCT1J3MEtHZ29BQUFBTlNVaEVVZ0FBQUJBQUFBQVFDQVlBQUFBZjgvOWhBQUFDbWtsRVFWUjQycTJUWFVoVFlSakhqMEgyUlV6YjVuSFRpeXo3dURSTWJadG1pUk1zc1M0c3VsRENKSlBwUmRKMDU1eWRNNmVobEthMkN5bFNETE1JRWdwZGdTaFVRbVdma0tNcnUvREdkSnRqT2orYXpyUHo3MnhIcFZFUlFTLzhlZUhsK2YrZTUzbWY5eVdJLzdrODFmSUVubFdlZ0NsV0JpT3hBMmVJNkg4QzlPVnZxVmlvVlFKY3ZCOGNLYUFseFk2RmFVTWdFTkQ4MVF4V25odTB4TS9BRW84SU5lMEhBdDhocmxGUnUzODFsaE9iWVZZY0ZvUDk2eWFlVThGeE5SZjlkMnpvdjllTHdLb0F6NHN1OERiZFJJQlNwRVlBQmdxaUQ0NFc3M3p2dmFJSWxSNEd6TGJsb05XK2hHY09BYS9HQmRROUVUQS92d2hQY3laNE0rbGJwcFRKRzRDNlk4VFdoL25SMTNpV0JGZ0pJRmhVcUdsOENYMkxnRHhST2RjRkRJN3hXSG5lTHJWbEpuc2oyK0RpeXNObVJvVVZUbzJoK3ZNNDN1QUxHMFBLYmx6R28xRS9NR0tUQUxUS0cza0hscmptTUlCV0kyaE5oSDl1Qm1kYnZjaXkrbkMwZmg3NkJnKytlWU5BWjRIVXBoZ0hTaGE3em9nU0FkWXdnRW9ReXhQM1BnUGNjNnZvR0Z4QzY5TWxqRS96NGd3NjE3TkxZc214bjBhb0xKb3c3SUpnQ3BIVkV1U1dIbmg5RzNoM0Y3aGZqQVV1R1Q3bWdKU0VVdkdyckR4bkF6QjdPU2JtY2VHMnhhbEt4VnFBV3NwaVhwTjROMS9vUEh5a0NrUG5maFB6NEZNbTQ3NmdZWnpsRzVDT2JDTE5VU3JyRHB0RmZhQlA0NDJwQ0o5Tkp6RkVsY0pPVldDQXVkVFZSTmxLdEdibnFYVFdtYVJqWEYyUjA2Z2pOZ2swT1J6S2JpeWo0VGJ1RWRxcE5yRzFCRlRSZGhSUWpwNTBvek5KdzdrUDZXaG5tWlp4M2ZqZHk5d2VaT0tzVllhYlg3djF4TDZMekhBUHo1RFY1NmkzNHlYTVNLV0dtdUxFOHZ1ME5hNjlPc2JaK2NlL2NZU2FGdDg5b3FTZElOSnFKbE5TVFY1WlJ1MWtvcFoyYWJMb21ld014a1grQU04bnZSbVVneHFXQUFBQUFFbEZUa1N1UW1DQycpOw0KICB9DQogICNzb3dhdGNobWszLWJ1dHRvbltjdWktYXJlYXR5cGU9Im1lbnUtcGFuZWwiXSwNCiAgICB0b29sYmFycGFsZXR0ZWl0ZW1bcGxhY2U9InBhbGV0dGUiXSA+ICNzb3dhdGNobWszLWJ1dHRvbiB7DQogICAgbGlzdC1zdHlsZS1pbWFnZTogdXJsKCdkYXRhOmltYWdlL3BuZztiYXNlNjQsaVZCT1J3MEtHZ29BQUFBTlNVaEVVZ0FBQUNBQUFBQWdDQVlBQUFCemVucjBBQUFHQWtsRVFWUjQydTJYZTB4VFZ4ekg2d09kRXg4SXRFVmNOcmRzbVZrMEprYWx0Qlh3TmFaekdqZmlvbTdSUmRsOEVFR0gzQ2ZGNlFTbW02SWhNQ1BHT1RkbkpjNEgyVFQ0bUpJTWg4eTVxZmlhSWlpMGxKZGk1ZG5lNzg2OXR3OUtTOFV0SnY2eGsveHlldy8zbk8vbi9NN3Y5enNIaGVMLzlxdzJnMExSdTJGMWNBSTQxVTQ3cDl3TU9sUXY5dDlNVVBRSFBlZzFKSWVxbnlwQS9EaEZ3TTdKL1pvcVZ3NERVdFdTMlRqVkhZRlgyYVRmdk9vT0RJcm5ueXBFMGZ4QVkxMVNpQXVncTltTlMwejJxa3ZsQU03YjdmWWQ1RG5UYURUMitjL0NNQXdlWnVkVVI3b1Q5ckpkYzREV0pvak5aclBkSUkvWWZ5L09LVjhCcjdyZFkzR25XUzF3Tm9FMDhraDdjbkZHcVlLNHQzNkU3THdhTjZoUk9MWmFpNzJycG1MUHF1azRrZjZocUNxck4xUUF1OThEOHBmQmZtak5Pakp0cjU3cTk3S3p5aFAreEszY0N6aTZKZ2FuOW01RjRTOS80V0N4RmNaekhUaDVvUkgxRDJXQXB0cHFGS1hQZzhETFl3Uk9XUWhxU05CajFXMk1jaUdKY25Td3ltNEJpamJNeGUyYnQvRFZNUUc1cHdXY3ZDcWc2SWFBL0ZJQlRMNkFQeXBrQ0V2NVZWeG54cmpHRVlqaThrV0s1L3dDSEprejRFSjJWQURPdkI4b0QrUzlBVG9LTTVGZUlHQnlwZ0RqZVFGWFRaQ3NwRnpBZ2x3QjgzTUVWTlRKRUg4ZjNkNWw2NVNaZmdHeWRMMDM1VVlIb0pseWVJRDFBWkQySXBJeWZwTUFSSnVkSmVEZDdRS21maUc0K3I3ODJTNEJXQnN0YU9QRE8zbEIzUVkyT054dkRGeUxINUlyRGVDSTBjTjlic05OUXd5bVo3UzZCTHRhWEZhekt4dHNXelR1c1V3WVNHcXpmcjNneW4wMkRLQThBV3g4R0k3eGl4Rzd6dFN0ZVBUR2RzeEliM1FCWU1zRTl4emlnbGgxc1Y4QVVtWnJuTFNnd2wxeFlHRmV4djdrbWRpY2N4dzZ0Z2JSbjdkNWljZGsyS0ZQYmNCSE9ROWs4YlpIZ01HOUJlS0NCRWJkM0syNFpia2lzTE83SkFEUkUrUzlkZU1iYUxVK2dLV0pDQm5xQ0lRRlVldWJKVkhueXZXcDlSTGM3ak90TXNDVkFyZTR1QkRIZlBVSmlzRStBVnFvb1MrNUJyQU9nTTV4Y091c05PK2VzMjBTZ0NqVzFSWmxONkdsM1ZHUWRyNERyL21rWi9CNFk1ekMrN3k0VDRxRjF3QnBrS012T3dab2I1SG1QbGpTZ1JrWjk2SGphb2xaTU1uUWdOUURMYmoveUNGZXVxZkw2b2ZMYzNIT2VGSmU5RjJNZUZXVEt3dWNBT0pnWjAzNGRnSFpXNnU4eFIwQ3lxb0VYS3dVVUc4VjNJRjMrVEE1QlViQWF6dkZlY1NGaVF2aVFtbmZXY0NyZnBXQ0xqSEVUUzF0UlpnYll1dEU0Tkloa21QdDhHam1NbEwvbDN1bUxkdDVJVEtFalZWZEVTODF2Z0ZZNWFZMlJvbThLZjFnU3duekd1eDBvV1RyUndKZnh3SjVzNEZOWXoyRS8rUmpjWTZaNjBOY2JRVWZOTHI3MDVBUGlib1dINFR0a3dKd1oxbHdsd2tjRUtJM3VHNE9MRTUyK1Q0NkdUbDB1c2U0MzVtM1FiUGZGZXFZR29Ob2tiUjVxYStUc2xmeHdrR1hSSUFUY1lHZTIrQVRwcE4xK2phZlRzUXVLczBGYk9QVmxWT1lDa0ZMbVhrOVhSc1ZrV0tlSldhTmhqVk44UEpDL3JUK3IyN1Q5VG1TRXgzUTJySlc1UWVnZXp0TXI4QTNERWZxUHlsc3ZDb2RLVUZEZEt5NVVzdWFJNXc2SW9BSTQrOVczSmZFUTVxSEY0aDdIN0VqcFp3L2xMSWNLK2tDTEtVTGNTdEZqODFVRmhiVHA1Rk1INENSU2NKYzlrS21lTE9lUU4vVFJGTG1mV01URzRmcWFWT29LS3BoYXQ0VTU0aWtUT1A5bHVhN1NZb0JKR3F2dXlBSXdLbDVneVNBeS9RMHFlOHpPZzlwOUM0SUtlR3dVeU1ReDVTQ29mZmlMYVpzdzhTMVZkTWlxR3BXWVVCdmFkVmNiVFR4eEdrdFUxTVN5WmhNRXhQcUIvZmdqaGc4aWtSdm5RUkJBSFpNN2ljQmxIMGNBb0ZWMi9LWWRXUy9EUzR2cldCK1FncjlBNWJReDAyUmpMbHNYSHlWZEhYWHNxYVZHdmF1ZkJ6SEdmdUljMmhaaTY1bmQwVTYrSFZ5a0pTSUFNWlpzZ2V5ZEgzVHdBeFVKVEJIRDJ4bHY3eE9jcjZNZk5Pd2pEM2VrVXg5L3pDRHpUNURJbjAxZ1NnWUYxOGEwSFhQSHhzRHZ1NExZSWRGbkZ3eU9sRWNUTENrRk5JeTVvMDYyc3c1UHlMdjU0bndqK1FwVlRzQ3NFMUxtL2RITWpWVzBpZG5BU05uUVdUeXZiRlBmSE1lODZsNUlKbVFpamFnci9nZVFabW5hdWxxdmZQdkdzb2NyNldxRjJocGk5N3BiZzFWblVqNlBuSFdBS2tPVU5VZlBCUC9nLzREQVlCaWczZFp1RGtBQUFBQVNVVk9SSzVDWUlJPScpOw0KICB9DQogICNzb3dhdGNobWszLXlvdWt1IHsNCiAgICBsaXN0LXN0eWxlLWltYWdlOiB1cmwoJ2RhdGE6aW1hZ2UvcG5nO2Jhc2U2NCxpVkJPUncwS0dnb0FBQUFOU1VoRVVnQUFBQkFBQUFBUUNBWUFBQUFmOC85aEFBQUJOVWxFUVZSNDJtTmdRQWNCOHhNWUFoYnM1MHBaOTU4M2V6TVlnOWdnTWJBY1RoQXdYd0dvNkx4VTIvSC91dXNlL3pmZS9SWUZnOFJBY2lBMVlMWG9tcG5EbDc3WFhINGZwdUc5eWU2My9VYTczaVNBTUlnTkVnUEpnZFNBMUtJYUFqUVZTZk44Zy8zdkJkQWRDQklEeWNFTUFic0U1bWVRMDJDYVFVTFRHUmdVUUJpYlQyR0dRTHdEQ2hOZzRFRDkvQjVtOHdadDlmMzNTclArN3pUVjN3ODB5QUdMUzk2RDlJQURGaFRDSUJOQi9vUXAycW1oc1A5L1pjSi9FSDRhN3Z4L3A3SWtpa0hRTUlIRURpaWFRQnhRWU1FTmtPVGYvOTlmN3o4eWZtb3AvMzhsTCtkK2tEeElMVWdQU0M5MkEzZ1o5di9YWVBpUGpKL0tNZnhmeThuUWoyRUFWaThnR1FEU2VFQ0FZVDV5b0tKNEFXc2djakxzdnllRHFSRnJJT0tLUmx3SkZqTWFLVTVJVkVuS0ZHY21Dckl6QUltUmgxNGlXVnFkQUFBQUFFbEZUa1N1UW1DQycpOw0KICB9DQogICNzb3dhdGNobWszLXR1ZG91IHsNCiAgICBsaXN0LXN0eWxlLWltYWdlOiB1cmwoJ2RhdGE6aW1hZ2UvcG5nO2Jhc2U2NCxpVkJPUncwS0dnb0FBQUFOU1VoRVVnQUFBQkFBQUFBUUNBWUFBQUFmOC85aEFBQUJpRWxFUVZSNDJvMVRUVXRDVVJDOXRHc1ZRZW9pRW9JVzRhcGR0R3BoVWYyRElPcGFVR0hsQ3d2TjZnK1l1blpoMGtNcWYwR3JJRjdMRm9IOWhGeEdwcEM1OUozdXpEV2ZYNmtIQmk3bnpzeWRPVE5YaUJiZ3dqZUhRN2NKWTdLQ3ZWRWIyOExHem9nTncyMGpPRkZRdkVSOGFVejhoL3FSeDhLV0FBTEtVbXRBL2x3Ym5ZbFRkK1RUTzNoZFdPeVVEUUMxQ3JwQUhOMHBIL0p0SzdzZTh1amdaeE1EUVQ2VUpOU29CQWN1azh1K2xoZ2FXY250SUxHd0tGZ3dlcDFLTEwwRHViQzJyNklUME1tVEwxVnhPVzhKVmp1MXFoMlBaNEhZREJDZEJrNTlUZ0xpaWFPN2t3WlBNUkV2Qkk4cUgzT0Ura08xNUp4L3l1MWlFaWhtVjZnRU5PZjdNMDJhKzBCNkEzaDdHS3hETTRIaHNaRlkxbVJTelRzNERyemNEazZRWEdtMEVIUVZXTVRxSi9DVUF4N1RRUEcxZjNDdDNDSmkyQ3Q1SkpuTjRjZEl2czB4cXQzbVJaS0tzRzZHV3lUWnNraHRxMHhKTWtyRTc0L3VRT0xvVG5hc2NzL1BSSW11L01CZEZEeWh1Rjl6L1Q1VDgyK292a2djUktaNFRHenF6QnoxM0lGZlArKy9SQ3QwbjlRQUFBQUFTVVZPUks1Q1lJST0nKTsNCiAgfQ0KICAjc293YXRjaG1rMy1pcWl5aSB7DQogICAgbGlzdC1zdHlsZS1pbWFnZTogdXJsKCdkYXRhOmltYWdlL3BuZztiYXNlNjQsaVZCT1J3MEtHZ29BQUFBTlNVaEVVZ0FBQUJBQUFBQVFDQVlBQUFBZjgvOWhBQUFBc2tsRVFWUjQybU5nb0JSVXpEZFFxSnF0MDFBMVIyZDkweUxML3lBTVpHUEZTUExyUVhwQWVobUFuUGZvQ2tDNFlxYk9GbVNNTEFkVFh6bEhaejhEbFBPZVZKZkRMR2FnUEF4bUFwMHlRN2NJU004R3NaSHdGcWo0LzhwWnV2WXdHcGtOb3BFTjJBSVdnQnFLelFDa01FRVlBRGFWQ0FQS1orcXVSbkxkYnRKZE1FczdHRzRBa0kzVEFDQXd4bVlBa3NGZ1MyaG53T1MxWWY5Sk1nQWRuTHl4T2hRV1VNU21LTXBTSXNWNWdkTGNDQUNrQkc2MkplUkRtd0FBQUFCSlJVNUVya0pnZ2c9PScpOw0KICB9DQogICNzb3dhdGNobWszLWxldHYgew0KICAgIGxpc3Qtc3R5bGUtaW1hZ2U6IHVybCgnZGF0YTppbWFnZS9wbmc7YmFzZTY0LGlWQk9SdzBLR2dvQUFBQU5TVWhFVWdBQUFCQUFBQUFRQ0FZQUFBQWY4LzloQUFBQXcwbEVRVlI0Mm1OZ0dQcmdzckxXZXlEK0Q4WDNzYW01b3FwbGNGbEZxK0dTc3VaK29KcjVsNVMxRXBBTitJK00wVFZmVXRIdVIxY0R3aUREemlzWUNPQTE0TEtTWmdHUzNIcVFTMENhUUs2QUdZTGZBS0NYd0FxVnRNNkQrT2NWTkJTZ0xyb1BWNC9MQUpCaUpQSDNJRVBRMU40SGh3VXVBeTZyNkRoZzhUc293T2VEdkVKVUlLSUVHdERwNkFHTU5SQkJnUVdLTWpBR3NaRzlnUlI5SUZkZ0RVUzBxQXBBU3lkbzhwQXdXQTh5Q1JzR0JTUnl0TUUxZ2dJVUdFWU13d01BQU5TeTh1Q3BKLzU1QUFBQUFFbEZUa1N1UW1DQycpOw0KICB9DQogICNzb3dhdGNobWszLXNvaHUgew0KICAgIGxpc3Qtc3R5bGUtaW1hZ2U6IHVybCgnZGF0YTppbWFnZS9wbmc7YmFzZTY0LGlWQk9SdzBLR2dvQUFBQU5TVWhFVWdBQUFCQUFBQUFRQ0FZQUFBQWY4LzloQUFBQ2pFbEVRVlI0Mm1OZ1FBUC9uejJUL3p4clF2Tzc0dFJ0YndzVDlyOUs5cjMrcGlqcTFPZEZFOXQvUEg2c3dvQUwvUC8vbi9uTC9GbEZuMmRNcXZ0NS83NEdzdHpQbXpmMVA4M3E2bnNaWWZuNTg1ek95U0MxR0pxZmRIUTB6MmxwcWN2UHlaMWNYVm5aZnZEZ1FTdDBTMzQrdkszOUt0UC8rcnZxeEVNb2h1eHRhR3FXRnhCOHg4ckErQitFSFd4c0RqMTU4a1RtMTVFVEZ0aTgrQ0xhL2hYSUpXQ0JWM2Z1cUlpeHNQNkNhVlpSVUx6Mzd0MDcvdit2WGtrOFpSRDYvOHJDN2ZpUDY5ZlZrQTM1c25WMXlzc0FnLzgvNzkzVVo2aXJxV21HYVFiaE5TdlhCSU50dW5kUEhtVEFVemFKLzg4VkRiNS82WjlSQkhNMmtHWi80Vy82K2ZPczlza01GaWFtcDJDYUJYaDRQOE1Wd1F3QVlRN0ovODhsdGY2L05ITTU5ZlBjWlgyUS9QdmFuSFd2c29NdU00Q2NqT3g4dUYrUkRVREdQTEtmUWZJZit0djZubnZxL3dJYklNWEFCRFpBUWtUMEZWNERnSnEvemxxVURIWkJSZjd5RjA3YS94bGlUU3hPMVRCdy9ROWxZUCt2emNEeS84eVpNMGJZREhqdEhyb05KQWFMOWhmT1ZvOWZSWGxlWjloZFhObDlqMEh3LzBvRzN2L1hnZlFhOTRCdHlBWThFMUI0OTJYdTBqamtXUGc4ZDI3MmN3M0YveDlhcTJjei9BQkc0MU1XMFYvSXRuM0lyK29EMmZLcHZiLzhQekE5SUd2K3ZtdWY4ek41bGM4Z0EzNWRPR01PRm55ZlV6YjVLYVB3LzZjc1luQkRRUEgvYmZuYWNKQUIvNTkrRXZsMjhKalYyNFRzK1UvWnhYNDlFNVA2Lzc2a1lERnlVbVovYmVONTZCbXZITkRKaXYvQmhtR0xBWENVaXY1LzdSdHdDSmpRZU5EekEvdjczSXJKTDZSMS9yOHlkZm4vUXNuby96TnUyZjlQV1lHdVloS0JhR1lVK3Y4MkxYOCtobWFVREFOTUtCL3lxbWEvOFFpNS9seEsrei9JVlM4MExhKy9TOG1iL2VzNDFNOUlBQUMzTzZiQ0VLaDFKQUFBQUFCSlJVNUVya0pnZ2c9PScpOw0KICB9DQogICNzb3dhdGNobWszLXBwdHYgew0KICAgIGxpc3Qtc3R5bGUtaW1hZ2U6IHVybCgnZGF0YTppbWFnZS9wbmc7YmFzZTY0LGlWQk9SdzBLR2dvQUFBQU5TVWhFVWdBQUFCQUFBQUFRQ0FZQUFBQWY4LzloQUFBRE9rbEVRVlI0MnBXVFcweWJkUmpHdnl6WmxuRkJ3anlRekNqZHlnb0t4dVBrUnAxbVYzcXhhT0t5a0JnMVRrVGpZYklaclIyek1FSmJWbGdjY1RvVU1zRk9NWnNtQnJNd1dDZmwwQ09zbGxYYUZlakhhZVZReXRaK3JNQmErUGxSRXVLaVh2Z2s3OVg3L0o3L216ZnZYeEQrUThmdDRveXUyeS9wdS8xeHVlWnJYRUd4OUxyclFKWnAwclhSTUdvVnRHS2I4RUx0NW4rQUJ0dGdwTVl4dk1MZlpKZHJoeG4wOW5FcU83dzMxODJLczEvY0FWZDIrV1BMc2prcWx4U1Z1SjZJc01kem04MlYzVlRYLzhMc3pmbFVvTEhIdDdoR2ZQbnNPcXkzRGthRzVXYmY1RzBpWVpHV2hUbTJ0UytoUFBnTlh6WDh5T1dSS0IxamNXeGpFbE95VDJmeHh1NTQzZWdjV2JrUVhDUTBlWVVUTVltMDh6Y29LRGJTMXVGa0xqclB6T2dRdjNvbk9HR2R4dVNlNWVzL1o1Q3h0QlJjWlJ1Y2JnN0Q4SVFWYlRpR1lKcWo0QzBEcmQ5L1M5SmNTOWhyeFRvZ010cnY0cE8yUVVwYVJJek9XK2k3QnFTMWpkdDhrblBjUmUzMEhFS3pSTzZyRmJTYzBrSGtkK2d2aCtjRS9EOFk2UHZEaThuU3kvT252YnhpRXFtdytCS3BBRzNUQjlKUG9RQkM0d0wzdm02azhWd3J5ZDhPd1VBVjFPV0RkZ01KWFE1aU9JN1RGMENwZC9Ka2xWc091TFlzd0JPUEc4Njl1eXcwZ2ZCUkMvdUsxWXpNUkVuVzdvWFg1SGIxVm1oN2cxdnRoNW1hbFhBRUo5bjJlUmQ1RlE3S08zMUoyWkZkL1hUdEdRUjlpSXhkQjNpeHpzYVl4NDdsaXAvRnQ5UGxkVzhoMlZyRTJIZ0lsbUpvekNMM3FjM2s2bnBwQ0VxckV6empFVW9oYzYrRy9QZWJlRWpub3NaOGxSR1BEZmRRaU5Id0F0TnpDeW5ZTVhHRE5JMkY3ZXBMNUIvOW1aTzl3MjdCNkRrbENydXRxUFpyZUZSdjU3RXlDMW5sUFJRMjkzUFcwb2NyTUk1Tm5PYmo5aUNiMUIxa2Zkck9qbklueDNxR1ZsSUx2THYwYWlCdFZ3TjV4OXJJUFZpUHFxeUxCNDljWXJ0c3pDenQ1SzVTQytucXkyd3R1Y2dEaHkvSzRRN3kxR2RXYnlCOTdZSjJ0dzRyOXBuSU1UcFFyTUtINm5sWTNZaks0RUY1dEFlRnBoT0ZISlJWWmlmbnlIbFV4YnFsOVFOS0tlTzd6KzUvNlRTSzQyNlVKd05rRkJSYWhUMGZ2cWQ4dWVqYXpqZTE4WjN2VkNXeWl5cVhsSVVsVTF2dXlkei9yMTkzdzZac2RiN3hRa0tscVlzTEd4OTVTdmdmK2d1ZjFraVFhNGt4VUFBQUFBQkpSVTVFcmtKZ2dnPT0nKTsNCiAgfQ0KICAjc293YXRjaG1rMy1xcSB7DQogICAgbGlzdC1zdHlsZS1pbWFnZTogdXJsKCdkYXRhOmltYWdlL3BuZztiYXNlNjQsaVZCT1J3MEtHZ29BQUFBTlNVaEVVZ0FBQUJBQUFBQVFDQVlBQUFBZjgvOWhBQUFDdTBsRVFWUjQybzNUWFVoVFlSd0c4UE94STJwaU4yRkNnYUtPZE9yV0IxMTFFMzFjZUJXa0ZXbW1ibXM2RENzaFVKSUd3Y0tLRWt1b2pCUXpGWnRsYWRRVUpVdk5vWnZwbkZ1bXBlU2FUazFMTEozbmJFL3VERjJqenhjZTNxdm45LzQ1NTMwSjRxY1ZyYkVkM05JMHRoVDJ5SUx3bXI2Wm9IeXRrdmlmWlUwbnRnNWVET0dpSDR6UHkzdUFDTHVMVDZUNU16WnJoOWlvZWtQcVg4c2pCU0VjN2pNNFkvQkh5UXkxbGxVb3ZtUENGVmx2K0xMYVVhbFUxQnB3YVE5ZENpMERkN0wxRk02YkJKQTIrWGtSdlFjSi84UkIxR0RCTHhPTXlBUUxQTkM0TWtFZmpmMDNTUFNNbHlEdE1RblZRS0FQRWpQTlFsSmo4a1hHTThnbE44QlcrZUcweFFNc09HYlJOcGFIMUhvQ09YcnZKSkdURHV5R0U5czEvVjdFcmlBZHVNdkFXY3BBYnFCNHdPbmt3SEVzSE93M3BHb29YREFUM2trbVdPejc2b1Nrcm5lUkIwYlRTZFpWekdBMkx4QnBIYVFQNE03aThoeVM2eWdVOUh1UnNFa1hFczJjRzZraEJnK1JyRlBOd0pZYmlJeE9EOENYblc2QTQzZlpjd3I1ZlFSVVJwSUhRajY2c0d0Z0dUdHVkcnNJWXlMSnpzZ1lmSkFGNEhBendRTTIreWhHclJaWUowZjQwNVV2YUNpYkdjUVhkMERVK0I0eCtpbUluNzZEdUVobklVeEpKS3hTQ3NQU0FLUm9QWUQ3MUxsNU83SnJvNURWVGlObkpUdUxuMEZTWVVSTTdSQkVGZjBRS2E2LzRiL0I2eVRCbEYxTzRxMThIWTQxZUlEdVlRMVNuZ2lnZkVsRDFoU00rTXV0aUtzMElyYmFqUERDRm9pT3Exdlcva0pEa24vUFhDWU4wNGtnWkRUNDRVQVppWVRiRkU1MjBVaHZGaVArV2p2RVpRWWUySkNyZ1RCWjNlNXpENmJTYWFrcGxXSjFpdlU0ZW04YmowaWZNVWg0bUFYeDFWY1FWVnNRVzI3RXBsTlYzeVdLSzYyL2ZROFRHZlNScnBUZ0phR3EweFZYM2dkeGhRR3hsU1krY1hkNkVacFphZ3RWbEo3OTU2dU1VblcyQ3RVNmhCVzFRVmlvUThTNSt1bVZZdVBHekZ0Ny85VDVBWjI4OUpQM1pRUEdBQUFBQUVsRlRrU3VRbUNDJyk7DQogIH0NCiAgI3Nvd2F0Y2htazMtMTYzIHsNCiAgICBsaXN0LXN0eWxlLWltYWdlOiB1cmwoJ2RhdGE6aW1hZ2UvcG5nO2Jhc2U2NCxpVkJPUncwS0dnb0FBQUFOU1VoRVVnQUFBQkFBQUFBUUNBWUFBQUFmOC85aEFBQUFTa2xFUVZSNDJtTmdvQVg0RDBUWU1NbWE4WWtScFJrYkc2OGgrQlNSWlFESllZRlBJVm5oUUhGTTRES1E1T2dqMlJzd3hiajRGTGtDcHdINFFwNlFHTUZBSkZvenhXbUFIQUFBVjdXMVMzNXZCSWtBQUFBQVNVVk9SSzVDWUlJPScpOw0KICB9DQogICNzb3dhdGNobWszLXNpbmEgew0KICAgIGxpc3Qtc3R5bGUtaW1hZ2U6IHVybCgnZGF0YTppbWFnZS9wbmc7YmFzZTY0LGlWQk9SdzBLR2dvQUFBQU5TVWhFVWdBQUFCQUFBQUFRQ0FZQUFBQWY4LzloQUFBQ0IwbEVRVlI0MnEyVHpVdFVZUlRHSHlaY2RNRXhqWm5yZkVXNU1RUTNob3RFa0JidFNxRVFXMGFKbTBDaFJiYnJid2dxYXFIU0ovYUZnME5wMkFlbG16YmpDQkVPT0ZIVFFPTkVSWmt6dDNGbW5zNzdldS90Z2k1Y2RPREhlYzU3M3VlY2QzRXZzSU9vSW5Laml2QTU3RFFxaUo0UXd5V2xpVmluREtDUWNQb0VkbTB4RVVHVGlFU0psb1lLd2w4cWlDelkyeC9hQTk2TDBVZEVkNHVlSnN3REhqTjhjdmhxQStIanN2bUNiYmhLaEE1SkxxdGFCaGFJL1h2a2RTYzM2L0JaZDBBUjVxbDFORnRGaExyWFllWkVVL1I1eVdOSzIyd1VFVHdzT2FIcTMyaWUxT1pmaU93dElQajJLd0k1WVVHZ29vQkEyZEVlTWtMSjFpdmYwZGlBRDJnYXpLQ3Bsdlh2NDlyQUlIbnJBWm5Pa0ZWdXNyeEMzcnl2ZStxTzNQWFFlQXdwK0NlV1kyMWtZcGFmMG1rTzlQY3paSnFzTnd5ZFZmMDVtNldPNlJtcXUrS3hxYitPMXpBK2N1Nmw3aC9wNldFb0dOeUNPbmZqMlF1K2dhR1poM0VGVDFCWGRucHRyYTB1MjlWT1BFV2RScnlYOFFpK1AwNmp1NnVMWHUzRkcrSnhHTUVkNEhsdGFVazNSb2FIM1V0OXZiMHUzdk5hS2tYeDhEYXdkaGRvd1QzZzRHeEhSNjY2dUVpclZPTEUrRGd2am81cWs4cXF0aXhMbTZ2SkpHZmEyL1VBNFl6N0lha2g4VmhzTGpVMHhKL3hPTG02K3UrOStUeC9URTFSOVI0SEFtcnpPOW5jdCsxUEpNMmp3alZoWHNnSzMyUlRYbkpTOHFRWVQwdjI0My9HWDNFOHIvY1N2dGRsQUFBQUFFbEZUa1N1UW1DQycpOw0KICB9DQp9', null, null),
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
          S1: null,  // Menu separator
          'remote': {
            label: Utilities.strings.GetStringFromName('remoteAccessLabel'),
            tooltiptext: Utilities.strings.GetStringFromName('remoteAccessDescription'),
          },
          S2: null, // Menu separator
          'youku_referer': {
            label: 'Youku Referer',
            tooltiptext: 'Youku Referer',
          },
          'iqiyi_referer': {
            label: 'iQiyi Referer',
            tooltiptext: 'iQiyi Referer',
          },
        };

        Utilities.sites = {
          'youku': {
            label: 'Youku.com',
            tooltiptext: 'http://www.youku.com/',
            target: /http:\/\/static\.youku\.com\/.+loaders?\.swf/i,
            url: /https?:\/\/[^\/]+youku\.com\//i,
          },
          'tudou': {
            label: 'Tudou.com',
            tooltiptext: 'http://www.tudou.com/',
            target: /http:\/\/js\.tudouui\.com\/.+player\.swf/i,
            url: /https?:\/\/[^\/]+tudou\.com\//i,
          },
          'iqiyi': {
            label: 'iQiyi.com',
            tooltiptext: 'http://www.iqiyi.com/',
            target: /http:\/\/www\.iqiyi\.com\/.+player\.swf/i,
            url: /https?:\/\/[^\/]+(iqiyi\.com|pps\.tv)\//i,
          },
          'letv': {
            label: 'Letv.com',
            tooltiptext: 'http://www.letv.com/',
            target: /http:\/\/player\.letvcdn\.com\/.+player\.swf/i,
            url: /https?:\/\/[^\/]+letv\.com\//i,
          },
          'sohu': {
            label: 'Sohu.com',
            tooltiptext: 'http://tv.sohu.com/',
            target: /http:\/\/tv\.sohu\.com\/.+main\.swf/i,
            url: /https?:\/\/[^\/]+(sohu|56)\.com\//i,
          },
          'pptv': {
            label: 'PPTV.com',
            tooltiptext: 'http://www.pptv.com/',
            target: /http:\/\/player\.pplive\.cn\/.+(player|live).+\.swf/i,
            url: /https?:\/\/[^\/]+pptv\.com\//i,
          },
          'qq': {
            label: 'QQ.com',
            tooltiptext: 'http://v.qq.com/',
            target: /http:\/\/imgcache\.qq\.com\/.+mediaplugin\.swf/i,
            url: /https?:\/\/[^\/]+qq\.com\//i,
          },
          '163': {
            label: '163.com',
            tooltiptext: 'http://v.163.com/',
            target: /http:\/\/v\.163\.com\/.+player.+\.swf/i,
            url: /https?:\/\/[^\/]+163\.com\//i,
          },
          'sina': {
            label: 'Sina.com.cn',
            tooltiptext: 'http://video.sina.com.cn/',
            target: /http:\/\/[^/]+\.sina\.com\.cn\/.+player.+\.swf/i,
            url: /https?:\/\/[^\/]+sina\.com\.cn\//i,
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

        for (var x in Utilities.sites) {
          var xItem = aDocument.createElement('menu');
          xItem.setAttribute('id', 'sowatchmk3-' + x);
          xItem.setAttribute('label', Utilities.sites[x].label);
          xItem.setAttribute('tooltiptext', Utilities.sites[x].tooltiptext);
          xItem.setAttribute('class', 'menu-iconic');
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
            if ((x == 'qq' || x == '163' || x == 'sina') && n == 'player') nItem.setAttribute('disabled', 'true');
            xPopup.appendChild(nItem);
          }
        }

        return aMenu;
      },
      onClick: function (aEvent) {
        for (var i in Utilities) {
          if (i == 'remote' || i == 'youku_referer' || i == 'iqiyi_referer') {
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
          }
        }
        for (var x in Utilities.sites) {
          switch (aEvent.target.id) {
            case 'sowatchmk3-' + x + '-player':
              PrefBranch.setCharPref('defined_rule.' + x, 'player');
              break;
            case 'sowatchmk3-' + x + '-filter':
              PrefBranch.setCharPref('defined_rule.' + x, 'filter');
              break;
            case 'sowatchmk3-' + x + '-none':
              PrefBranch.setCharPref('defined_rule.' + x, 'none');
              break;
          }
        }
      },
      onPopup: function (aEvent) {
        for (var i in Utilities) {
          if (i == 'remote' || i == 'youku_referer' || i == 'iqiyi_referer') {
            switch (aEvent.target.id) {
              case 'sowatchmk3-popup':
                if (Utilities[i] == true) {
                  aEvent.target.querySelector('#sowatchmk3-' + i).setAttribute('checked', 'true');
                } else {
                  aEvent.target.querySelector('#sowatchmk3-' + i).setAttribute('checked', 'false');
                }
                break;
            }
          }
        }
        for (var x in Utilities.sites) {
          switch (aEvent.target.id) {
            case 'sowatchmk3-popup':
              if (!Utilities.sites[x].url.test(aEvent.target.ownerDocument.defaultView.content.location.href) && Utilities.sites[x].popup != true) {
                aEvent.target.querySelector('#sowatchmk3-' + x).setAttribute('hidden', 'true');
                if (x == 'youku') {
                  aEvent.target.querySelector('#sowatchmk3-youku_referer').setAttribute('hidden', 'true');
                }
                if (x == 'iqiyi') {
                  aEvent.target.querySelector('#sowatchmk3-iqiyi_referer').setAttribute('hidden', 'true');
                }
              } else {
                aEvent.target.querySelector('#sowatchmk3-' + x).setAttribute('hidden', 'false');
                if (x == 'youku') {
                  aEvent.target.querySelector('#sowatchmk3-youku_referer').setAttribute('hidden', 'false');
                }
                if (x == 'iqiyi') {
                  aEvent.target.querySelector('#sowatchmk3-iqiyi_referer').setAttribute('hidden', 'false');
                }
              }
              break;
            case 'sowatchmk3-popup-' + x:
              if (Utilities[x] == 'player') {
                aEvent.target.querySelector('#sowatchmk3-' + x + '-player').setAttribute('checked', 'true');
              } else if (Utilities[x] == 'filter') {
                aEvent.target.querySelector('#sowatchmk3-' + x + '-filter').setAttribute('checked', 'true');
              } else if (Utilities[x] == 'none') {
                aEvent.target.querySelector('#sowatchmk3-' + x + '-none').setAttribute('checked', 'true');
              }
              break;
          }
        }
      },
    });
    Services.sss.loadAndRegisterSheet(this.css, Services.sss.AUTHOR_SHEET);
    Utilities.toolbar = true;
  },
  removeIcon: function () {
    if (Utilities.toolbar != true) return;
    Services.sss.unregisterSheet(this.css, Services.sss.AUTHOR_SHEET);
    CustomizableUI.destroyWidget('sowatchmk3-button');
    Utilities.toolbar = false;
  },
  UserInterface: function (aSubject) {
    var httpChannel = aSubject.QueryInterface(Ci.nsIHttpChannel);

    var aVisitor = new HttpHeaderVisitor();
    httpChannel.visitResponseHeaders(aVisitor);
    if (!aVisitor.isFlash()) return;

    for (var i in Utilities.sites) {
      if (Utilities.sites[i].target.test(httpChannel.URI.spec)) {
        Utilities.sites[i].popup = true;
      } else {
        Utilities.sites[i].popup = false;
      }
    }
  },
};

// 以下用来细化规则，土豆css代码因为跟破解播放器有关，如果原版播放器则会出现上下黑边，所以和播放器规则合并在一起。
var RuleResolver = {
  'youku': {
    playerOn: function () {
      PlayerRules['youku_loader'] = {
        'object': FileIO.path() + 'loader.swf',
        'remote': FileIO.link(0) + 'loader.swf',
        'target': /http:\/\/static\.youku\.com\/.*\/v\/swf\/loaders?\.swf/i,
      };
      PlayerRules['youku_player'] = {
        'object': FileIO.path() + 'player.swf',
        'remote': FileIO.link(0) + 'player.swf',
        'target': /http:\/\/static\.youku\.com\/.*\/v\/swf\/q?player.*\.swf/i,
      };
    },
    playerOff: function () {
      PlayerRules['youku_loader'] = null;
      PlayerRules['youku_player'] = null;
    },
    filterOn: function () {
      FilterRules['youku_tudou'] = {
        'object': 'http://valf.atm.youku.com/vf?vip=0',
        'target': /http:\/\/val[fcopb]\.atm\.youku\.com\/v.+/i,
      };
    },
    filterOff: function () {
      FilterRules['youku_tudou'] = null;
    },
    refererOn: function () {
      RefererRules['youku'] = {
        'object': 'http://www.youku.com/',
        'target': /http:\/\/.*\.youku\.com/i,
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
        'target': /http:\/\/js\.tudouui\.com\/bin\/lingtong\/PortalPlayer.*\.swf/i,
      };
      FilterRules['tudou_css'] = {
        'object': 'https://raw.githubusercontent.com/jc3213/noname/master/Misc/tudou_play_74.css',
        'target': /http:\/\/css\.tudouui\.com\/v3\/dist\/css\/play\/play.+\.css/i,
      };
      PlayerRules['tudou_olc'] = {
        'object': 'http://js.tudouui.com/bin/player2/olc.swf',
        'target': /http:\/\/js\.tudouui\.com\/bin\/player2\/olc.+\.swf/i,
      };
      PlayerRules['tudou_social'] = {
        'object': FileIO.path() + 'sp.swf',
        'remote': FileIO.link(0) + 'sp.swf',
        'target': /http:\/\/js\.tudouui\.com\/bin\/lingtong\/SocialPlayer.*\.swf/i,
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
        'target': /http:\/\/val[fcopb]\.atm\.youku\.com\/v.+/i,
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
        'target': /http:\/\/www\.iqiyi\.com\/common\/flashplayer\/\d+\/MainPlayer.*\.swf/i,
      };
      PlayerRules['iqiyi_out'] = {
        'object': FileIO.path() + 'iqiyi_out.swf',
        'remote': FileIO.link(0) + 'iqiyi_out.swf',
        'target': /https?:\/\/www\.iqiyi\.com\/(common\/flash)?player\/\d+\/(Share)?Player.*\.swf/i,
      };
    },
    playerOff: function () {
      PlayerRules['iqiyi5'] = null;
      PlayerRules['iqiyi_out'] = null;
    },
    filterOn: function () {
      FilterRules['iqiyi'] = {
        'object': 'http://www.iqiyi.com/player/cupid/common/clear.swf',
        'target': /http:\/\/www\.iqiyi\.com\/common\/flashplayer\/\d+\/((dsp)?roll|hawkeye|pause).*\.swf/i,
      };
    },
    filterOff: function () {
      FilterRules['iqiyi'] = null;
    },
    refererOn: function () {
      RefererRules['iqiyi'] = {
        'object': 'http://www.iqiyi.com/',
        'target': /http:\/\/.*\.qiyi\.com/i,
      };
    },
    refererOff: function () {
      RefererRules['iqiyi'] = null;
    },
  },
  'letv': {
    playerOn: function () {
      PlayerRules['letv'] = {
        'object': FileIO.path() + 'letv.swf',
        'remote': FileIO.link(0) + 'letv.swf',
        'target': /http:\/\/.*\.letv(cdn)?\.com\/.*(new)?player\/((SDK)?Letv|swf)Player\.swf/i,
      };
      PlayerRules['letv_skin'] = {
        'object': 'http://player.letvcdn.com/p/201407/24/15/newplayer/1/SSLetvPlayer.swf',
        'target': /http:\/\/player\.letvcdn\.com\/p\/((?!15)\d+\/){3}newplayer\/1\/S?SLetvPlayer\.swf/i,
      };
    },
    playerOff: function () {
      PlayerRules['letv'] = null;
      PlayerRules['letv_skin'] = null;
    },
    filterOn: function () {
      FilterRules['letv'] = {
        'object': 'http://ark.letv.com/s',
        'target': /http:\/\/(ark|fz)\.letv\.com\/s\?ark/i,
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
        'target': /http:\/\/(tv\.sohu\.com\/upload\/swf\/(p2p\/)?\d+|(\d+\.){3}\d+\/webplayer)\/Main\.swf/i,
      };
    },
    playerOff: function () {
      PlayerRules['sohu'] = null;
    },
    filterOn: function () {
      FilterRules['sohu'] = {
        'object': 'http://v.aty.sohu.com/v',
        'target': /http:\/\/v\.aty\.sohu\.com\/v\?/i,
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
        'target': /http:\/\/player.pplive.cn\/ikan\/.*\/player4player2\.swf/i,
      };
      PlayerRules['pptv_live'] = {
        'object': FileIO.path() + 'pptv.in.Live.swf',
        'remote': FileIO.link(1) + 'pptv.in.Live.swf',
        'target': /http:\/\/player.pplive.cn\/live\/.*\/player4live2\.swf/i,
      };
    },
    playerOff: function () {
      PlayerRules['pptv'] = null;
      PlayerRules['pptv_live'] = null;
    },
    filterOn: function () {
      FilterRules['pptv'] = {
        'object': 'http://de.as.pptv.com/ikandelivery/vast/draft',
        'target': /http:\/\/de\.as\.pptv\.com\/ikandelivery\/vast\/.+draft/i,
      };
    },
    filterOff: function () {
      FilterRules['pptv'] = null;
    },
  },
  'qq': {
    playerOn: function () {},
    playerOff: function () {},
    filterOn: function () {
      FilterRules['qq'] = {
        'object': 'http://livep.l.qq.com/livemsg',
        'target': /http:\/\/livew\.l\.qq\.com\/livemsg\?/i,
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
        'target': /http:\/\/v\.163\.com\/special\/.*\.xml/i,
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
        'target': /http:\/\/sax\.sina\.com\.cn\/video\/newimpress/i,
      };
    },
    filterOff: function () {
      FilterRules['sina'] = null;
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
      Toolbar.UserInterface(aSubject);
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
  Observers.startUp();
}

function shutdown(aData, aReason) {
  Toolbar.removeIcon();
  Observers.shutDown();
}

function install(aData, aReason) {}

function uninstall(aData, aReason) {
  if (aReason == ADDON_UNINSTALL) {
    Preferences.remove();
  }
}
