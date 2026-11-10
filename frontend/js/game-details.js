/* Game Details: everything is driven by ?game=<slug> (React). */
(function () {
  var h = PMC.h;
  function GameDetails() {
    PMC.useStore();
    var toast = PMC.useToast();
    var g = PM.game(PM.query("game"));
    if (!g) {
      return h`<div className="page-head"><h1>Game not found</h1><p>We couldn't find that game.</p>
        <a className="btn btn-primary" href="search.html" style=${{ marginTop: "18px" }}>Back to Search Games</a></div>`;
    }
    var tours = PM.tournaments().filter(function (t) { return t.game === g.slug; });
    var upcoming = tours.filter(function (t) { return t.status === "upcoming"; }).length;
    var players = window.PLAYERS.filter(function (p) { return p.games.indexOf(g.slug) !== -1; });
    var online = players.filter(function (p) { return p.online; });
    var recent = players.slice().sort(function (a, b) { return (b.online ? 1 : 0) - (a.online ? 1 : 0); }).slice(0, 6);
    document.title = "Play-Mate | " + g.name;

    return h`<${React.Fragment}>
      <section className="game-hero" style=${{ backgroundImage: "url(" + g.img + ")" }}>
        <div className="game-hero-in">
          <img className="game-cover" src=${g.img} alt=${g.name + " cover"} />
          <div className="game-info">
            <a className="crumb" href="search.html">\u2039 Back to Search Games</a>
            <h1>${g.name}</h1>
            <p className="genre">Category: ${g.genre}</p>
            <p className="game-desc">${g.desc}</p>
            <div className="chips-row"><span className="chip-stat"><b>${upcoming}</b> available tournaments</span><span className="chip-stat"><b>${online.length}</b> players online</span></div>
          </div></div></section>

      <section className="section" id="tournaments"><h2>Available Tournaments</h2>
        ${tours.length ? h`<div className="grid tour-grid">${tours.map(function (t) {
          return h`<${PMC.TournamentCard} key=${t.id} t=${t} onResult=${function (r) { toast.show(r.message, r.ok ? "ok" : "err"); }} />`; })}</div>`
        : h`<${PMC.Empty} title=${"No " + g.name + " tournaments yet"} text="Be the first to host one."><a className="btn btn-primary" href="tournaments.html">Create Tournament</a></${PMC.Empty}>`}
      </section>

      <section className="section" id="online"><h2>Online Players</h2>
        ${online.length ? h`<div className="grid">${online.map(function (p) { return h`<${PMC.PlayerCard} key=${p.id} player=${p} showStatus=${true} />`; })}</div>`
        : h`<${PMC.Empty} title="Nobody is online right now" text=${"Check back soon for " + g.name + " players."} />`}
      </section>

      <section className="section" id="community"><h2>${g.name} Community</h2>
        <div className="stat-grid">
          <div className="stat glass"><b>${g.registered.toLocaleString("en-IN")}</b><span>Registered players</span></div>
          <div className="stat glass"><b>${online.length}</b><span>Online players</span></div>
          <div className="stat glass"><b>${upcoming}</b><span>Upcoming tournaments</span></div>
        </div>
        <div className="panel glass recent"><h3>Recently active players</h3>
          <ul className="recent-list">${recent.map(function (p) {
            return h`<li key=${p.id}><a href=${"profile.html?u=" + p.id}><span className="mini-av"><img src=${PM.avatarFor(p)} alt="" /><i className=${"dot " + (p.online ? "on" : "off")}></i></span>
              <span><b>${p.name}</b><small>${p.last}</small></span></a></li>`; })}</ul></div>
      </section>
      ${toast.node}
    </${React.Fragment}>`;
  }
  PMC.mount(GameDetails);
})();
