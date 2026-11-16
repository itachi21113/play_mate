/* Tournament organization studio. */
(function () {
  var h = PMC.h, useState = React.useState;

  function HostingForm(p) {
    var initial = {
      name: "", game: "", date: "", time: "", fee: "0", prize: "0",
      max: "", unit: "players", desc: ""
    };
    var state = useState(initial), form = state[0], setForm = state[1];
    var errorState = useState(""), error = errorState[0], setError = errorState[1];

    function setField(key) {
      return function (event) {
        var next = Object.assign({}, form);
        next[key] = event.target.value;
        setForm(next);
      };
    }

    function submit(event) {
      event.preventDefault();
      var game = PM.gameByName(form.game.trim()) || PM.game(form.game.trim());
      if (!form.name.trim() || !game || !form.date || !form.time ||
          Number(form.fee) < 0 || Number(form.prize) < 0 ||
          !Number.isInteger(Number(form.max)) || Number(form.max) < 2 ||
          !form.desc.trim()) {
        setError("Enter a name, valid game, schedule, non-negative fee and prize, capacity of at least two, and description.");
        return;
      }
      var today = new Date();
      var minDate = [
        today.getFullYear(),
        String(today.getMonth() + 1).padStart(2, "0"),
        String(today.getDate()).padStart(2, "0")
      ].join("-");
      if (form.date < minDate) {
        setError("Tournament date cannot be in the past.");
        return;
      }
      try {
        PM.request("POST", "/api/tournaments", {
          name: form.name.trim(), game: game.slug, date: form.date, time: form.time,
          fee: Number(form.fee), prize: Number(form.prize), max: Number(form.max),
          unit: form.unit, desc: form.desc.trim()
        });
        PM.refreshBootstrap();
        setForm(initial);
        setError("");
        p.onNotice({ text: "Tournament created successfully.", kind: "ok" });
      } catch (requestError) {
        setError(requestError.message);
      }
    }

    function field(key, label, control, full) {
      return h`<div className=${"field" + (full ? " full" : "")}>
        <label htmlFor=${"host_" + key}>${label}</label>${control}</div>`;
    }
    function input(key, type, placeholder, extra) {
      return h`<input id=${"host_" + key} type=${type} placeholder=${placeholder || ""}
        value=${form[key]} onChange=${setField(key)} required ...${extra || {}} />`;
    }

    return h`<form className="tour-form glass" noValidate onSubmit=${submit}>
      <h2>Create a Tournament</h2>
      ${error ? h`<p className="studio-alert err" role="alert">${error}</p>` : null}
      <div className="form-grid">
        ${field("name", "Tournament Name", input("name", "text", "e.g. Midnight Clash"))}
        ${field("game", "Game", h`<input id="host_game" list="hostGameList" value=${form.game}
          onChange=${setField("game")} placeholder="Choose a game" required />
          <datalist id="hostGameList">${GAMES.map(function (game) {
            return h`<option key=${game.slug} value=${game.name}></option>`;
          })}</datalist>`)}
        ${field("date", "Tournament Date", input("date", "date"))}
        ${field("time", "Tournament Time", input("time", "time"))}
        ${field("fee", "Entry Fee (\u20B9)", input("fee", "number", "0 for free", { min: 0, step: 1 }))}
        ${field("prize", "Prize Pool (\u20B9)", input("prize", "number", "0 if no prize", { min: 0, step: 1 }))}
        ${field("max", "Capacity", input("max", "number", "Players or teams", { min: 2, step: 1 }))}
        ${field("unit", "Capacity Type", h`<select id="host_unit" value=${form.unit} onChange=${setField("unit")}>
          <option value="players">Players</option><option value="teams">Teams</option></select>`)}
        ${field("desc", "Description", h`<textarea id="host_desc" rows="4" value=${form.desc}
          onChange=${setField("desc")} placeholder="Rules, format and rewards" required></textarea>`, true)}
      </div>
      <div className="form-actions"><button className="btn btn-primary" type="submit">Create Tournament</button></div>
    </form>`;
  }

  function Organizer() {
    PMC.useStore();
    var noticeState = useState(null), notice = noticeState[0], setNotice = noticeState[1];
    var participantsState = useState(null), modal = participantsState[0], setModal = participantsState[1];
    var currentUser = PM.currentUser();

    if (!currentUser || currentUser.role !== "organizer" ||
        currentUser.approvalStatus !== "approved") {
      return h`<header className="page-head studio-head"><h1>Organizer Studio</h1>
        <p>An approved organization account is required to host tournaments.</p>
        <a className="btn btn-primary" href="login.html">Log in as Organizer</a></header>`;
    }

    var tournaments = PM.tournaments().filter(function (tournament) {
      return tournament.hostUsername === currentUser.username;
    });

    function updateStatus(tournament, status) {
      try {
        PM.request(
          "PATCH",
          "/api/tournaments/" + encodeURIComponent(tournament.id) + "/status",
          { status: status }
        );
        PM.refreshBootstrap();
        setNotice({ text: tournament.name + " is now " + status + ".", kind: "ok" });
      } catch (error) {
        setNotice({ text: error.message, kind: "err" });
      }
    }

    function showParticipants(tournament) {
      try {
        var participants = PM.request(
          "GET",
          "/api/tournaments/" + encodeURIComponent(tournament.id) + "/participants"
        );
        setModal({ tournament: tournament, participants: participants });
      } catch (error) {
        setNotice({ text: error.message, kind: "err" });
      }
    }

    function nextStatus(status) {
      if (status === "upcoming") return "ongoing";
      if (status === "ongoing") return "completed";
      return "";
    }

    return h`<${React.Fragment}>
      <header className="page-head studio-head"><h1>Organizer Studio</h1>
        <p>Hosting as <strong>${currentUser.organizationName || currentUser.fullName}</strong></p></header>
      ${notice ? h`<p className=${"studio-alert " + notice.kind} role="status">${notice.text}</p>` : null}
      <${HostingForm} onNotice=${setNotice} />
      <section className="studio-section glass">
        <h2>Your Hosted Tournaments <span className="muted">(${tournaments.length})</span></h2>
        ${tournaments.length ? h`<div className="hosted-list">${tournaments.map(function (tournament) {
          var next = nextStatus(tournament.status);
          return h`<article className="hosted-card" key=${tournament.id}>
            <div><h3>${tournament.name}</h3>
              <p>${PM.fmtDate(tournament.date)} · ${PM.fmtTime(tournament.time)} ·
                ${tournament.taken}/${tournament.max} ${tournament.unit}</p>
              <span className=${"approval-pill " + tournament.status}>${tournament.status}</span>
            </div>
            <div className="hosted-controls">
              <button className="btn btn-outline" type="button"
                onClick=${function () { showParticipants(tournament); }}>Participants</button>
              ${next ? h`<button className="btn btn-primary" type="button"
                onClick=${function () { updateStatus(tournament, next); }}>Mark ${next}</button>` : null}
            </div>
          </article>`;
        })}</div>` : h`<${PMC.Empty} title="No tournaments yet"
          text="Create your first tournament above to start hosting." />`}
      </section>
      ${modal ? h`<div className="participant-overlay" role="presentation"
        onClick=${function (event) { if (event.target === event.currentTarget) setModal(null); }}>
        <section className="participant-panel" role="dialog" aria-modal="true" aria-labelledby="participants-heading">
          <header><div><h2 id="participants-heading">Participants</h2>
            <p className="muted">${modal.tournament.name}</p></div>
            <button className="btn btn-ghost" type="button" onClick=${function () { setModal(null); }}>Close</button>
          </header>
          ${modal.participants.length ? h`<div className="participant-cards">
            ${modal.participants.map(function (participant) {
              return h`<article className="participant-card" key=${participant.username}>
                <strong>${participant.fullName}</strong><p>@${participant.username}</p>
                <p>${participant.favGame || "Game not set"}</p>
                <a href=${"mailto:" + participant.email}>${participant.email}</a>
                <p>${participant.phone}</p></article>`;
            })}</div>` : h`<${PMC.Empty} title="No registered participants"
              text="Player registrations will appear here." />`}
        </section></div>` : null}
    </${React.Fragment}>`;
  }

  PMC.mount(Organizer);
})();
