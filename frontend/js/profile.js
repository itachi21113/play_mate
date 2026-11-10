/* Profile: your own account, or ?u=<username> for another player (React). */
(function () {
  var h = PMC.h;
  function Profile() {
    PMC.useStore();
    var id = PM.query("u"), me = PM.currentUser();
    if (!id && !me) { location.replace("login.html"); return null; }
    var p = PM.profileFor(id);
    if (!p) return h`<div className="wrap"><div className="page-head"><h1>Player not found</h1><p>We couldn't find that profile.</p><a className="btn btn-primary" href="players.html" style=${{ marginTop: "18px" }}>Browse Players</a></div></div>`;
    var src = p.self ? (p.avatar || PM.BLANK_AVATAR) : PM.avatarFor({ name: p.name, img: p.img });
    var game = PM.gameByName(p.favGame);
    return h`<${React.Fragment}>
      <div className="profile-cover"><img src="images/banners/ghost.jpg" alt="" /></div>
      <div className="wrap profile-main">
        <div className="profile-top">
          <div className="avatar"><img src=${src} alt=${p.name} />${p.self ? null : h`<span className=${"dot-status " + (p.online ? "on" : "off")} title=${p.online ? "Online" : "Offline"}></span>`}</div>
          <div><h1>${p.name}</h1><p className="sub">@${p.username}${p.self ? "" : " \u00B7 " + (p.online ? "Online" : p.last)}</p></div>
          ${p.self ? h`<a className="btn btn-outline" href="edit-profile.html">Edit Profile</a>`
                   : (me ? h`<a className="btn btn-primary" href=${"messages.html?chat=" + p.username}>Message</a>` : h`<a className="btn btn-outline" href="login.html">Log in to message</a>`)}
        </div>
        <div className="panels">
          <div className="stack">
            <section className="panel glass"><h2>Favorite Game</h2>
              ${p.favGame ? h`<ul className="chips"><li>${game ? h`<a href=${"game-details.html?game=" + game.slug}>${p.favGame}</a>` : p.favGame}</li></ul>` : h`<p className="muted">No favorite game selected yet.</p>`}</section>
            ${p.self ? h`<section className="panel glass"><h2>Contact</h2>
              <dl className="info-list"><dt>Full name</dt><dd>${p.name}</dd><dt>Email</dt><dd>${p.email}</dd><dt>Phone</dt><dd>+91 ${p.phone}</dd></dl></section>`
              : (p.games.length ? h`<section className="panel glass"><h2>Plays</h2><ul className="chips">${p.games.map(function (s) { var g = PM.game(s); return h`<li key=${s}><a href=${"game-details.html?game=" + s}>${g.name}</a></li>`; })}</ul></section>` : null)}
          </div>
          <section className="panel glass"><h2>About</h2>
            ${p.bio ? h`<p>${p.bio}</p>` : h`<p className="muted">${p.self ? "You haven't added a description yet. Click Edit Profile to add one." : "This player hasn't added a description."}</p>`}</section>
        </div></div>
    </${React.Fragment}>`;
  }
  PMC.mount(Profile);
})();
