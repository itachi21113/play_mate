/* Tournament Details: driven by ?id=<tournament id> (React). */
(function () {
  var h = PMC.h;
  var RULES = ["Join the lobby at least 15 minutes before the start time.", "Use your registered username in-game; mismatched names may be disqualified.",
    "Cheating, hacks and teaming against the rules lead to an instant ban.", "The host's decision on disputes is final.", "Prize money is shared within 7 days after the event ends."];
  function Details() {
    PMC.useStore();
    var toast = PMC.useToast();
    var t = PM.tournament(PM.query("id"));
    if (!t) return h`<div className="page-head"><h1>Tournament not found</h1><p>This tournament doesn't exist or was removed.</p><a className="btn btn-primary" href="tournaments.html" style=${{ marginTop: "18px" }}>Back to Tournaments</a></div>`;
    var g = PM.game(t.game) || {}, left = PM.slotsLeft(t), filled = t.max - left, pct = Math.min(100, Math.round(filled / t.max * 100));
    document.title = "Play-Mate | " + t.name;
    return h`<${React.Fragment}>
      <div className="page-head"><a className="crumb" href="tournaments.html">\u2039 All Tournaments</a></div>
      <section className="tour-detail glass">
        <div className="tour-detail-banner"><img src=${g.img} alt=${(g.name || "") + " banner"} /><${PMC.StatusBadge} status=${t.status} /></div>
        <div className="tour-detail-body">
          <h1>${t.name}</h1>
          <p className="genre"><a href=${"game-details.html?game=" + t.game}>${g.name}</a> \u00B7 Hosted by ${t.host}</p>
          <p className="game-desc">${t.desc}</p>
          <ul className="tour-meta big">
            <li><span>Date</span><b>${PM.fmtDate(t.date)}</b></li>
            <li><span>Time</span><b>${PM.fmtTime(t.time)}</b></li>
            <li><span>Entry fee</span><b>${t.fee ? PM.money(t.fee) : "Free"}</b></li>
            <li><span>Prize pool</span><b className="prize">${PM.money(t.prize)}</b></li>
            <li><span>Max ${t.unit}</span><b>${t.max}</b></li>
            <li><span>Available slots</span><b>${left}</b></li>
          </ul>
          <div className="slotbar" aria-hidden="true"><i style=${{ width: pct + "%" }}></i></div>
          <p className="slot-note">${filled} of ${t.max} ${t.unit} registered</p>
          <div className="tour-actions">
            <${PMC.RegisterButton} t=${t} onResult=${function (r) { toast.show(r.message, r.ok ? "ok" : "err"); }} />
            <a className="btn btn-outline" href=${"game-details.html?game=" + t.game}>More ${g.name} tournaments</a>
          </div>
        </div></section>
      <section className="panel glass rules"><h2>Rules</h2><ol>${RULES.map(function (r, i) { return h`<li key=${i}>${r}</li>`; })}</ol></section>
      ${toast.node}
    </${React.Fragment}>`;
  }
  PMC.mount(Details);
})();
