/* terminal.js — injects the jx-blog terminal chrome onto theme-earth:
   a titlebar (traffic-light dots + host + ssh badge), a shell-prompt nav,
   `$ ls`/`$ cat` command lines, and a vim-style status bar. Pure decoration:
   every step is guarded, so if the markup shifts the page still renders. */
(function () {
  "use strict";

  var HOST = "jason@jx-blog";

  function el(tag, cls, html) {
    var n = document.createElement(tag);
    if (cls) n.className = cls;
    if (html != null) n.innerHTML = html;
    return n;
  }
  function step(fn) {
    try { fn(); } catch (e) { /* decoration only — never block the page */ }
  }

  function init() {
    var header = document.getElementById("header-menu");

    // ── strip widgets that clash with the terminal read ────
    step(function () {
      // home: the category filter is redundant with the `ls` listing
      if ((location.pathname.replace(/\/+$/, "") || "/") === "/") {
        var filters = document.getElementById("filters");
        if (filters) filters.remove();
      }
      // post/page: drop the like + share action buttons
      if (document.getElementById("content")) {
        ["i-tabler-heart", "i-tabler-share"].forEach(function (ic) {
          var icon = document.querySelector("." + ic);
          var wrap = icon && (icon.closest(".group") || icon.parentElement);
          if (wrap) wrap.remove();
        });
      }
    });

    // ── title bar ─────────────────────────────────────────
    step(function () {
      if (!header || header.querySelector(".t-titlebar")) return;
      var bar = el(
        "div",
        "t-titlebar",
        '<span class="t-dots"><i></i><i></i><i></i></span>' +
          '<span class="t-name">' + HOST + ": ~</span>" +
          '<span class="t-badge">ssh &middot; 2222</span>'
      );
      header.insertBefore(bar, header.firstChild);
    });

    // ── prompt nav: `jason@jx-blog:~$ cd  home posts about  ▊` ──
    step(function () {
      if (!header) return;
      var row = header.querySelector("div.mx-auto");
      var leftGroup = row && row.firstElementChild;
      if (leftGroup && !leftGroup.querySelector(".t-prompt-prefix")) {
        var prefix = el(
          "span",
          "t-prompt-prefix",
          '<span class="t-usr">' + HOST + "</span>" +
            '<span class="t-sep">:</span><span class="t-path">~</span>' +
            '<span class="t-dollar">$</span><span class="t-kw">cd</span>'
        );
        leftGroup.insertBefore(prefix, leftGroup.firstChild);
      }
      // desktop nav links: mark the current page, append a blinking cursor
      var nav = header.querySelector('ul[class*="sm:flex"]');
      if (nav) {
        var here = location.pathname.replace(/\/+$/, "") || "/";
        nav.querySelectorAll("a[href]").forEach(function (a) {
          var p = a.pathname.replace(/\/+$/, "") || "/";
          if (p === here) a.classList.add("t-active");
        });
        if (!nav.querySelector(".t-cursor")) nav.appendChild(el("span", "t-cursor"));
      }
    });

    // ── home: `$ ls -lt ~/posts` above the post list ───────
    step(function () {
      var list = document.getElementById("post-list");
      if (list && !document.querySelector(".t-cmd-ls")) {
        var cmd = el("div", "t-cmd t-cmd-ls", 'ls -lt <span class="t-arg">~/posts</span>');
        list.parentNode.insertBefore(cmd, list);
      }
    });

    // ── post: `$ cat ~/posts/<slug>.md` above the article ──
    step(function () {
      var content = document.getElementById("content");
      if (!content || document.querySelector(".t-cmd-cat")) return;
      var slug = decodeURIComponent(
        (location.pathname.replace(/\/+$/, "").split("/").pop() || "index")
      );
      var cmd = el(
        "div",
        "t-cmd t-cmd-cat",
        'cat <span class="t-arg">~/posts/' + slug + ".md</span>"
      );
      var card = content.closest(".rounded-xl") || content.parentNode;
      var title = card.querySelector("h1");
      var anchor = title || content;
      anchor.parentNode.insertBefore(cmd, anchor);
    });

    // ── status bar in the footer ───────────────────────────
    step(function () {
      var footer = document.querySelector("footer");
      if (!footer || footer.querySelector(".t-statusbar")) return;
      var path =
        location.pathname === "/"
          ? "~/posts"
          : "~" + location.pathname.replace(/\/+$/, "");
      var bar = el(
        "div",
        "t-statusbar",
        '<span class="t-mode">NORMAL</span>' +
          '<span class="t-path">' + path + "</span>" +
          '<span class="t-right">utf-8 &middot; main &middot; 100%</span>'
      );
      footer.insertBefore(bar, footer.firstChild);
      footer.classList.add("t-footer");
    });
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init, { once: true });
  } else {
    init();
  }
})();
