/* Play-Mate data + localStorage helpers (frontend only, no backend). */
(function () {
  var W = window;

  /* ---------------- sample data ---------------- */
  W.GAMES = [
    { slug: "bgmi", name: "BGMI", genre: "Battle Royale", players: "2.4M", registered: 24850, img: "images/games/bgmi.jpg",
      desc: "Battlegrounds Mobile India drops 100 players onto a shrinking island. Loot up, rotate smart and be the last squad standing." },
    { slug: "valorant", name: "Valorant", genre: "Tactical FPS", players: "1.8M", registered: 18340, img: "images/games/valorant.jpg",
      desc: "A 5v5 character-based tactical shooter where precise gunplay meets unique agent abilities. Plant the spike or defend the site." },
    { slug: "minecraft", name: "Minecraft", genre: "Sandbox", players: "3.1M", registered: 31020, img: "images/games/minecraft.jpg",
      desc: "Mine, craft and build anything you can imagine. Team up on survival servers or compete in build and mini-game challenges." },
    { slug: "free-fire", name: "Free Fire", genre: "Battle Royale", players: "2.9M", registered: 27610, img: "images/games/freefire.jpg",
      desc: "A fast 10-minute battle royale with quick matches, unique characters and intense squad fights on mobile." },
    { slug: "cs2", name: "Counter Strike 2", genre: "Tactical FPS", players: "1.5M", registered: 15275, img: "images/games/cs2.jpg",
      desc: "The legendary 5v5 competitive shooter. Master recoil, utility and economy to win rounds as terrorists or counter-terrorists." },
    { slug: "apex-legends", name: "Apex Legends", genre: "Hero Shooter", players: "980K", registered: 9860, img: "images/games/apex.jpg",
      desc: "Squad up as a Legend in this fast-paced hero shooter battle royale built around movement, teamwork and unique abilities." },
    { slug: "fortnite", name: "Fortnite", genre: "Battle Royale", players: "2.2M", registered: 22140, img: "images/games/fortnite.jpg",
      desc: "Build, fight and outlast 99 other players. Fortnite mixes shooting with fast construction for a unique battle royale." },
    { slug: "codm", name: "Call of Duty Mobile", genre: "Action FPS", players: "1.7M", registered: 17420, img: "images/games/codm.jpg",
      desc: "Console-quality Call of Duty on mobile with multiplayer modes, ranked play and a full battle royale." }
  ];

  /* id doubles as the player's username */
  W.PLAYERS = [
    { id: "rahul_gamer",   name: "Rahul Gamer",   game: "BGMI",             games: ["bgmi", "valorant", "minecraft"],   online: true,  img: "images/avatars/rahul.jpg", last: "Online now",
      bio: "Passionate gamer looking for new teammates and gaming friends.", reply: "Let's squad up tonight!" },
    { id: "amit_pro",      name: "Amit Pro",      game: "Valorant",         games: ["valorant", "cs2"],                 online: true,  img: "images/avatars/amit.jpg",  last: "Online now",
      bio: "Duelist main. Always hunting for a fifth for ranked.", reply: "Sounds good. See you at 8!" },
    { id: "sneha_plays",   name: "Sneha Plays",   game: "Minecraft",        games: ["minecraft", "fortnite"],           online: true,  img: "images/avatars/sneha.jpg", last: "Online now",
      bio: "Redstone nerd and survival server host.", reply: "Awesome, I'll set it up tonight!" },
    { id: "karan_elite",   name: "Karan Elite",   game: "Free Fire",        games: ["free-fire", "bgmi"],               online: false, img: "images/avatars/karan.jpg", last: "Last seen today at 7:02 PM",
      bio: "Rush player. Weekend scrims and custom rooms.", reply: "" },
    { id: "rohanx",        name: "RohanX",        game: "BGMI",             games: ["bgmi", "codm"],                    online: true,  img: "", last: "Online now",
      bio: "IGL for a small BGMI squad. Need good callouts.", reply: "Nice, adding you to the lobby now." },
    { id: "priya_sniper",  name: "Priya Sniper",  game: "Valorant",         games: ["valorant", "apex-legends"],        online: true,  img: "", last: "Online now",
      bio: "Operator enjoyer. One shot, one reaction.", reply: "gg, queue up!" },
    { id: "vikram_rush",   name: "Vikram Rush",   game: "Counter Strike 2", games: ["cs2", "valorant"],                 online: true,  img: "", last: "Online now",
      bio: "Entry fragger. Faceit level 8 grinder.", reply: "Ready when you are." },
    { id: "ananya_builds", name: "Ananya Builds", game: "Minecraft",        games: ["minecraft"],                       online: true,  img: "", last: "Online now",
      bio: "Mega builds and creative servers.", reply: "Come check my new build!" },
    { id: "neha_ace",      name: "Neha Ace",      game: "Apex Legends",     games: ["apex-legends", "fortnite"],        online: true,  img: "", last: "Online now",
      bio: "Wraith main. Looking for a trio.", reply: "Drop with us!" },
    { id: "arjun_clutch",  name: "Arjun Clutch",  game: "Call of Duty Mobile", games: ["codm", "bgmi", "free-fire"],    online: true,  img: "", last: "Online now",
      bio: "Ranked grinder. 1v4 clutches are my thing.", reply: "Let's go ranked." },
    { id: "simran_fn",     name: "Simran FN",     game: "Fortnite",         games: ["fortnite", "minecraft"],           online: true,  img: "", last: "Online now",
      bio: "Builder and box-fight lover.", reply: "Zero build or build?" },
    { id: "dev_headshot",  name: "Dev Headshot",  game: "Free Fire",        games: ["free-fire", "codm"],               online: true,  img: "", last: "Online now",
      bio: "Headshots only. Custom room host.", reply: "Joining now." },
    { id: "kabir_ops",     name: "Kabir Ops",     game: "Counter Strike 2", games: ["cs2", "codm"],                     online: false, img: "", last: "Last seen 2 hours ago",
      bio: "AWPer on weekends.", reply: "" },
    { id: "isha_loot",     name: "Isha Loot",     game: "Apex Legends",     games: ["apex-legends", "valorant"],        online: true,  img: "", last: "Online now",
      bio: "Always first to the loot room.", reply: "Pinging you a loot spot." }
  ];

  W.TOURNAMENTS = [
    { id: "t1",  name: "BGMI Squad Showdown",       game: "bgmi",         date: "2026-11-21", time: "18:00", fee: 50,  prize: 10000, max: 100, taken: 64, unit: "players", status: "upcoming",  host: "Play-Mate Official",
      desc: "Squad-based BGMI tournament with 4 matches on Erangel and Miramar. Points are awarded for placement and kills." },
    { id: "t2",  name: "Erangel Battle Cup",        game: "bgmi",         date: "2026-11-10", time: "16:00", fee: 0,   prize: 5000,  max: 100, taken: 100, unit: "players", status: "ongoing",   host: "Rohan X",
      desc: "Free-entry daily cup on Erangel. Matches are live right now, check the leaderboard after the final round." },
    { id: "t3",  name: "Valorant Night Clash",      game: "valorant",     date: "2026-11-15", time: "20:00", fee: 100, prize: 15000, max: 32,  taken: 20, unit: "teams",   status: "upcoming",  host: "Amit Pro",
      desc: "5v5 single-elimination bracket. Best of one until the semis, best of three for the final." },
    { id: "t4",  name: "Radiant Cup Season 2",      game: "valorant",     date: "2026-10-18", time: "19:00", fee: 150, prize: 25000, max: 16,  taken: 16, unit: "teams",   status: "completed", host: "Play-Mate Official",
      desc: "Season 2 of the Radiant Cup has finished. Winners were crowned after a packed final on Ascent." },
    { id: "t5",  name: "Block Builders Challenge",  game: "minecraft",    date: "2026-11-24", time: "17:00", fee: 0,   prize: 2000,  max: 50,  taken: 18, unit: "players", status: "upcoming",  host: "Sneha Plays",
      desc: "Build the best themed structure in 2 hours. Judged on creativity, detail and use of redstone." },
    { id: "t6",  name: "Free Fire Booyah Cup",      game: "free-fire",    date: "2026-11-18", time: "19:30", fee: 30,  prize: 5000,  max: 48,  taken: 40, unit: "players", status: "upcoming",  host: "Karan Elite",
      desc: "Solo custom-room tournament across three maps. Highest total points after three rounds wins." },
    { id: "t7",  name: "Bermuda Rush Weekend",      game: "free-fire",    date: "2026-11-10", time: "15:00", fee: 20,  prize: 2500,  max: 48,  taken: 44, unit: "players", status: "ongoing",   host: "Dev Headshot",
      desc: "Weekend rush event on Bermuda. Registrations are closed while matches are in progress." },
    { id: "t8",  name: "CS2 5v5 Clash",             game: "cs2",          date: "2026-11-28", time: "21:00", fee: 200, prize: 20000, max: 16,  taken: 9,  unit: "teams",   status: "upcoming",  host: "Vikram Rush",
      desc: "Competitive 5v5 on the active duty map pool. Teams are seeded by registration order." },
    { id: "t9",  name: "Dust Masters Open",         game: "cs2",          date: "2026-10-25", time: "20:00", fee: 100, prize: 8000,  max: 16,  taken: 16, unit: "teams",   status: "completed", host: "Kabir Ops",
      desc: "An open bracket on classic maps. The event has concluded and results are final." },
    { id: "t10", name: "Apex Legends Trios",        game: "apex-legends", date: "2026-11-22", time: "18:30", fee: 0,   prize: 3000,  max: 20,  taken: 11, unit: "teams",   status: "upcoming",  host: "Neha Ace",
      desc: "Trios tournament with 6 lobbies. Points for placement and kills across all games." },
    { id: "t11", name: "Fortnite Victory Royale Cup", game: "fortnite",   date: "2026-11-30", time: "19:00", fee: 99,  prize: 6000,  max: 100, taken: 52, unit: "players", status: "upcoming",  host: "Simran FN",
      desc: "Solo cup with the Victory Royale format. Five matches, best three scores count." },
    { id: "t12", name: "CODM Ranked Rumble",        game: "codm",         date: "2026-11-17", time: "20:00", fee: 50,  prize: 8000,  max: 64,  taken: 30, unit: "players", status: "upcoming",  host: "Arjun Clutch",
      desc: "Multiplayer ranked-style knockout on Hardpoint and Search and Destroy." },
    { id: "t13", name: "Warzone Mobile Open",       game: "codm",         date: "2026-10-12", time: "18:00", fee: 0,   prize: 4000,  max: 64,  taken: 64, unit: "players", status: "completed", host: "Play-Mate Official",
      desc: "Battle royale open event. Completed, with results announced on the community page." },
    { id: "t14", name: "Minecraft PvP Arena",       game: "minecraft",    date: "2026-11-10", time: "14:00", fee: 0,   prize: 1500,  max: 32,  taken: 32, unit: "players", status: "ongoing",   host: "Ananya Builds",
      desc: "Bracket-style PvP arena fights. Spectating is open to everyone." }
  ];

  W.SLIDES = [
    { img: "images/banners/ghost.jpg",   title: "Welcome to <span style=\"white-space:nowrap\">Play-Mate</span>",
      sub: "Connect with fellow gamers and discover gaming partners.", cta: "Explore Players", href: "players.html", tag: "Find your squad" },
    { img: "images/banners/warzone.jpg", title: "Drop in with a squad",
      sub: "Battle royale is better with teammates who actually call out.", cta: "Search Games", href: "search.html", tag: "Battle Royale" },
    { img: "images/banners/masked.jpg",  title: "Rule the lobby",
      sub: "Match with players who share your favourite games and your pace.", cta: "Explore Players", href: "players.html", tag: "Tactical FPS" },
    { img: "images/banners/soldier.jpg", title: "Build your profile",
      sub: "Show off your favourite games and let teammates find you.", cta: "View Profile", href: "profile.html", tag: "Your gamer card" }
  ];

  /* ---------------- storage helpers ---------------- */
  var K = { users: "pm_users", cur: "pm_user", regs: "pm_regs", slots: "pm_slots", custom: "pm_custom_tours", chats: "pm_chats" };
  function read(k, d) { try { var v = localStorage.getItem(k); return v ? JSON.parse(v) : d; } catch (e) { return d; } }
  function write(k, v) { try { localStorage.setItem(k, JSON.stringify(v)); return true; } catch (e) { return false; } }
  function changed() { try { window.dispatchEvent(new Event("pmchange")); } catch (e) {} }

  var PM = W.PM = {};
  PM.read = read; PM.write = write; PM.keys = K;

  /* avatars */
  var COLORS = ["#ff6a1a", "#18c8ff", "#a855f7", "#22c55e", "#ef4444", "#eab308", "#ec4899", "#14b8a6"];
  function svgUri(s) { return "data:image/svg+xml;utf8," + encodeURIComponent(s); }
  PM.BLANK_AVATAR = svgUri('<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 200 200"><rect width="200" height="200" fill="#1c1c22"/><circle cx="100" cy="78" r="38" fill="#4a4a55"/><path d="M26 190c6-44 38-66 74-66s68 22 74 66z" fill="#4a4a55"/></svg>');
  PM.avatarFor = function (p) {
    if (!p) return PM.BLANK_AVATAR;
    if (p.img) return p.img;
    if (p.avatar) return p.avatar;
    var name = p.name || p.fullName || "?", sum = 0;
    for (var i = 0; i < name.length; i++) sum += name.charCodeAt(i);
    var c = COLORS[sum % COLORS.length];
    return svgUri('<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 200 200"><rect width="200" height="200" fill="' + c + '"/><text x="100" y="128" font-family="Arial,sans-serif" font-size="92" font-weight="700" text-anchor="middle" fill="#0a0a0a">' + name.charAt(0).toUpperCase() + '</text></svg>');
  };

  /* games */
  PM.game = function (slug) { return W.GAMES.filter(function (g) { return g.slug === slug; })[0]; };
  PM.gameByName = function (name) { return W.GAMES.filter(function (g) { return g.name === name; })[0]; };

  /* validation (shared by register + edit profile) */
  PM.validate = {
    fullName: function (v) { v = (v || "").trim(); if (!v) return "Full name is required."; if (v.length < 2) return "Full name must be at least 2 characters."; if (!/^[A-Za-z][A-Za-z .'-]*$/.test(v)) return "Use letters only (spaces, . ' - allowed)."; return ""; },
    username: function (v) { v = (v || "").trim(); if (!v) return "Username is required."; if (!/^[A-Za-z0-9_]{3,20}$/.test(v)) return "3-20 characters: letters, numbers and underscore only."; return ""; },
    email: function (v) { v = (v || "").trim(); if (!v) return "Email address is required."; if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(v)) return "Enter a valid email address."; return ""; },
    phone: function (v) {
      v = (v || "").replace(/[\s-]/g, ""); if (!v) return "Phone number is required.";
      v = v.replace(/^(\+91|91|0)(?=\d{10}$)/, "");
      if (!/^\d+$/.test(v)) return "Phone number must contain digits only.";
      if (v.length !== 10) return "Enter a 10-digit mobile number.";
      if (!/^[6-9]/.test(v)) return "Indian mobile numbers start with 6, 7, 8 or 9.";
      return "";
    },
    password: function (v) { if (!v) return "Password is required."; if (v.length < 8) return "Password must be at least 8 characters."; if (!/[A-Za-z]/.test(v) || !/\d/.test(v)) return "Password needs at least one letter and one number."; return ""; }
  };
  PM.cleanPhone = function (v) { return (v || "").replace(/[\s-]/g, "").replace(/^(\+91|91|0)(?=\d{10}$)/, ""); };

  /* users */
  PM.users = function () {
    var u = read(K.users, null);
    if (!u) {
      u = [{ fullName: "Rahul Gamer", username: "rahul_gamer", email: "demo@playmate.com", phone: "9876543210", password: "Demo@123",
             bio: "Passionate gamer looking for new teammates and gaming friends.", favGame: "BGMI", avatar: "" }];
      write(K.users, u);
    }
    return u;
  };
  PM.currentUser = function () {
    var id; try { id = localStorage.getItem(K.cur); } catch (e) {}
    if (!id) return null;
    var found = PM.users().filter(function (u) { return u.username.toLowerCase() === id.toLowerCase(); })[0];
    if (!found) { try { localStorage.removeItem(K.cur); } catch (e) {} return null; }
    return found;
  };
  PM.register = function (d) {
    var users = PM.users(), errs = {};
    if (users.some(function (u) { return u.username.toLowerCase() === d.username.trim().toLowerCase(); })) errs.username = "That username is already taken.";
    if (users.some(function (u) { return u.email.toLowerCase() === d.email.trim().toLowerCase(); })) errs.email = "An account with this email already exists.";
    if (users.some(function (u) { return u.phone === PM.cleanPhone(d.phone); })) errs.phone = "This phone number is already registered.";
    if (Object.keys(errs).length) return { ok: false, errors: errs };
    var user = { fullName: d.fullName.trim(), username: d.username.trim(), email: d.email.trim(), phone: PM.cleanPhone(d.phone),
                 password: d.password, bio: "", favGame: "", avatar: "" };
    users.push(user); write(K.users, users);
    try { localStorage.setItem(K.cur, user.username); } catch (e) {}
    return { ok: true, user: user };
  };
  PM.login = function (ident, pw) {
    ident = (ident || "").trim().toLowerCase();
    var u = PM.users().filter(function (x) { return x.email.toLowerCase() === ident || x.username.toLowerCase() === ident; })[0];
    if (!u) return { ok: false, error: "No account found. Please register first." };
    if (u.password !== pw) return { ok: false, error: "Incorrect password. Try again." };
    try { localStorage.setItem(K.cur, u.username); } catch (e) {}
    return { ok: true, user: u };
  };
  PM.logout = function () { try { localStorage.removeItem(K.cur); } catch (e) {} };
  PM.updateUser = function (oldUsername, patch) {
    var users = PM.users(), errs = {};
    users.forEach(function (u) {
      if (u.username.toLowerCase() === oldUsername.toLowerCase()) return;
      if (patch.username && u.username.toLowerCase() === patch.username.toLowerCase()) errs.username = "That username is already taken.";
      if (patch.email && u.email.toLowerCase() === patch.email.toLowerCase()) errs.email = "Another account uses this email.";
      if (patch.phone && u.phone === patch.phone) errs.phone = "Another account uses this phone number.";
    });
    if (Object.keys(errs).length) return { ok: false, errors: errs };
    var me = users.filter(function (u) { return u.username.toLowerCase() === oldUsername.toLowerCase(); })[0];
    Object.keys(patch).forEach(function (k) { me[k] = patch[k]; });
    if (!write(K.users, users)) return { ok: false, errors: { avatar: "Could not save: browser storage is full. Try a smaller picture." } };
    if (patch.username && patch.username !== oldUsername) {
      try { localStorage.setItem(K.cur, patch.username); } catch (e) {}
      var regs = read(K.regs, {}); if (regs[oldUsername]) { regs[patch.username] = regs[oldUsername]; delete regs[oldUsername]; write(K.regs, regs); }
    }
    changed();
    return { ok: true, user: me };
  };

  /* profile lookup: own account or a sample player */
  PM.profileFor = function (id) {
    var cur = PM.currentUser();
    if (!id) return cur ? { self: true, username: cur.username, name: cur.fullName, email: cur.email, phone: cur.phone, bio: cur.bio, favGame: cur.favGame, avatar: cur.avatar, online: true, games: [] } : null;
    if (cur && cur.username.toLowerCase() === id.toLowerCase()) return PM.profileFor();
    var p = W.PLAYERS.filter(function (x) { return x.id === id; })[0];
    if (!p) return null;
    return { self: false, username: p.id, name: p.name, bio: p.bio, favGame: p.game, img: p.img, online: p.online, last: p.last, games: p.games };
  };

  /* tournaments */
  PM.tournaments = function () {
    var custom = read(K.custom, []);
    return W.TOURNAMENTS.concat(custom);
  };
  PM.tournament = function (id) { return PM.tournaments().filter(function (t) { return t.id === id; })[0]; };
  PM.addTournament = function (t) {
    var custom = read(K.custom, []);
    t.id = "c" + Date.now(); t.status = "upcoming"; t.taken = 0; t.unit = "players"; t.custom = true;
    custom.push(t); write(K.custom, custom); changed(); return t;
  };
  PM.extraTaken = function (id) { return (read(K.slots, {})[id]) || 0; };
  PM.slotsLeft = function (t) { return Math.max(0, t.max - t.taken - PM.extraTaken(t.id)); };
  PM.isRegistered = function (id) {
    var u = PM.currentUser(); if (!u) return false;
    return (read(K.regs, {})[u.username] || []).indexOf(id) !== -1;
  };
  PM.registerFor = function (id) {
    var t = PM.tournament(id), u = PM.currentUser();
    if (!t) return { ok: false, message: "Tournament not found." };
    if (!u) return { ok: false, login: true, message: "Please log in to register for a tournament." };
    if (t.status !== "upcoming") return { ok: false, message: "Registration is closed for this tournament." };
    if (PM.isRegistered(id)) return { ok: false, message: "You are already registered for this tournament." };
    if (PM.slotsLeft(t) <= 0) return { ok: false, message: "Sorry, all slots are filled." };
    var regs = read(K.regs, {}), slots = read(K.slots, {});
    (regs[u.username] = regs[u.username] || []).push(id);
    slots[id] = (slots[id] || 0) + 1;
    write(K.regs, regs); write(K.slots, slots); changed();
    return { ok: true, message: "You're registered for " + t.name + "! See you in the lobby." };
  };

  /* formatting */
  PM.money = function (n) { return "\u20B9" + Number(n).toLocaleString("en-IN"); };
  PM.fmtDate = function (d) {
    var x = new Date(d + "T00:00:00"); return isNaN(x) ? d : x.toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" });
  };
  PM.fmtTime = function (t) {
    var p = (t || "00:00").split(":"), h = +p[0], m = p[1], ap = h >= 12 ? "PM" : "AM"; h = h % 12 || 12; return h + ":" + m + " " + ap;
  };
  PM.query = function (name) { var m = location.search.match(new RegExp("[?&]" + name + "=([^&]*)")); return m ? decodeURIComponent(m[1].replace(/\+/g, " ")) : ""; };
})();
