// Glass-lens portfolio: smooth-scrolled content mirrored into a canvas texture
// and refracted through a WebGL lens whose shape morphs per section.
// Ported from the "Lens Portfolio" Claude Design component.
"use strict";

class Lens {
  constructor(root, props) { this.rootEl = root; this.props = props; }

  static THEMES = {
    light: { bg:'#f2efe9', fg:'#141312', mute:'#5f5b54', line:'rgba(20,19,18,0.14)', p1:'#dcd5c8', p2:'#c5cace', p3:'#ccd0c1', accent:'#4f7dfe' },
    dark: { bg:'#0f0f0e', fg:'#eeebe4', mute:'#b3afa6', line:'rgba(238,235,228,0.14)', p1:'#29261f', p2:'#1f242a', p3:'#23271e', accent:'#6e95ff' }
  };
  static VS = 'attribute vec2 a;varying vec2 vUv;void main(){vUv=a*0.5+0.5;gl_Position=vec4(a,0.,1.);}';
  static FS = `precision highp float;
varying vec2 vUv;
uniform sampler2D uTex;
uniform float uS,uR,uTri,uRot,uMag,uRefr,uCA,uGlow,uDark,uFlash,uQ;
uniform vec2 uC,uB,uTilt;
uniform vec4 uA;uniform float uSpread;
uniform vec3 uBg,uAcc;
mat2 rot2(float a){float c=cos(a),s=sin(a);return mat2(c,s,-s,c);}
float sdBox(vec2 p,vec2 b,float r){vec2 q=abs(p)-b+vec2(r);return length(max(q,0.))+min(max(q.x,q.y),0.)-r;}
float sdTri(vec2 p,float r){const float k=1.7320508;p.x=abs(p.x)-r;p.y=p.y+r/k;if(p.x+k*p.y>0.)p=vec2(p.x-k*p.y,-k*p.x-p.y)/2.;p.x-=clamp(p.x,-2.*r,0.);return -length(p)*sign(p.y);}
float map(vec2 p){
  p=rot2(uRot)*p;
  float r=min(uR,min(uB.x,uB.y));
  float d1=sdBox(p,uB,r);
  if(uTri<0.001)return d1;
  float s=max(uB.x,uB.y)*1.18;float rr=s*0.16;
  float d2=sdTri(vec2(p.x,-p.y),s-rr*1.732)-rr;
  return mix(d1,d2,uTri);
}
float comp(vec2 p){
  float dm=map(p);
  float am=min(min(uA.x,uA.y),min(uA.z,uA.w));
  float bl=smoothstep(0.96,1.0,am);
  if(bl>=1.)return dm;
  float M=max(uB.x,uB.y),E=M*1.3,h=E*0.5,du=1e5;
  for(int i=0;i<4;i++){
    float a=i==0?uA.x:i==1?uA.y:i==2?uA.z:uA.w;
    float dir=i==0?-0.6:i==1?0.45:i==2?-0.3:0.65;
    vec2 q=p-vec2(dir*uSpread*M*(1.-a),0.);
    float lo=-E+float(i)*h,hi=lo+h,gp=5.*(1.-clamp(a,0.,1.)),sl=-1e5;
    if(i>0)sl=max(sl,lo-q.y+gp);
    if(i<3)sl=max(sl,q.y-hi+gp);
    du=min(du,max(map(q),sl));
  }
  return mix(du,dm,bl);
}
vec3 samp(vec2 pos){vec2 uv=pos/uS;vec3 c=texture2D(uTex,clamp(uv,0.,1.)).rgb;float inb=step(0.,uv.x)*step(uv.x,1.)*step(0.,uv.y)*step(uv.y,1.);return mix(uBg,c,inb);}
void main(){
  vec2 f=vec2(vUv.x,1.-vUv.y)*uS;
  vec2 p=f-uC;
  float d=map(p);
  float mn=min(uB.x,uB.y);
  float fade=smoothstep(0.,40.,min(min(f.x,f.y),min(uS-f.x,uS-f.y)));
  float ds=map(p-vec2(-uTilt.x*0.8,mn*0.22));
  float sh=exp(-max(ds,0.)/(mn*0.32+8.))*(0.11-0.05*uDark)+exp(-max(d,0.)/4.)*0.05;
  float gl=uGlow*exp(-max(d,0.)/(mn*0.35+10.))*0.32;
  float oa=clamp(gl+sh*(1.-gl),0.,1.)*fade;
  vec2 cp=(p-vec2(uTilt.x*1.5,mn*0.55))/vec2(mn*0.6,mn*0.22);
  float caus=exp(-dot(cp,cp))*smoothstep(0.,8.,d)*mix(0.05,0.16,uDark);
  vec3 oc=(uAcc*gl+vec3(0.8,0.88,1.)*caus)*fade;
  if(d>1.){gl_FragColor=vec4(oc,oa);return;}
  vec2 e=vec2(1.,0.);
  vec2 g=vec2(map(p+e.xy)-map(p-e.xy),map(p+e.yx)-map(p-e.yx));
  g/=max(length(g),1e-4);
  float ew=mix(min(mn*0.8,110.),min(mn*0.5,70.),uTri);
  float t=clamp(-d/ew,0.,1.);
  float h=sqrt(max(1.-(1.-t)*(1.-t),0.));
  float edge=pow(1.-t,2.2);
  vec2 sp=uC+p/mix(1.,uMag,h)+g*edge*ew*0.9*uRefr+uTilt*h;
  vec2 pd=rot2(-uRot)*vec2(0.5,0.866);
  sp+=pd*uTri*h*30.*uRefr;
  vec2 off=sp-f;
  float ca=uCA*(0.03+0.09*edge+0.22*uTri+0.08*uFlash);
  vec3 col;
  if(uQ>0.5){
    vec3 acc=vec3(0.),ws=vec3(0.);
    for(int i=0;i<7;i++){
      float fi=float(i)/6.;
      vec3 w=vec3(max(0.,1.-abs(fi-1.)*2.),max(0.,1.-abs(fi-.5)*2.4),max(0.,1.-fi*2.));
      acc+=samp(f+off*(1.+ca*(fi*2.-1.)))*w; ws+=w;
    }
    col=acc/ws;
  } else col=vec3(samp(f+off*(1.+ca)).r,samp(sp).g,samp(f+off*(1.-ca)).b);
  float br=1.+7.*edge;
  vec3 bl=(samp(sp+vec2(br,0.))+samp(sp-vec2(br,0.))+samp(sp+vec2(0.,br))+samp(sp-vec2(0.,br)))*0.25;
  col=mix(col,bl,edge*0.55);
  vec2 L=normalize(vec2(-0.55,-0.85)+uTilt*0.02);
  float lit=dot(g,L);
  float rim=1.-smoothstep(0.,2.2,-d);
  float bev=pow(1.-t,3.);
  float id=(-d-ew*0.2)/2.5;
  float rim2=exp(-id*id)*max(-lit,0.)*0.22;
  float gy=clamp(p.y/max(uB.x,uB.y),-1.,1.);
  col*=1.-0.05*(gy*0.5+0.5)*h;
  col=mix(col,vec3(1.),clamp(0.07*max(-gy,0.)*h+bev*0.25*max(lit,0.)+rim*(0.2+0.6*max(lit,0.)),0.,1.));
  col=mix(col,vec3(1.),rim2);
  col=mix(col,vec3(0.),clamp(bev*0.12*max(-lit,0.)+rim*0.22*max(-lit,0.),0.,1.));
  vec2 sc=uC+vec2(-0.4,-0.45)*uB-uTilt*1.2;
  vec2 sq=(f-sc)/vec2(mn*0.3+4.,mn*0.2+3.);
  col=mix(col,vec3(1.),exp(-dot(sq,sq))*0.55*h);
  col=mix(col,uAcc,uGlow*0.3*pow(1.-t,1.5));
  col=mix(col,vec3(1.),clamp(uFlash*(0.08*h+0.5*rim+0.25*bev),0.,1.));
  float a=clamp(0.5-d,0.,1.);
  gl_FragColor=vec4(col*a+oc*(1.-a),a+oa*(1.-a));
}`;

