/* Players: browse + filter sample players (React). */
(function () {
  var h = PMC.h, useState = React.useState;
  function Players() {
    var s = useState(""), q = s[0], setQ = s[1];
    var list = window.PLAYERS.filter(function (p) {
      var t = q.trim().toLowerCase();
      return !t || p.name.toLowerCase().indexOf(t) !== -1 || p.game.toLowerCase().indexOf(t) !== -1;
    });
    return h`<${React.Fragment}>
      <div className="page-head"><h1>Players</h1><p>Browse gamers and find someone who plays what you play.</p></div>
      <div className="search-bar glass"><input type="search" placeholder="Search by name or game" aria-label="Search players" value=${q} onChange=${function (e) { setQ(e.target.value); }} /></div>
      <p className="result-count">${list.length} ${list.length === 1 ? "player" : "players"}</p>
      <div className="grid">${list.map(function (p) { return h`<${PMC.PlayerCard} key=${p.id} player=${p} showStatus=${true} />`; })}</div>
      ${list.length ? null : h`<${PMC.Empty} title="No players found" text="Try another name or game." />`}
    </${React.Fragment}>`;
  }
  PMC.mount(Players);
})();
