/* Search Games: instant filtering, Explore opens game-details.html (React). */
(function () {
  var h = PMC.h, useState = React.useState;
  function Search() {
    var s = useState(PM.query("q")), q = s[0], setQ = s[1];
    var t = q.trim().toLowerCase();
    var list = window.GAMES.filter(function (g) { return !t || g.name.toLowerCase().indexOf(t) !== -1 || g.genre.toLowerCase().indexOf(t) !== -1; });
    return h`<${React.Fragment}>
      <div className="page-head"><h1>Search Games</h1><p>Type a game name or genre. Results filter as you type.</p></div>
      <form className="search-bar glass" role="search" onSubmit=${function (e) { e.preventDefault(); }}>
        <input type="search" placeholder="Search games, e.g. Valorant" aria-label="Search games" autoComplete="off" value=${q} onChange=${function (e) { setQ(e.target.value); }} />
        <button className="btn btn-primary" type="submit">Search</button></form>
      <p className="result-count" aria-live="polite">${list.length} ${list.length === 1 ? "game" : "games"}${t ? ' matching "' + q.trim() + '"' : ""}</p>
      <div className="grid">${list.map(function (g) { return h`<${PMC.GameCard} key=${g.slug} game=${g} />`; })}</div>
      ${list.length ? null : h`<${PMC.Empty} title="No games found" text='Try another name, like "Fortnite" or "Apex".' />`}
    </${React.Fragment}>`;
  }
  PMC.mount(Search);
})();