  mount() {
    const root = this.rootEl; if (!root) return;
    this.root = root;
    this.q = s => root.querySelector(s);
    this.qa = s => Array.from(root.querySelectorAll(s));
    this.applyTheme();
    this.content = this.q('[data-content]'); this.spacer = this.q('[data-spacer]');
    this.prog = this.q('[data-prog]'); this.cue = this.q('[data-cue]');
    this.clock = this.q('[data-clock]'); this.clockFmt = new Intl.DateTimeFormat('en-GB', { hour: '2-digit', minute: '2-digit', timeZone: 'Europe/Paris' });
    this.stackCount = this.q('[data-stack-count]'); this.workCount = this.q('[data-work-count]');
    this.y = window.scrollY; this.prevY = this.y; this.skew = 0; this.hover = -1; this.hoverY = null;
    this.mouse = { x:0, y:0, sx:0, sy:0 }; this.heroOn = false; this.heroT = 0;
    this.coarse = matchMedia('(pointer: coarse)').matches;
    this.rm = matchMedia('(prefers-reduced-motion: reduce)').matches;
    this.mc = document.createElement('canvas').getContext('2d');
    this.tex = document.createElement('canvas'); this.tc = this.tex.getContext('2d');
    this.content.style.transform = `translate3d(0,${-this.y}px,0)`;
    this.initGL(); this.initReveals(); this.bind(); this.layout();
    const go = () => { if (this.dead || this.heroOn || !this.preDone) return; this.layout(); this.heroOn = true; this.heroT = performance.now();
      const h = location.hash.slice(1); if (h && this.sec[h]) { window.scrollTo(0, this.navTarget(h)); if (this.rm) this.y = this.navTarget(h); } };
    (document.fonts ? document.fonts.ready : Promise.resolve()).then(go);
    setTimeout(go, 1500);
    const pre = this.q('[data-pre]'), pn = this.q('[data-pre-n]');
    if (!pre || this.rm || sessionStorage.getItem('ab-pre')) { if (pre) pre.remove(); this.preDone = true; }
    else {
      sessionStorage.setItem('ab-pre', '1');
      const t0 = performance.now();
      const step = t => {
        if (this.dead) return;
        const k = Math.min(1, (t - t0) / 1100), e = 1 - Math.pow(1 - k, 3);
        pn.textContent = String(Math.round(e * 100));
        if (k < 1) { requestAnimationFrame(step); return; }
        pre.animate([{ transform: 'none' }, { transform: 'translateY(-100%)' }], { duration: 750, easing: 'cubic-bezier(.7,0,.2,1)', fill: 'forwards' }).finished.then(() => pre.remove());
        setTimeout(() => { this.preDone = true; go(); }, 220);
      };
      requestAnimationFrame(step);
    }
    this.tick = this.tick.bind(this);
    this.raf = requestAnimationFrame(this.tick);
  }

  setTheme(theme) {
    if (theme !== this.props.theme) { this.props = { ...this.props, theme }; localStorage.removeItem('ab-theme'); this.applyTheme(); this.layout(); }
  }

  destroy() {
    this.dead = true; cancelAnimationFrame(this.raf);
    removeEventListener('resize', this.onResize); removeEventListener('keydown', this.onKey); removeEventListener('mousemove', this.onMove);
    document.removeEventListener('mouseleave', this.onLeave); document.removeEventListener('focusin', this.onFocus);
    this.ro && this.ro.disconnect();
    (this.navEls || []).forEach(el => el.removeEventListener('click', this.onNav));
    (this.rows || []).forEach(r => { r.el.removeEventListener('mouseenter', r.en); r.el.removeEventListener('mouseleave', r.lv); });
  }

  applyTheme() {
    const name = this.themeName = localStorage.getItem('ab-theme') || (matchMedia('(prefers-color-scheme: light)').matches ? 'light' : (this.props.theme === 'light' ? 'light' : 'dark'));
    const btn = document.querySelector('[data-theme-toggle]');
    if (btn) { const su = btn.querySelector('[data-icon-sun]'), mo = btn.querySelector('[data-icon-moon]'); if (su && mo) { su.style.display = name === 'dark' ? 'block' : 'none'; mo.style.display = name === 'dark' ? 'none' : 'block'; if (this._iconAnim && !matchMedia('(prefers-reduced-motion: reduce)').matches) { (name === 'dark' ? su : mo).animate([{ transform: 'rotate(-120deg) scale(0.3)', opacity: 0 }, { transform: 'none', opacity: 1 }], { duration: 550, easing: 'cubic-bezier(.2,.9,.25,1.2)' }); } this._iconAnim = false; } btn.setAttribute('aria-label', 'Switch to ' + (name === 'dark' ? 'light' : 'dark') + ' theme'); btn.onclick = () => {
      const next = name === 'dark' ? 'light' : 'dark', r = btn.getBoundingClientRect(), cx = r.left + r.width / 2, cy = r.top + r.height / 2;
      const go = () => { localStorage.setItem('ab-theme', next); this._iconAnim = true; this.applyTheme(); if (this.root && this.root.style) this.root.style.background = ''; document.body.style.background = ''; this.tcs = null; if (this.layout) this.layout(); if (this.renderGlass && this.states) { this.rendered = false; this.renderGlass(performance.now()); } };
      if (!document.startViewTransition || matchMedia('(prefers-reduced-motion: reduce)').matches) { go(); return; }
      const vt = document.startViewTransition(go);
      vt.ready.then(() => {
        const R = Math.hypot(Math.max(cx, innerWidth - cx), Math.max(cy, innerHeight - cy));
        document.documentElement.animate({ clipPath: [`circle(0px at ${cx}px ${cy}px)`, `circle(${R}px at ${cx}px ${cy}px)`] }, { duration: 700, easing: 'cubic-bezier(.5,0,.2,1)', pseudoElement: '::view-transition-new(root)' });
      }).catch(() => {});
    }; }
    const t = Lens.THEMES[name];
    const s = document.documentElement.style;
    for (const k in t) s.setProperty('--' + k, t[k]);
    this.theme = t;
    const hx = h => [1,3,5].map(i => parseInt(h.slice(i, i + 2), 16) / 255);
    this.bgRGB = hx(t.bg); this.accRGB = hx(t.accent); this.tcs = null;
  }

