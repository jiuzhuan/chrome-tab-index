// Copyright 2021 Google LLC
//
// Use of this source code is governed by a BSD-style
// license that can be found in the LICENSE file or at
// https://developers.google.com/open-source/licenses/bsd

// Search the bookmarks when entering the search keyword.
$('#search').change(function () {
    $('#bookmarks').empty();
    dumpBookmarks($('#search').val());
});

// Traverse the bookmark tree, and print the folder and nodes.
function dumpBookmarks(query) {
    var bookmarkTreeNodes = chrome.bookmarks.getTree(function (bookmarkTreeNodes) {
        // for (var i = 0; i < bookmarkTreeNodes.length; i++) {
            // if (String(bookmarkTreeNodes[i].title.toLowerCase()).indexOf('test') == 0) {
            //     $('#bookmarks').append(dumpNode(bookmarkTreeNodes[i], query));
            // }
        // }
        $('#bookmarks').append(dumpNode(bookmarkTreeNodes[0].children[0].children[0], query));
    });
}

function dumpTreeNodes(bookmarkNodes, query) {
    var list = $('<ul>');
    for (var i = 0; i < bookmarkNodes.length; i++) {
        list.append(dumpNode(bookmarkNodes[i], query));
    }

    return list;
}

function dumpNode(bookmarkNode, query) {
    if (bookmarkNode.title) {
        if (query && !bookmarkNode.children) {
            if (String(bookmarkNode.title.toLowerCase()).indexOf(query.toLowerCase()) == -1) {
                return $('<span></span>');
            }
        }

        var anchor = $('<a>');
        anchor.attr('href', bookmarkNode.url);
        anchor.text(bookmarkNode.title);

        /*
         * When clicking on a bookmark in the extension, a new tab is fired with
         * the bookmark url.
         */
        anchor.click(function () {
            if (bookmarkNode.children) {
                openBookmarkNode(bookmarkNode);
            } else {
                chrome.storage.local.get(bookmarkNode.id).then((result) => {
                    chrome.tabs.get(result[bookmarkNode.id], (tab) => {
                        chrome.tabs.highlight({ tabs: tab.index})
                    })
                });
            }
        });

        var span = $('<span>');
        var options = bookmarkNode.children ?
            $('<span>[<a href="#" id="addlink">Add</a>]</span>') :
            $('<span>[<a id="editlink" href="#">Edit</a> <a id="deletelink" ' +
                'href="#">Delete</a>]</span>');
        var edit = bookmarkNode.children ? $('<table><tr><td>Name</td><td>' +
            '<input id="title"></td></tr><tr><td>URL</td><td><input id="url">' +
            '</td></tr></table>') : $('<input>');

        // Show add and edit links when hover over.
        span.hover(function () {
            span.append(options);
            $('#deletelink').click(function (event) {
                console.log(event)
                $('#deletedialog').empty().dialog({
                    autoOpen: false,
                    closeOnEscape: true,
                    title: 'Confirm Deletion',
                    modal: true,
                    show: 'slide',
                    position: {
                        my: "left",
                        at: "center",
                        of: event.target.parentElement.parentElement
                    },
                    buttons: {
                        'Yes, Delete It!': function () {
                            chrome.bookmarks.remove(String(bookmarkNode.id));
                            span.parent().remove();
                            $(this).dialog('destroy');
                        },
                        Cancel: function () {
                            $(this).dialog('destroy');
                        }
                    }
                }).dialog('open');
            });
            $('#addlink').click(function (event) {
                edit.show();
                $('#adddialog').empty().append(edit).dialog({
                    autoOpen: false,
                    closeOnEscape: true,
                    title: 'Add New Bookmark',
                    modal: true,
                    show: 'slide',
                    position: {
                        my: "left",
                        at: "center",
                        of: event.target.parentElement.parentElement
                    },
                    buttons: {
                        'Add': function () {
                            edit.hide();
                            chrome.bookmarks.create({
                                parentId: bookmarkNode.id,
                                title: $('#title').val(), url: $('#url').val()
                            });
                            $('#bookmarks').empty();
                            $(this).dialog('destroy');
                            window.dumpBookmarks();
                        },
                        'Cancel': function () {
                            edit.hide();
                            $(this).dialog('destroy');
                        }
                    }
                }).dialog('open');
            });
            $('#editlink').click(function (event) {
                edit.show();
                edit.val(anchor.text());
                $('#editdialog').empty().append(edit).dialog({
                    autoOpen: false,
                    closeOnEscape: true,
                    title: 'Edit Title',
                    modal: true,
                    show: 'fade',
                    position: {
                        my: "left",
                        at: "center",
                        of: event.target.parentElement.parentElement
                    },
                    buttons: {
                        'Save': function () {
                            edit.hide();
                            chrome.bookmarks.update(String(bookmarkNode.id), {
                                title: edit.val()
                            });
                            anchor.text(edit.val());
                            options.show();
                            $(this).dialog('destroy');
                        },
                        'Cancel': function () {
                            edit.hide();
                            $(this).dialog('destroy');
                        }
                    }
                }).dialog('open');
            });
            options.fadeIn();
        },

            // unhover
            function () {
                options.remove();
            }).append(anchor);
    }

    var li = $(bookmarkNode.title ? '<li>' : '<div>').append(span);
    if (bookmarkNode.children && bookmarkNode.children.length > 0) {
        li.append(dumpTreeNodes(bookmarkNode.children, query));
    }

    return li;
}
                                                                                                                    
function openBookmarkNode(bookmarkNode) {
    if (bookmarkNode.children && bookmarkNode.children.length > 0) {
        for (var i = 0; i < bookmarkNode.children.length; i++) {
            openBookmarkNode(bookmarkNode.children[i]);
        }
    } else {
        chrome.tabs.create({ url: bookmarkNode.url, active: false }, (tab) => {
            let bookId = String(bookmarkNode.id);
            let ob = {};
            ob[bookId] = tab.id;
            chrome.storage.local.set(ob).then(() => {
                console.log("Value is set to " + tabMap);
            });
        });
    }
}

document.addEventListener('DOMContentLoaded', function () {
    dumpBookmarks();
});
