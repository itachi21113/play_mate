/* Shared: header, footer, page transitions, scroll effects. */
(function () {
  var page = document.body.getAttribute("data-page") || "home";
  /* Login state is backed by the API token and current-user cache. */
  var loggedIn = !!(window.PM && window.PM.currentUser());
  window.PM_LOGGED_IN = loggedIn;

  var links = [
    { id: "home",        label: "Home",         href: "index.html" },
    { id: "players",     label: "Players",      href: "players.html" },
    { id: "search",      label: "Search Games", href: "search.html" },
    { id: "tournaments", label: "Tournaments",  href: "tournaments.html" }
  ];
  if (loggedIn) {
    links.push({ id: "messages", label: "Messages", href: "messages.html" });
    links.push({ id: "profile",  label: "Profile",  href: "profile.html" });
    links.push({ id: "logout",   label: "Logout",   href: "index.html", logout: true });
  }

  var logo = '<svg viewBox="0 0 48 48" aria-hidden="true"><defs><linearGradient id="lg" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#ff8a1f"/><stop offset="1" stop-color="#ff2d1a"/></linearGradient></defs>' +
    '<path d="M10 14h28a6 6 0 0 1 5.8 4.5l2 8A7 7 0 0 1 39 35a7 7 0 0 1-5.4-2.6L32 30H16l-1.600 2.400A7 7 0 0 1 9 35a7 7 0 0 1-6.800-8.500l2-8A6 6 0 0 1 10 14z" fill="url(#lg)"/>' +
    '<path d="M13 20v6M10 23h6" stroke="#0a0a0a" stroke-width="2.4" stroke-linecap="round"/><circle cx="33" cy="21.500" r="1.800" fill="#0a0a0a"/><circle cx="37" cy="25.500" r="1.800" fill="#0a0a0a"/></svg>';

  var nav = links.map(function (l) {
    return '<a href="' + l.href + '"' + (l.logout ? ' data-logout' : '') + (l.id === page ? ' class="active" aria-current="page"' : '') + '>' + l.label + '</a>';
  }).join("");

  var header =
    '<header class="site-header" id="siteHeader"><div class="bar">' +
    '<a class="brand" href="index.html">' + logo + '<span>Play-Mate</span></a>' +
    '<nav class="main-nav" id="mainNav" aria-label="Main">' + nav + '</nav>' +
    (loggedIn ? '' : '<div class="auth"><a class="btn btn-ghost' + (page === "login" ? " is-current" : "") + '" href="login.html">Login</a>' +
    '<a class="btn btn-primary' + (page === "register" ? " is-current" : "") + '" href="register.html">Register</a></div>') +
    '<button class="burger" id="burger" aria-label="Open menu" aria-expanded="false"><span></span><span></span><span></span></button>' +
    '</div></header>';

  var footer =
    '<footer class="site-footer"><div class="wrap"><a class="brand" href="index.html">' + logo + '<span>Play-Mate</span></a>' +
    '<p>Find your next gaming partner. A college project prototype, frontend only.</p>' +
    '<div class="flinks"><a href="index.html">Home</a><a href="players.html">Players</a><a href="search.html">Search Games</a><a href="tournaments.html">Tournaments</a>' + (loggedIn ? '<a href="messages.html">Messages</a>' : '') + '<a href="profile.html">Profile</a></div></div></footer>';

  document.body.insertAdjacentHTML("afterbegin", header);
  document.body.insertAdjacentHTML("beforeend", footer);
  document.body.insertAdjacentHTML("beforeend", '<div class="curtain" id="curtain" aria-hidden="true"></div>');

  /* mobile menu */
  var burger = document.getElementById("burger");
  var headerEl = document.getElementById("siteHeader");
  burger.addEventListener("click", function () {
    var open = headerEl.classList.toggle("menu-open");
    burger.setAttribute("aria-expanded", open);
  });

  /* header turns solid on scroll */
  function onScroll() { headerEl.classList.toggle("solid", window.scrollY > 40); }
  window.addEventListener("scroll", onScroll, { passive: true }); onScroll();

  /* page transitions: curtain wipes in on link click, then navigates */
  var curtain = document.getElementById("curtain");
  document.addEventListener("click", function (e) {
    var a = e.target.closest("a[href]");
    if (a && a.hasAttribute("data-logout")) { if (window.PM) window.PM.logout(); }
    if (!a || e.defaultPrevented || e.metaKey || e.ctrlKey || e.shiftKey || a.target === "_blank") return;
    var href = a.getAttribute("href");
    if (!href || href.charAt(0) === "#" || /^(https?:|mailto:)/.test(href)) return;
    e.preventDefault();
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) { location.href = href; return; }
    curtain.classList.add("in");
    setTimeout(function () { location.href = href; }, 420);
  });
  window.addEventListener("pageshow", function () { curtain.classList.remove("in"); });
  document.body.classList.add("loaded");
})();