  bind() {
    this.onResize = () => { if (this.coarse && innerWidth === this.W && Math.abs(innerHeight - this.H) < 160) return; this.layout(); };
    this.onMove = e => { this.mouse.x = e.clientX / this.W * 2 - 1; this.mouse.y = e.clientY / this.H * 2 - 1; this.mouse.px = e.clientX; this.mouse.py = e.clientY; };
    this.onLeave = () => { this.mouse.x = 0; this.mouse.y = 0; this.mouse.px = null; };
    addEventListener('resize', this.onResize);
    addEventListener('mousemove', this.onMove);
    document.addEventListener('mouseleave', this.onLeave);
    this.ro = new ResizeObserver(() => this.layout()); this.ro.observe(this.content);
    this.onFocus = e => { const el = e.target; if (!this.content.contains(el)) return; const r = el.getBoundingClientRect(); if (r.top < 80 || r.bottom > this.H - 40) window.scrollTo(0, Math.max(0, r.top + this.y - this.H * 0.4)); };
    document.addEventListener('focusin', this.onFocus);
    this.sbar = this.q('[data-sbar]'); this.sthumb = this.q('[data-sthumb]');
    if (this.sbar) {
      const hot = on => { this.sthumb.style.width = on ? '6px' : '3px'; this.sthumb.style.opacity = on ? '0.75' : '0.35'; };
      this.sbar.addEventListener('pointerenter', () => hot(true));
      this.sbar.addEventListener('pointerleave', () => { if (!this.drag) hot(false); });
      this.sbar.addEventListener('pointerdown', e => {
        e.preventDefault(); this.sbar.setPointerCapture(e.pointerId);
        const th = this.thumbH || 60, top = this.thumbTop || 0;
        this.drag = { off: (e.clientY >= top && e.clientY <= top + th) ? e.clientY - top : th / 2 };
        this.sthumb.style.background = 'var(--accent,#6e95ff)';
        const move = ev => { const th2 = this.thumbH || 60, t = Math.max(0, Math.min(this.H - th2, ev.clientY - this.drag.off)); window.scrollTo(0, t / Math.max(1, this.H - th2) * this.maxY); };
        move(e);
        const up = () => { this.drag = null; this.sthumb.style.background = ''; hot(false); this.sbar.removeEventListener('pointermove', move); this.sbar.removeEventListener('pointerup', up); this.sbar.removeEventListener('pointercancel', up); };
        this.sbar.addEventListener('pointermove', move); this.sbar.addEventListener('pointerup', up); this.sbar.addEventListener('pointercancel', up);
      });
    }
    this.keyBuf = '';
    this.onKey = e => {
      if (e.target && /input|textarea/i.test(e.target.tagName)) return;
      const k = e.key.length === 1 ? e.key.toLowerCase() : ''; if (!k || k === ' ') return;
      this.keyBuf = (this.keyBuf + k).slice(-8);
      if (this.keyBuf.endsWith("rur'u'")) {
        this.keyBuf = ''; this.eggT = performance.now(); this.solvedT = this.eggT; this.faceKey = null;
        const t = this.q('[data-egg]'); if (t) { t.textContent = "R U R' U'. Sexy move."; t.style.opacity = '1'; t.style.transform = 'none'; clearTimeout(this.eggTo); this.eggTo = setTimeout(() => { t.style.opacity = '0'; t.style.transform = 'translateY(8px)'; }, 2400); }
      }
    };
    addEventListener('keydown', this.onKey);
    this.navEls = this.qa('[data-nav]');
    this.onNav = e => { e.preventDefault(); window.scrollTo(0, this.navTarget(e.currentTarget.dataset.nav)); };
    this.navEls.forEach(el => el.addEventListener('click', this.onNav));
    this.rows = this.qa('[data-essay]').map((el, i) => {
      const r = { el, w: el.querySelector('[data-ewrap]'), x: 0 };
      r.en = () => { this.hover = i; }; r.lv = () => { if (this.hover === i) this.hover = -1; };
      el.addEventListener('mouseenter', r.en); el.addEventListener('mouseleave', r.lv);
      el.tabIndex = 0; el.setAttribute('role', 'link');
      r.go = e => { if (e.type === 'click' || e.key === 'Enter') (window.abGo ? window.abGo('note.html') : (location.href = 'note.html')); };
      el.addEventListener('click', r.go); el.addEventListener('keydown', r.go);
      el.addEventListener('focus', r.en); el.addEventListener('blur', r.lv);
      return r;
    });
  }

  navTarget(k) {
    const s = this.sec[k], H = this.H;
    if (!s || k === 'top') return 0;
    if (k === 'about') return s.top + s.h / 2 - H / 2;
    if (k === 'writing') return s.top + H * 0.05;
    if (k === 'contact') return this.maxY - (this.revealH || 0);
    return s.top;
  }

  initReveals() {
    this.groups = this.qa('[data-rg]').map(g => ({
      el: g, hero: g.dataset.rg === 'hero', on: false, base: parseFloat(g.dataset.rgDelay || 0),
      items: Array.from(g.querySelectorAll('[data-rv]')).map(el => {
        el._rv = { p: 0, from: 0, to: 0, start: 0, dur: 1, delay: 0, w: false };
        el.style.transform = 'translate3d(0,100%,0)'; el.style.clipPath = 'inset(-40% -20% 100% -20%)';
        return el;
      })
    }));
  }

  setGroup(g, on, now) {
    g.on = on;
    g.items.forEach(el => {
      const v = el._rv; v.from = v.p; v.to = on ? 1 : 0;
      v.start = now + (on ? (g.base + v.delay) * 1000 : 0); v.dur = on ? 1150 : 420; if (this.rm) { v.start = now; v.dur = 1; }
    });
  }

  updItem(el, now) {
    const v = el._rv; let p = v.p;
    if (now >= v.start) {
      const k = Math.min(1, (now - v.start) / v.dur);
      const e = v.to > v.from ? 1 - Math.pow(1 - k, 4) : k * k;
      p = v.from + (v.to - v.from) * e;
    }
    if (v.w && Math.abs(p - v.p) < 1e-4) return false;
    v.p = p; v.w = true;
    if (p >= 0.999) { el.style.transform = 'none'; el.style.clipPath = 'none'; }
    else { const o = (1 - p) * 100; el.style.transform = `translate3d(0,${o}%,0)`; el.style.clipPath = `inset(-40% -20% ${o}% -20%)`; }
    return true;
  }

