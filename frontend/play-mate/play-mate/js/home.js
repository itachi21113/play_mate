/* Home: hero carousel + poster rows (React). */
(function () {
  var h = PMC.h, useState = React.useState, useEffect = React.useEffect, useRef = React.useRef;

  function Hero() {
    var slides = window.SLIDES, s = useState(0), cur = s[0], setCur = s[1], p = useState(false), paused = p[0], setPaused = p[1];
    var x0 = useRef(null);
    function go(n) { setCur((n + slides.length) % slides.length); }
    useEffect(function () {
      if (paused || window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
      var t = setInterval(function () { setCur(function (c) { return (c + 1) % slides.length; }); }, 6000);
      return function () { clearInterval(t); };
    }, [paused, cur]);
    return h`<section className="hero" aria-label="Featured" onMouseEnter=${function () { setPaused(true); }} onMouseLeave=${function () { setPaused(false); }}
        onTouchStart=${function (e) { x0.current = e.touches[0].clientX; }}
        onTouchEnd=${function (e) { if (x0.current === null) return; var dx = e.changedTouches[0].clientX - x0.current; if (Math.abs(dx) > 50) go(cur + (dx < 0 ? 1 : -1)); x0.current = null; }}>
      <div className="slides">${slides.map(function (sl, i) {
        var Tag = i === 0 ? "h1" : "h2";
        return h`<div key=${i} className=${"slide" + (i === cur ? " active" : "")}><img src=${sl.img} alt="" />
          <div className="content"><span className="tag">${sl.tag}</span>
          <${Tag} dangerouslySetInnerHTML=${{ __html: sl.title }}></${Tag}>
          <p>${sl.sub}</p><a className="btn btn-primary btn-lg" href=${sl.href}>${sl.cta}</a></div></div>`;
      })}</div>
      <button className="arrow prev" aria-label="Previous slide" onClick=${function () { go(cur - 1); }}>\u2039</button>
      <button className="arrow next" aria-label="Next slide" onClick=${function () { go(cur + 1); }}>\u203A</button>
      <div className="dots">${slides.map(function (_, i) {
        return h`<button key=${i} aria-label=${"Go to slide " + (i + 1)} className=${i === cur ? "on" : ""} onClick=${function () { go(i); }}></button>`;
      })}</div></section>`;
  }

  function Row(p) {
    var ref = useRef();
    function scroll(d) { ref.current.scrollBy({ left: d * ref.current.clientWidth * 0.8, behavior: "smooth" }); }
    return h`<section className="section"><h2>${p.title}</h2>
      <div className="row-wrap"><button className="r-btn r-prev" aria-label="Scroll left" onClick=${function () { scroll(-1); }}>\u2039</button>
      <div className=${"row" + (p.cls ? " " + p.cls : "")} ref=${ref}>${p.children}</div>
      <button className="r-btn r-next" aria-label="Scroll right" onClick=${function () { scroll(1); }}>\u203A</button></div></section>`;
  }

  function Home() {
    return h`<${React.Fragment}><${Hero} /><div className="wrap">
      <${Row} title="Trending Games">${window.GAMES.map(function (g) { return h`<${PMC.GameCard} key=${g.slug} game=${g} />`; })}</${Row}>
      <${Row} title="Top Players" cls="players">${window.PLAYERS.slice(0, 6).map(function (pl) { return h`<${PMC.PlayerCard} key=${pl.id} player=${pl} />`; })}</${Row}>
    </div></${React.Fragment}>`;
  }
  PMC.mount(Home);
})();
