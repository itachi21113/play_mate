/* Shared React components (React + htm, no build step). */
(function () {
  var h = htm.bind(React.createElement);
  var useState = React.useState, useEffect = React.useEffect, useRef = React.useRef;
  var C = window.PMC = { h: h };

  /* re-render when localStorage-backed data changes (same tab or other tabs) */
  C.useStore = function () {
    var s = useState(0), set = s[1];
    useEffect(function () {
      function f() { set(function (n) { return n + 1; }); }
      window.addEventListener("pmchange", f); window.addEventListener("storage", f);
      return function () { window.removeEventListener("pmchange", f); window.removeEventListener("storage", f); };
    }, []);
  };

  /* toast: const t = PMC.useToast(); t.show("text", "ok"|"err"); render t.node */
  C.useToast = function () {
    var s = useState(null), msg = s[0], setMsg = s[1], timer = useRef();
    function show(text, kind) {
      setMsg({ text: text, kind: kind || "ok" });
      clearTimeout(timer.current); timer.current = setTimeout(function () { setMsg(null); }, 3200);
    }
    var node = msg ? h`<div className=${"toast " + msg.kind} role="status" aria-live="polite">${msg.text}</div>` : null;
    return { show: show, node: node };
  };

  C.mount = function (Comp) {
    ReactDOM.createRoot(document.getElementById("root")).render(h`<${Comp} />`);
  };

  C.Empty = function (p) {
    return h`<div className="empty"><h3>${p.title}</h3><p>${p.text}</p>${p.children}</div>`;
  };

  /* ---------- cards ---------- */
  C.GameCard = function (p) {
    var g = p.game;
    return h`<article className="game-card"><div className="poster"><img src=${g.img} alt=${g.name + " cover"} loading="lazy" />
      <span className="live"><i></i>${g.players} active</span></div>
      <div className="info"><h3>${g.name}</h3><p className="genre">${g.genre}</p>
      <p className="active-players">Active Players: <b>${g.players}</b></p>
      <a className="btn btn-outline" href=${"game-details.html?game=" + g.slug}>Explore</a></div></article>`;
  };

  C.PlayerCard = function (p) {
    var pl = p.player;
    return h`<article className="player-card"><div className="avatar"><img src=${PM.avatarFor(pl)} alt=${pl.name} />
      ${p.showStatus ? h`<span className=${"dot-status " + (pl.online ? "on" : "off")} title=${pl.online ? "Online" : "Offline"}></span>` : null}</div>
      <h3>${pl.name}</h3>
      ${p.showStatus ? h`<p className="handle">@${pl.id}</p>` : null}
      <p className="fav">Favorite game: <b>${pl.game}</b></p>
      <a className="btn btn-primary" href=${"profile.html?u=" + pl.id}>View Profile</a></article>`;
  };

  var STATUS = { upcoming: "Upcoming", ongoing: "Ongoing", completed: "Completed" };
  C.StatusBadge = function (p) { return h`<span className=${"status-badge " + p.status}>${STATUS[p.status]}</span>`; };

  /* register button: decides its own label/disabled state */
  C.RegisterButton = function (p) {
    C.useStore();
    var t = p.t, left = PM.slotsLeft(t), reg = PM.isRegistered(t.id), label = "Register Now", dis = false;
    if (t.status === "completed") { label = "Completed"; dis = true; }
    else if (t.status === "ongoing") { label = "Registration Closed"; dis = true; }
    else if (reg) { label = "Registered \u2713"; dis = true; }
    else if (left <= 0) { label = "Slots Full"; dis = true; }
    function click() {
      var r = PM.registerFor(t.id);
      p.onResult(r);
      if (r.login) setTimeout(function () { location.href = "login.html"; }, 1400);
    }
    return h`<button type="button" className=${"btn btn-primary" + (p.block ? " block" : "")} disabled=${dis} onClick=${click}>${label}</button>`;
  };

  C.TournamentCard = function (p) {
    C.useStore();
    var t = p.t, g = PM.game(t.game) || {}, left = PM.slotsLeft(t), filled = t.max - left;
    var pct = Math.min(100, Math.round(filled / t.max * 100));
    return h`<article className="tour-card">
      <div className="tour-banner"><img src=${g.img} alt=${(g.name || "Game") + " banner"} loading="lazy" /><${C.StatusBadge} status=${t.status} /></div>
      <div className="tour-body">
        <h3>${t.name}</h3>
        <p className="genre">${g.name}</p>
        <ul className="tour-meta">
          <li><span>Date</span><b>${PM.fmtDate(t.date)}, ${PM.fmtTime(t.time)}</b></li>
          <li><span>Entry fee</span><b>${t.fee ? PM.money(t.fee) : "Free"}</b></li>
          <li><span>Prize pool</span><b className="prize">${PM.money(t.prize)}</b></li>
          <li><span>Max ${t.unit}</span><b>${t.max}</b></li>
          <li><span>Available slots</span><b>${left}</b></li>
        </ul>
        <div className="slotbar" aria-hidden="true"><i style=${{ width: pct + "%" }}></i></div>
        <div className="tour-actions">
          <a className="btn btn-outline" href=${"tournament-details.html?id=" + t.id}>View Details</a>
          <${C.RegisterButton} t=${t} onResult=${p.onResult} />
        </div></div></article>`;
  };
})();