  cache(el) {
    const cs = getComputedStyle(el), c = this.mc;
    const fs = parseFloat(cs.fontSize) || 16;
    const d = { el, fs, type: el.dataset.lens === 'panel' ? 'panel' : 'text' };
    d.font = `${cs.fontStyle} ${cs.fontWeight} ${fs}px ${cs.fontFamily}`;
    d.ls = cs.letterSpacing === 'normal' ? '0px' : cs.letterSpacing;
    d.color = cs.color; d.align = cs.textAlign; d.upper = cs.textTransform === 'uppercase';
    d.lh = cs.lineHeight === 'normal' ? fs * 1.2 : parseFloat(cs.lineHeight);
    const bg = cs.backgroundColor;
    d.bg = (bg === 'transparent' || /rgba\(.*,\s*0\)$/.test(bg)) ? null : bg;
    d.bw = parseFloat(cs.borderTopWidth) || 0; d.bc = cs.borderTopColor; d.br = parseFloat(cs.borderTopLeftRadius) || 0;
    d.pl = parseFloat(cs.paddingLeft) || 0; d.pr = parseFloat(cs.paddingRight) || 0; d.pt = parseFloat(cs.paddingTop) || 0;
    d.op = parseFloat(cs.opacity); if (isNaN(d.op)) d.op = 1;
    d.text = el.childElementCount === 0;
    c.font = d.font; try { c.letterSpacing = d.ls; } catch (e) {}
    const m = c.measureText('Hg');
    d.asc = m.fontBoundingBoxAscent || fs * 0.92; d.desc = m.fontBoundingBoxDescent || fs * 0.24;
    d.cap = c.measureText('H').actualBoundingBoxAscent || fs * 0.7;
    return d;
  }

  layout() {
    if (!this.root || this.dead) return;
    const W = innerWidth, H = innerHeight; this.W = W; this.H = H; this.m = Math.min(W * 1.15, H);
    this.dpr = this.coarse ? Math.min(devicePixelRatio || 1, 1.25) : Math.min((devicePixelRatio || 1) * 1.25, 2.25);
    const mob = W < 700; this.mobile = mob;
    const rvl = this.q('[data-reveal]'), rsp0 = this.q('[data-reveal-space]'), cs0 = this.q('[data-sec="contact"]');
    if (rvl && rsp0 && cs0) {
      const wm = rvl.querySelector('[data-wordmark]'), mqRow = this.q('[data-marq]') && this.q('[data-marq]').parentElement;
      cs0.style.minHeight = '0px'; if (wm) wm.style.display = 'block'; if (mqRow) mqRow.style.display = 'flex';
      let fh = rvl.offsetHeight;
      if (wm && cs0.offsetHeight + fh > H) { wm.style.display = 'none'; fh = rvl.offsetHeight; }
      if (mqRow && cs0.offsetHeight + fh > H) mqRow.style.display = 'none';
      rsp0.style.height = fh + 'px'; cs0.style.minHeight = Math.max(H - fh, 0) + 'px';
    }
    const name = this.q('[data-name]');
    if (name && !name.getAttribute('aria-label')) { name.setAttribute('aria-label', 'Alban Billiette'); Array.from(name.children).forEach(c => c.setAttribute('aria-hidden', 'true')); }
    this.faces = this.qa('[data-face]');
    if (name) { const sp = name.querySelector('span:not([data-rv])'); if (sp) { sp.style.display = mob ? 'block' : 'inline-block'; sp.style.height = mob ? '0' : ''; } }
    const bio = this.q('[data-sec="about"] p[data-rg]'); if (bio) bio.style.gridColumn = mob ? '1 / -1' : '1 / span 9';
    const cueG = this.cue && this.cue.closest('[data-rg]'); if (cueG) cueG.style.display = mob ? 'none' : 'flex';
    const brand = this.q('header [data-nav="top"]'); if (brand) { const t = mob ? 'AB' : 'Alban Billiette'; if (brand.textContent !== t) brand.textContent = t; }
    const navEl = this.q('header nav'); if (navEl) navEl.style.gap = mob ? '14px' : 'clamp(16px,2.4vw,36px)';
    if (name) {
      name.style.fontSize = '18vw';
      const avail = name.parentElement.clientWidth - W * 0.06, w = name.offsetWidth;
      if (w > 0) name.style.fontSize = (W * 0.18 * avail / w) + 'px';
    }
    const ch = this.content.offsetHeight;
    this.spacer.style.height = ch + 'px'; this.maxY = Math.max(0, ch - H);
    this.sec = {};
    this.qa('[data-sec]').forEach(el => { this.sec[el.dataset.sec] = { el, top: el.offsetTop, h: el.offsetHeight, pin: el.querySelector('[data-pin]') }; });
    this.draws = this.qa('[data-lens]').filter(el => el.dataset.lens === 'panel' || !el.parentElement.closest('[data-lens="panel"]')).map(el => {
      const d = this.cache(el);
      if (d.type === 'panel') d.kids = Array.from(el.querySelectorAll('[data-lens]')).map(k => this.cache(k));
      return d;
    });
    this.words = this.qa('[data-word]').map(el => ({ el, h: el.offsetHeight, kids: Array.from(el.querySelectorAll('[data-lens]')) }));
    this.track = this.q('[data-track]'); this.panels = this.track ? Array.from(this.track.querySelectorAll('[data-lens="panel"]')) : [];
    this.bioWords = this.qa('[data-sec="about"] p[data-rg] [data-rv]');
    this.mags = this.mags || this.qa('header a, header button, [data-sec="contact"] a').map(el => ({ el, x: 0, y: 0 }));
    this.marq = this.q('[data-marq]'); if (this.marq) this.mqW = this.marq.scrollWidth / 3;
    this.prev = this.q('[data-preview]'); this.prevLbl = this.q('[data-preview-label]'); if (this.prev) { this.prevH = this.prev.offsetHeight; this.prevW = this.prev.offsetWidth; }
    this.revealEl = this.q('[data-reveal]'); this.revealLens = this.revealEl ? Array.from(this.revealEl.querySelectorAll('[data-lens]')) : [];
    const rsp = this.q('[data-reveal-space]'); this.revealH = rsp ? rsp.offsetHeight : 0;
    if (this.track) { this.trackW = this.track.scrollWidth; this.cardC = Array.from(this.track.children).map(a => a.offsetLeft + a.offsetWidth / 2); }
    if (this.panels[0]) { const p = this.panels[0]; this.panelY = this.track.offsetTop + p.offsetTop + p.offsetHeight / 2; }
    (this.rows || []).forEach(r => { r.top = r.el.offsetTop; r.h = r.el.offsetHeight; });
    const y = this.y;
    const m0 = this.m;
    const capMid = (el, d) => (d.lh - (d.asc + d.desc)) / 2 + d.asc - d.cap;
    if (name) {
      const d = this.cache(name.querySelector('[data-lens]'));
      const nr = name.getBoundingClientRect();
      this.heroMid = mob ? nr.top + y + nr.height * 0.5 + m0 * 0.13 : nr.top + y + capMid(name, d) + d.cap / 2;
    }
    const hl = this.q('[data-hl1]');
    if (hl) {
      const sp = hl.querySelector('[data-lens]'), d = this.cache(sp), r = hl.getBoundingClientRect();
      const R = this.m * 0.065;
      this.contactX = r.left + sp.offsetWidth * 0.8;
      this.contactY = r.top + y - this.maxY + capMid(hl, d) - R * 0.88;
      this.contactY = Math.max(this.contactY, 72 + R * 1.2);
    }
    (this.groups || []).forEach(g => {
      let lt = null, line = -1;
      g.items.forEach((el, i) => {
        const t = el.offsetTop;
        if (lt === null || Math.abs(t - lt) > 4) { line++; lt = t; }
        el._rv.delay = g.hero ? 0.15 + i * 0.055 : line * 0.09 + i * 0.008;
      });
    });
    this.buildStates();
  }

