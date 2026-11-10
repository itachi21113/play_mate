/* Login + Register forms with validation (React, localStorage demo accounts). */
(function () {
  var h = PMC.h, useState = React.useState;
  var page = document.body.getAttribute("data-page");

  function useForm(init) {
    var s = useState(init), f = s[0], setF = s[1], e = useState({}), errs = e[0], setErrs = e[1];
    function set(k) { return function (ev) { var v = ev.target.value; setF(function (o) { var n = Object.assign({}, o); n[k] = v; return n; }); }; }
    return { f: f, errs: errs, setErrs: setErrs, set: set };
  }
  function Field(p) {
    return h`<div className=${"field" + (p.err ? " has-err" : "")}><label htmlFor=${p.id}>${p.label}</label>
      <input id=${p.id} name=${p.id} type=${p.type || "text"} placeholder=${p.ph} value=${p.value} onChange=${p.onChange} autoComplete=${p.ac || "off"} aria-invalid=${!!p.err} ...${p.extra || {}} />
      ${p.err ? h`<p className="err" role="alert">${p.err}</p>` : null}</div>`;
  }

  function Register() {
    var F = useForm({ fullName: "", username: "", email: "", phone: "", password: "", confirm: "" }), f = F.f, errs = F.errs;
    var m = useState(null), msg = m[0], setMsg = m[1];
    function submit(ev) {
      ev.preventDefault(); var V = PM.validate, r = {};
      r.fullName = V.fullName(f.fullName); r.username = V.username(f.username); r.email = V.email(f.email); r.phone = V.phone(f.phone); r.password = V.password(f.password);
      r.confirm = !f.confirm ? "Please confirm your password." : (f.confirm !== f.password ? "Passwords do not match." : "");
      Object.keys(r).forEach(function (k) { if (!r[k]) delete r[k]; });
      if (!Object.keys(r).length) { var res = PM.register(f); if (res.ok) { setMsg({ ok: true, t: "Account created! Taking you to Play-Mate..." }); F.setErrs({}); setTimeout(function () { location.href = "index.html"; }, 900); return; } r = res.errors; }
      setMsg(null); F.setErrs(r);
    }
    return h`<form className="auth-card" noValidate onSubmit=${submit}>
      <h1>Create Your Account</h1><p className="lead">Pick a username and start finding teammates.</p>
      <${Field} id="fullName" label="Full Name" ph="Your full name" value=${f.fullName} onChange=${F.set("fullName")} err=${errs.fullName} ac="name" />
      <${Field} id="username" label="Username" ph="YourGamerTag" value=${f.username} onChange=${F.set("username")} err=${errs.username} ac="username" />
      <${Field} id="email" label="Email Address" type="email" ph="you@example.com" value=${f.email} onChange=${F.set("email")} err=${errs.email} ac="email" />
      <${Field} id="phone" label="Phone Number" type="tel" ph="10-digit mobile number" value=${f.phone} onChange=${F.set("phone")} err=${errs.phone} ac="tel" extra=${{ inputMode: "numeric", maxLength: 14 }} />
      <${Field} id="password" label="Password" type="password" ph="At least 8 characters, with a number" value=${f.password} onChange=${F.set("password")} err=${errs.password} ac="new-password" />
      <${Field} id="confirm" label="Confirm Password" type="password" ph="Repeat password" value=${f.confirm} onChange=${F.set("confirm")} err=${errs.confirm} ac="new-password" />
      <button className="btn btn-primary" type="submit">Register</button>
      <p className=${"form-msg" + (msg ? " ok" : "")} aria-live="polite">${msg ? msg.t : ""}</p>
      <p className="switch">Already have an account? <a href="login.html">Login</a></p></form>`;
  }

  function Login() {
    var F = useForm({ email: "", password: "" }), f = F.f, errs = F.errs;
    var m = useState(null), msg = m[0], setMsg = m[1];
    function submit(ev) {
      ev.preventDefault(); var r = {};
      if (!f.email.trim()) r.email = "Enter your email or username.";
      if (!f.password) r.password = "Password is required.";
      if (Object.keys(r).length) { F.setErrs(r); setMsg(null); return; }
      var res = PM.login(f.email, f.password);
      if (!res.ok) { F.setErrs({}); setMsg({ ok: false, t: res.error }); return; }
      F.setErrs({}); setMsg({ ok: true, t: "Login successful! Redirecting..." });
      setTimeout(function () { location.href = "index.html"; }, 700);
    }
    return h`<form className="auth-card" noValidate onSubmit=${submit}>
      <h1>Login to Play-Mate</h1><p className="lead">Welcome back. Your squad is waiting.</p>
      <${Field} id="email" label="Email or Username" ph="you@example.com" value=${f.email} onChange=${F.set("email")} err=${errs.email} ac="username" />
      <${Field} id="password" label="Password" type="password" ph="Your password" value=${f.password} onChange=${F.set("password")} err=${errs.password} ac="current-password" />
      <button className="btn btn-primary" type="submit">Login</button>
      <p className=${"form-msg" + (msg ? (msg.ok ? " ok" : " err") : "")} aria-live="polite">${msg ? msg.t : ""}</p>
      <p className="demo-hint">Demo account: <b>demo@playmate.com</b> / <b>Demo@123</b></p>
      <p className="switch">New here? <a href="register.html">Register</a></p></form>`;
  }
  PMC.mount(page === "register" ? Register : Login);
})();
