/* Edit Profile: separate page; saves to localStorage (React). */
(function () {
  var h = PMC.h, useState = React.useState, useRef = React.useRef;

  /* shrink the picture before storing it (localStorage is small) */
  function resize(file, cb) {
    var r = new FileReader();
    r.onload = function () {
      var img = new Image();
      img.onload = function () {
        var max = 320, s = Math.min(1, max / Math.max(img.width, img.height)), c = document.createElement("canvas");
        c.width = Math.round(img.width * s); c.height = Math.round(img.height * s);
        c.getContext("2d").drawImage(img, 0, 0, c.width, c.height);
        cb(c.toDataURL("image/jpeg", 0.85));
      };
      img.onerror = function () { cb(null); };
      img.src = r.result;
    };
    r.onerror = function () { cb(null); };
    r.readAsDataURL(file);
  }

  function Edit() {
    var me = PM.currentUser();
    if (!me) { location.replace("login.html"); return null; }
    var s = useState({ fullName: me.fullName, username: me.username, email: me.email, phone: me.phone, bio: me.bio || "", favGame: me.favGame || "", avatar: me.avatar || "" }),
        f = s[0], setF = s[1], e = useState({}), errs = e[0], setErrs = e[1], fileRef = useRef();
    var toast = PMC.useToast();
    function set(k) { return function (ev) { var v = ev.target.value; setF(function (o) { var n = Object.assign({}, o); n[k] = v; return n; }); }; }
    function pick(ev) {
      var file = ev.target.files && ev.target.files[0]; ev.target.value = "";
      if (!file) return;
      if (!/^image\//.test(file.type)) { setErrs(function (o) { return Object.assign({}, o, { avatar: "Please choose an image file (JPG, PNG, WEBP)." }); }); return; }
      if (file.size > 5 * 1024 * 1024) { setErrs(function (o) { return Object.assign({}, o, { avatar: "Image is too large. Max size is 5 MB." }); }); return; }
      resize(file, function (data) {
        if (!data) { setErrs(function (o) { return Object.assign({}, o, { avatar: "That image couldn't be read. Try another." }); }); return; }
        setErrs(function (o) { var n = Object.assign({}, o); delete n.avatar; return n; });
        setF(function (o) { return Object.assign({}, o, { avatar: data }); });
      });
    }
    function save(ev) {
      ev.preventDefault();
      var r = {}, V = PM.validate;
      r.fullName = V.fullName(f.fullName); r.username = V.username(f.username); r.email = V.email(f.email); r.phone = V.phone(f.phone);
      if (f.bio.length > 300) r.bio = "Description can be at most 300 characters.";
      Object.keys(r).forEach(function (k) { if (!r[k]) delete r[k]; });
      if (Object.keys(r).length) { setErrs(r); return; }
      var res = PM.updateUser(me.username, { fullName: f.fullName.trim(), username: f.username.trim(), email: f.email.trim(), phone: PM.cleanPhone(f.phone), bio: f.bio.trim(), favGame: f.favGame, avatar: f.avatar });
      if (!res.ok) { setErrs(res.errors); return; }
      toast.show("Profile updated successfully!", "ok");
      setTimeout(function () { location.href = "profile.html"; }, 700);
    }
    function field(k, label, type, ph) {
      return h`<div className=${"field" + (errs[k] ? " has-err" : "")}><label htmlFor=${"e_" + k}>${label}</label>
        <input id=${"e_" + k} type=${type} placeholder=${ph} value=${f[k]} onChange=${set(k)} aria-invalid=${!!errs[k]} ...${k === "phone" ? { inputMode: "numeric", maxLength: 14 } : {}} />
        ${errs[k] ? h`<p className="err" role="alert">${errs[k]}</p>` : null}</div>`;
    }
    return h`<${React.Fragment}>
      <div className="page-head"><h1>Edit Profile</h1><p>Update your details. Changes are saved on this device.</p></div>
      <form className="tour-form glass edit-form" noValidate onSubmit=${save}>
        <div className="avatar-edit">
          <div className="avatar"><img src=${f.avatar || PM.BLANK_AVATAR} alt="Profile picture preview" /></div>
          <div><p className="label-like">Profile Picture</p>
            <div className="form-actions" style=${{ marginTop: 0 }}>
              <button type="button" className="btn btn-outline" onClick=${function () { fileRef.current.click(); }}>${f.avatar ? "Change Picture" : "Upload Profile Picture"}</button>
              ${f.avatar ? h`<button type="button" className="btn btn-ghost" onClick=${function () { setF(function (o) { return Object.assign({}, o, { avatar: "" }); }); }}>Remove</button>` : null}
            </div>
            <input type="file" accept="image/*" hidden ref=${fileRef} onChange=${pick} />
            <p className="hint">JPG, PNG or WEBP, up to 5 MB. Preview only; saved when you click Save Changes.</p>
            ${errs.avatar ? h`<p className="err" role="alert">${errs.avatar}</p>` : null}</div>
        </div>
        <div className="form-grid">
          ${field("fullName", "Full Name", "text", "Your full name")}
          ${field("username", "Username", "text", "YourGamerTag")}
          ${field("email", "Email", "email", "you@example.com")}
          ${field("phone", "Phone Number", "tel", "10-digit mobile number")}
          <div className="field"><label htmlFor="e_fav">Favorite Game</label>
            <select id="e_fav" value=${f.favGame} onChange=${set("favGame")}><option value="">Select a game</option>${window.GAMES.map(function (g) { return h`<option key=${g.slug} value=${g.name}>${g.name}</option>`; })}</select></div>
          <div className=${"field full" + (errs.bio ? " has-err" : "")}><label htmlFor="e_bio">About Me</label>
            <textarea id="e_bio" rows="4" maxLength="300" placeholder="Tell other gamers about yourself..." value=${f.bio} onChange=${set("bio")}></textarea>
            <p className="hint right">${f.bio.length}/300</p>${errs.bio ? h`<p className="err" role="alert">${errs.bio}</p>` : null}</div>
        </div>
        <div className="form-actions"><button className="btn btn-primary" type="submit">Save Changes</button><a className="btn btn-ghost" href="profile.html">Cancel</a></div>
      </form>${toast.node}
    </${React.Fragment}>`;
  }
  PMC.mount(Edit);
})();
