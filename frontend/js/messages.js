/* Messages: sample conversations, saved in localStorage (React). No backend. */
(function () {
  var h = PMC.h, useState = React.useState, useEffect = React.useEffect, useRef = React.useRef;
  if (!PM.currentUser()) { location.replace("login.html"); return; }

  var SEED = [
    { id: "amit_pro", last: "Ready for tonight's Valorant match?", time: "2 min ago", unread: 2, msgs: [
      { from: "them", text: "Ready for tonight's Valorant match?", time: "7:58 PM" },
      { from: "me", text: "Yes bro, invite me at 8 PM.", time: "7:59 PM", status: "seen" },
      { from: "them", text: "Sure. We need one more player.", time: "8:01 PM" },
      { from: "me", text: "I'll ask Rahul Gamer.", time: "8:02 PM", status: "delivered" } ] },
    { id: "sneha_plays", last: "Let's start a Minecraft server.", time: "10 min ago", unread: 0, msgs: [
      { from: "me", text: "Did you finish the new Minecraft map?", time: "7:40 PM", status: "seen" },
      { from: "them", text: "Almost! It looks amazing.", time: "7:44 PM" },
      { from: "them", text: "Let's start a Minecraft server.", time: "7:50 PM" } ] },
    { id: "karan_elite", last: "Tournament starts at 8 PM.", time: "1 hour ago", unread: 0, msgs: [
      { from: "me", text: "What time does the Free Fire scrim begin?", time: "6:48 PM", status: "seen" },
      { from: "them", text: "Tournament starts at 8 PM.", time: "7:02 PM" } ] },
    { id: "rohanx", last: "Need one more teammate for BGMI.", time: "3 hours ago", unread: 0, msgs: [
      { from: "them", text: "Need one more teammate for BGMI.", time: "5:12 PM" },
      { from: "me", text: "Count me in after dinner.", time: "5:20 PM", status: "delivered" } ] }
  ];
  var EMOJIS = ["😀","😂","😎","🔥","🎮","🏆","👍","🙌","💯","😅","🤝","🎯","⚡","👑","😤","🥳","🤯","😈","🫡","❤️"];

  function load() {
    var saved = PM.read(PM.keys.chats, null);
    if (!saved || !saved.length) return SEED.map(function (c) { return JSON.parse(JSON.stringify(c)); });
    return saved;
  }
  function pl(id) { return window.PLAYERS.filter(function (p) { return p.id === id; })[0]; }
  function nowTime() { return new Date().toLocaleTimeString([], { hour: "numeric", minute: "2-digit" }); }
  function statusOf(p) { return p.online ? "Online" : (p.last || "Offline"); }

  function Pfp(p) {
    return h`<span className=${"pfp " + (p.sm ? "sm" : "")}><img src=${PM.avatarFor(p.p)} alt="" /><i className=${"dot " + (p.p.online ? "on" : "off")} title=${p.p.online ? "Online" : "Offline"}></i></span>`;
  }
  function Tick(p) {
    return h`<svg className=${"tick " + p.status} viewBox="0 0 24 24" aria-label=${p.status === "seen" ? "Seen" : "Delivered"}><path d="m2 13 4 4L14 8M10 15l2 2 9-10"/></svg>`;
  }

  function Messages() {
    var cs = useState(load), chats = cs[0], setChats = cs[1];
    var as = useState(function () { var q = PM.query("chat"); return q && pl(q) ? q : null; }), activeId = as[0], setActive = as[1];
    var qs = useState(""), query = qs[0], setQuery = qs[1];
    var ts = useState(""), draft = ts[0], setDraft = ts[1];
    var es = useState(false), emojiOpen = es[0], setEmojiOpen = es[1];
    var ms = useState(false), menuOpen = ms[0], setMenuOpen = ms[1];
    var ss = useState(false), searchOpen = ss[0], setSearchOpen = ss[1];
    var cq = useState(""), chatQ = cq[0], setChatQ = cq[1];
    var ty = useState(null), typingId = ty[0], setTyping = ty[1];
    var areaRef = useRef(), fileRef = useRef(), timers = useRef([]);

    /* a chat opened from a profile (?chat=) gets created if it doesn't exist yet */
    useEffect(function () {
      if (activeId && !chats.some(function (c) { return c.id === activeId; })) {
        setChats(function (cur) { return [{ id: activeId, last: "No messages yet", time: "New", unread: 0, msgs: [] }].concat(cur); });
      }
    }, []);
    /* persist on every change */
    useEffect(function () { PM.write(PM.keys.chats, chats); }, [chats]);
    var active = chats.filter(function (c) { return c.id === activeId; })[0];
    var activeP = active ? pl(active.id) : null;
    /* always scroll to the latest message */
    useEffect(function () { if (areaRef.current) areaRef.current.scrollTop = areaRef.current.scrollHeight; }, [activeId, active && active.msgs.length, typingId]);
    useEffect(function () { return function () { timers.current.forEach(clearTimeout); }; }, []);
    useEffect(function () {
      function close(e) { if (!e.target.closest(".composer")) setEmojiOpen(false); if (!e.target.closest(".more-wrap")) setMenuOpen(false); }
      document.addEventListener("click", close); return function () { document.removeEventListener("click", close); };
    }, []);

    function patch(id, fn) { setChats(function (cur) { return cur.map(function (c) { return c.id === id ? fn(c) : c; }); }); }
    function open(id) {
      setActive(id); setChatQ(""); setSearchOpen(false); setMenuOpen(false); setEmojiOpen(false); setDraft("");
      patch(id, function (c) { return Object.assign({}, c, { unread: 0 }); });
    }
    function later(fn, ms) { var t = setTimeout(fn, ms); timers.current.push(t); }

    function send(text, isFile) {
      text = (text || "").trim(); if (!text || !activeId) return;
      var id = activeId, p = pl(id);
      patch(id, function (c) { return Object.assign({}, c, { last: (isFile ? "📎 " : "") + text, time: "Just now", unread: 0, msgs: c.msgs.concat([{ from: "me", text: text, time: nowTime(), status: "delivered", file: !!isFile }]) }); });
      later(function () { patch(id, function (c) { var m = c.msgs.slice(); for (var i = m.length - 1; i >= 0; i--) if (m[i].from === "me") { m[i] = Object.assign({}, m[i], { status: "seen" }); break; } return Object.assign({}, c, { msgs: m }); }); }, 1100);
      if (p && p.online && p.reply) {
        later(function () { setTyping(id); }, 700);
        later(function () {
          setTyping(null);
          patch(id, function (c) { return Object.assign({}, c, { last: p.reply, time: "Just now", unread: id === activeIdRef.current ? 0 : c.unread + 1, msgs: c.msgs.concat([{ from: "them", text: p.reply, time: nowTime() }]) }); });
        }, 2500);
      }
    }
    var activeIdRef = useRef(null); activeIdRef.current = activeId;

    var q = query.trim().toLowerCase();
    var list = chats.filter(function (c) { var p = pl(c.id); return p && (!q || p.name.toLowerCase().indexOf(q) !== -1 || c.last.toLowerCase().indexOf(q) !== -1); });
    var onlineList = list.filter(function (c) { return pl(c.id).online; });
    var cq2 = chatQ.trim().toLowerCase();

    return h`<${React.Fragment}>
      <div className="page-head msg-head"><h1>Messages</h1><p>Chat and stay connected with your teammates and gaming friends.</p></div>
      <section className=${"msg-shell glass" + (active ? " chat-open" : "")} aria-label="Messenger">
        <aside className="msg-side">
          <div className="side-top"><label className="chat-search"><svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="11" cy="11" r="7"/><path d="m20 20-3.5-3.5"/></svg>
            <input type="search" placeholder="Search conversations" aria-label="Search conversations" autoComplete="off" value=${query} onChange=${function (e) { setQuery(e.target.value); }} /></label></div>
          <div className="side-scroll">
            ${onlineList.length ? h`<${React.Fragment}><p className="side-label">Online now</p><div className="online-strip">${onlineList.map(function (c) { var p = pl(c.id);
              return h`<button key=${c.id} type="button" className="strip-item" aria-label=${"Open chat with " + p.name} onClick=${function () { open(c.id); }}><${Pfp} p=${p} /><span>${p.name.split(" ")[0]}</span></button>`; })}</div></${React.Fragment}>` : null}
            <p className="side-label">Recent chats</p>
            ${list.length ? list.map(function (c) { var p = pl(c.id);
              return h`<button key=${c.id} type="button" className=${"conv" + (c.id === activeId ? " active" : "")} onClick=${function () { open(c.id); }}>
                <${Pfp} p=${p} /><span className="conv-body"><span className="conv-top"><b>${p.name}</b><time>${c.time}</time></span>
                <span className="conv-bottom"><span className="conv-last">${c.last}</span>${c.unread ? h`<span className="badge" aria-label=${c.unread + " unread messages"}>${c.unread}</span>` : null}</span></span></button>`; })
              : h`<p className="side-empty">No conversations found.</p>`}
          </div>
        </aside>

        <section className="msg-main" aria-label="Chat window">
          ${!active ? h`<div className="chat-empty"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 5h16v11H9l-5 4z"/></svg><h2>Your messages</h2><p>Select a conversation to start chatting with your teammates.</p></div>` : h`<${React.Fragment}>
            <header className="chat-head">
              <button type="button" className="icon-btn back-btn" aria-label="Back to conversations" onClick=${function () { setActive(null); }}><svg viewBox="0 0 24 24"><path d="m15 5-7 7 7 7"/></svg></button>
              <${Pfp} p=${activeP} sm=${true} />
              <div className="head-id"><h2>${activeP.name}</h2><p className=${activeP.online ? "on" : ""}>${typingId === active.id ? "typing..." : statusOf(activeP)}</p></div>
              <div className="head-actions"><div className="more-wrap">
                <button type="button" className="icon-btn" aria-label="More options" aria-expanded=${menuOpen} onClick=${function () { setMenuOpen(!menuOpen); }}><svg viewBox="0 0 24 24"><circle cx="12" cy="5" r="1.2"/><circle cx="12" cy="12" r="1.2"/><circle cx="12" cy="19" r="1.2"/></svg></button>
                ${menuOpen ? h`<div className="menu"><a href=${"profile.html?u=" + activeP.id}>View profile</a>
                  <button type="button" onClick=${function () { setSearchOpen(true); setMenuOpen(false); }}>Search in chat</button>
                  <button type="button" onClick=${function () { patch(active.id, function (c) { return Object.assign({}, c, { msgs: [], last: "No messages yet" }); }); setMenuOpen(false); }}>Clear chat</button></div>` : null}
              </div></div>
            </header>
            ${searchOpen ? h`<div className="chat-search-row"><input type="search" autoFocus placeholder="Search in this chat" aria-label="Search in this chat" value=${chatQ} onChange=${function (e) { setChatQ(e.target.value); }} />
              <button type="button" className="icon-btn" aria-label="Close search" onClick=${function () { setSearchOpen(false); setChatQ(""); }}>×</button></div>` : null}
            <div className="chat-area" ref=${areaRef}>
              ${active.msgs.length ? h`<div className="day">Today</div>` : h`<div className="chat-empty small"><p>No messages yet. Say hi to ${activeP.name.split(" ")[0]}!</p></div>`}
              ${active.msgs.map(function (m, i) {
                var cls = m.from === "me" ? "out" : "in", hit = cq2 && m.text.toLowerCase().indexOf(cq2) !== -1, dim = cq2 && !hit;
                return h`<div key=${i} className=${"row-msg " + cls + (dim ? " dim" : "") + (hit ? " hit" : "")}><div className=${"bubble " + cls}>
                  ${m.file ? h`<span className="file"><svg viewBox="0 0 24 24"><path d="M6 3h8l4 4v14H6zM14 3v4h4"/></svg>${m.text}</span>` : m.text}
                  <span className="meta"><time>${m.time}</time>${m.from === "me" ? h`<${Tick} status=${m.status || "delivered"} />` : null}</span></div></div>`; })}
              ${typingId === active.id ? h`<div className="row-msg in"><div className="bubble in typing-bubble"><i></i><i></i><i></i></div></div>` : null}
            </div>
            <div className="composer">
              ${emojiOpen ? h`<div className="emoji-pop">${EMOJIS.map(function (em) { return h`<button key=${em} type="button" aria-label=${"Emoji " + em} onClick=${function () { setDraft(draft + em); }}>${em}</button>`; })}</div>` : null}
              <button type="button" className="icon-btn" aria-label="Emoji picker" aria-expanded=${emojiOpen} onClick=${function () { setEmojiOpen(!emojiOpen); }}><svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="9"/><path d="M8.5 14a4 4 0 0 0 7 0M9 9.5h.01M15 9.5h.01"/></svg></button>
              <button type="button" className="icon-btn" aria-label="Attach file" onClick=${function () { fileRef.current.click(); }}><svg viewBox="0 0 24 24"><path d="m20 11-8.5 8.5a5 5 0 0 1-7-7L13 4a3.5 3.5 0 0 1 5 5l-8.5 8.5a2 2 0 0 1-3-3L14 7"/></svg></button>
              <input type="file" hidden ref=${fileRef} onChange=${function (e) { var f = e.target.files && e.target.files[0]; if (f) send(f.name, true); e.target.value = ""; }} />
              <input className="msg-input" type="text" placeholder="Type a message..." aria-label="Type a message" autoComplete="off" value=${draft}
                onChange=${function (e) { setDraft(e.target.value); }} onFocus=${function () { if (active.unread) patch(active.id, function (c) { return Object.assign({}, c, { unread: 0 }); }); }}
                onKeyDown=${function (e) { if (e.key === "Enter") { e.preventDefault(); send(draft); setDraft(""); } }} />
              <button type="button" className="send-btn" aria-label="Send message" onClick=${function () { send(draft); setDraft(""); }}><svg viewBox="0 0 24 24"><path d="M3.4 20.4 21 12 3.4 3.6l.1 6.5L15 12 3.5 13.9z"/></svg></button>
            </div></${React.Fragment}>`}
        </section>
      </section>
    </${React.Fragment}>`;
  }
  PMC.mount(Messages);
})();