  buildStates() {
    const W = this.W, H = this.H, m = this.m, S = this.sec;
    const c = s => s.top + s.h / 2 - H / 2;
    const st = [
      { a: 0, b: H * 0.05, f: () => ({ x: W * 0.62, y: (this.heroMid || H * 0.6) - m * 0.13, bw: m * .23, bh: m * .23, r: m * .23, tri: 0, rot: 0, mag: 1.14, glow: 0 }) },
      { a: c(S.about) - H * .1, b: c(S.about) + H * .1, f: () => ({ x: W * (this.mobile ? 0.9 : 0.86), y: H * .5, bw: m * (this.mobile ? .075 : .1), bh: m * (this.mobile ? .26 : .31), r: m * .05, tri: 0, rot: .1, mag: 1.06, glow: 0 }) },
      { a: S.stack.top, b: S.stack.top + S.stack.h - H, f: p => ({ x: W * .5, y: H * .5, bw: m * .23, bh: m * .23, r: m * .04, tri: 1, rot: -0.2 + p * 1.1 + 2.0944 * (p < 0.4 ? (p / 0.4) * (p / 0.4) * (3 - 2 * p / 0.4) : 1), mag: 1.02, glow: 0 }) },
      { a: S.work.top, b: S.work.top + S.work.h - H, f: p => ({ x: W * .5, y: this.panelY || H * .45, bw: m * .055, bh: m * .3, r: m * .055, tri: 0, rot: .14 + Math.PI - p * .1, mag: 1.5, glow: 0 }) },
      { a: c(S.writing) - H * .12, b: c(S.writing) + H * .12, f: () => ({ x: W * (this.mobile ? .84 : .77), y: this.hoverY == null ? H * (this.mobile ? .3 : .5) : this.hoverY, bw: m * (this.mobile ? .1 : .15) * (1 + .14 * (this.hoverAmt || 0)), bh: m * (this.mobile ? .1 : .15) * (1 + .14 * (this.hoverAmt || 0)), r: m * .2, tri: 0, rot: Math.PI, mag: 1.16 + .1 * (this.hoverAmt || 0), glow: 1 + .8 * (this.hoverAmt || 0) }) },
      { a: this.maxY - (this.revealH || 0), b: this.maxY, f: p => ({ x: this.contactX || W * .6, y: (this.contactY || H * .5) + (1 - p) * (this.revealH || 0), bw: m * .065, bh: m * .065, r: m * .065, tri: 0, rot: Math.PI, mag: 1.2, glow: .35 }) }
    ];
    for (let i = 1; i < st.length; i++) { st[i].a = Math.max(st[i].a, st[i - 1].b); st[i].b = Math.max(st[i].b, st[i].a); }
    this.states = st;
  }

  spring(G) {
    const f = this._f || 1, keys = Object.keys(G);
    if (!this.sp || this.rm) { this.sp = {}; keys.forEach(k => this.sp[k] = { v: G[k], u: 0 }); return { ...G }; }
    const o = {}; let act = false;
    keys.forEach(k => {
      const s = this.sp[k] || (this.sp[k] = { v: G[k], u: 0 });
      s.u += (G[k] - s.v) * 0.11 * f; s.u *= Math.pow(0.76, f); s.v += s.u * f;
      if (Math.abs(s.u) > 0.01) act = true;
      o[k] = s.v;
    });
    this.springActive = act || Math.abs((this.st && this.st.u) || 0) > 0.0005;
    o.tri = Math.min(1, Math.max(0, o.tri)); o.glow = Math.max(0, o.glow); o.r = Math.max(0, o.r);
    o.bw = Math.max(4, o.bw); o.bh = Math.max(4, o.bh); o.mag = Math.max(1, o.mag);
    return o;
  }

  stretch() {
    const f = this._f || 1, s = this.st || (this.st = { v: 0, u: 0 });
    if (this.rm) return 0;
    const tgt = Math.min(Math.abs(this.vel || 0) * 0.0045, 0.2);
    s.u += (tgt - s.v) * 0.08 * f; s.u *= Math.pow(0.8, f); s.v += s.u * f;
    return Math.max(-0.12, Math.min(0.25, s.v));
  }

  tintAt(y) {
    const dark = this.themeName !== 'light';
    const L = new Array(6).fill(dark ? '#0f0f0e' : '#f2efe9');
    const hx = h => [1,3,5].map(i => parseInt(h.slice(i, i + 2), 16));
    const st = this.states;
    for (let i = 0; i < st.length; i++) {
      if (y <= st[i].b) {
        if (y >= st[i].a || i === 0) return hx(L[i]);
        let t = (y - st[i - 1].b) / Math.max(1, st[i].a - st[i - 1].b); t = t * t * (3 - 2 * t);
        const a = hx(L[i - 1]), b = hx(L[i]);
        return a.map((v, k) => v + (b[k] - v) * t);
      }
    }
    return hx(L[L.length - 1]);
  }

  glassAt(y) {
    const st = this.states;
    for (let i = 0; i < st.length; i++) {
      const s = st[i];
      if (y <= s.b) {
        if (y >= s.a || i === 0) return s.f(s.b > s.a ? (y - s.a) / (s.b - s.a) : 0);
        const pv = st[i - 1];
        let t = (y - pv.b) / Math.max(1, s.a - pv.b); t = t * t * (3 - 2 * t);
        const A = pv.f(1), B = s.f(0), o = {};
        for (const k in A) o[k] = A[k] + (B[k] - A[k]) * t;
        return o;
      }
    }
    return st[st.length - 1].f(1);
  }

