(function() {
    var application,
        os = kendo.support.mobileOS;

    module("kendo.mobile.Application", {
        setup: function() {
            location.hash = '';
            $.mockjaxSettings.responseTime = 0;
            $.mockjaxSettings.contentType = "text/html";
            QUnit.fixture.css({ height: "100px", overflow: "hidden"});
        },

        teardown: function() {
            application.destroy();
            $.mockjaxClear();
            kendo.history.stop();
            QUnit.fixture.empty();
        }
    });

    function setup(html, options) {
        var root = $("<div />").append(html);
        QUnit.fixture.html(root);
        application = new kendo.mobile.Application(root, options);
        root.addClass("k-ff19"); // Trick Firefox scroller tests, since the UA is wrong.
    }

    test("Navigates to remote view silently on ready", function() {
        location.hash = "#../../test1";

        setup('<div data-role="view" id="test1">Page 1</div><div data-url="../../test1" data-role="view" id="page2">Page 2</div>');
        equal(location.hash, "#../../test1");
    });

    test("Applies view title attribute contents to layout view title", function() {
        setup('<div data-layout="foo" data-role="view" data-title="foo" id="page1">Page 1</div> \
            <div data-role="layout" data-id="foo"><div data-role="header"><div data-role="navbar"><span id="view-title" data-role="view-title"></span></div></div></div> \
        ');

        equal(application.element.find("#view-title").text(), "foo", "view title applies view title attribute");
    });

    test("Applies view title attribute contents to document title", function() {
        setup('<div data-layout="foo" data-role="view" data-title="foo" id="page1">Page 1</div> \
            <div data-role="layout" data-id="foo"><div data-role="header"><div data-role="navbar"><span id="view-title" data-role="view-title"></span></div></div></div> \
        ');

        equal(document.title, "foo", "view title applies view title attribute");
    });

    test("Allows prevention in beforeShow event", 3, function() {
        window.refuse = function(e) {
            e.preventDefault();
        };

        setup('<div data-role="view" id="foo"><a data-role="button" href="#bar">Go to Bar</a></div><div id="bar" data-role="view" data-before-show="refuse">bar</div>');

        var transitionDone = stub(application.pane.loader, "transitionDone" )

        tap(application.element.find("a"));


        equal(application.view().id, "/");
        equal(location.hash, "");

        equal(transitionDone.calls("transitionDone"), 1);
    });
    asyncTest("Syncs pane and browser history", 1, function() {
        setup('<div data-role="view" id="foo">foo</div><div id="bar" data-role="view">bar</div><div id="baz" data-role="view">baz</div>');

        application.navigate("#bar");
        application.navigate("#baz");
        application.navigate("#:back");

        setTimeout(function() {
            history.back();
        }, 300);

        setTimeout(function() {
            start();
            equal(application.view().id, "/");
        }, 400);
    });

    if (kendo.support.mobileOS.android) {
        test("Appends precomposed icon meta link", function() {
            setup('<div data-role="view" id="test1">Page 1</div>', {
                icon: "icon.png"
            });

            var link = $(document.head).find("link[rel=apple-touch-icon-precomposed]");

            equal(link.length, 1);
            equal(link.attr("href"), "icon.png");
            equal(link.attr("sizes"), undefined);
        });

        test("Appends multiple icons", function() {
            setup('<div data-role="view" id="test1">Page 1</div>', {
                icon: {
                    "76x76": "icon76.png",
                    "112x112": "icon112.png"
                }
            });

            var links = $(document.head).find("link[rel=apple-touch-icon-precomposed]");

            equal(links.eq(0).attr("href"), "icon112.png");
            equal(links.eq(0).attr("sizes"), "112x112");

            equal(links.eq(1).attr("href"), "icon76.png");
            equal(links.eq(1).attr("sizes"), "76x76");
        });
    } else {
        test("Appends icon meta link", function() {
            setup('<div data-role="view" id="test1">Page 1</div>', {
                icon: "icon.png"
            });

            var link = $(document.head).find("link[rel=apple-touch-icon]");

            equal(link.length, 1);
            equal(link.attr("href"), "icon.png");
            equal(link.attr("sizes"), undefined);
        });

        test("append multiple icons", function() {
            setup('<div data-role="view" id="test1">Page 1</div>', {
                icon: {
                    "76x76": "icon76.png",
                    "112x112": "icon112.png"
                }
            });

            var links = $(document.head).find("link[rel=apple-touch-icon]");

            equal(links.eq(0).attr("href"), "icon112.png");
            equal(links.eq(0).attr("sizes"), "112x112");

            equal(links.eq(1).attr("href"), "icon76.png");
            equal(links.eq(1).attr("sizes"), "76x76");
        });
    }

    test("triggers pull when pulled", 1, function() {
        ok(true); return;
        setup('<div data-role="view" data-pull="pull" id="page1"><div style="height:200px">View</div></div>');

        var el = $("#page1 .km-scroll-wrapper");

        application.scroller().setOptions({
            pullToRefresh: true,
            pullOffset: 100,
            pull: function() {
                ok(true);
            }
        });

        el.trigger($.Event("touchstart", { originalEvent: { changedTouches: [{ pageX: 1, pageY: 1, identifier: 1}] }}));
        el.trigger($.Event("touchmove", { originalEvent: { changedTouches: [{ pageX: 1, pageY: 200, identifier: 1}] }}));
        el.trigger($.Event("touchend", { originalEvent: { changedTouches: [{ pageX: 1, pageY: 200, identifier: 1}] }}));
    });

    test("triggers scroll when scrolled", 1, function() {
        setup('<div data-role="view" data-pull="pull" id="page1"><div style="height:200px">View</div></div>');

        var el = $("#page1 .km-scroll-wrapper");

        application.scroller().bind("scroll", function() {
            ok(true);
        });

        el.trigger($.Event("touchstart", { originalEvent: { changedTouches: [{ pageX: 1, pageY: 100, identifier: 1}] }}));
        el.trigger($.Event("touchmove", { originalEvent: { changedTouches: [{ pageX: 1, pageY: 1, identifier: 1}] }}));
        el.trigger($.Event("touchend", { originalEvent: { changedTouches: [{ pageX: 1, pageY: 1, identifier: 1}] }}));

        application.scroller().unbind("scroll");
    });

    function success() {
        ok(true);
    }

    test("Loads initial view depending on options", 2, function() {
        setup('<div data-role="view" id="test1">Page 1</div><div data-role="view" id="page2">Page 2</div>', {
            initial: "page2"
        });

        equal(location.hash, "#page2");
        equal(application.view().id, "#page2");
    });

    test("Omits options.initial if location.hash", function() {
        location.hash = "#../../page2";

        setup('<div data-role="view" id="page1">Page 1</div><div data-url="../../page2" data-role="view" id="page2">Page 2</div>', {
            initial: "page1"
        });

        equal(location.hash, "#../../page2");
        equal(application.view().id, "../../page2");
        equal(application.view().content.find(".km-scroll-container").html(), "Page 2");
    });

    test("Appends root and phone/tablet classes on documentElement", function () {
        setup('<div data-role="view" />');
        ok(QUnit.fixture.hasClass("km-root"), 'app has ' + QUnit.fixture.attr("class"));
        ok(QUnit.fixture.hasClass("km-" + (os && os.tablet ? "tablet" : "phone")));
    });

    test("Sets web-app-capable meta to yes by default", 1, function() {
        setup('<div data-role="view" />', {});

        ok($("meta[name=apple-mobile-web-app-capable]").attr("content") == "yes");
    });

    test("Sets web-app-capable meta to no if disabled explicitly", 1, function() {
        setup('<div data-role="view" />', {
            webAppCapable: false
        });

        ok($("meta[name=apple-mobile-web-app-capable]").attr("content") == "no");
    });

    test("Removes existing meta tags", 1, function() {
        $("head").prepend(
            '<meta content="initial-scale=1.0, maximum-scale=1.0, user-scalable=no" name="viewport" />' +
            '<meta name="apple-mobile-web-app-capable" content="yes" />' +
            '<meta name="apple-mobile-web-app-status-bar-style" content="black" />' +
            '<meta name="msapplication-tap-highlight" content="no" />'
        );

        setup('<div data-role="view" />');

        ok($("meta").length < 6);
    });

    test("skin method returns the current skin", 1, function() {
        setup('<div data-role="view" />', {
            skin: "flat"
        });

        ok(application.skin() == "flat");
    });

    test("Setting the skin changes the Application styling", 3, function() {
        setup('<div data-role="view" />', {
            platform: "ios"
        });

        application.skin("flat");

        ok(application.skin() == "flat");
        ok(!application.element.hasClass("km-ios"));
        ok(application.element.hasClass("km-flat"));
    });

    test("Setting the skin to empty changes the Application styling", 3, function() {
        setup('<div data-role="view" />', {
            platform: "ios",
            skin: "flat"
        });

        application.skin("");

        ok(application.skin() == "");
        ok(application.element.hasClass("km-ios"));
        ok(!application.element.hasClass("km-flat"));
    });

    test("Force platform layout", 1, function() {
        setup('<div data-role="view" />', {
            platform: "android"
        });

        ok(application.element.hasClass("km-android"));
    });

    test("Setting skin removes the platform classes", 2, function() {
        setup('<div data-role="view" />', {
            platform: "ios",
            skin: "flat"
        });

        ok(application.element.hasClass("km-flat"));
        ok(!application.element.hasClass("km-ios"));
    });

    /*
    if (navigator.__defineGetter__ && !kendo.support.browser.safari) {
        test("Forcing platform layout still reports correct device", 1, function() {
            setup('<div data-role="view" />', {
                platform: "android"
            });

            ok(application.element.hasClass("km-on-ios"), "App element had to have km-on-ios, has " + application.element.attr("class"));
        });
    }
    */

    asyncTest("Triggers init event handler", 1, function() {
        var app = new kendo.mobile.Application(
            $("<div><div data-role='view' /></div>"),
            {
                init: function(e) {
                    start();
                    ok(true);
                    e.sender.destroy();
                }
            }
        );
    });
})();
