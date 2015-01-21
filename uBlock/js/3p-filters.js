/*******************************************************************************

    µBlock - a Chromium browser extension to block requests.
    Copyright (C) 2014 Raymond Hill

    This program is free software: you can redistribute it and/or modify
    it under the terms of the GNU General Public License as published by
    the Free Software Foundation, either version 3 of the License, or
    (at your option) any later version.

    This program is distributed in the hope that it will be useful,
    but WITHOUT ANY WARRANTY; without even the implied warranty of
    MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
    GNU General Public License for more details.

    You should have received a copy of the GNU General Public License
    along with this program.  If not, see {http://www.gnu.org/licenses/}.

    Home: https://github.com/gorhill/uBlock
*/

/* global vAPI, uDom */

/******************************************************************************/

(function() {

'use strict';

/******************************************************************************/

var userListName = vAPI.i18n('1pPageName');
var listDetails = {};
var cosmeticSwitch = true;
var externalLists = '';
var cacheWasPurged = false;
var needUpdate = false;
var hasCachedContent = false;

var re3rdPartyExternalAsset = /^https?:\/\/[a-z0-9]+/;

/******************************************************************************/

var onMessage = function(msg) {
    switch ( msg.what ) {
        case 'loadUbiquitousBlacklistCompleted':
            renderBlacklists();
            break;

        default:
            break;
    }
};

var messager = vAPI.messaging.channel('3p-filters.js', onMessage);

/******************************************************************************/

var renderNumber = function(value) {
    return value.toLocaleString();
};

/******************************************************************************/

// TODO: get rid of background page dependencies

var renderBlacklists = function() {
    uDom('body').toggleClass('busy', true);

    // Assemble a pretty blacklist name if possible
    var listNameFromListKey = function(listKey) {
        if ( listKey === listDetails.userFiltersPath ) {
            return userListName;
        }
        var list = listDetails.current[listKey] || listDetails.available[listKey];
        var listTitle = list ? list.title : '';
        if ( listTitle === '' ) {
            return listKey;
        }
        return listTitle;
    };

    // Assemble a pretty blacklist name if possible
    var htmlFromHomeURL = function(entry) {
        if ( !entry.homeDomain ) {
            return '';
        }
        return [
            ' <a href="http://',
            entry.homeHostname,
            '" target="_blank">(',
            entry.homeDomain,
            ')</a>'
        ].join('');
    };

    var purgeButtontext = vAPI.i18n('3pExternalListPurge');
    var updateButtontext = vAPI.i18n('3pExternalListNew');
    var obsoleteButtontext = vAPI.i18n('3pExternalListObsolete');
    var liTemplate = [
        '<li class="listDetails">',
        '<input type="checkbox" {{checked}}>',
        ' ',
        '<a data-href="{{URL}}" type="text/plain">',
        '{{name}}',
        '\u200E</a>',
        '{{homeURL}}',
        ': ',
        '<span class="dim">',
        vAPI.i18n('3pListsOfBlockedHostsPerListStats'),
        '</span>'
    ].join('');

    var htmlFromLeaf = function(listKey) {
        var html = [];
        var list = listDetails.available[listKey];
        var li = liTemplate
            .replace('{{checked}}', list.off ? '' : 'checked')
            .replace('{{URL}}', encodeURI(listKey))
            .replace('{{name}}', listNameFromListKey(listKey))
            .replace('{{homeURL}}', htmlFromHomeURL(list))
            .replace('{{used}}', !list.off && !isNaN(+list.entryUsedCount) ? renderNumber(list.entryUsedCount) : '0')
            .replace('{{total}}', !isNaN(+list.entryCount) ? renderNumber(list.entryCount) : '?');
        html.push(li);
        // https://github.com/gorhill/uBlock/issues/104
        var asset = listDetails.cache[listKey];
        if ( asset === undefined ) {
            return html.join('\n');
        }
        // Update status
        if ( list.off !== true ) {
            var obsolete = asset.repoObsolete ||
                       asset.cacheObsolete ||
                       asset.cached !== true && re3rdPartyExternalAsset.test(listKey);
            if ( obsolete ) {
                html.push(
                    '&ensp;',
                    '<span class="status obsolete">',
                    asset.repoObsolete ? updateButtontext : obsoleteButtontext,
                    '</span>'
                );
                needUpdate = true;
            }
        }
        // In cache
        if ( asset.cached ) {
            html.push(
                '&ensp;',
                '<span class="status purge">',
                purgeButtontext,
                '</span>'
            );
            hasCachedContent = true;
        }
        return html.join('\n');
    };

    var htmlFromBranch = function(groupKey, listKeys) {
        var html = [
            '<li>',
            vAPI.i18n('3pGroup' + groupKey.charAt(0).toUpperCase() + groupKey.slice(1)),
            '<ul>'
        ];
        if ( !listKeys ) {
            return html.join('');
        }
        listKeys.sort(function(a, b) {
            return (listDetails.available[a].title || "").localeCompare(listDetails.available[b].title || "");
        });
        for ( var i = 0; i < listKeys.length; i++ ) {
            html.push(htmlFromLeaf(listKeys[i]));
        }
        html.push('</ul>');
        return html.join('');
    };

    // https://www.youtube.com/watch?v=unCVi4hYRlY#t=30m18s

    var groupsFromLists = function(lists) {
        var groups = {};
        var listKeys = Object.keys(lists);
        var i = listKeys.length;
        var listKey, list, groupKey;
        while ( i-- ) {
            listKey = listKeys[i];
            list = lists[listKey];
            groupKey = list.group || 'nogroup';
            if ( groups[groupKey] === undefined ) {
                groups[groupKey] = [];
            }
            groups[groupKey].push(listKey);
        }
        return groups;
    };

    var onListsReceived = function(details) {
        // Before all, set context vars
        listDetails = details;
        cosmeticSwitch = details.cosmetic;
        needUpdate = false;
        hasCachedContent = false;

        // Visually split the filter lists in purpose-based groups
        var html = [];
        var groups = groupsFromLists(details.available);
        var groupKey, i;
        var groupKeys = [
            'default',
            'ads',
            'privacy',
            'malware',
            'social',
            'multipurpose',
            'regions',
            'custom'
        ];
        for ( i = 0; i < groupKeys.length; i++ ) {
            groupKey = groupKeys[i];
            html.push(htmlFromBranch(groupKey, groups[groupKey]));
            delete groups[groupKey];
        }
        // For all groups not covered above (if any left)
        groupKeys = Object.keys(groups);
        for ( i = 0; i < groupKeys.length; i++ ) {
            groupKey = groupKeys[i];
            html.push(htmlFromBranch(groupKey, groups[groupKey]));
            delete groups[groupKey];
        }

        uDom('#listsOfBlockedHostsPrompt').text(
            vAPI.i18n('3pListsOfBlockedHostsPrompt')
                .replace('{{netFilterCount}}', renderNumber(details.netFilterCount))
                .replace('{{cosmeticFilterCount}}', renderNumber(details.cosmeticFilterCount))
        );
        uDom('#autoUpdate').prop('checked', listDetails.autoUpdate === true);
        uDom('#parseCosmeticFilters').prop('checked', listDetails.cosmetic === true);
        uDom('#lists').html(html.join(''));
        uDom('a').attr('target', '_blank');

        // Firefox: sanitizer drops those `href` attributes that point to local URLs
        var lis = uDom('a[data-href]');
        var a;
        i = lis.length;
        while ( i-- ) {
            a = lis.subset(i, 1);
            a.attr('href', a.attr('data-href'));
        }

        updateWidgets();
    };

    messager.send({ what: 'getLists' }, onListsReceived);
};

/******************************************************************************/

// Return whether selection of lists changed.

var listsSelectionChanged = function() {
    if ( listDetails.cosmetic !== cosmeticSwitch ) {
        return true;
    }
    if ( cacheWasPurged ) {
        return true;
    }
    var availableLists = listDetails.available;
    var currentLists = listDetails.current;
    var location, availableOff, currentOff;
    // This check existing entries
    for ( location in availableLists ) {
        if ( availableLists.hasOwnProperty(location) === false ) {
            continue;
        }
        availableOff = availableLists[location].off === true;
        currentOff = currentLists[location] === undefined || currentLists[location].off === true;
        if ( availableOff !== currentOff ) {
            return true;
        }
    }
    // This check removed entries
    for ( location in currentLists ) {
        if ( currentLists.hasOwnProperty(location) === false ) {
            continue;
        }
        currentOff = currentLists[location].off === true;
        availableOff = availableLists[location] === undefined || availableLists[location].off === true;
        if ( availableOff !== currentOff ) {
            return true;
        }
    }
    return false;
};

/******************************************************************************/

// Return whether content need update.

var listsContentChanged = function() {
    return needUpdate;
};

/******************************************************************************/

// This is to give a visual hint that the selection of blacklists has changed.

var updateWidgets = function() {
    uDom('#buttonApply').toggleClass('disabled', !listsSelectionChanged());
    uDom('#buttonUpdate').toggleClass('disabled', !listsContentChanged());
    uDom('#buttonPurgeAll').toggleClass('disabled', !hasCachedContent);
    uDom('body').toggleClass('busy', false);
};

/******************************************************************************/

var onListCheckboxChanged = function() {
    var href = uDom(this).parent().descendants('a').first().attr('href');
    if ( typeof href !== 'string' ) {
        return;
    }
    if ( listDetails.available[href] === undefined ) {
        return;
    }
    listDetails.available[href].off = !this.checked;
    updateWidgets();
};

/******************************************************************************/

var onListLinkClicked = function(ev) {
    messager.send({
        what: 'gotoURL',
        details: {
            url: 'asset-viewer.html?url=' + uDom(this).attr('href'),
            select: true,
            index: -1
        }
    });
    ev.preventDefault();
};

/******************************************************************************/

var onPurgeClicked = function() {
    var button = uDom(this);
    var li = button.parent();
    var href = li.descendants('a').first().attr('href');
    if ( !href ) {
        return;
    }
    messager.send({ what: 'purgeCache', path: href });
    button.remove();
    if ( li.descendants('input').first().prop('checked') ) {
        cacheWasPurged = true;
        updateWidgets();
    }
};

/******************************************************************************/

var reloadAll = function(update) {
    // Loading may take a while when resources are fetched from remote
    // servers. We do not want the user to force reload while we are reloading.
    uDom('body').toggleClass('busy', true);

    // Reload blacklists
    messager.send({
        what: 'userSettings',
        name: 'parseAllABPHideFilters',
        value: listDetails.cosmetic
    });
    // Reload blacklists
    var switches = [];
    var lis = uDom('#lists .listDetails');
    var i = lis.length;
    var path;
    while ( i-- ) {
        path = lis
            .subset(i, 1)
            .descendants('a')
            .attr('href');
        switches.push({
            location: path,
            off: lis.subset(i, 1).descendants('input').prop('checked') === false
        });
    }
    messager.send({
        what: 'reloadAllFilters',
        switches: switches,
        update: update
    });
    cacheWasPurged = false;
};

/******************************************************************************/

var buttonApplyHandler = function() {
    reloadAll(false);
    uDom('#buttonApply').toggleClass('enabled', false);
};

/******************************************************************************/

var buttonUpdateHandler = function() {
    if ( needUpdate ) {
        reloadAll(true);
    }
};

/******************************************************************************/

var buttonPurgeAllHandler = function() {
    var onCompleted = function() {
        renderBlacklists();
    };
    messager.send({ what: 'purgeAllCaches' }, onCompleted);
};

/******************************************************************************/

var autoUpdateCheckboxChanged = function() {
    messager.send({
        what: 'userSettings',
        name: 'autoUpdate',
        value: this.checked
    });
};

/******************************************************************************/

var cosmeticSwitchChanged = function() {
    listDetails.cosmetic = this.checked;
    updateWidgets();
};

/******************************************************************************/

var renderExternalLists = function() {
    var onReceived = function(details) {
        uDom('#externalLists').val(details);
        externalLists = details;
    };
    messager.send({ what: 'userSettings', name: 'externalLists' }, onReceived);
};

/******************************************************************************/

var externalListsChangeHandler = function() {
    uDom('#externalListsApply').prop(
        'disabled',
        this.value.trim() === externalLists
    );
};

/******************************************************************************/

var externalListsApplyHandler = function() {
    externalLists = uDom('#externalLists').val();
    messager.send({
        what: 'userSettings',
        name: 'externalLists',
        value: externalLists
    });
    renderBlacklists();
    uDom('#externalListsApply').prop('disabled', true);
};

/******************************************************************************/

uDom.onLoad(function() {
    uDom('#autoUpdate').on('change', autoUpdateCheckboxChanged);
    uDom('#parseCosmeticFilters').on('change', cosmeticSwitchChanged);
    uDom('#buttonApply').on('click', buttonApplyHandler);
    uDom('#buttonUpdate').on('click', buttonUpdateHandler);
    uDom('#buttonPurgeAll').on('click', buttonPurgeAllHandler);
    uDom('#lists').on('change', '.listDetails > input', onListCheckboxChanged);
    uDom('#lists').on('click', '.listDetails > a:nth-of-type(1)', onListLinkClicked);
    uDom('#lists').on('click', 'span.purge', onPurgeClicked);
    uDom('#externalLists').on('input', externalListsChangeHandler);
    uDom('#externalListsApply').on('click', externalListsApplyHandler);

    renderBlacklists();
    renderExternalLists();
});

/******************************************************************************/

})();

