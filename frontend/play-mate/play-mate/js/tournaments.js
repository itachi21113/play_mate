/* Tournaments: list, search, filters, create form (React). */
(function () {
  var h = PMC.h, useState = React.useState;

  function CreateForm(p) {
    var init = { host: "", tname: "", game: "", desc: "", fee: "", prize: "", slots: "", date: "", time: "" };
    var s = useState(init), f = s[0], setF = s[1], e = useState({}), errs = e[0], setErrs = e[1];
    var today = new Date(); var min = today.getFullYear() + "-" + String(today.getMonth() + 1).padStart(2, "0") + "-" + String(today.getDate()).padStart(2, "0");
    function set(k) { return function (ev) { var v = ev.target.value; setF(function (o) { var n = Object.assign({}, o); n[k] = v; return n; }); }; }
    function validate() {
      var r = {};
      if (!f.host.trim()) r.host = "Host name is required.";
      if (!f.tname.trim()) r.tname = "Tournament name is required.";
      if (!window.PM.gameByName(f.game.trim())) r.game = "Pick a game from the list.";
      if (!f.desc.trim()) r.desc = "Add a short description.";
      if (f.fee === "" || Number(f.fee) < 0) r.fee = "Enter 0 or more (0 = free).";
      if (f.prize === "" || Number(f.prize) < 0) r.prize = "Enter 0 or more.";
      if (!(Number(f.slots) >= 2)) r.slots = "At least 2 slots.";
      if (!f.date) r.date = "Choose a date."; else if (f.date < min) r.date = "Date cannot be in the past.";
      if (!f.time) r.time = "Choose a time.";
      return r;
    }
    function submit(ev) {
      ev.preventDefault();
      var r = validate(); setErrs(r); if (Object.keys(r).length) return;
      var g = PM.gameByName(f.game.trim());
      PM.addTournament({ name: f.tname.trim(), game: g.slug, date: f.date, time: f.time, fee: Number(f.fee), prize: Number(f.prize), max: Number(f.slots), host: f.host.trim(), desc: f.desc.trim() });
      setF(init); setErrs({});
      p.onCreated("Tournament Created Successfully!");
    }
    function field(k, label, input, full) {
      return h`<div className=${"field" + (full ? " full" : "") + (errs[k] ? " has-err" : "")}><label htmlFor=${"f_" + k}>${label}</label>${input}${errs[k] ? h`<p className="err" role="alert">${errs[k]}</p>` : null}</div>`;
    }
    function inp(k, type, ph, extra) { return h`<input id=${"f_" + k} type=${type} placeholder=${ph} value=${f[k]} onChange=${set(k)} aria-invalid=${!!errs[k]} ...${extra || {}} />`; }
    return h`<form className="tour-form glass" noValidate autoComplete="off" onSubmit=${submit} onReset=${function () { setF(init); setErrs({}); }}>
      <h2>Create a Tournament</h2>
      <div className="form-grid">
        ${field("host", "Host Name", inp("host", "text", "e.g. Rahul Gamer"))}
        ${field("tname", "Tournament Name", inp("tname", "text", "e.g. Midnight Clash"))}
        ${field("game", "Game Name", h`<${React.Fragment}>${inp("game", "text", "e.g. Valorant", { list: "gameList" })}<datalist id="gameList">${window.GAMES.map(function (g) { return h`<option key=${g.slug} value=${g.name}></option>`; })}</datalist></${React.Fragment}>`)}
        ${field("slots", "Total Slots", inp("slots", "number", "e.g. 32", { min: 2, step: 1 }))}
        ${field("fee", "Participation Fee (\u20B9)", inp("fee", "number", "0 for free entry", { min: 0, step: 1 }))}
        ${field("prize", "Prize Pool (\u20B9)", inp("prize", "number", "0 if no prize", { min: 0, step: 1 }))}
        ${field("date", "Tournament Date", inp("date", "date", "", { min: min }))}
        ${field("time", "Tournament Time", inp("time", "time", ""))}
        ${field("desc", "Tournament Description", h`<textarea id="f_desc" rows="4" placeholder="Rules, format, rewards, how players join..." value=${f.desc} onChange=${set("desc")} aria-invalid=${!!errs.desc}></textarea>`, true)}
      </div>
      <div className="form-actions"><button className="btn btn-primary" type="submit">Create Tournament</button><button className="btn btn-ghost" type="reset">Reset Form</button></div>
    </form>`;
  }

  var STATUSES = [["all", "All"], ["upcoming", "Upcoming"], ["ongoing", "Ongoing"], ["completed", "Completed"]];

  function Tournaments() {
    PMC.useStore();
    var toast = PMC.useToast();
    var a = useState(""), q = a[0], setQ = a[1], b = useState("all"), game = b[0], setGame = b[1],
        c = useState("all"), status = c[0], setStatus = c[1], d = useState(false), showForm = d[0], setShowForm = d[1];
    var all = PM.tournaments(), t = q.trim().toLowerCase();
    var list = all.filter(function (x) {
      var g = PM.game(x.game) || {};
      return (game === "all" || x.game === game) && (status === "all" || x.status === status) &&
        (!t || x.name.toLowerCase().indexOf(t) !== -1 || (g.name || "").toLowerCase().indexOf(t) !== -1 || (x.host || "").toLowerCase().indexOf(t) !== -1);
    });
    function reset() { setQ(""); setGame("all"); setStatus("all"); }
    return h`<${React.Fragment}>
      <div className="page-head head-row"><div><h1>Tournaments</h1><p>Find a tournament, register for a slot, or host your own.</p></div>
        <button type="button" className="btn btn-primary" aria-expanded=${showForm} onClick=${function () { setShowForm(!showForm); }}>${showForm ? "Close Form" : "+ Create Tournament"}</button></div>
      ${showForm ? h`<${CreateForm} onCreated=${function (m) { toast.show(m, "ok"); setShowForm(false); reset(); window.scrollTo({ top: 0, behavior: "smooth" }); }} />` : null}

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
