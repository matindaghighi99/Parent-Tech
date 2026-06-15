(function(){
  "use strict";

  var reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  var doc = document.documentElement;

  /* -------- scroll progress hairline -------- */
  (function scrollbar(){
    var bar = document.createElement("div");
    bar.className = "scrollbar";
    bar.setAttribute("aria-hidden","true");
    document.body.appendChild(bar);
    var rAF = null;
    function tick(){
      var h = doc.scrollHeight - window.innerHeight;
      var p = h > 0 ? Math.min(1, Math.max(0, window.scrollY / h)) : 0;
      bar.style.setProperty("--scroll", p.toFixed(4));
      rAF = null;
    }
    function onScroll(){ if(!rAF) rAF = requestAnimationFrame(tick); }
    window.addEventListener("scroll", onScroll, {passive:true});
    window.addEventListener("resize", onScroll, {passive:true});
    tick();
  })();

  /* -------- nav: scrolled state + mobile menu -------- */
  var nav = document.getElementById("nav");
  if (nav){
    var onScroll = function(){ nav.classList.toggle("scrolled", window.scrollY > 16); };
    onScroll();
    window.addEventListener("scroll", onScroll, {passive:true});

    var mb = document.getElementById("menuBtn");
    var nl = document.getElementById("navlinks");
    if (mb && nl){
      mb.addEventListener("click", function(){
        var open = document.body.classList.toggle("menu-open");
        mb.setAttribute("aria-expanded", open ? "true" : "false");
      });
      nl.addEventListener("click", function(e){
        if (e.target.tagName === "A"){
          document.body.classList.remove("menu-open");
          mb.setAttribute("aria-expanded","false");
        }
      });
      // Esc closes menu
      document.addEventListener("keydown", function(e){
        if (e.key === "Escape" && document.body.classList.contains("menu-open")){
          document.body.classList.remove("menu-open");
          mb.setAttribute("aria-expanded","false");
          mb.focus();
        }
      });
    }
  }

  /* -------- reveal w/ stagger -------- */
  (function reveal(){
    // Apply stagger index to siblings within reveal groups
    document.querySelectorAll("[data-stagger]").forEach(function(group){
      var kids = group.querySelectorAll(".reveal");
      kids.forEach(function(el, i){ el.style.setProperty("--i", i); });
    });
    var revs = document.querySelectorAll(".reveal");
    if (reduce || !("IntersectionObserver" in window)){
      revs.forEach(function(r){ r.classList.add("in"); });
      return;
    }
    var io = new IntersectionObserver(function(entries){
      entries.forEach(function(en){
        if (en.isIntersecting){
          en.target.classList.add("in");
          io.unobserve(en.target);
        }
      });
    }, {threshold:.14, rootMargin:"0px 0px -40px 0px"});
    revs.forEach(function(r){ io.observe(r); });
  })();

  /* -------- tabular counters -------- */
  (function counters(){
    var els = document.querySelectorAll("[data-count]");
    if (!els.length) return;
    function fmt(n){ return Number(n).toLocaleString("en-CA"); }
    function setFinal(el){
      var tg = +el.getAttribute("data-count");
      var node = el.firstChild;
      if (node && node.nodeType === 3) node.textContent = fmt(tg);
      else el.textContent = fmt(tg);
    }
    if (reduce || !("IntersectionObserver" in window)){
      els.forEach(setFinal);
      return;
    }
    var io = new IntersectionObserver(function(entries){
      entries.forEach(function(en){
        if (!en.isIntersecting) return;
        var el = en.target;
        var tg = +el.getAttribute("data-count");
        var dur = 1100;
        var t0 = null;
        function tick(ts){
          if (!t0) t0 = ts;
          var p = Math.min((ts - t0) / dur, 1);
          var eased = 1 - Math.pow(1 - p, 3);
          var val = Math.round(eased * tg);
          var node = el.firstChild;
          if (node && node.nodeType === 3) node.textContent = fmt(val);
          else el.textContent = fmt(val);
          if (p < 1) requestAnimationFrame(tick);
        }
        requestAnimationFrame(tick);
        io.unobserve(el);
      });
    }, {threshold:.5});
    els.forEach(function(c){ io.observe(c); });
  })();

  /* -------- magnetic CTA (very subtle) -------- */
  (function magnetic(){
    if (reduce || matchMedia("(hover:none)").matches) return;
    var btns = document.querySelectorAll(".btn-teal");
    btns.forEach(function(btn){
      var rAF = null, x = 0, y = 0;
      btn.addEventListener("mousemove", function(e){
        var r = btn.getBoundingClientRect();
        x = (e.clientX - r.left - r.width/2) * 0.18;
        y = (e.clientY - r.top - r.height/2) * 0.22;
        if (!rAF) rAF = requestAnimationFrame(function(){
          btn.style.transform = "translate(" + x.toFixed(2) + "px," + (y - 2).toFixed(2) + "px)";
          rAF = null;
        });
      });
      btn.addEventListener("mouseleave", function(){
        btn.style.transform = "";
      });
    });
  })();

  /* -------- contact form -------- */
  (function form(){
    var f = document.getElementById("lf");
    if (!f) return;
    var done = document.getElementById("formDone");
    var fOf = function(i){ return i.closest(".field"); };
    var vEmail = function(v){ return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v); };
    var fields = [
      {i:"lname",  t:function(v){return v.trim().length>0;}},
      {i:"lorg",   t:function(v){return v.trim().length>0;}},
      {i:"lemail", t:function(v){return vEmail(v.trim());}},
      {i:"lmsg",   t:function(v){return v.trim().length>0;}}
    ];
    f.addEventListener("submit", function(e){
      e.preventDefault();
      var ok = true;
      fields.forEach(function(c){
        var el = document.getElementById(c.i);
        var good = c.t(el.value);
        fOf(el).classList.toggle("invalid", !good);
        if (!good) ok = false;
      });
      if (!ok){
        var bad = f.querySelector(".field.invalid input, .field.invalid textarea");
        if (bad) bad.focus();
        return;
      }
      f.style.display = "none";
      done.classList.add("show");
      done.scrollIntoView({behavior:reduce?"auto":"smooth", block:"center"});
    });
    f.addEventListener("input", function(e){
      var fld = e.target.closest(".field");
      if (fld && fld.classList.contains("invalid")) fld.classList.remove("invalid");
    });
  })();

  /* -------- hero aurora canvas (cartographic dust) -------- */
  (function aurora(){
    var canvas = document.getElementById("aura");
    if (!canvas) return;
    var ctx = canvas.getContext("2d");
    var dpr = Math.min(window.devicePixelRatio || 1, 2);
    var W = 0, H = 0;
    var particles = [];
    var lines = [];
    var T = [47,230,192], V = [139,125,240];
    var mouse = {x:.5, y:.5};
    var hasMouse = !matchMedia("(hover:none)").matches;

    function lerp(a,b,t){ return [ a[0]+(b[0]-a[0])*t, a[1]+(b[1]-a[1])*t, a[2]+(b[2]-a[2])*t ]; }
    function size(){
      var r = canvas.getBoundingClientRect();
      W = r.width; H = r.height;
      canvas.width = W * dpr; canvas.height = H * dpr;
      ctx.setTransform(dpr,0,0,dpr,0,0);
    }
    function build(){
      particles = [];
      var n = Math.round(Math.min(110, W / 14));
      for (var i=0;i<n;i++){
        particles.push({
          x: Math.random()*W,
          y: Math.random()*H,
          r: Math.random()*1.7 + .4,
          s: Math.random()*.22 + .04,
          ph: Math.random()*6.2832,
          a: Math.random()*.5 + .22
        });
      }
      // a few thin "contour" arcs hovering near the bottom
      lines = [];
      for (var j=0;j<4;j++){
        lines.push({
          y: H * (0.62 + j*0.08),
          amp: 22 + j*8,
          freq: 0.0024 + j*0.0004,
          phase: Math.random()*6.2832,
          alpha: 0.08 - j*0.012
        });
      }
    }

    function frame(t){
      ctx.clearRect(0,0,W,H);

      // soft horizon glow following mouse subtly
      var cx = W * (0.5 + (mouse.x - 0.5) * 0.05);
      var cy = H * (0.85 + (mouse.y - 0.5) * 0.03);
      var grad = ctx.createRadialGradient(cx, cy, 0, cx, cy, Math.max(W,H)*0.7);
      grad.addColorStop(0, "rgba(47,230,192,0.10)");
      grad.addColorStop(0.5, "rgba(139,125,240,0.04)");
      grad.addColorStop(1, "rgba(6,8,13,0)");
      ctx.fillStyle = grad;
      ctx.fillRect(0,0,W,H);

      // contour arcs — drawn as thin sine paths
      for (var li=0; li<lines.length; li++){
        var L = lines[li];
        ctx.beginPath();
        ctx.strokeStyle = "rgba(150,172,196," + L.alpha + ")";
        ctx.lineWidth = 1;
        for (var x=0; x<=W; x+=4){
          var y = L.y + Math.sin(x*L.freq + t*0.0003 + L.phase) * L.amp;
          if (x===0) ctx.moveTo(x,y); else ctx.lineTo(x,y);
        }
        ctx.stroke();
      }

      // dust particles
      for (var i=0;i<particles.length;i++){
        var p = particles[i];
        p.y -= p.s;
        p.x += Math.sin(t*0.0004 + p.ph) * 0.22;
        if (p.y < -4){ p.y = H + 4; p.x = Math.random()*W; }
        var c = lerp(T, V, p.x / W);
        var tw = 0.6 + 0.4 * Math.sin(t*0.001 + p.ph);
        ctx.beginPath();
        ctx.fillStyle = "rgba("+(c[0]|0)+","+(c[1]|0)+","+(c[2]|0)+","+(p.a*tw)+")";
        ctx.arc(p.x, p.y, p.r, 0, 6.2832);
        ctx.fill();
      }

      requestAnimationFrame(frame);
    }

    function staticFrame(){
      ctx.clearRect(0,0,W,H);
      var grad = ctx.createRadialGradient(W*0.5, H*0.85, 0, W*0.5, H*0.85, Math.max(W,H)*0.7);
      grad.addColorStop(0, "rgba(47,230,192,0.08)");
      grad.addColorStop(1, "rgba(6,8,13,0)");
      ctx.fillStyle = grad;
      ctx.fillRect(0,0,W,H);
      for (var li=0; li<lines.length; li++){
        var L = lines[li];
        ctx.beginPath();
        ctx.strokeStyle = "rgba(150,172,196," + L.alpha + ")";
        ctx.lineWidth = 1;
        for (var x=0; x<=W; x+=4){
          var y = L.y + Math.sin(x*L.freq + L.phase) * L.amp;
          if (x===0) ctx.moveTo(x,y); else ctx.lineTo(x,y);
        }
        ctx.stroke();
      }
    }

    function init(){
      size(); build();
      if (reduce) staticFrame();
      else requestAnimationFrame(frame);
    }

    if (hasMouse){
      window.addEventListener("mousemove", function(e){
        mouse.x = e.clientX / window.innerWidth;
        mouse.y = e.clientY / window.innerHeight;
      }, {passive:true});
    }

    init();
    var rt;
    window.addEventListener("resize", function(){
      clearTimeout(rt); rt = setTimeout(init, 160);
    });
  })();

  /* -------- subtle parallax on hero text -------- */
  (function heroParallax(){
    if (reduce || matchMedia("(hover:none)").matches) return;
    var hero = document.querySelector(".hero");
    var inner = document.querySelector(".hero-inner");
    if (!hero || !inner) return;
    var rAF = null, tx = 0, ty = 0;
    hero.addEventListener("mousemove", function(e){
      var r = hero.getBoundingClientRect();
      tx = ((e.clientX - r.left) / r.width - 0.5) * 6;
      ty = ((e.clientY - r.top)  / r.height - 0.5) * 4;
      if (!rAF) rAF = requestAnimationFrame(function(){
        inner.style.transform = "translate3d(" + tx.toFixed(2) + "px," + ty.toFixed(2) + "px,0)";
        rAF = null;
      });
    });
    hero.addEventListener("mouseleave", function(){
      inner.style.transform = "";
    });
  })();

})();
