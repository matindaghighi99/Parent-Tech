(function(){
  "use strict";
  var reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  /* nav */
  var nav = document.getElementById("nav");
  if(nav){
    var onScroll=function(){ nav.classList.toggle("scrolled", window.scrollY>24); };
    onScroll(); window.addEventListener("scroll", onScroll, {passive:true});
    var mb=document.getElementById("menuBtn"), nl=document.getElementById("navlinks");
    if(mb){ mb.addEventListener("click",function(){
      var o=document.body.classList.toggle("menu-open"); mb.setAttribute("aria-expanded",o?"true":"false");
    });
    nl.addEventListener("click",function(e){ if(e.target.tagName==="A"){document.body.classList.remove("menu-open");mb.setAttribute("aria-expanded","false");}});}
  }

  /* reveal */
  var revs=document.querySelectorAll(".reveal");
  if(reduce||!("IntersectionObserver" in window)){ revs.forEach(function(r){r.classList.add("in");}); }
  else{ var io=new IntersectionObserver(function(es){es.forEach(function(en){if(en.isIntersecting){en.target.classList.add("in");io.unobserve(en.target);}});},{threshold:.14});
    revs.forEach(function(r){io.observe(r);}); }

  /* counters */
  var cs=document.querySelectorAll("[data-count]");
  if(cs.length){
    if(reduce||!("IntersectionObserver" in window)){ cs.forEach(function(el){el.firstChild.textContent=el.getAttribute("data-count");}); }
    else{ var cio=new IntersectionObserver(function(es){es.forEach(function(en){
      if(!en.isIntersecting)return; var el=en.target,tg=+el.getAttribute("data-count"),t0=null;
      function tick(ts){if(!t0)t0=ts;var p=Math.min((ts-t0)/1000,1);el.firstChild.textContent=Math.round(p*tg);if(p<1)requestAnimationFrame(tick);}
      requestAnimationFrame(tick); cio.unobserve(el);
    });},{threshold:.6}); cs.forEach(function(c){cio.observe(c);}); }
  }

  /* contact form */
  var form=document.getElementById("lf");
  if(form){
    var done=document.getElementById("formDone");
    var fOf=function(i){return i.closest(".field");};
    var vEmail=function(v){return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v);};
    form.addEventListener("submit",function(e){
      e.preventDefault(); var ok=true;
      [{i:"lname",t:function(v){return v.trim().length>0;}},
       {i:"lorg",t:function(v){return v.trim().length>0;}},
       {i:"lemail",t:function(v){return vEmail(v.trim());}},
       {i:"lmsg",t:function(v){return v.trim().length>0;}}].forEach(function(c){
        var el=document.getElementById(c.i),g=c.t(el.value);fOf(el).classList.toggle("invalid",!g);if(!g)ok=false;});
      if(!ok){var b=form.querySelector(".field.invalid input,.field.invalid textarea");if(b)b.focus();return;}
      form.style.display="none"; done.classList.add("show");
      done.scrollIntoView({behavior:reduce?"auto":"smooth",block:"center"});
    });
    form.addEventListener("input",function(e){var f=e.target.closest(".field");if(f&&f.classList.contains("invalid"))f.classList.remove("invalid");});
  }

  /* hero aurora dust */
  var canvas=document.getElementById("aura");
  if(canvas){
    var ctx=canvas.getContext("2d"),W,H,dpr=Math.min(window.devicePixelRatio||1,2),P=[];
    var TEAL=[47,230,192],VIO=[139,125,240];
    function lerp(a,b,t){return[a[0]+(b[0]-a[0])*t,a[1]+(b[1]-a[1])*t,a[2]+(b[2]-a[2])*t];}
    function size(){var r=canvas.getBoundingClientRect();W=r.width;H=r.height;canvas.width=W*dpr;canvas.height=H*dpr;ctx.setTransform(dpr,0,0,dpr,0,0);}
    function build(){P=[];var n=Math.round(Math.min(90,W/16));for(var i=0;i<n;i++){P.push({x:Math.random()*W,y:Math.random()*H,r:Math.random()*1.8+.5,s:Math.random()*.25+.05,ph:Math.random()*6.28,a:Math.random()*.5+.2});}}
    function frame(t){
      ctx.clearRect(0,0,W,H);
      for(var i=0;i<P.length;i++){var p=P[i];
        p.y-=p.s; p.x+=Math.sin(t*0.0004+p.ph)*0.2;
        if(p.y<-4){p.y=H+4;p.x=Math.random()*W;}
        var c=lerp(TEAL,VIO,p.x/W),tw=0.6+0.4*Math.sin(t*0.001+p.ph);
        ctx.beginPath();ctx.fillStyle="rgba("+(c[0]|0)+","+(c[1]|0)+","+(c[2]|0)+","+(p.a*tw)+")";
        ctx.arc(p.x,p.y,p.r,0,6.2832);ctx.fill();
      }
      requestAnimationFrame(frame);
    }
    function init(){size();build();if(!reduce)requestAnimationFrame(frame);else frame(0);}
    init();
    var rt;window.addEventListener("resize",function(){clearTimeout(rt);rt=setTimeout(init,160);});
  }
})();