  initGL() {
    const cv = this.q('[data-glass]'); this.cv = cv;
    const gl = cv.getContext('webgl', { alpha: true, premultipliedAlpha: true, antialias: false });
    this.gl = gl; if (!gl) { cv.style.display = 'none'; return; }
    const sh = (type, src) => { const s = gl.createShader(type); gl.shaderSource(s, src); gl.compileShader(s); if (!gl.getShaderParameter(s, gl.COMPILE_STATUS)) console.error(gl.getShaderInfoLog(s)); return s; };
    const pr = gl.createProgram();
    gl.attachShader(pr, sh(gl.VERTEX_SHADER, Lens.VS)); gl.attachShader(pr, sh(gl.FRAGMENT_SHADER, Lens.FS));
    gl.linkProgram(pr); gl.useProgram(pr);
    const b = gl.createBuffer(); gl.bindBuffer(gl.ARRAY_BUFFER, b);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1,-1,1,-1,-1,1,1,1]), gl.STATIC_DRAW);
    const loc = gl.getAttribLocation(pr, 'a'); gl.enableVertexAttribArray(loc); gl.vertexAttribPointer(loc, 2, gl.FLOAT, false, 0, 0);
    const tx = gl.createTexture(); gl.bindTexture(gl.TEXTURE_2D, tx);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE); gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR); gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
    this.u = {};
    ['uTex','uS','uR','uTri','uRot','uMag','uRefr','uCA','uGlow','uDark','uC','uB','uTilt','uBg','uAcc','uFlash','uQ','uA','uSpread'].forEach(n => this.u[n] = gl.getUniformLocation(pr, n));
    gl.uniform1i(this.u.uTex, 0);
  }

  rr(x, y, w, h, r) {
    const c = this.tc; c.beginPath(); r = Math.max(0, Math.min(r, h / 2, w / 2));
    if (c.roundRect && r > 0) c.roundRect(x, y, w, h, r); else c.rect(x, y, w, h);
  }

  wrap(s, w) {
    const c = this.tc;
    if (c.measureText(s).width <= w) return [s];
    const out = []; let cur = '';
    for (const wd of s.split(' ')) { const t = cur ? cur + ' ' + wd : wd; if (cur && c.measureText(t).width > w) { out.push(cur); cur = wd; } else cur = t; }
    if (cur) out.push(cur);
    return out;
  }

  drawBox(d, x, y, w, h, op) {
    const c = this.tc; c.globalAlpha = op;
    if (d.bg) { c.fillStyle = d.bg; this.rr(x, y, w, h, d.br); c.fill(); }
    if (d.bw > 0) { c.strokeStyle = d.bc; c.lineWidth = d.bw; this.rr(x + d.bw / 2, y + d.bw / 2, w - d.bw, h - d.bw, d.br - d.bw / 2); c.stroke(); }
    if (!d.text) return;
    let s = d.el.textContent; if (!s || !s.trim()) return; s = s.trim(); if (d.upper) s = s.toUpperCase();
    c.font = d.font; try { c.letterSpacing = d.ls; } catch (e) {} c.fillStyle = d.color;
    const cw = w - d.pl - d.pr - 2 * d.bw, cx = x + d.pl + d.bw, cy = y + d.pt + d.bw;
    if (d._s !== s || Math.abs((d._w || 0) - cw) > 1) { d._lines = this.wrap(s, cw + 2); d._s = s; d._w = cw; }
    const pad = (d.lh - (d.asc + d.desc)) / 2 + d.asc;
    d._lines.forEach((ln, i) => {
      let lx = cx;
      if (d.align === 'center' || d.align === 'right' || d.align === 'end') { const lw = c.measureText(ln).width; lx = d.align === 'center' ? cx + (cw - lw) / 2 : cx + cw - lw; }
      c.fillText(ln, lx, cy + i * d.lh + pad);
    });
  }

  drawPanel(d, r, op) {
    const el = d.el, c = this.tc, w = el.offsetWidth, h = el.offsetHeight;
    c.save(); c.globalAlpha = op;
    c.translate(r.left + r.width / 2, r.top + r.height / 2);
    c.transform(1, 0, Math.tan(el._skew || 0), 1, 0, 0);
    c.translate(-w / 2, -h / 2);
    c.beginPath(); c.rect(0, 0, w, h); c.clip();
    c.fillStyle = d.bg || '#ccc'; c.fillRect(0, 0, w, h);
    c.strokeStyle = this.theme.line; c.lineWidth = 1; c.beginPath();
    const stp = 12 * Math.SQRT2;
    for (let k = 0; k < w + h; k += stp) { c.moveTo(k, 0); c.lineTo(k - h, h); }
    c.stroke();
    d.kids.forEach(k => this.drawBox(k, k.el.offsetLeft, k.el.offsetTop, k.el.offsetWidth, k.el.offsetHeight, op));
    c.restore();
  }

  drawMirror(bx, by, S) {
    const c = this.tc, dpr = this.dpr;
    c.setTransform(dpr, 0, 0, dpr, -bx * dpr, -by * dpr);
    c.globalAlpha = 1; c.fillStyle = this.tcs || this.theme.bg; c.fillRect(bx, by, S, S);
    for (const d of this.draws) {
      const r = d.el.getBoundingClientRect();
      if (!r.width || r.right < bx || r.left > bx + S || r.bottom < by || r.top > by + S) continue;
      const op = d.el._op != null ? d.el._op : d.op; if (op <= 0.01) continue;
      if (d.type === 'panel') { this.drawPanel(d, r, op); continue; }
      const rv = d.el._rv; let clip = false;
      if (rv) {
        if (rv.p <= 0.001) continue;
        if (rv.p < 0.999) { const h = r.height, ot = r.top - (1 - rv.p) * h; c.save(); c.beginPath(); c.rect(r.left - 200, ot - h * 0.4, r.width + 400, h * 1.4); c.clip(); clip = true; }
      }
      this.drawBox(d, r.left, r.top, r.width, r.height, op);
      if (clip) c.restore();
    }
  }

  renderGlass(now) {
    const gl = this.gl; if (!gl || !this.states) return;
    if (this.coarse && this.rendered && !this.active && now - this.heroT > 4500) return;
    this.rendered = true;
    const G0 = this.glassAt(this.y), G = this.spring(G0), ms = this.mouse, t = now / 1000;
    const k = this.rm && this.heroOn ? 1 : this.heroOn ? Math.min(1, Math.max(0, (now - this.heroT - 950) / 1700)) : 0;
    const ie = 1 - Math.pow(1 - k, 3), sc = 0.6 + 0.4 * ie, km = k - 1, drop = 1 + 2.6 * km * km * km + 1.6 * km * km;
    const ek = this.eggT ? Math.min(1, (now - this.eggT) / 1300) : 1, ee = ek < 1 ? 0.5 - 0.5 * Math.cos(ek * Math.PI) : 0, ew = ek < 1 ? Math.sin(ek * Math.PI * 3) * (1 - ek) : 0;
    if (ek < 1) this.active = true;
    const st = this.stretch(), bw = G.bw * sc * (1 - st * 0.45) * (1 + 0.14 * ew), bh = G.bh * sc * (1 + st) * (1 - 0.14 * ew), mn = Math.min(bw, bh);
    const ks = this.heroOn && !this.rm ? Math.min(1, Math.max(0, (now - this.heroT - 900) / 2600)) : 1, es = ks < 0.5 ? 4 * ks * ks * ks : 1 - Math.pow(-2 * ks + 2, 3) / 2;
    const sweep = (1 - es) * (this.W * 0.1 - G.x) * Math.max(0, 1 - this.y / (this.H * 0.5));
    const cx = G.x + sweep + ms.sx * 18, cy = G.y + ms.sy * 13 + (this.rm ? 0 : Math.sin(t * 0.9) * 4) - (1 - drop) * this.H * 0.12;
    const rot = G.rot + ms.sx * 0.08 + Math.sin(t * 0.45) * 0.015 + ee * Math.PI * 2;
    const half = Math.max(bw, bh) * 1.45 + mn * 0.6 + 70;
    const S = Math.ceil(half * 2 / 32) * 32;
    const bx = Math.round(cx - S / 2), by = Math.round(cy - S / 2);
    const px = Math.round(S * this.dpr);
    if (this.texPx !== px) { this.texPx = px; this.tex.width = this.tex.height = px; this.cv.width = this.cv.height = px; this.cv.style.width = this.cv.style.height = S + 'px'; }
    this.cv.style.transform = `translate3d(${bx}px,${by}px,0)`;
    this.cv.style.opacity = Math.min(1, k * 4);
    this.drawMirror(bx, by, S);
    const u = this.u, P = this.props;
    gl.viewport(0, 0, px, px);
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, this.tex);
    gl.uniform1f(u.uS, S); gl.uniform2f(u.uC, cx - bx, cy - by); gl.uniform2f(u.uB, bw, bh);
    gl.uniform1f(u.uR, G.r * sc); gl.uniform1f(u.uTri, G.tri); gl.uniform1f(u.uRot, rot); gl.uniform1f(u.uMag, G.mag);
    gl.uniform1f(u.uRefr, P.refraction ?? 1); gl.uniform1f(u.uCA, P.aberration ?? 1); gl.uniform1f(u.uGlow, G.glow);
    gl.uniform1f(u.uDark, this.themeName === 'light' ? 0 : 1);
    gl.uniform2f(u.uTilt, ms.sx * 22, ms.sy * 22);
    gl.uniform1f(u.uFlash, Math.max(this.flash || 0, ek < 1 ? Math.sin(ek * Math.PI) * 1.5 : 0)); gl.uniform1f(u.uQ, this.coarse ? 0 : 1);
    const Sk = this.sec.stack, f1 = this._f || 1, sm = x => { x = Math.min(1, Math.max(0, x)); return x * x * (3 - 2 * x); };
    const asm = this.asm || (this.asm = [0, 1, 2, 3].map(() => ({ v: 0, u: 0 })));
    asm.forEach((a, i) => {
      const tg = !Sk || this.y < Sk.top ? 0 : this.y > Sk.top + Sk.h - this.H ? 1 : sm(((this.stackShift ?? -1) - i + 0.55) / 0.45);
      if (this.rm) { a.v = tg; a.u = 0; return; }
      a.u += (tg - a.v) * 0.14 * f1; a.u *= Math.pow(0.7, f1); a.v += a.u * f1;
      if (Math.abs(a.u) > 0.0005 || Math.abs(tg - a.v) > 0.002) this.active = true;
    });
    gl.uniform4f(u.uA, asm[0].v, asm[1].v, asm[2].v, asm[3].v); gl.uniform1f(u.uSpread, P.spread ?? 0.5);
    gl.uniform3fv(u.uBg, this.bgRGB); gl.uniform3fv(u.uAcc, this.accRGB);
    gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
  }

  tick(now) {
    if (this.dead) return;
    this.raf = requestAnimationFrame(this.tick);
    if (!this.W || !this.states) return;
    const dt = Math.min(64, now - (this.last || now)) || 16.67; this.last = now;
    const f = dt / 16.67, P = this.props, W = this.W, H = this.H;
    let lerp = 0.3 - 0.28 * (P.inertia ?? 0.55); if (this.coarse) lerp = 1; if (this.rm) lerp = 1;
    const target = Math.min(window.scrollY, this.maxY);
    this.y += (target - this.y) * (1 - Math.pow(1 - lerp, f));
    if (Math.abs(target - this.y) < 0.05) this.y = target;
    this.active = this.springActive || Math.abs(target - this.y) > 0.05 || (this.flash || 0) > 0.002;
    const y = this.y, vel = (y - this.prevY) / f; this.prevY = y; this.vel = vel; this._f = f;
    const ms = this.mouse; ms.sx += (ms.x - ms.sx) * 0.06 * f; ms.sy += (ms.y - ms.sy) * 0.06 * f;
    const cl = (v, a, b) => Math.max(a, Math.min(b, v)), pad = n => String(n).padStart(2, '0');

    const gr = this.groups.map(g => g.el.getBoundingClientRect());
    this.content.style.transform = `translate3d(0,${-y}px,0)`;
    for (const k in this.sec) { const s = this.sec[k]; if (s.pin) s.pin.style.transform = `translate3d(0,${cl(y - s.top, 0, s.h - H)}px,0)`; }

    const st = this.sec.stack;
    if (st) {
      const p = cl((y - st.top) / (st.h - H), 0, 1), n = this.words.length, s0 = p * (n - 1 + 0.7) - 0.35, fl = Math.floor(s0), e3 = x => x * x * (3 - 2 * x), fr = s0 - fl, shift = fl + fr + (e3(fr) - fr) * 0.55;
      this.stackShift = shift;
      this.words.forEach((w, i) => {
        const rel = i - shift;
        w.el.style.transform = `translate3d(0,${H * 0.5 + rel * H * 0.6 - w.h / 2}px,0)`;
        const o = cl(1 - Math.abs(rel) * 0.8, 0.1, 1);
        w.kids.forEach(kd => { kd._op = o; kd.style.opacity = o; });
      });
      const txt = pad(cl(Math.round(shift), 0, n - 1) + 1) + ' / ' + pad(n);
      if (this.stackCount && this.stackCount.textContent !== txt) this.stackCount.textContent = txt;
    }
    const wk = this.sec.work;
    if (wk && this.track) {
      const p = cl((y - wk.top) / (wk.h - H), 0, 1);
      const tx = -p * Math.max(0, this.trackW - W);
      this.track.style.transform = `translate3d(${tx}px,0,0)`;
      const inPin = y >= wk.top - H * 0.3 && y <= wk.top + wk.h - H * 0.7;
      let fl = 0; if (inPin && !this.rm) (this.cardC || []).forEach(c => { const d = (tx + c - W * 0.5) / (W * 0.05); fl = Math.max(fl, Math.exp(-d * d)); });
      this.flash = (this.flash || 0) + (fl - (this.flash || 0)) * 0.2 * f;
      const txt = pad(Math.round(p * (this.panels.length - 1)) + 1) + ' / ' + pad(this.panels.length);
      if (this.workCount && this.workCount.textContent !== txt) this.workCount.textContent = txt;
      this.skew += ((this.rm ? 0 : cl(vel * 0.1, -6, 6)) - this.skew) * 0.12 * f;
      const rad = this.skew * Math.PI / 180;
      this.panels.forEach(pl => { pl._skew = rad; pl.style.transform = `skewX(${this.skew.toFixed(3)}deg)`; });
    }
    this.rows.forEach((r, i) => { r.x += ((this.hover === i ? W * 0.03 : 0) - r.x) * 0.12 * f; r.w.style.transform = `translate3d(${r.x.toFixed(2)}px,0,0)`; });
    const hr = this.rows[this.hover];
    const hy = hr ? hr.top + hr.h / 2 - y : H * 0.5;
    this.hoverY = this.hoverY == null ? hy : this.hoverY + (hy - this.hoverY) * 0.08 * f;
    this.hoverAmt = (this.hoverAmt || 0) + ((hr ? 1 : 0) - (this.hoverAmt || 0)) * 0.08 * f;

    this.groups.forEach((g, i) => {
      const r = gr[i];
      if (g.hero) { if (this.heroOn && !g.on) this.setGroup(g, true, now); }
      else if (!g.on) { if (this.heroOn && r.top < H * 0.9 && r.bottom > 0) this.setGroup(g, true, now); }
      else if (r.top > H * 1.02) this.setGroup(g, false, now);
      g.items.forEach(el => { if (this.updItem(el, now)) this.active = true; });
    });

    const tc = this.tintAt(y).map(Math.round), tcs = `rgb(${tc[0]},${tc[1]},${tc[2]})`;
    if (tcs !== this.tcs) { this.tcs = tcs; this.root.style.background = tcs; document.body.style.background = tcs; this.bgRGB = tc.map(v => v / 255); }
    if (this.sthumb) {
      const th = Math.max(48, H * H / (this.maxY + H)), tp = (this.maxY ? y / this.maxY : 0) * (H - th);
      this.thumbH = th; this.thumbTop = tp;
      this.sthumb.style.height = th + 'px'; this.sthumb.style.transform = `translate3d(0,${tp}px,0)`;
    }
    if (this.cue) this.cue.style.transform = `translate3d(0,${((now / 1800) % 1) * 200 - 100}%,0)`;
    if (this.clock && now - (this.clockT || -1e9) > 1000) { this.clockT = now; const t = this.clockFmt.format(new Date()) + ' local time'; if (this.clock.textContent !== t) this.clock.textContent = t; }
    const mpx = this.mouse.px, mpy = this.mouse.py;
    if (this.bioWords) this.bioWords.forEach(w => { const r = w.getBoundingClientRect(), o = Math.round((0.18 + 0.82 * cl((H * 0.82 - r.top) / (H * 0.32), 0, 1)) * 100) / 100; if (w._sc !== o) { w._sc = o; w.style.opacity = o; w._op = o; } });
    if (this.mags && !this.coarse && !this.rm) this.mags.forEach(m => {
      const el = m.el; if (el._rv && el._rv.p < 0.999) return;
      let tx = 0, ty = 0;
      if (mpx != null) { const r = el.getBoundingClientRect(), dx = mpx - (r.left + r.width / 2 - m.x), dy = mpy - (r.top + r.height / 2 - m.y), k = Math.max(0, 1 - Math.hypot(dx, dy) / 110); tx = dx * 0.28 * k; ty = dy * 0.28 * k; }
      m.x += (tx - m.x) * 0.18 * f; m.y += (ty - m.y) * 0.18 * f;
      if (Math.abs(m.x) + Math.abs(m.y) < 0.05) { if (m.on) { el.style.transform = el._rv ? 'none' : ''; m.on = false; } return; }
      m.on = true; el.style.transform = `translate3d(${m.x.toFixed(2)}px,${m.y.toFixed(2)}px,0)`;
    });
    if (this.marq) { this.mq = (this.mq || 0) - (this.rm ? 0 : (0.7 + Math.min(Math.abs(vel), 40) * 0.12) * f); if (this.mqW && -this.mq > this.mqW) this.mq += this.mqW; this.marq.style.transform = `translate3d(${this.mq.toFixed(1)}px,0,0)`; }
    if (this.prev) {
      const show = this.hover >= 0 && !this.coarse && mpx != null ? 1 : 0;
      this.pa = (this.pa || 0) + (show - (this.pa || 0)) * 0.15 * f;
      if (show && this.prevLbl) { const lt = 'cover image · 0' + (this.hover + 1); if (this.prevLbl.textContent !== lt) this.prevLbl.textContent = lt; }
      if (mpx != null) {
        const txp = mpx + 28 + this.prevW > W - 12 ? mpx - 28 - this.prevW : mpx + 28, typ = mpy - this.prevH / 2;
        this.ppx = this.ppx == null ? txp : this.ppx + (txp - this.ppx) * 0.16 * f; this.ppy = this.ppy == null ? typ : this.ppy + (typ - this.ppy) * 0.16 * f;
      }
      this.prev.style.opacity = this.pa.toFixed(3); this.prev._op = this.pa;
      this.prev.style.transform = `translate3d(${(this.ppx || 0).toFixed(1)}px,${((this.ppy || 0) + (1 - this.pa) * 14).toFixed(1)}px,0)`;
      if (Math.abs(show - this.pa) > 0.002) this.active = true;
    }
    if (this.revealEl) {
      const rs = this.revealH || 1, rv = cl((y - (this.maxY - rs)) / rs, 0, 1);
      this.revealEl.style.transform = `translate3d(0,${((1 - rv) * rs * 0.45).toFixed(1)}px,0)`;
      const o = rv > 0.005 ? 1 : 0; this.revealLens.forEach(el => { el._op = o; });
    }
    this.updFaces(now);
    this.renderGlass(now);
  }

  updFaces(now) {
    if (!this.faces || !this.states) return;
    const st = this.states, y = this.y; let face = st.length - 1;
    for (let i = 0; i < st.length; i++) { if (y <= st[i].b) { if (y >= st[i].a || i === 0) face = i; else face = (y - st[i - 1].b) / Math.max(1, st[i].a - st[i - 1].b) > 0.5 ? i : i - 1; break; } }
    if (face === 5 && this.face !== 5 && !this.rm) this.solvedT = now;
    const solving = this.solvedT && now - this.solvedT < 1400 && !this.rm;
    const key = face + (solving ? 's' : '');
    if (key === this.faceKey) return; this.faceKey = key; this.face = face;
    const RC = ['#f2f2ee', '#ff7a1a', '#16a34a', '#dc2626', '#2563eb', '#facc15'];
    this.faces.forEach((el, i) => { el.style.background = solving ? RC[i] : i === face ? 'var(--accent,#6e95ff)' : i < face ? 'var(--mute,#b3afa6)' : ''; });
    if (solving) setTimeout(() => { this.faceKey = null; }, 1450);
  }
}

(() => {
  const start = () => {
    const root = document.querySelector('[data-root]'); if (!root) return;
    const lens = new Lens(root, { theme: 'dark', refraction: 1, aberration: 1, inertia: 0.55 });
    lens.mount();
    window.lens = lens;
  };
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', start); else start();
})();
