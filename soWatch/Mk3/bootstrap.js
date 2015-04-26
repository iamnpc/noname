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
  css: Services.io.newURI('data:text/css;base64,QC1tb3otZG9jdW1lbnQgdXJsKCJjaHJvbWU6Ly9icm93c2VyL2NvbnRlbnQvYnJvd3Nlci54dWwiKSB7DQogICNzb3dhdGNobWszLWJ1dHRvbiB7DQogICAgbGlzdC1zdHlsZS1pbWFnZTogdXJsKCdkYXRhOmltYWdlL3BuZztiYXNlNjQsaVZCT1J3MEtHZ29BQUFBTlNVaEVVZ0FBQUJBQUFBQVFDQVlBQUFBZjgvOWhBQUFDbWtsRVFWUjQycTJUWFVoVFlSakhqMEgyUlV6YjVuSFRpeXo3dURSTWJadG1pUk1zc1M0c3VsRENKSlBwUmRKMDU1eWRNNmVobEthMkN5bFNETE1JRWdwZGdTaFVRbVdma0tNcnUvREdkSnRqT2orYXpyUHo3MnhIcFZFUlFTLzhlZUhsK2YrZTUzbWY5eVdJLzdrODFmSUVubFdlZ0NsV0JpT3hBMmVJNkg4QzlPVnZxVmlvVlFKY3ZCOGNLYUFseFk2RmFVTWdFTkQ4MVF4V25odTB4TS9BRW84SU5lMEhBdDhocmxGUnUzODFsaE9iWVZZY0ZvUDk2eWFlVThGeE5SZjlkMnpvdjllTHdLb0F6NHN1OERiZFJJQlNwRVlBQmdxaUQ0NFc3M3p2dmFJSWxSNEd6TGJsb05XK2hHY09BYS9HQmRROUVUQS92d2hQY3laNE0rbGJwcFRKRzRDNlk4VFdoL25SMTNpV0JGZ0pJRmhVcUdsOENYMkxnRHhST2RjRkRJN3hXSG5lTHJWbEpuc2oyK0RpeXNObVJvVVZUbzJoK3ZNNDN1QUxHMFBLYmx6R28xRS9NR0tUQUxUS0cza0hscmptTUlCV0kyaE5oSDl1Qm1kYnZjaXkrbkMwZmg3NkJnKytlWU5BWjRIVXBoZ0hTaGE3em9nU0FkWXdnRW9ReXhQM1BnUGNjNnZvR0Z4QzY5TWxqRS96NGd3NjE3TkxZc214bjBhb0xKb3c3SUpnQ3BIVkV1U1dIbmg5RzNoM0Y3aGZqQVV1R1Q3bWdKU0VVdkdyckR4bkF6QjdPU2JtY2VHMnhhbEt4VnFBV3NwaVhwTjROMS9vUEh5a0NrUG5maFB6NEZNbTQ3NmdZWnpsRzVDT2JDTE5VU3JyRHB0RmZhQlA0NDJwQ0o5Tkp6RkVsY0pPVldDQXVkVFZSTmxLdEdibnFYVFdtYVJqWEYyUjA2Z2pOZ2swT1J6S2JpeWo0VGJ1RWRxcE5yRzFCRlRSZGhSUWpwNTBvek5KdzdrUDZXaG5tWlp4M2ZqZHk5d2VaT0tzVllhYlg3djF4TDZMekhBUHo1RFY1NmkzNHlYTVNLV0dtdUxFOHZ1ME5hNjlPc2JaK2NlL2NZU2FGdDg5b3FTZElOSnFKbE5TVFY1WlJ1MWtvcFoyYWJMb21ld014a1grQU04bnZSbVVneHFXQUFBQUFFbEZUa1N1UW1DQycpOw0KICB9DQogICNzb3dhdGNobWszLWJ1dHRvbltjdWktYXJlYXR5cGU9Im1lbnUtcGFuZWwiXSwNCiAgICB0b29sYmFycGFsZXR0ZWl0ZW1bcGxhY2U9InBhbGV0dGUiXSA+ICNzb3dhdGNobWszLWJ1dHRvbiB7DQogICAgbGlzdC1zdHlsZS1pbWFnZTogdXJsKCdkYXRhOmltYWdlL3BuZztiYXNlNjQsaVZCT1J3MEtHZ29BQUFBTlNVaEVVZ0FBQUNBQUFBQWdDQVlBQUFCemVucjBBQUFHQWtsRVFWUjQydTJYZTB4VFZ4ekg2d09kRXg4SXRFVmNOcmRzbVZrMEprYWx0Qlh3TmFaekdqZmlvbTdSUmRsOEVFR0gzQ2ZGNlFTbW02SWhNQ1BHT1RkbkpjNEgyVFQ0bUpJTWg4eTVxZmlhSWlpMGxKZGk1ZG5lNzg2OXR3OUtTOFV0SnY2eGsveHlldy8zbk8vbi9NN3Y5enNIaGVMLzlxdzJnMExSdTJGMWNBSTQxVTQ3cDl3TU9sUXY5dDlNVVBRSFBlZzFKSWVxbnlwQS9EaEZ3TTdKL1pvcVZ3NERVdFdTMlRqVkhZRlgyYVRmdk9vT0RJcm5ueXBFMGZ4QVkxMVNpQXVncTltTlMwejJxa3ZsQU03YjdmWWQ1RG5UYURUMitjL0NNQXdlWnVkVVI3b1Q5ckpkYzREV0pvak5aclBkSUkvWWZ5L09LVjhCcjdyZFkzR25XUzF3Tm9FMDhraDdjbkZHcVlLNHQzNkU3THdhTjZoUk9MWmFpNzJycG1MUHF1azRrZjZocUNxck4xUUF1OThEOHBmQmZtak5Pakp0cjU3cTk3S3p5aFAreEszY0N6aTZKZ2FuOW01RjRTOS80V0N4RmNaekhUaDVvUkgxRDJXQXB0cHFGS1hQZzhETFl3Uk9XUWhxU05CajFXMk1jaUdKY25Td3ltNEJpamJNeGUyYnQvRFZNUUc1cHdXY3ZDcWc2SWFBL0ZJQlRMNkFQeXBrQ0V2NVZWeG54cmpHRVlqaThrV0s1L3dDSEprejRFSjJWQURPdkI4b0QrUzlBVG9LTTVGZUlHQnlwZ0RqZVFGWFRaQ3NwRnpBZ2x3QjgzTUVWTlRKRUg4ZjNkNWw2NVNaZmdHeWRMMDM1VVlIb0pseWVJRDFBWkQySXBJeWZwTUFSSnVkSmVEZDdRS21maUc0K3I3ODJTNEJXQnN0YU9QRE8zbEIzUVkyT054dkRGeUxINUlyRGVDSTBjTjlic05OUXd5bVo3UzZCTHRhWEZhekt4dHNXelR1c1V3WVNHcXpmcjNneW4wMkRLQThBV3g4R0k3eGl4Rzd6dFN0ZVBUR2RzeEliM1FCWU1zRTl4emlnbGgxc1Y4QVVtWnJuTFNnd2wxeFlHRmV4djdrbWRpY2N4dzZ0Z2JSbjdkNWljZGsyS0ZQYmNCSE9ROWs4YlpIZ01HOUJlS0NCRWJkM0syNFpia2lzTE83SkFEUkUrUzlkZU1iYUxVK2dLV0pDQm5xQ0lRRlVldWJKVkhueXZXcDlSTGM3ak90TXNDVkFyZTR1QkRIZlBVSmlzRStBVnFvb1MrNUJyQU9nTTV4Y091c05PK2VzMjBTZ0NqVzFSWmxONkdsM1ZHUWRyNERyL21rWi9CNFk1ekMrN3k0VDRxRjF3QnBrS012T3dab2I1SG1QbGpTZ1JrWjk2SGphb2xaTU1uUWdOUURMYmoveUNGZXVxZkw2b2ZMYzNIT2VGSmU5RjJNZUZXVEt3dWNBT0pnWjAzNGRnSFpXNnU4eFIwQ3lxb0VYS3dVVUc4VjNJRjMrVEE1QlViQWF6dkZlY1NGaVF2aVFtbmZXY0NyZnBXQ0xqSEVUUzF0UlpnYll1dEU0Tkloa21QdDhHam1NbEwvbDN1bUxkdDVJVEtFalZWZEVTODF2Z0ZZNWFZMlJvbThLZjFnU3duekd1eDBvV1RyUndKZnh3SjVzNEZOWXoyRS8rUmpjWTZaNjBOY2JRVWZOTHI3MDVBUGlib1dINFR0a3dKd1oxbHdsd2tjRUtJM3VHNE9MRTUyK1Q0NkdUbDB1c2U0MzVtM1FiUGZGZXFZR29Ob2tiUjVxYStUc2xmeHdrR1hSSUFUY1lHZTIrQVRwcE4xK2phZlRzUXVLczBGYk9QVmxWT1lDa0ZMbVhrOVhSc1ZrV0tlSldhTmhqVk44UEpDL3JUK3IyN1Q5VG1TRXgzUTJySlc1UWVnZXp0TXI4QTNERWZxUHlsc3ZDb2RLVUZEZEt5NVVzdWFJNXc2SW9BSTQrOVczSmZFUTVxSEY0aDdIN0VqcFp3L2xMSWNLK2tDTEtVTGNTdEZqODFVRmhiVHA1Rk1INENSU2NKYzlrS21lTE9lUU4vVFJGTG1mV01URzRmcWFWT29LS3BoYXQ0VTU0aWtUT1A5bHVhN1NZb0JKR3F2dXlBSXdLbDVneVNBeS9RMHFlOHpPZzlwOUM0SUtlR3dVeU1ReDVTQ29mZmlMYVpzdzhTMVZkTWlxR3BXWVVCdmFkVmNiVFR4eEdrdFUxTVN5WmhNRXhQcUIvZmdqaGc4aWtSdm5RUkJBSFpNN2ljQmxIMGNBb0ZWMi9LWWRXUy9EUzR2cldCK1FncjlBNWJReDAyUmpMbHNYSHlWZEhYWHNxYVZHdmF1ZkJ6SEdmdUljMmhaaTY1bmQwVTYrSFZ5a0pTSUFNWlpzZ2V5ZEgzVHdBeFVKVEJIRDJ4bHY3eE9jcjZNZk5Pd2pEM2VrVXg5L3pDRHpUNURJbjAxZ1NnWUYxOGEwSFhQSHhzRHZ1NExZSWRGbkZ3eU9sRWNUTENrRk5JeTVvMDYyc3c1UHlMdjU0bndqK1FwVlRzQ3NFMUxtL2RITWpWVzBpZG5BU05uUVdUeXZiRlBmSE1lODZsNUlKbVFpamFnci9nZVFabW5hdWxxdmZQdkdzb2NyNldxRjJocGk5N3BiZzFWblVqNlBuSFdBS2tPVU5VZlBCUC9nLzREQVlCaWczZFp1RGtBQUFBQVNVVk9SSzVDWUlJPScpOw0KICB9DQogICNzb3dhdGNobWszLXlvdWt1IHsNCiAgICBsaXN0LXN0eWxlLWltYWdlOiB1cmwoJ2RhdGE6aW1hZ2UvcG5nO2Jhc2U2NCxpVkJPUncwS0dnb0FBQUFOU1VoRVVnQUFBQkFBQUFBUUNBWUFBQUFmOC85aEFBQUJOVWxFUVZSNDJtTmdRQWNCOHhNWUFoYnM1MHBaOTU4M2V6TVlnOWdnTWJBY1RoQXdYd0dvNkx4VTIvSC91dXNlL3pmZS9SWUZnOFJBY2lBMVlMWG9tcG5EbDc3WFhINGZwdUc5eWU2My9VYTczaVNBTUlnTkVnUEpnZFNBMUtJYUFqUVZTZk44Zy8zdkJkQWRDQklEeWNFTUFic0U1bWVRMDJDYVFVTFRHUmdVUUJpYlQyR0dRTHdEQ2hOZzRFRDkvQjVtOHdadDlmMzNTclArN3pUVjN3ODB5QUdMUzk2RDlJQURGaFRDSUJOQi9vUXAycW1oc1A5L1pjSi9FSDRhN3Z4L3A3SWtpa0hRTUlIRURpaWFRQnhRWU1FTmtPVGYvOTlmN3o4eWZtb3AvMzhsTCtkK2tEeElMVWdQU0M5MkEzZ1o5di9YWVBpUGpKL0tNZnhmeThuUWoyRUFWaThnR1FEU2VFQ0FZVDV5b0tKNEFXc2djakxzdnllRHFSRnJJT0tLUmx3SkZqTWFLVTVJVkVuS0ZHY21Dckl6QUltUmgxNGlXVnFkQUFBQUFFbEZUa1N1UW1DQycpOw0KICB9DQogICNzb3dhdGNobWszLXR1ZG91IHsNCiAgICBsaXN0LXN0eWxlLWltYWdlOiB1cmwoJ2RhdGE6aW1hZ2UvcG5nO2Jhc2U2NCxpVkJPUncwS0dnb0FBQUFOU1VoRVVnQUFBQkFBQUFBUUNBWUFBQUFmOC85aEFBQUJpRWxFUVZSNDJvMVRUVXRDVVJDOXRHc1ZRZW9pRW9JVzRhcGR0R3BoVWYyRElPcGFVR0hsQ3d2TjZnK1l1blpoMGtNcWYwR3JJRjdMRm9IOWhGeEdwcEM1OUozdXpEV2ZYNmtIQmk3bnpzeWRPVE5YaUJiZ3dqZUhRN2NKWTdLQ3ZWRWIyOExHem9nTncyMGpPRkZRdkVSOGFVejhoL3FSeDhLV0FBTEtVbXRBL2x3Ym5ZbFRkK1RUTzNoZFdPeVVEUUMxQ3JwQUhOMHBIL0p0SzdzZTh1amdaeE1EUVQ2VUpOU29CQWN1azh1K2xoZ2FXY250SUxHd0tGZ3dlcDFLTEwwRHViQzJyNklUME1tVEwxVnhPVzhKVmp1MXFoMlBaNEhZREJDZEJrNTlUZ0xpaWFPN2t3WlBNUkV2Qkk4cUgzT0Ura08xNUp4L3l1MWlFaWhtVjZnRU5PZjdNMDJhKzBCNkEzaDdHS3hETTRIaHNaRlkxbVJTelRzNERyemNEazZRWEdtMEVIUVZXTVRxSi9DVUF4N1RRUEcxZjNDdDNDSmkyQ3Q1SkpuTjRjZEl2czB4cXQzbVJaS0tzRzZHV3lUWnNraHRxMHhKTWtyRTc0L3VRT0xvVG5hc2NzL1BSSW11L01CZEZEeWh1Rjl6L1Q1VDgyK292a2djUktaNFRHenF6QnoxM0lGZlArKy9SQ3QwbjlRQUFBQUFTVVZPUks1Q1lJST0nKTsNCiAgfQ0KICAjc293YXRjaG1rMy1pcWl5aSB7DQogICAgbGlzdC1zdHlsZS1pbWFnZTogdXJsKCdkYXRhOmltYWdlL3BuZztiYXNlNjQsaVZCT1J3MEtHZ29BQUFBTlNVaEVVZ0FBQUJBQUFBQVFDQVlBQUFBZjgvOWhBQUFBc2tsRVFWUjQybU5nb0JSVXpEZFFxSnF0MDFBMVIyZDkweUxML3lBTVpHUEZTUExyUVhwQWVobUFuUGZvQ2tDNFlxYk9GbVNNTEFkVFh6bEhaejhEbFBPZVZKZkRMR2FnUEF4bUFwMHlRN2NJU004R3NaSHdGcWo0LzhwWnV2WXdHcGtOb3BFTjJBSVdnQnFLelFDa01FRVlBRGFWQ0FQS1orcXVSbkxkYnRKZE1FczdHRzRBa0kzVEFDQXd4bVlBa3NGZ1MyaG53T1MxWWY5Sk1nQWRuTHl4T2hRV1VNU21LTXBTSXNWNWdkTGNDQUNrQkc2MkplUkRtd0FBQUFCSlJVNUVya0pnZ2c9PScpOw0KICB9DQogICNzb3dhdGNobWszLXBwcyB7DQogICAgbGlzdC1zdHlsZS1pbWFnZTogdXJsKCdkYXRhOmltYWdlL3BuZztiYXNlNjQsaVZCT1J3MEtHZ29BQUFBTlNVaEVVZ0FBQUJBQUFBQVFDQVlBQUFBZjgvOWhBQUFCNjBsRVFWUjQycDJUVDBoVVVSVEdqeTVhQjBXMWFjcGwreGJ0MjBXMUtJUHBEeVNFNDJBUnRqQUNvY0FKMjlTaUtKSEFWYmdTSmtlTGtZZzB3b0xLaDhQa2hKTkorR3JHUlZhT013c2Y1cTl6NzlONTgySTA2RHdPNzl4ejcvZmQ3NXg3cjRoYWZHUXYvK095QVc0Ylh2ZFVKSWczODVvMWxpU3VRVHIvZ0szc2MvOUJNaDM3cWJodnlIVWRzam1ETVZneFRNYitKWmZyTzhOak5ZTzFDb3lzVFlIOTJ5M1kvSXVKeG1vK3RsNktKVmo5dldLVDZabGV5enlhNzFQUURoaTdCYlBqTVBNY1h0NkQyd2ZJbjIra2RTakNtbjQrd1VoQVlLejFjUVM2ZDhQOE95Z1ZZZW1iL2d2Z1RzS1RUb3B0d3NkVFVsUENYM1dSVVBERWZkMzVHWGdWUCtlVmRUODEzWWl4bTB3M0s4bVpCcCtndG9uRzFreTlyKzdBUXJiK2tYZ2xHR3doZTB6cUUzQkRhM2RmYjNtc0xDK0VDVXhEcWdSZDIrRFhGeHRHbzFHYzk0Nk5DL21NSFh2ZXFoMkhDR0pEd1RGK3Y2UU5HdSt4aTU0bWt4Unl2cHFsMmJla0JoNzV2Wmg3VWI4RXE2S25pY1dMU3BLK1dsVzhNandZeVA4NmdSc1huSk1TM0lQUlQ3M2hFaThMY3kxS2ttcW44cU5vYytXZlpjZ2xXZTRVSm84S3BidE5URjhSUW8rSmF3cDZlSmo1bUpBNXEzNUNXR3pYWEdLWG5jdWU5c0ZUZWcreUY0UVA1eVI0a1ZaKzl4N29hTURWeWFsbWYzRTlkNDc3Qk00UjJmY0hGN2JMNy9wSlBsTUFBQUFBU1VWT1JLNUNZSUk9Jyk7DQogIH0NCiAgI3Nvd2F0Y2htazMtbGV0diB7DQogICAgbGlzdC1zdHlsZS1pbWFnZTogdXJsKCdkYXRhOmltYWdlL3BuZztiYXNlNjQsaVZCT1J3MEtHZ29BQUFBTlNVaEVVZ0FBQUJBQUFBQVFDQVlBQUFBZjgvOWhBQUFBdzBsRVFWUjQybU5nR1ByZ3NyTFdleUQrRDhYM3NhbTVvcXBsY0ZsRnErR1NzdVorb0pyNWw1UzFFcEFOK0krTTBUVmZVdEh1UjFjRHdpRER6aXNZQ09BMTRMS1NaZ0dTM0hxUVMwQ2FRSzZBR1lMZkFLQ1h3QXFWdE02RCtPY1ZOQlNnTHJvUFY0L0xBSkJpSlBIM0lFUFExTjRIaHdVdUF5NnI2RGhnOFRzb3dPZUR2RUpVSUtJRUd0RHA2QUdNTlJCQmdRV0tNakFHc1pHOWdSUjlJRmRnRFVTMHFBcEFTeWRvOHBBd1dBOHlDUnNHQlNSeXRNRTFnZ0lVR0VZTXd3TUFBTlN5OHVDcEovNTVBQUFBQUVsRlRrU3VRbUNDJyk7DQogIH0NCiAgI3Nvd2F0Y2htazMtc29odSB7DQogICAgbGlzdC1zdHlsZS1pbWFnZTogdXJsKCdkYXRhOmltYWdlL3BuZztiYXNlNjQsaVZCT1J3MEtHZ29BQUFBTlNVaEVVZ0FBQUJBQUFBQVFDQVlBQUFBZjgvOWhBQUFDakVsRVFWUjQybU5nUUFQL256MlQvenhyUXZPNzR0UnRid3NUOXI5SzlyMytwaWpxMU9kRkU5dC9QSDZzd29BTC9QLy9uL25ML0ZsRm4yZE1xdnQ1Lzc0R3N0elBtemYxUDgzcTZuc1pZZm41ODV6T3lTQzFHSnFmZEhRMHoybHBxY3ZQeVoxY1hWblpmdkRnUVN0MFMzNCt2SzM5S3RQLytydnF4RU1vaHV4dGFHcVdGeEI4eDhyQStCK0VIV3hzRGoxNThrVG0xNUVURnRpOCtDTGEvaFhJSldDQlYzZnVxSWl4c1A2Q2FWWlJVTHozN3QwNy92K3ZYa2s4WlJENi84ckM3ZmlQNjlmVmtBMzVzblYxeXNzQWcvOC83OTNVWjZpcnFXbUdhUWJoTlN2WEJJTnR1bmRQSG1UQVV6YUovODhWRGI1LzZaOVJCSE0ya0daLzRXLzYrZk9zOXNrTUZpYW1wMkNhQlhoNFA4TVZ3UXdBWVE3Si84OGx0ZjYvTkhNNTlmUGNaWDJRL1B2YW5IV3Zzb011TTRDY2pPeDh1RitSRFVER1BMS2ZRZklmK3R2Nm5udnEvd0liSU1YQUJEWkFRa1QwRlY0RGdKcS96bHFVREhaQlJmN3lGMDdhL3hsaVRTeE8xVEJ3L1E5bFlQK3Z6Y0R5Lzh5Wk0wYllESGp0SHJvTkpBYUw5aGZPVm85ZlJYbGVaOWhkWE5sOWowSHcvMG9HM3YvWGdmUWE5NEJ0eUFZOEUxQjQ5Mlh1MGpqa1dQZzhkMjcyY3czRi94OWFxMmN6L0FCRzQxTVcwVi9JdG4zSXIrb0QyZktwdmIvOFB6QTlJR3Yrdm11Zjh6TjVsYzhnQTM1ZE9HTU9GbnlmVXpiNUthUHcvNmNzWW5CRFFQSC9iZm5hY0pBQi81OStFdmwyOEpqVjI0VHMrVS9aeFg0OUU1UDYvNzZrWURGeVVtWi9iZU41NkJtdkhOREppdi9CaG1HTEFYQ1VpdjUvN1J0d0NKalFlTkR6QS92NzNJckpMNlIxL3I4eWRmbi9Rc25vL3pOdTJmOVBXWUd1WWhLQmFHWVUrdjgyTFg4K2htYVVEQU5NS0IveXFtYS84UWk1L2x4Syt6L0lWUzgwTGErL1M4bWIvZXM0MU05SUFBQzNPNmJDRUtoMUpBQUFBQUJKUlU1RXJrSmdnZz09Jyk7DQogIH0NCiAgI3Nvd2F0Y2htazMtcHB0diB7DQogICAgbGlzdC1zdHlsZS1pbWFnZTogdXJsKCdkYXRhOmltYWdlL3BuZztiYXNlNjQsaVZCT1J3MEtHZ29BQUFBTlNVaEVVZ0FBQUJBQUFBQVFDQVlBQUFBZjgvOWhBQUFET2tsRVFWUjQycFdUVzB5YmRSakd2eXpabG5GQndqeVF6Q2pkeWdvS3h1UGtScDFtVjNxeGFPS3lrQmcxVGtUalliSVpyUjJ6TUVKYlZsZ2NjVG9VTXNGT01ac21Cck13V0NmbDBDT3NsbFhhRmVqSGFlVlF5dForck1CYStQbFJFdUtpWHZnazc5WDcvSjcvbXpmdlh4RCtROGZ0NG95dTJ5L3B1LzF4dWVaclhFR3g5THJyUUpacDByWFJNR29WdEdLYjhFTHQ1bitBQnR0Z3BNWXh2TUxmWkpkcmh4bjA5bkVxTzd3MzE4MktzMS9jQVZkMitXUExzamtxbHhTVnVKNklzTWR6bTgyVjNWVFgvOExzemZsVW9MSEh0N2hHZlBuc09xeTNEa2FHNVdiZjVHMGlZWkdXaFRtMnRTK2hQUGdOWHpYOHlPV1JLQjFqY1d4akVsT3lUMmZ4eHU1NDNlZ2NXYmtRWENRMGVZVVRNWW0wOHpjb0tEYlMxdUZrTGpyUHpPZ1F2M29uT0dHZHh1U2U1ZXMvWjVDeHRCUmNaUnVjYmc3RDhJUVZiVGlHWUpxajRDMERyZDkvUzlKY1M5aHJ4VG9nTXRydjRwTzJRVXBhUkl6T1craTdCcVMxamR0OGtuUGNSZTMwSEVLelJPNnJGYlNjMGtIa2QrZ3ZoK2NFL0Q4WTZQdkRpOG5TeS9PbnZieGlFcW13K0JLcEFHM1RCOUpQb1FCQzR3TDN2bTZrOFZ3cnlkOE93VUFWMU9XRGRnTUpYUTVpT0k3VEYwQ3BkL0prbFZzT3VMWXN3Qk9QRzg2OXV5dzBnZkJSQy91SzFZek1SRW5XN29YWDVIYjFWbWg3ZzF2dGg1bWFsWEFFSjluMmVSZDVGUTdLTzMxSjJaRmQvWFR0R1FSOWlJeGRCM2l4enNhWXg0N2xpcC9GdDlQbGRXOGgyVnJFMkhnSWxtSm96Q0wzcWMzazZucHBDRXFyRXp6akVVb2hjNitHL1BlYmVFam5vc1o4bFJHUERmZFFpTkh3QXROekN5bllNWEdETkkyRjdlcEw1Qi85bVpPOXcyN0I2RGtsQ3J1dHFQWnJlRlJ2NTdFeUMxbmxQUlEyOTNQVzBvY3JNSTVObk9iajlpQ2IxQjFrZmRyT2puSW54M3FHVmxJTHZMdjBhaUJ0VndONXg5cklQVmlQcXF5TEI0OWNZcnRzekN6dDVLNVNDK25xeTJ3dHVjZ0RoeS9LNFE3eTFHZFdieUI5N1lKMnR3NHI5cG5JTVRwUXJNS0g2bmxZM1lqSzRFRjV0QWVGcGhPRkhKUlZaaWZueUhsVXhicWw5UU5LS2VPN3orNS82VFNLNDI2VUp3TmtGQlJhaFQwZnZxZDh1ZWphemplMThaM3ZWQ1d5aXlxWGxJVWxVMXZ1eWR6L3IxOTN3NlpzZGI3eFFrS2xxWXNMR3g5NVN2Z2YrZ3VmMWtpUWE0a3hVQUFBQUFCSlJVNUVya0pnZ2c9PScpOw0KICB9DQogICNzb3dhdGNobWszLWt1NiB7DQogICAgbGlzdC1zdHlsZS1pbWFnZTogdXJsKCdkYXRhOmltYWdlL3BuZztiYXNlNjQsaVZCT1J3MEtHZ29BQUFBTlNVaEVVZ0FBQUJBQUFBQVFDQVlBQUFBZjgvOWhBQUFBbVVsRVFWUjQybU5nd0FNU0VoTCtBNm4vQ2dvSy94bElCVkJOeUpoOHpRNE9EdjhIUmpPcGZrZjM4MzhCQVFHU1hBRFcxTkRROEgvRituNE13d0lDQXY0VGJjQ0ovd3ovSC93ditOL1QzNEJoVUgxOS9YK2lEQURoMC84Ri9sOS8zL0Mvb0tBQXhSQmpZK1AvUkJrQXc5ZitPL3lmUDM4K2lpSFFSRVpERjFBVUJ0aGlBWnVUQ2FZRGtsSWlLTkZRa2dyaFdSZHFFTkVBQUlPRnZ3eXNSUWtzQUFBQUFFbEZUa1N1UW1DQycpOw0KICB9DQogICNzb3dhdGNobWszLTU2IHsNCiAgICBsaXN0LXN0eWxlLWltYWdlOiB1cmwoJ2RhdGE6aW1hZ2UvcG5nO2Jhc2U2NCxpVkJPUncwS0dnb0FBQUFOU1VoRVVnQUFBQkFBQUFBUUNBWUFBQUFmOC85aEFBQUFVa2xFUVZSNDJtTmdHQVZ3OEthOS9mOHpjM01NREJMSHBRYXVHWnRHZE0zb2NpaTI0NVFnUmpNK0Z4RHJOWnlLc0JtSTB4QmlYSVV1QnpjQW05OUljZ0UrTCtDVHg1c08wUDJITEkvWDcwTVBBQUFIaXV2VWFlVnByQUFBQUFCSlJVNUVya0pnZ2c9PScpOw0KICB9DQogICNzb3dhdGNobWszLXFxIHsNCiAgICBsaXN0LXN0eWxlLWltYWdlOiB1cmwoJ2RhdGE6aW1hZ2UvcG5nO2Jhc2U2NCxpVkJPUncwS0dnb0FBQUFOU1VoRVVnQUFBQkFBQUFBUUNBWUFBQUFmOC85aEFBQUN1MGxFUVZSNDJvM1RYVWhUWVJ3RzhQT3hJMnBpTjJGQ2dhS09kT3JXQjExMUUzMWNlQldrRldtbWJtczZEQ3NoVUpJR3djS0tFa3VvakJRekZadGxhZFFVSlV2Tm9adnBuRnVtcGVTYVRrMUxMSjNuYkUvdURGMmp6eGNlM3F2bjkvNDU1MzBKNHFjVnJiRWQzTkkwdGhUMnlJTHdtcjZab0h5dGt2aWZaVTBudGc1ZURPR2lINHpQeTN1QUNMdUxUNlQ1TXpacmg5aW9la1BxWDhzakJTRWM3ak00WS9CSHlReTFsbFVvdm1QQ0ZWbHYrTExhVWFsVTFCcHdhUTlkQ2kwRGQ3TDFGTTZiQkpBMitYa1J2UWNKLzhSQjFHREJMeE9NeUFRTFBOQzRNa0VmamYwM1NQU01seUR0TVFuVlFLQVBFalBOUWxKajhrWEdNOGdsTjhCVytlRzB4UU1zT0diUk5wYUgxSG9DT1hydkpKR1REdXlHRTlzMS9WN0VyaUFkdU12QVdjcEFicUI0d09ua3dIRXNIT3czcEdvb1hEQVQza2ttV096NzZvU2tybmVSQjBiVFNkWlZ6R0EyTHhCcEhhUVA0TTdpOGh5UzZ5Z1U5SHVSc0VrWEVzMmNHNmtoQmcrUnJGUE53SlliaUl4T0Q4Q1huVzZBNDNmWmN3cjVmUVJVUnBJSFFqNjZzR3RnR1R0dWRyc0lZeUxKenNnWWZKQUY0SEF6d1FNMit5aEdyUlpZSjBmNDA1VXZhQ2liR2NRWGQwRFUrQjR4K2ltSW43NkR1RWhuSVV4SkpLeFNDc1BTQUtSb1BZRDcxTGw1TzdKcm81RFZUaU5uSlR1TG4wRlNZVVJNN1JCRUZmMFFLYTYvNGIvQjZ5VEJsRjFPNHExOEhZNDFlSUR1WVExU25naWdmRWxEMWhTTStNdXRpS3MwSXJiYWpQRENGb2lPcTF2Vy9rSkRrbi9QWENZTjA0a2daRFQ0NFVBWmlZVGJGRTUyMFVodkZpUCtXanZFWlFZZTJKQ3JnVEJaM2U1ekQ2YlNhYWtwbFdKMWl2VTRlbThiajBpZk1VaDRtQVh4MVZjUVZWc1FXMjdFcGxOVjN5V0tLNjIvZlE4VEdmU1JycFRnSmFHcTB4VlgzZ2R4aFFHeGxTWStjWGQ2RVpwWmFndFZsSjc5NTZ1TVVuVzJDdFU2aEJXMVFWaW9ROFM1K3VtVll1UEd6RnQ3LzlUNUFaMjg5SlAzWlFQR0FBQUFBRWxGVGtTdVFtQ0MnKTsNCiAgfQ0KICAjc293YXRjaG1rMy0xNjMgew0KICAgIGxpc3Qtc3R5bGUtaW1hZ2U6IHVybCgnZGF0YTppbWFnZS9wbmc7YmFzZTY0LGlWQk9SdzBLR2dvQUFBQU5TVWhFVWdBQUFCQUFBQUFRQ0FZQUFBQWY4LzloQUFBQVNrbEVRVlI0Mm1OZ29BWDREMFRZTU1tYThZa1JwUmtiRzY4aCtCU1JaUURKWVlGUElWbmhRSEZNNERLUTVPZ2oyUnN3eGJqNEZMa0Nwd0g0UXA2UUdNRkFKRm96eFdtQUhBQUFWN1cxUzM1dkJJa0FBQUFBU1VWT1JLNUNZSUk9Jyk7DQogIH0NCiAgI3Nvd2F0Y2htazMtc2luYSB7DQogICAgbGlzdC1zdHlsZS1pbWFnZTogdXJsKCdkYXRhOmltYWdlL3BuZztiYXNlNjQsaVZCT1J3MEtHZ29BQUFBTlNVaEVVZ0FBQUJBQUFBQVFDQVlBQUFBZjgvOWhBQUFDQjBsRVFWUjQycTJUelV0VVlSVEdIeVpjZE1FeGpabnJmRVc1TVFRM2hvdEVrQmJ0U3FFUVcwYUptMENoUmJicmJ3Z3FhcUhTSi9hRmcwTnAyQWVsbXpiakNCRU9PRkhUUU9ORVJaa3p0M0ZtbnM3N2V1L3RnaTVjZE9ESGVjNTczdWVjZDNFdnNJT29JbktqaXZBNTdEUXFpSjRRd3lXbGlWaW5ES0NRY1BvRWRtMHhFVUdUaUVTSmxvWUt3bDhxaUN6WTJ4L2FBOTZMMFVkRWQ0dWVKc3dESGpOOGN2aHFBK0hqc3ZtQ2JiaEtoQTVKTHF0YUJoYUkvWHZrZFNjMzYvQlpkMEFSNXFsMU5GdEZoTHJYWWVaRVUvUjV5V05LMjJ3VUVUd3NPYUhxMzJpZTFPWmZpT3d0SVBqMkt3STVZVUdnb29CQTJkRWVNa0xKMWl2ZjBkaUFEMmdhektDcGx2WHY0OXJBSUhuckFabk9rRlZ1c3J4QzNyeXZlK3FPM1BYUWVBd3ArQ2VXWTIxa1lwYWYwbWtPOVBjelpKcXNOd3lkVmYwNW02V082Um1xdStLeHFiK08xekErY3U2bDdoL3A2V0VvR055Q09uZmoyUXUrZ2FHWmgzRUZUMUJYZG5wdHJhMHUyOVZPUEVXZFJyeVg4UWkrUDA2anU2dUxYdTNGRytKeEdNRWQ0SGx0YVVrM1JvYUgzVXQ5dmIwdTN2TmFLa1h4OERhd2RoZG93VDNnNEd4SFI2NjZ1RWlyVk9MRStEZ3ZqbzVxazhxcXRpeExtNnZKSkdmYTIvVUE0WXo3SWFraDhWaHNMalUweEoveE9MbTYrdSs5K1R4L1RFMVI5UjRIQW1yek85bmN0KzFQSk0yandqVmhYc2dLMzJSVFhuSlM4cVFZVDB2MjQzL0dYM0U4ci9jU3Z0ZGxBQUFBQUVsRlRrU3VRbUNDJyk7DQogIH0NCiAgI3Nvd2F0Y2htazMtZHVvd2FuIHsNCiAgICBsaXN0LXN0eWxlLWltYWdlOiB1cmwoJ2RhdGE6aW1hZ2UvcG5nO2Jhc2U2NCxpVkJPUncwS0dnb0FBQUFOU1VoRVVnQUFBQkFBQUFBUUNBWUFBQUFmOC85aEFBQUNsVWxFUVZSNDJwV1RYVWlUVVJqSFh4UENvQS9vb2c4SXV2SW1xS3ZVVWxraUtkcHM2cHZMNVJRWEpoWU1iVzR1TitmV3ZtcGJLMHNGQ1pTd3NJdm9RNklMNnlvUWhDNmltd2doVk9qMVBlL1gzcm1aczVuT2YzdVZ3TUJnSGpnWDUzbDQvdWM1ditkL0tHcWJCVkJaWEZEZm5ONnYyTHVOdDhXUTRRaTFrMFZDalJWU1VKK1MrNjVDSG1nRmJ6MUg1UDYyRTVrTHVHdGJJMEVkbGorOVFlcW5oT2p3VFJDSGVqeGpBY0d2T1N5Nkt0bmt6R2NzakhRZ09UMEYwbHVWRUYzYXZkc1dmSFZwZC9PKyttck9WMmZsUFRXZFlxZ2hsNFNiVlh6bm1SbkJYQUMrSXcrc3Mrb2QxMzg5bndzM0Q1S3d3YzRNbXc1dUFudWh6ZVk4OUlRVWJJRDg4Qm9XeC9zZzJNdGl2SzI4UlhaVjdtZHZsZWhZcDdvbEd0QWU0RDMwek9MVWEwajNtMENjNnVtNUo0WWNhbmJJWWhUOWx5R0hHaEIvN3NUNmFoTHhsMzRJblFVSnhsNXhhdXRrQkI4ZGl3MjM0emYzSGZLRFJqQUJmU3ZGK3V2RGNyZ0owYkFPcWNRQ1ZwU2txeFNDS1IvelhhV09mK0I2NllsSWtNWnFYSUFjcUFIanFSMmhXSit1VUxBVXJVUjZpaEVmdFdBdEx1TFg3QmZ3NWlLdzNXVTJwVkFLYXZaSmZ2b283NmsrU1d6bm1ZVVJ5K1lGL2pvekJZcktJaGJWNDNRZ0ZiRVhRZkpWSXpybUJtdk1JL05CL1RIZW9XNFJQTFFrT05VZ3R2Sko1bEZiYnBxWmdmSFd0U244TmxwalRHZjNrTzR5TXpFVmZtUGI4MFZpTHY3QTlWN01VNlloQnE0c3k0TTNFUEdxRVgzV0M4NXg0ZWwvNXcrdE5udk9WWktqZEtXY2ViZW1JLzUyQUt1UkgwaDhITVhhb2dUZW9sb2hQdnA0Um9aS3Y5a3UzOU1qTVRtRzliVWtsaWFHTmp5UmpoZGtKbkJIcStIVHNCVEFzZEV1eU40S0VPUHBKZDVTZmloald6UHUydmVLeUY5SGt1NVMzNDUrcHNLRTlWd3l6bHRMZWxpclNnTVh0V3RyL2crSEE0c2s3T2lqcFFBQUFBQkpSVTVFcmtKZ2dnPT0nKTsNCiAgfQ0KfQ==', null, null),
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
          S3: null, // Menu separator
        };

        var xLists = {
          'youku': {
            label: 'Youku.com',
            tooltiptext: 'http://www.youku.com/',
          },
          'tudou': {
            label: 'Tudou.com',
            tooltiptext: 'http://www.tudou.com/',
          },
          'iqiyi': {
            label: 'iQiyi.com',
            tooltiptext: 'http://www.iqiyi.com/',
          },
          'pps': {
            label: 'PPS.tv',
            tooltiptext: 'http://www.pps.tv/',
          },
          'letv': {
            label: 'Letv.com',
            tooltiptext: 'http://www.letv.com/',
          },
          'sohu': {
            label: 'Sohu.com',
            tooltiptext: 'http://tv.sohu.com/',
          },
          'pptv': {
            label: 'PPTV.com',
            tooltiptext: 'http://www.pptv.com/',
          },
          'ku6': {
            label: 'Ku6.com',
            tooltiptext: 'http://www.ku6.com/',
          },
          '56': {
            label: '56.com',
            tooltiptext: 'http://www.56.com/',
          },
          'qq': {
            label: 'QQ.com',
            tooltiptext: 'http://v.qq.com/',
          },
          '163': {
            label: '163.com',
            tooltiptext: 'http://v.163.com/',
          },
          'sina': {
            label: 'Sina.com.cn',
            tooltiptext: 'http://video.sina.com.cn/',
          },
          'duowan': {
            label: 'Duowan.com',
            tooltiptext: 'http://v.duowan.com/',
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
        for (var i in Utilities) {
          if (i == 'strings') continue;
          else if (i == 'remote' || i == 'youku_referer' || i == 'iqiyi_referer') {
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
          } else {
            switch (aEvent.target.id) {
              case 'sowatchmk3-popup-' + i:
                if (Utilities[i] == 'player') {
                  aEvent.target.childNodes[0].setAttribute('checked', 'true');
                } else if (Utilities[i] == 'filter') {
                  aEvent.target.childNodes[1].setAttribute('checked', 'true');
                } else if (Utilities[i] == 'none') {
                  aEvent.target.childNodes[2].setAttribute('checked', 'true');
                }
              break;
            }
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
