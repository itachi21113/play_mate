/* Tournaments: list, search and filters (React). */
(function () {
  var h = PMC.h, useState = React.useState;

  var STATUSES = [["all", "All"], ["upcoming", "Upcoming"], ["ongoing", "Ongoing"], ["completed", "Completed"]];

  function Tournaments() {
    PMC.useStore();
    var toast = PMC.useToast();
    var a = useState(""), q = a[0], setQ = a[1], b = useState("all"), game = b[0], setGame = b[1],
        c = useState("all"), status = c[0], setStatus = c[1];
    var all = PM.tournaments(), t = q.trim().toLowerCase();
    var list = all.filter(function (x) {
      var g = PM.game(x.game) || {};
      return (game === "all" || x.game === game) && (status === "all" || x.status === status) &&
        (!t || x.name.toLowerCase().indexOf(t) !== -1 || (g.name || "").toLowerCase().indexOf(t) !== -1 || (x.host || "").toLowerCase().indexOf(t) !== -1);
    });
    function reset() { setQ(""); setGame("all"); setStatus("all"); }
    return h`<${React.Fragment}>
      <div className="page-head"><h1>Tournaments</h1><p>Find a tournament and register for a slot.</p></div>

      <div className="filters">
        <div className="search-bar glass"><input type="search" placeholder="Search tournaments, games or hosts" aria-label="Search tournaments" value=${q} onChange=${function (e) { setQ(e.target.value); }} /></div>
        <div className="seg" role="group" aria-label="Status filter">${STATUSES.map(function (s) {
          return h`<button key=${s[0]} type="button" className=${status === s[0] ? "on" : ""} aria-pressed=${status === s[0]} onClick=${function () { setStatus(s[0]); }}>${s[1]}</button>`; })}</div>
        <div className="chip-filter" role="group" aria-label="Game filter">
          <button type="button" className=${game === "all" ? "on" : ""} aria-pressed=${game === "all"} onClick=${function () { setGame("all"); }}>All Games</button>
          ${window.GAMES.map(function (g) { return h`<button key=${g.slug} type="button" className=${game === g.slug ? "on" : ""} aria-pressed=${game === g.slug} onClick=${function () { setGame(g.slug); }}>${g.name}</button>`; })}</div>
      </div>
      <p className="result-count" aria-live="polite">${list.length} ${list.length === 1 ? "tournament" : "tournaments"}</p>
      ${list.length ? h`<div className="grid tour-grid">${list.map(function (x) { return h`<${PMC.TournamentCard} key=${x.id} t=${x} onResult=${function (r) { toast.show(r.message, r.ok ? "ok" : "err"); }} />`; })}</div>`
        : h`<${PMC.Empty} title="No tournaments match" text="Try changing the search or filters."><button type="button" className="btn btn-outline" onClick=${reset}>Clear filters</button></${PMC.Empty}>`}
      ${toast.node}
    </${React.Fragment}>`;
  }
  PMC.mount(Tournaments);
})();
