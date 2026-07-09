// @ts-nocheck
import React, { useEffect, useState } from 'react';

export default function LandingPage() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  useEffect(() => {
    const rm = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    // Animated counters
    function animateCount(el) {
      const target = parseFloat(el.getAttribute('data-target') || '0');
      const dur = 1400;
      let start = null;
      function ease(t) { return 1 - Math.pow(1 - t, 3); }
      function frame(ts) {
        if (!start) start = ts;
        const p = Math.min((ts - start) / dur, 1);
        el.textContent = Math.round(ease(p) * target);
        if (p < 1) requestAnimationFrame(frame);
        else el.textContent = target;
      }
      requestAnimationFrame(frame);
    }

    // Workload bars
    function fillBars(scope) {
      scope.querySelectorAll('.fill[data-w]').forEach((f) => {
        f.style.width = f.getAttribute('data-w') + '%';
      });
    }

    // SVG charts
    function animateChart(card) {
      card.querySelectorAll('.bar-rect').forEach((r, i) => {
        const h = parseFloat(r.getAttribute('data-h') || '0');
        setTimeout(() => {
          r.setAttribute('y', String(150 - h));
          r.setAttribute('height', String(h));
          r.style.transition = 'y .9s cubic-bezier(.2,.8,.2,1), height .9s cubic-bezier(.2,.8,.2,1)';
        }, i * 80);
      });
      card.querySelectorAll('.donut-seg').forEach((seg, i) => {
        const len = parseFloat(seg.getAttribute('data-len') || '0');
        const off = seg.getAttribute('data-offset');
        setTimeout(() => {
          seg.style.transition = 'stroke-dasharray 1s cubic-bezier(.2,.8,.2,1)';
          seg.setAttribute('stroke-dasharray', len + ' 289');
          if (off) seg.setAttribute('stroke-dashoffset', off);
        }, 200 + i * 150);
      });
      card.querySelectorAll('.line-draw').forEach((p) => {
        const len = p.getTotalLength();
        p.style.strokeDasharray = len;
        p.style.strokeDashoffset = len;
        requestAnimationFrame(() => {
          p.style.transition = 'stroke-dashoffset 1.4s ease';
          p.style.strokeDashoffset = '0';
        });
      });
      card.querySelectorAll('.fill[data-w]').forEach((f) => {
        f.style.width = f.getAttribute('data-w') + '%';
      });
    }

    // Intersection Observer for reveals
    const io = new IntersectionObserver((entries) => {
      entries.forEach((e) => {
        if (!e.isIntersecting) return;
        const el = e.target;
        el.classList.add('in');
        if (el.classList.contains('stagger')) {
          Array.from(el.children).forEach((child, i) => {
            child.style.transitionDelay = (i * 70) + 'ms';
          });
        }
        el.querySelectorAll('.count').forEach(animateCount);
        if (el.classList.contains('chart-anim')) animateChart(el);
        if (el.querySelector && el.querySelector('.wl-anim')) fillBars(el);
        io.unobserve(el);
      });
    }, { threshold: 0.18, rootMargin: '0px 0px -40px 0px' });

    document.querySelectorAll('.reveal, .stagger').forEach((el) => {
      if (rm) {
        el.classList.add('in');
        el.querySelectorAll('.count').forEach((c) => {
          c.textContent = c.getAttribute('data-target') || '0';
        });
        if (el.classList.contains('chart-anim')) animateChart(el);
        fillBars(el);
        return;
      }
      io.observe(el);
    });

    document.querySelectorAll('.wl-anim, .wl-anim2').forEach((w) => {
      io.observe(w);
    });

    // Active step highlight
    const steps = document.querySelectorAll('.step');
    const stepIO = new IntersectionObserver((es) => {
      es.forEach((e) => { if (e.isIntersecting) e.target.classList.add('active'); });
    }, { threshold: 0.5 });
    steps.forEach((s) => stepIO.observe(s));

    // Magnetic buttons
    const magneticBtns = document.querySelectorAll('.magnetic');

    if (!rm) {
      magneticBtns.forEach((btn) => {
        btn.addEventListener('mousemove', (ev) => {
          const r = btn.getBoundingClientRect();
          const x = ev.clientX - r.left - r.width / 2;
          const y = ev.clientY - r.top - r.height / 2;
          btn.style.transform = 'translate(' + x * 0.25 + 'px,' + y * 0.35 + 'px)';
        });
        btn.addEventListener('mouseleave', () => { btn.style.transform = ''; });
      });
    }

    // Parallax
    const tilt = document.querySelector('.tilt');
    const hero = document.querySelector('.hero');
    const blobs = document.querySelectorAll('.parallax');
    const handleHeroMove = (ev) => {
      const w = window.innerWidth, h = window.innerHeight;
      const nx = (ev.clientX / w - 0.5), ny = (ev.clientY / h - 0.5);
      if (tilt) tilt.style.transform = 'rotateY(' + (nx * 7) + 'deg) rotateX(' + (-ny * 7) + 'deg)';
      blobs.forEach((b) => {
        const d = parseFloat(b.getAttribute('data-depth') || '0.04');
        b.style.transform = 'translate(' + (nx * d * 900) + 'px,' + (ny * d * 900) + 'px)';
      });
    };
    const handleHeroLeave = () => {
      if (tilt) tilt.style.transform = '';
    };

    if (!rm && window.matchMedia('(pointer:fine)').matches) {
      if (hero) hero.addEventListener('mousemove', handleHeroMove);
      if (hero) hero.addEventListener('mouseleave', handleHeroLeave);
    }

    // Smooth scroll
    const smoothLinks = document.querySelectorAll('a[href^="#"]');
    smoothLinks.forEach((a) => {
      a.addEventListener('click', (e) => {
        const id = a.getAttribute('href');
        if (id && id.length > 1) {
          const t = document.querySelector(id);
          if (t) { e.preventDefault(); t.scrollIntoView({ behavior: 'smooth' }); }
        }
      });
    });

    // Nav bar scroll effect
    const nav = document.getElementById('nav');
    const handleScroll = () => {
      if (window.scrollY > 20) {
        nav?.classList.add('scrolled');
      } else {
        nav?.classList.remove('scrolled');
      }
    };
    window.addEventListener('scroll', handleScroll);
    handleScroll(); // init

    return () => {
      io.disconnect();
      stepIO.disconnect();
      window.removeEventListener('scroll', handleScroll);
      if (hero) {
        hero.removeEventListener('mousemove', handleHeroMove);
        hero.removeEventListener('mouseleave', handleHeroLeave);
      }
    };
  }, []);

  return (
    <>
      <div>
        <meta charSet="UTF-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
        <title>SprintOS The Operating System for Engineering Excellence</title>
        <meta name="description" content="SprintOS unifies sprint planning, task management, standups, blocker tracking, collaboration and analytics into one intelligent workspace for engineering teams." />
        <style dangerouslySetInnerHTML={{ __html: "\n:root{\n  --orange:#325470;\n  --orange-soft:#4C7596;\n  --orange-deep:#213B52;\n  --ink:#111827;\n  --ink-2:#6B7280;\n  --bg:#FFFFFF;\n  --bg-soft:#F8FAFC;\n  --border:#E5E7EB;\n  --border-soft:#EEF1F5;\n  --shadow-sm:0 1px 2px rgba(17,24,39,.06),0 1px 3px rgba(17,24,39,.04);\n  --shadow-md:0 8px 24px -8px rgba(17,24,39,.12),0 2px 6px rgba(17,24,39,.05);\n  --shadow-lg:0 32px 64px -24px rgba(17,24,39,.22),0 8px 24px -12px rgba(17,24,39,.10);\n  --shadow-orange:0 18px 40px -14px rgba(50,84,112,.5);\n  --radius:18px;\n  --radius-sm:12px;\n  --maxw:1200px;\n  --font:\"Google Sans\", \"Google Sans Text\", Inter, system-ui, sans-serif;\n  --mono:ui-monospace,\"SF Mono\",\"SFMono-Regular\",Menlo,Consolas,monospace;\n}\n*{margin:0;padding:0;box-sizing:border-box}\nhtml{scroll-behavior:smooth;-webkit-text-size-adjust:100%;zoom:.9}\nbody{\n  font-family:var(--font);\n  color:var(--ink);\n  background:var(--bg);\n  line-height:1.6;\n  -webkit-font-smoothing:antialiased;\n  text-rendering:optimizeLegibility;\n  overflow-x:hidden;\n}\na{color:inherit;text-decoration:none}\nimg,svg{display:block;max-width:100%}\n::selection{background:rgba(50,84,112,.18);color:var(--ink)}\n\n.wrap{max-width:var(--maxw);margin:0 auto;padding:0 28px}\nsection{position:relative}\n.eyebrow{\n  display:inline-flex;align-items:center;gap:8px;\n  font-size:13px;font-weight:600;letter-spacing:.08em;text-transform:uppercase;\n  color:var(--orange-deep);\n  padding:7px 14px;border-radius:999px;\n  background:rgba(50,84,112,.08);border:1px solid rgba(50,84,112,.18);\n}\n.eyebrow::before{content:\"\";width:6px;height:6px;border-radius:50%;background:var(--orange)}\nh1,h2,h3{letter-spacing:-.025em;line-height:1.08;font-weight:700;color:var(--ink)}\n.h-section{font-size:clamp(30px,4.4vw,52px);font-weight:760;letter-spacing:-.03em}\n.sub{font-size:clamp(16px,1.5vw,19px);color:var(--ink-2);line-height:1.65;max-width:640px}\n.center{text-align:center;margin:0 auto}\n.section-pad{padding:clamp(80px,11vw,150px) 0}\n\n/* ============ BUTTONS ============ */\n.btn{\n  position:relative;display:inline-flex;align-items:center;justify-content:center;gap:9px;\n  font-size:15px;font-weight:600;letter-spacing:-.01em;\n  padding:14px 26px;border-radius:13px;cursor:pointer;border:1px solid transparent;\n  transition:transform .25s cubic-bezier(.2,.8,.2,1),box-shadow .3s,background .25s,color .25s;\n  will-change:transform;white-space:nowrap;\n}\n.btn svg{width:17px;height:17px}\n.btn-primary{\n  background:linear-gradient(180deg,var(--orange-soft),var(--orange) 70%,var(--orange-deep));\n  color:#fff;box-shadow:var(--shadow-orange);\n}\n.btn-primary:hover{box-shadow:0 24px 48px -14px rgba(50,84,112,.6)}\n.btn-ghost{background:#fff;color:var(--ink);border-color:var(--border);box-shadow:var(--shadow-sm)}\n.btn-ghost:hover{border-color:#d3d8df;background:#fcfcfd}\n.btn-dark{background:var(--ink);color:#fff}\n.btn-dark:hover{background:#1f2937}\n\n/* ============ SCROLL PROGRESS ============ */\n.progress{position:fixed;top:0;left:0;height:3px;width:0;z-index:200;\n  background:linear-gradient(90deg,var(--orange-soft),var(--orange),var(--orange-deep));\n  box-shadow:0 0 12px rgba(50,84,112,.5)}\n\n/* ============ NAV ============ */\nnav{\n  position:fixed;top:0;left:0;right:0;z-index:100;\n  transition:background .35s,box-shadow .35s,border-color .35s,padding .35s;\n  border-bottom:1px solid transparent;\n}\nnav.scrolled{\n  background:rgba(255,255,255,.72);\n  backdrop-filter:saturate(180%) blur(18px);-webkit-backdrop-filter:saturate(180%) blur(18px);\n  border-bottom:1px solid var(--border-soft);box-shadow:0 4px 20px -10px rgba(17,24,39,.08);\n}\n.nav-inner{max-width:var(--maxw);margin:0 auto;padding:16px 28px;display:flex;align-items:center;justify-content:space-between}\n.brand{display:flex;align-items:center;gap:11px;font-weight:740;font-size:19px;letter-spacing:-.02em}\n.logo-mark{\n  width:34px;height:34px;border-radius:10px;\n  background:linear-gradient(145deg,var(--orange-soft),var(--orange-deep));\n  display:grid;place-items:center;box-shadow:var(--shadow-orange);position:relative;overflow:hidden;\n}\n.logo-mark::after{content:\"\";position:absolute;inset:0;background:linear-gradient(120deg,transparent 40%,rgba(255,255,255,.45) 50%,transparent 60%);transform:translateX(-120%);animation:sheen 5s ease-in-out infinite 1s}\n@keyframes sheen{0%,60%{transform:translateX(-120%)}80%,100%{transform:translateX(120%)}}\n.logo-mark svg{width:18px;height:18px}\n.nav-links{display:flex;gap:34px;align-items:center}\n.nav-links a{font-size:14.5px;color:var(--ink-2);font-weight:500;transition:color .2s;position:relative}\n.nav-links a:hover{color:var(--ink)}\n.nav-links a::after{content:\"\";position:absolute;left:0;bottom:-4px;height:2px;width:0;background:var(--orange);transition:width .25s}\n.nav-links a:hover::after{width:100%}\n.nav-cta{display:flex;gap:12px;align-items:center}\n.nav-cta .btn{padding:10px 20px;font-size:14px}\n.burger{display:none;flex-direction:column;gap:5px;cursor:pointer;padding:6px}\n.burger span{width:22px;height:2px;background:var(--ink);border-radius:2px;transition:.3s}\n@media(max-width:880px){\n  .nav-links{display:none}\n  .nav-cta .btn-ghost{display:none}\n  .burger{display:flex}\n}\n\n/* ============ HERO ============ */\n.hero{padding:150px 0 90px;position:relative;overflow:hidden}\n.hero-bg{position:absolute;inset:0;z-index:-1;overflow:hidden}\n.blob{position:absolute;border-radius:50%;filter:blur(70px);opacity:.5;will-change:transform}\n.blob-1{width:560px;height:560px;background:radial-gradient(circle,rgba(50,84,112,.32),transparent 70%);top:-180px;right:-120px;animation:float1 16s ease-in-out infinite}\n.blob-2{width:440px;height:440px;background:radial-gradient(circle,rgba(76,117,150,.22),transparent 70%);bottom:-160px;left:-100px;animation:float2 19s ease-in-out infinite}\n.grid-bg{position:absolute;inset:0;\n  background-image:linear-gradient(var(--border-soft) 1px,transparent 1px),linear-gradient(90deg,var(--border-soft) 1px,transparent 1px);\n  background-size:56px 56px;\n  mask-image:radial-gradient(ellipse 80% 60% at 50% 30%,#000 30%,transparent 75%);\n  -webkit-mask-image:radial-gradient(ellipse 80% 60% at 50% 30%,#000 30%,transparent 75%);opacity:.6}\n@keyframes float1{0%,100%{transform:translate(0,0)}50%{transform:translate(-40px,40px)}}\n@keyframes float2{0%,100%{transform:translate(0,0)}50%{transform:translate(40px,-30px)}}\n.hero-grid{display:grid;grid-template-columns:1.05fr 1fr;gap:56px;align-items:center}\n.hero h1{font-size:clamp(36px,5.6vw,66px);font-weight:780;letter-spacing:-.035em;line-height:1.04;margin:24px 0 22px}\n.hero h1 .grad{background:linear-gradient(120deg,var(--orange-deep),var(--orange) 60%,var(--orange-soft));-webkit-background-clip:text;background-clip:text;-webkit-text-fill-color:transparent}\n.hero .sub{font-size:clamp(16px,1.6vw,19.5px);max-width:540px}\n.hero-actions{display:flex;gap:14px;margin-top:34px;flex-wrap:wrap}\n.hero-meta{display:flex;gap:26px;margin-top:38px;flex-wrap:wrap}\n.hero-meta .m{display:flex;align-items:center;gap:9px;font-size:13.5px;color:var(--ink-2);font-weight:500}\n.hero-meta svg{width:17px;height:17px;color:var(--orange)}\n@media(max-width:920px){.hero-grid{grid-template-columns:1fr;gap:48px}.hero{padding:130px 0 70px}}\n\n/* ============ DASHBOARD MOCKUP (HERO) ============ */\n.dash-target{position:relative;perspective:1600px}\n.dash{\n  background:#fff;border:1px solid var(--border);border-radius:20px;box-shadow:var(--shadow-lg);\n  overflow:hidden;transform-style:preserve-3d;will-change:transform;\n}\n.dash-top{display:flex;align-items:center;gap:8px;padding:13px 16px;border-bottom:1px solid var(--border-soft);background:var(--bg-soft)}\n.dot{width:11px;height:11px;border-radius:50%}\n.dot.r{background:#ff5f57}.dot.y{background:#febc2e}.dot.g{background:#28c840}\n.dash-url{margin-left:14px;font-size:12px;color:var(--ink-2);font-family:var(--mono);background:#fff;border:1px solid var(--border-soft);border-radius:7px;padding:4px 12px;flex:1;max-width:260px}\n.dash-body{padding:18px}\n.dash-head{display:flex;justify-content:space-between;align-items:center;margin-bottom:16px}\n.dash-head .t{font-size:15px;font-weight:700}\n.dash-head .pill{font-size:11px;font-weight:600;color:var(--orange-deep);background:rgba(50,84,112,.1);padding:4px 11px;border-radius:999px}\n.kpi-grid{display:grid;grid-template-columns:repeat(2,1fr);gap:11px}\n.kpi{border:1px solid var(--border-soft);border-radius:13px;padding:14px;background:linear-gradient(180deg,#fff,#fdfdfe);transition:transform .3s,box-shadow .3s}\n.kpi:hover{transform:translateY(-3px);box-shadow:var(--shadow-md)}\n.kpi .lbl{font-size:11.5px;color:var(--ink-2);font-weight:600;display:flex;align-items:center;gap:6px}\n.kpi .lbl .ic{width:24px;height:24px;border-radius:7px;display:grid;place-items:center;background:rgba(50,84,112,.1);color:var(--orange-deep)}\n.kpi .lbl .ic svg{width:13px;height:13px}\n.kpi .val{font-size:25px;font-weight:760;letter-spacing:-.02em;margin-top:9px}\n.kpi .trend{font-size:11px;font-weight:600;margin-top:3px;display:flex;align-items:center;gap:4px}\n.up{color:#16a34a}.down{color:#dc2626}\n.mini-bars{display:flex;align-items:flex-end;gap:4px;height:30px;margin-top:8px}\n.mini-bars i{flex:1;background:linear-gradient(180deg,var(--orange-soft),var(--orange));border-radius:3px 3px 0 0;opacity:.85}\n.dash-spark{margin-top:13px;border:1px solid var(--border-soft);border-radius:13px;padding:13px}\n.dash-spark .sh{display:flex;justify-content:space-between;font-size:12px;font-weight:600;margin-bottom:6px}\n.dash-spark .sh span:last-child{color:var(--orange-deep)}\n\n/* floating side cards */\n.float-card{position:absolute;background:rgba(255,255,255,.85);backdrop-filter:blur(14px);-webkit-backdrop-filter:blur(14px);\n  border:1px solid var(--border);border-radius:14px;box-shadow:var(--shadow-md);padding:13px 15px;will-change:transform;z-index:3}\n.fc-1{top:-26px;left:-34px;animation:bob 6s ease-in-out infinite}\n.fc-2{bottom:24px;right:-40px;animation:bob 7s ease-in-out infinite .8s}\n@keyframes bob{0%,100%{transform:translateY(0)}50%{transform:translateY(-14px)}}\n.fc-row{display:flex;align-items:center;gap:10px}\n.fc-ic{width:34px;height:34px;border-radius:10px;display:grid;place-items:center;color:#fff;flex-shrink:0}\n.fc-ic.green{background:linear-gradient(145deg,#34d399,#059669)}\n.fc-ic.orange{background:linear-gradient(145deg,var(--orange-soft),var(--orange-deep))}\n.fc-ic svg{width:17px;height:17px}\n.fc-t{font-size:13px;font-weight:700}\n.fc-s{font-size:11px;color:var(--ink-2)}\n@media(max-width:920px){.float-card{display:none}}\n\n/* ============ TRUST BAR ============ */\n.trust{background:var(--bg-soft);border-top:1px solid var(--border-soft);border-bottom:1px solid var(--border-soft);padding:64px 0}\n.stats{display:grid;grid-template-columns:repeat(4,1fr);gap:24px;text-align:center}\n.stat .num{font-size:clamp(40px,5vw,58px);font-weight:780;letter-spacing:-.03em;\n  background:linear-gradient(120deg,var(--ink),#374151);-webkit-background-clip:text;background-clip:text;-webkit-text-fill-color:transparent}\n.stat .num .pct{color:var(--orange);-webkit-text-fill-color:var(--orange)}\n.stat .lbl{font-size:14.5px;color:var(--ink-2);font-weight:550;margin-top:4px}\n.stat{position:relative}\n.stat:not(:last-child)::after{content:\"\";position:absolute;right:-12px;top:18%;height:64%;width:1px;background:var(--border)}\n@media(max-width:760px){.stats{grid-template-columns:repeat(2,1fr);gap:38px 24px}.stat:nth-child(2)::after,.stat::after{display:none}}\n\n/* ============ PROBLEM ============ */\n.problem-grid{display:grid;grid-template-columns:1fr 1.1fr;gap:60px;align-items:center;margin-top:54px}\n@media(max-width:920px){.problem-grid{grid-template-columns:1fr;gap:44px}}\n.pain-list{display:flex;flex-direction:column;gap:14px}\n.pain{display:flex;align-items:center;gap:15px;padding:16px 18px;background:#fff;border:1px solid var(--border);border-radius:14px;box-shadow:var(--shadow-sm);transition:transform .3s,box-shadow .3s}\n.pain:hover{transform:translateX(6px);box-shadow:var(--shadow-md);border-color:#C2D4E0}\n.pain .pi{width:42px;height:42px;border-radius:11px;display:grid;place-items:center;background:#fef2f2;color:#dc2626;flex-shrink:0}\n.pain .pi svg{width:20px;height:20px}\n.pain .pt{font-weight:650;font-size:15px}\n.pain .ps{font-size:13px;color:var(--ink-2)}\n.pain .tag{margin-left:auto;font-size:11px;font-weight:600;color:#dc2626;background:#fef2f2;padding:4px 10px;border-radius:999px}\n.chaos-viz{position:relative;background:var(--bg-soft);border:1px solid var(--border);border-radius:22px;padding:34px;min-height:340px;overflow:hidden}\n.chaos-node{position:absolute;background:#fff;border:1px solid var(--border);border-radius:12px;padding:10px 14px;font-size:12.5px;font-weight:650;box-shadow:var(--shadow-sm);display:flex;align-items:center;gap:8px}\n.chaos-node .nd{width:8px;height:8px;border-radius:50%}\n.cn-1{top:10%;left:8%;animation:drift 7s ease-in-out infinite}\n.cn-2{top:18%;right:10%;animation:drift 8s ease-in-out infinite 1s}\n.cn-3{top:48%;left:4%;animation:drift 6.5s ease-in-out infinite .5s}\n.cn-4{bottom:14%;right:8%;animation:drift 7.5s ease-in-out infinite 1.5s}\n.cn-5{bottom:8%;left:30%;animation:drift 8.5s ease-in-out infinite .8s}\n@keyframes drift{0%,100%{transform:translate(0,0)}50%{transform:translate(6px,-10px)}}\n.chaos-lines{position:absolute;inset:0;z-index:0}\n.unify{margin-top:60px;text-align:center;background:var(--ink);border-radius:24px;padding:54px 32px;position:relative;overflow:hidden}\n.unify::before{content:\"\";position:absolute;inset:0;background:radial-gradient(ellipse 50% 80% at 50% 0%,rgba(50,84,112,.28),transparent 70%)}\n.unify h3{color:#fff;font-size:clamp(24px,3.4vw,40px);position:relative;font-weight:740}\n.unify h3 .o{color:var(--orange-soft)}\n.unify p{color:#9ca3af;margin-top:10px;position:relative}\n\n/* ============ PLATFORM OVERVIEW ============ */\n.plat-grid{display:grid;grid-template-columns:repeat(3,1fr);gap:18px;margin-top:54px}\n@media(max-width:920px){.plat-grid{grid-template-columns:repeat(2,1fr)}}\n@media(max-width:600px){.plat-grid{grid-template-columns:1fr}}\n.plat-card{border:1px solid var(--border);border-radius:16px;padding:24px;cursor:pointer;\n  background:#fff;transition:transform .35s cubic-bezier(.2,.8,.2,1),box-shadow .35s,border-color .35s;position:relative;overflow:hidden}\n.plat-card::before{content:\"\";position:absolute;top:0;left:0;right:0;height:3px;background:var(--orange);transform:scaleX(0);transform-origin:left;transition:transform .35s}\n.plat-card:hover{transform:translateY(-6px);box-shadow:var(--shadow-lg);border-color:transparent}\n.plat-card:hover::before{transform:scaleX(1)}\n.plat-ic{width:48px;height:48px;border-radius:13px;display:grid;place-items:center;margin-bottom:16px;\n  background:linear-gradient(145deg,rgba(50,84,112,.12),rgba(50,84,112,.04));color:var(--orange-deep);transition:.35s}\n.plat-card:hover .plat-ic{background:linear-gradient(145deg,var(--orange-soft),var(--orange-deep));color:#fff;transform:scale(1.05)}\n.plat-ic svg{width:23px;height:23px}\n.plat-card h3{font-size:18px;font-weight:680;margin-bottom:7px}\n.plat-card p{font-size:14px;color:var(--ink-2);line-height:1.6}\n\n/* ============ CORE MODULES ============ */\n.mod-grid{display:grid;grid-template-columns:repeat(4,1fr);gap:18px;margin-top:54px}\n@media(max-width:1080px){.mod-grid{grid-template-columns:repeat(3,1fr)}}\n@media(max-width:820px){.mod-grid{grid-template-columns:repeat(2,1fr)}}\n@media(max-width:520px){.mod-grid{grid-template-columns:1fr}}\n.mod{position:relative;border:1px solid var(--border);border-radius:16px;padding:24px;background:#fff;overflow:hidden;\n  transition:transform .35s cubic-bezier(.2,.8,.2,1),box-shadow .35s,border-color .35s}\n.mod::after{content:\"\";position:absolute;width:160px;height:160px;border-radius:50%;background:radial-gradient(circle,rgba(50,84,112,.14),transparent 70%);top:-80px;right:-80px;opacity:0;transition:opacity .4s}\n.mod:hover{transform:translateY(-6px);box-shadow:var(--shadow-lg);border-color:#C2D4E0}\n.mod:hover::after{opacity:1}\n.mod-ic{width:46px;height:46px;border-radius:12px;background:var(--ink);color:#fff;display:grid;place-items:center;margin-bottom:15px;transition:.35s}\n.mod:hover .mod-ic{background:linear-gradient(145deg,var(--orange-soft),var(--orange-deep));transform:rotate(-6deg) scale(1.06)}\n.mod-ic svg{width:22px;height:22px}\n.mod h3{font-size:16.5px;font-weight:680;margin-bottom:10px}\n.mod ul{list-style:none;display:flex;flex-direction:column;gap:7px}\n.mod li{font-size:13px;color:var(--ink-2);display:flex;align-items:center;gap:8px}\n.mod li::before{content:\"\";width:5px;height:5px;border-radius:50%;background:var(--orange);flex-shrink:0}\n.mod .idx{position:absolute;top:18px;right:20px;font-size:13px;font-weight:700;color:var(--border);font-family:var(--mono)}\n\n/* ============ HOW IT WORKS ============ */\n.steps{display:grid;grid-template-columns:repeat(4,1fr);gap:0;margin-top:60px;position:relative}\n.steps::before{content:\"\";position:absolute;top:34px;left:12%;right:12%;height:2px;background:linear-gradient(90deg,var(--orange-soft),var(--orange),var(--orange-deep));z-index:0;opacity:.35}\n@media(max-width:820px){.steps{grid-template-columns:1fr;gap:30px}.steps::before{display:none}}\n.step{text-align:center;padding:0 16px;position:relative;z-index:1}\n.step .ring{width:70px;height:70px;border-radius:50%;margin:0 auto 20px;display:grid;place-items:center;\n  background:#fff;border:2px solid var(--border);color:var(--orange-deep);position:relative;transition:.4s;box-shadow:var(--shadow-sm)}\n.step.active .ring,.step:hover .ring{border-color:var(--orange);background:linear-gradient(145deg,var(--orange-soft),var(--orange-deep));color:#fff;box-shadow:var(--shadow-orange);transform:scale(1.06)}\n.step .ring svg{width:28px;height:28px}\n.step .n{position:absolute;top:-6px;right:-6px;width:24px;height:24px;border-radius:50%;background:var(--ink);color:#fff;font-size:12px;font-weight:700;display:grid;place-items:center}\n.step h3{font-size:19px;font-weight:700;margin-bottom:8px}\n.step p{font-size:14px;color:var(--ink-2)}\n\n/* ============ DEEP FEATURES ============ */\n.feat{display:grid;grid-template-columns:1fr 1fr;gap:60px;align-items:center;margin-top:90px}\n.feat:first-of-type{margin-top:54px}\n.feat.rev .feat-text{order:2}\n@media(max-width:920px){.feat,.feat.rev .feat-text{grid-template-columns:1fr;order:0}.feat{gap:38px;margin-top:64px}.feat .feat-visual{order:-1}}\n.feat-text .eyebrow{margin-bottom:18px}\n.feat-text h3{font-size:clamp(24px,3vw,36px);font-weight:740;margin-bottom:16px;letter-spacing:-.025em}\n.feat-text p{font-size:16px;color:var(--ink-2);margin-bottom:22px;line-height:1.7;max-width:480px}\n.feat-list{list-style:none;display:flex;flex-direction:column;gap:12px;margin-bottom:26px}\n.feat-list li{display:flex;align-items:flex-start;gap:11px;font-size:14.5px;font-weight:500}\n.feat-list .ck{width:22px;height:22px;border-radius:50%;background:rgba(50,84,112,.12);color:var(--orange-deep);display:grid;place-items:center;flex-shrink:0;margin-top:1px}\n.feat-list .ck svg{width:13px;height:13px}\n.feat-metrics{display:flex;gap:28px;flex-wrap:wrap}\n.feat-metrics .fm .v{font-size:26px;font-weight:760;color:var(--orange-deep);letter-spacing:-.02em}\n.feat-metrics .fm .l{font-size:12.5px;color:var(--ink-2);font-weight:550}\n.feat-visual{position:relative}\n\n/* generic mock panel */\n.mock{background:#fff;border:1px solid var(--border);border-radius:18px;box-shadow:var(--shadow-lg);overflow:hidden}\n.mock-bar{display:flex;align-items:center;gap:8px;padding:12px 15px;border-bottom:1px solid var(--border-soft);background:var(--bg-soft)}\n.mock-bar .mt{margin-left:8px;font-size:13px;font-weight:650}\n.mock-bar .mp{margin-left:auto;font-size:11px;font-weight:600;color:var(--orange-deep);background:rgba(50,84,112,.1);padding:3px 10px;border-radius:999px}\n.mock-body{padding:18px}\n\n/* kanban */\n.kanban{display:grid;grid-template-columns:repeat(3,1fr);gap:12px}\n.kcol{background:var(--bg-soft);border-radius:12px;padding:11px}\n.kcol .kh{font-size:11.5px;font-weight:700;text-transform:uppercase;letter-spacing:.05em;color:var(--ink-2);display:flex;justify-content:space-between;margin-bottom:10px}\n.kcol .kh .cnt{background:#fff;border:1px solid var(--border);border-radius:6px;padding:0 7px;font-size:11px}\n.kcard{background:#fff;border:1px solid var(--border-soft);border-radius:9px;padding:10px;margin-bottom:8px;box-shadow:var(--shadow-sm);transition:transform .25s,box-shadow .25s;cursor:grab}\n.kcard:hover{transform:translateY(-2px);box-shadow:var(--shadow-md)}\n.kcard .ktag{display:inline-block;font-size:10px;font-weight:700;padding:2px 7px;border-radius:5px;margin-bottom:7px}\n.t-orange{background:rgba(50,84,112,.12);color:var(--orange-deep)}\n.t-blue{background:#eff6ff;color:#2563eb}\n.t-green{background:#ecfdf5;color:#059669}\n.t-purple{background:#f5f3ff;color:#7c3aed}\n.kcard .ktitle{font-size:12.5px;font-weight:600;line-height:1.4}\n.kcard .kmeta{display:flex;align-items:center;justify-content:space-between;margin-top:9px}\n.kcard .pts{font-size:11px;color:var(--ink-2);font-weight:600;background:var(--bg-soft);padding:2px 7px;border-radius:5px}\n.av{width:22px;height:22px;border-radius:50%;display:grid;place-items:center;font-size:10px;font-weight:700;color:#fff}\n\n/* chat ui */\n.chat-mock .mock-body{padding:0}\n.chat-wrap{display:grid;grid-template-columns:118px 1fr}\n.chat-side{background:var(--bg-soft);border-right:1px solid var(--border-soft);padding:14px 10px}\n.chan{font-size:12px;font-weight:600;color:var(--ink-2);padding:7px 9px;border-radius:8px;margin-bottom:3px;cursor:pointer;display:flex;align-items:center;gap:6px}\n.chan.on{background:#fff;color:var(--ink);box-shadow:var(--shadow-sm)}\n.chan .h{color:var(--ink-2);font-weight:700}\n.chat-main{padding:16px;display:flex;flex-direction:column;gap:13px;min-height:240px}\n.msg{display:flex;gap:10px;align-items:flex-start}\n.msg .av{flex-shrink:0;margin-top:2px}\n.msg .body .nm{font-size:12px;font-weight:700}.msg .body .nm span{font-weight:500;color:var(--ink-2);margin-left:6px}\n.msg .body .tx{font-size:13px;color:#374151;background:var(--bg-soft);padding:8px 12px;border-radius:4px 12px 12px 12px;margin-top:4px;display:inline-block}\n.msg .body .tx .mn{color:var(--orange-deep);font-weight:600}\n.chat-input{display:flex;align-items:center;gap:8px;border:1px solid var(--border);border-radius:10px;padding:9px 12px;margin-top:6px;font-size:13px;color:var(--ink-2)}\n.chat-input .send{margin-left:auto;width:26px;height:26px;border-radius:7px;background:var(--orange);display:grid;place-items:center;color:#fff}\n.chat-input .send svg{width:13px;height:13px}\n\n/* workload */\n.workload{display:flex;flex-direction:column;gap:13px}\n.wl{display:grid;grid-template-columns:88px 1fr 38px;align-items:center;gap:12px}\n.wl .nm{font-size:13px;font-weight:600;display:flex;align-items:center;gap:8px}\n.wl .track{height:9px;background:var(--bg-soft);border-radius:99px;overflow:hidden}\n.wl .fill{height:100%;border-radius:99px;width:0;transition:width 1.1s cubic-bezier(.2,.8,.2,1)}\n.wl .pc{font-size:12px;font-weight:700;text-align:right}\n.f-orange{background:linear-gradient(90deg,var(--orange-soft),var(--orange-deep))}\n.f-amber{background:linear-gradient(90deg,#fbbf24,#f59e0b)}\n.f-green{background:linear-gradient(90deg,#34d399,#059669)}\n.f-red{background:linear-gradient(90deg,#f87171,#dc2626)}\n\n/* notif panel */\n.notif{display:flex;flex-direction:column;gap:9px}\n.nrow{display:flex;gap:11px;align-items:flex-start;padding:11px;border:1px solid var(--border-soft);border-radius:11px;transition:.25s}\n.nrow:hover{background:var(--bg-soft)}\n.nrow .ni{width:32px;height:32px;border-radius:9px;display:grid;place-items:center;flex-shrink:0;color:#fff}\n.nrow .ni svg{width:15px;height:15px}\n.nrow .nt{font-size:13px;font-weight:600;line-height:1.4}\n.nrow .ns{font-size:11.5px;color:var(--ink-2);margin-top:2px}\n.nrow .ntime{margin-left:auto;font-size:10.5px;color:var(--ink-2);white-space:nowrap}\n\n/* ============ ANALYTICS SHOWCASE ============ */\n.charts{display:grid;grid-template-columns:repeat(6,1fr);gap:18px;margin-top:54px}\n.chart-card{background:#fff;border:1px solid var(--border);border-radius:16px;padding:20px;box-shadow:var(--shadow-sm);transition:transform .35s,box-shadow .35s}\n.chart-card:hover{transform:translateY(-4px);box-shadow:var(--shadow-md)}\n.c-span-3{grid-column:span 3}.c-span-2{grid-column:span 2}.c-span-4{grid-column:span 4}.c-span-6{grid-column:span 6}\n@media(max-width:920px){.charts{grid-template-columns:1fr}.c-span-3,.c-span-2,.c-span-4,.c-span-6{grid-column:span 1}}\n.chart-head{display:flex;justify-content:space-between;align-items:flex-start;margin-bottom:16px}\n.chart-head .ct{font-size:15px;font-weight:700}\n.chart-head .cs{font-size:12px;color:var(--ink-2)}\n.chart-head .cbadge{font-size:11px;font-weight:700;padding:3px 9px;border-radius:7px}\n.svg-chart{width:100%;height:auto;overflow:visible}\n.bar-rect{transition:transform .9s cubic-bezier(.2,.8,.2,1)}\n.donut-leg{display:flex;flex-direction:column;gap:8px;font-size:12.5px}\n.donut-leg .lg{display:flex;align-items:center;gap:8px;font-weight:550}\n.donut-leg .lg .sw{width:11px;height:11px;border-radius:3px}\n.donut-leg .lg .v{margin-left:auto;font-weight:700;color:var(--ink-2)}\n.donut-wrap{display:grid;grid-template-columns:130px 1fr;gap:18px;align-items:center}\n@media(max-width:520px){.donut-wrap{grid-template-columns:1fr}}\n\n/* ============ ROLES ============ */\n.roles{display:grid;grid-template-columns:repeat(3,1fr);gap:20px;margin-top:54px}\n@media(max-width:820px){.roles{grid-template-columns:1fr}}\n.role{border:1px solid var(--border);border-radius:18px;padding:30px;background:#fff;position:relative;transition:transform .35s,box-shadow .35s;overflow:hidden}\n.role.feature{border-color:transparent;background:var(--ink);color:#fff;box-shadow:var(--shadow-lg)}\n.role.feature::before{content:\"\";position:absolute;inset:0;background:radial-gradient(ellipse 60% 50% at 50% 0,rgba(50,84,112,.25),transparent 70%)}\n.role:hover{transform:translateY(-6px);box-shadow:var(--shadow-lg)}\n.role .rtag{font-size:12px;font-weight:700;letter-spacing:.08em;text-transform:uppercase;color:var(--orange-deep)}\n.role.feature .rtag{color:var(--orange-soft)}\n.role .ricon{width:54px;height:54px;border-radius:14px;display:grid;place-items:center;margin:14px 0 18px;\n  background:rgba(50,84,112,.1);color:var(--orange-deep);position:relative}\n.role.feature .ricon{background:linear-gradient(145deg,var(--orange-soft),var(--orange-deep));color:#fff}\n.role .ricon svg{width:26px;height:26px}\n.role h3{font-size:22px;font-weight:740;position:relative}\n.role .rd{font-size:13.5px;color:var(--ink-2);margin:8px 0 20px;position:relative}\n.role.feature .rd{color:#9ca3af}\n.role ul{list-style:none;display:flex;flex-direction:column;gap:11px;position:relative}\n.role li{font-size:14px;display:flex;align-items:flex-start;gap:10px}\n.role li .rc{width:20px;height:20px;border-radius:50%;background:rgba(50,84,112,.12);color:var(--orange-deep);display:grid;place-items:center;flex-shrink:0;margin-top:1px}\n.role.feature li .rc{background:rgba(50,84,112,.25);color:var(--orange-soft)}\n.role li .rc svg{width:12px;height:12px}\n\n/* ============ SECURITY ============ */\n.sec-wrap{background:var(--ink);border-radius:26px;padding:clamp(40px,6vw,72px);position:relative;overflow:hidden;margin-top:54px}\n.sec-wrap::before{content:\"\";position:absolute;top:-30%;right:-10%;width:500px;height:500px;border-radius:50%;background:radial-gradient(circle,rgba(50,84,112,.2),transparent 70%)}\n.sec-wrap .grid-bg{opacity:.07;mask-image:none;-webkit-mask-image:none}\n.sec-head{text-align:center;position:relative;margin-bottom:46px}\n.sec-head h2{color:#fff;font-size:clamp(28px,3.6vw,44px);font-weight:740}\n.sec-head p{color:#9ca3af;margin-top:12px;max-width:560px;margin-left:auto;margin-right:auto}\n.sec-grid{display:grid;grid-template-columns:repeat(3,1fr);gap:18px;position:relative}\n@media(max-width:820px){.sec-grid{grid-template-columns:repeat(2,1fr)}}\n@media(max-width:520px){.sec-grid{grid-template-columns:1fr}}\n.sec-block{background:rgba(255,255,255,.04);border:1px solid rgba(255,255,255,.09);border-radius:15px;padding:24px;transition:.35s;backdrop-filter:blur(6px)}\n.sec-block:hover{background:rgba(255,255,255,.07);border-color:rgba(50,84,112,.4);transform:translateY(-4px)}\n.sec-block .si{width:46px;height:46px;border-radius:12px;background:rgba(50,84,112,.15);color:var(--orange-soft);display:grid;place-items:center;margin-bottom:16px}\n.sec-block .si svg{width:23px;height:23px}\n.sec-block h3{color:#fff;font-size:16.5px;font-weight:680;margin-bottom:7px}\n.sec-block p{color:#9ca3af;font-size:13.5px;line-height:1.6}\n\n/* ============ TECH STACK ============ */\n.stack-grid{display:grid;grid-template-columns:repeat(4,1fr);gap:22px;margin-top:54px}\n@media(max-width:820px){.stack-grid{grid-template-columns:repeat(2,1fr)}}\n.stack-col h4{font-size:12px;font-weight:700;letter-spacing:.08em;text-transform:uppercase;color:var(--ink-2);margin-bottom:16px;display:flex;align-items:center;gap:8px}\n.stack-col h4::before{content:\"\";width:18px;height:2px;background:var(--orange);border-radius:2px}\n.tech{display:flex;align-items:center;gap:12px;padding:13px 15px;background:#fff;border:1px solid var(--border);border-radius:12px;margin-bottom:10px;\n  box-shadow:var(--shadow-sm);transition:transform .3s,box-shadow .3s,border-color .3s}\n.tech:hover{transform:translateX(5px);box-shadow:var(--shadow-md);border-color:#C2D4E0}\n.tech .tlogo{width:34px;height:34px;border-radius:9px;display:grid;place-items:center;background:var(--bg-soft);font-weight:800;font-size:13px;flex-shrink:0;font-family:var(--mono)}\n.tech .tn{font-size:14.5px;font-weight:650}\n\n/* ============ FINAL CTA ============ */\n.fcta{background:linear-gradient(160deg,#fff,var(--bg-soft));border-top:1px solid var(--border-soft);text-align:center;position:relative;overflow:hidden}\n.fcta-card{background:var(--ink);border-radius:28px;padding:clamp(48px,7vw,84px) 32px;position:relative;overflow:hidden;box-shadow:var(--shadow-lg)}\n.fcta-card::before{content:\"\";position:absolute;inset:0;background:radial-gradient(ellipse 60% 100% at 50% 120%,rgba(50,84,112,.32),transparent 60%)}\n.fcta-card .blob-c{position:absolute;width:420px;height:420px;border-radius:50%;background:radial-gradient(circle,rgba(50,84,112,.22),transparent 70%);filter:blur(50px);top:-200px;left:50%;transform:translateX(-50%)}\n.fcta-card h2{color:#fff;font-size:clamp(28px,4vw,50px);font-weight:760;letter-spacing:-.03em;position:relative;max-width:760px;margin:0 auto;line-height:1.1}\n.fcta-card p{color:#9ca3af;position:relative;max-width:580px;margin:18px auto 0;font-size:17px}\n.fcta-actions{display:flex;gap:14px;justify-content:center;margin-top:34px;position:relative;flex-wrap:wrap}\n.btn-light{background:#fff;color:var(--ink)}\n.btn-light:hover{background:#f3f4f6}\n\n/* ============ FOOTER ============ */\nfooter{background:var(--bg);border-top:1px solid var(--border-soft);padding:64px 0 34px}\n.foot-grid{display:grid;grid-template-columns:1.6fr 1fr 1fr 1fr 1fr;gap:36px}\n@media(max-width:820px){.foot-grid{grid-template-columns:1fr 1fr;gap:34px}}\n.foot-brand .brand{margin-bottom:14px}\n.foot-brand p{font-size:14px;color:var(--ink-2);max-width:280px;line-height:1.65}\n.foot-social{display:flex;gap:10px;margin-top:18px}\n.foot-social a{width:36px;height:36px;border-radius:10px;border:1px solid var(--border);display:grid;place-items:center;color:var(--ink-2);transition:.25s}\n.foot-social a:hover{border-color:var(--orange);color:var(--orange-deep);transform:translateY(-2px)}\n.foot-social svg{width:17px;height:17px}\n.foot-col h5{font-size:13px;font-weight:700;margin-bottom:16px;letter-spacing:-.01em}\n.foot-col a{display:block;font-size:14px;color:var(--ink-2);margin-bottom:11px;transition:color .2s}\n.foot-col a:hover{color:var(--orange-deep)}\n.foot-bottom{display:flex;justify-content:space-between;align-items:center;border-top:1px solid var(--border-soft);margin-top:48px;padding-top:26px;flex-wrap:wrap;gap:14px}\n.foot-bottom p{font-size:13px;color:var(--ink-2)}\n.foot-bottom .links{display:flex;gap:24px}\n.foot-bottom .links a{font-size:13px;color:var(--ink-2)}\n.foot-bottom .links a:hover{color:var(--ink)}\n\n/* ============ REVEAL ANIMATIONS ============ */\n.reveal{opacity:0;transform:translateY(28px);transition:opacity .7s cubic-bezier(.2,.8,.2,1),transform .7s cubic-bezier(.2,.8,.2,1)}\n.reveal.in{opacity:1;transform:none}\n.stagger>*{opacity:0;transform:translateY(24px);transition:opacity .6s cubic-bezier(.2,.8,.2,1),transform .6s cubic-bezier(.2,.8,.2,1)}\n.stagger.in>*{opacity:1;transform:none}\n@media(prefers-reduced-motion:reduce){\n  *{animation:none!important;transition:none!important}\n  .reveal,.stagger>*{opacity:1;transform:none}\n}\n\n/* Custom Mobile Dropdown Styling */\n.mobile-menu {\n  position: absolute;\n  top: 100%;\n  left: 0;\n  right: 0;\n  background: rgba(255, 255, 255, 0.95);\n  backdrop-filter: blur(20px);\n  -webkit-backdrop-filter: blur(20px);\n  border-bottom: 1px solid var(--border-soft);\n  padding: 24px;\n  box-shadow: 0 10px 20px -10px rgba(17,24,39,.08);\n  z-index: 99;\n}\n.mobile-links {\n  display: flex;\n  flex-direction: column;\n  gap: 16px;\n}\n.mobile-links a {\n  font-size: 16px;\n  color: var(--ink-2);\n  font-weight: 600;\n  padding: 8px 0;\n  border-bottom: 1px solid rgba(0,0,0,0.02);\n  transition: color 0.2s, padding-left 0.2s;\n}\n.mobile-links a:hover {\n  color: var(--orange);\n  padding-left: 4px;\n}\n.mobile-cta-group {\n  display: flex;\n  flex-direction: column;\n  gap: 12px;\n  margin-top: 16px;\n}\n.burger.active span:nth-child(1) {\n  transform: translateY(7px) rotate(45deg);\n}\n.burger.active span:nth-child(2) {\n  opacity: 0;\n}\n.burger.active span:nth-child(3) {\n  transform: translateY(-7px) rotate(-45deg);\n}\n" }} />
        <div>
  <div className="progress" id="progress" />
  {/* NAV */}
  <nav id="nav">
    <div className="nav-inner">
      <a href="#" className="brand">
        <span className="logo-mark">
          <svg viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 12l4-4 4 4 4-6 6 8" /></svg>
        </span>
        SprintOS
      </a>
      <div className="nav-links">
        <a href="#platform">Platform</a>
        <a href="#modules">Modules</a>
        <a href="#features">Features</a>
        <a href="#analytics">Analytics</a>
        <a href="#security">Security</a>
      </div>
      <div className="nav-cta">
        <a href="/signin" className="btn btn-ghost">Sign In</a>
        <a href="#cta" className="btn btn-primary magnetic">Book Demo</a>
      </div>
      <div className="burger" id="burger"><span /><span /><span /></div>
    
          </div>
          
          {/* Mobile Dropdown Menu */}
          {mobileMenuOpen && (
            <div className="mobile-menu animate-in fade-in slide-in-from-top-4 duration-200">
              <div className="mobile-links">
                <a href="#platform" onClick={() => setMobileMenuOpen(false)}>Platform</a>
                <a href="#modules" onClick={() => setMobileMenuOpen(false)}>Modules</a>
                <a href="#features" onClick={() => setMobileMenuOpen(false)}>Features</a>
                <a href="#analytics" onClick={() => setMobileMenuOpen(false)}>Analytics</a>
                <a href="#security" onClick={() => setMobileMenuOpen(false)}>Security</a>
                <div className="mobile-cta-group">
                  <a href="/signin" className="btn btn-ghost w-full">Sign In</a>
                  <a href="#cta" className="btn btn-primary w-full" onClick={() => setMobileMenuOpen(false)}>Book Demo</a>
                </div>
              </div>
            </div>
          )}
        </nav>

  {/* HERO */}
  <section className="hero">
    <div className="hero-bg">
      <div className="grid-bg" />
      <div className="blob blob-1 parallax" data-depth="0.04" />
      <div className="blob blob-2 parallax" data-depth="0.06" />
    </div>
    <div className="wrap hero-grid">
      <div className="hero-text reveal">
        <span className="eyebrow">One workspace · Zero context switching</span>
        <h1>Engineering Teams Don't Need More Tools. They Need <span className="grad">One Operating System.</span></h1>
        <p className="sub">SprintOS unifies sprint planning, task management, standups, blocker tracking, collaboration, analytics, and team performance into one intelligent workspace.</p>
        <div className="hero-actions">
          <a href="#cta" className="btn btn-primary magnetic">
            Book Demo
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12h14M13 6l6 6-6 6" /></svg>
          </a>
          <a href="/signin" className="btn btn-ghost">Sign In</a>
        </div>
        <div className="hero-meta">
          <div className="m"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><path d="M20 6L9 17l-5-5" /></svg> SOC 2 Type II</div>
          <div className="m"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><path d="M20 6L9 17l-5-5" /></svg> 99.99% uptime SLA</div>
          <div className="m"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><path d="M20 6L9 17l-5-5" /></svg> No credit card required</div>
        </div>
      </div>
      <div className="dash-target reveal">
        <div className="float-card fc-1">
          <div className="fc-row">
            <div className="fc-ic green"><svg viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" /><path d="M22 4L12 14.01l-3-3" /></svg></div>
            <div><div className="fc-t">Sprint 24 shipped</div><div className="fc-s">on time · 0 carryover</div></div>
          </div>
        </div>
        <div className="float-card fc-2">
          <div className="fc-row">
            <div className="fc-ic orange"><svg viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><path d="M13 2L3 14h9l-1 8 10-12h-9z" /></svg></div>
            <div><div className="fc-t">Velocity +18%</div><div className="fc-s">vs. last sprint</div></div>
          </div>
        </div>
        <div className="dash tilt">
          <div className="dash-top">
            <span className="dot r" /><span className="dot y" /><span className="dot g" />
            <span className="dash-url">app.sprintos.io/dashboard</span>
          </div>
          <div className="dash-body">
            <div className="dash-head">
              <div className="t">Sprint 24 Overview</div>
              <div className="pill">● Live</div>
            </div>
            <div className="kpi-grid">
              <div className="kpi">
                <div className="lbl"><span className="ic"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><path d="M13 2L3 14h9l-1 8 10-12h-9z" /></svg></span> Sprint Velocity</div>
                <div className="val"><span className="count" data-target={86}>0</span></div>
                <div className="trend up">▲ 18% this sprint</div>
              </div>
              <div className="kpi">
                <div className="lbl"><span className="ic"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" /><path d="M22 4L12 14.01l-3-3" /></svg></span> Completion Rate</div>
                <div className="val"><span className="count" data-target={94}>0</span>%</div>
                <div className="trend up">▲ 6% vs target</div>
              </div>
              <div className="kpi">
                <div className="lbl"><span className="ic"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><rect x={3} y={3} width={7} height={7} rx={1} /><rect x={14} y={3} width={7} height={7} rx={1} /><rect x={3} y={14} width={7} height={7} rx={1} /></svg></span> Active Tasks</div>
                <div className="val"><span className="count" data-target={142}>0</span></div>
                <div className="mini-bars"><i style={{height: '40%'}} /><i style={{height: '70%'}} /><i style={{height: '55%'}} /><i style={{height: '90%'}} /><i style={{height: '65%'}} /><i style={{height: '80%'}} /></div>
              </div>
              <div className="kpi">
                <div className="lbl"><span className="ic"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" /><circle cx={9} cy={7} r={4} /><path d="M23 21v-2a4 4 0 0 0-3-3.87" /></svg></span> Team Utilization</div>
                <div className="val"><span className="count" data-target={78}>0</span>%</div>
                <div className="trend up">▲ healthy load</div>
              </div>
            </div>
            <div className="dash-spark">
              <div className="sh"><span>Burndown</span><span>2 days ahead</span></div>
              <svg viewBox="0 0 320 60" className="svg-chart" style={{height: 54}}>
                <defs><linearGradient id="hg" x1={0} y1={0} x2={0} y2={1}><stop offset={0} stopColor="rgba(50,84,112,.25)" /><stop offset={1} stopColor="rgba(50,84,112,0)" /></linearGradient></defs>
                <path d="M0,8 L60,18 L120,22 L180,34 L240,42 L320,54 L320,60 L0,60 Z" fill="url(#hg)" />
                <path d="M0,8 L60,18 L120,22 L180,34 L240,42 L320,54" fill="none" stroke="var(--orange)" strokeWidth="2.5" strokeLinecap="round" />
                <path d="M0,8 L320,56" fill="none" stroke="var(--border)" strokeWidth="1.5" strokeDasharray="4 4" />
              </svg>
            </div>
          </div>
        </div>
      </div>
    </div>
  </section>
  {/* TRUST BAR */}
  <section className="trust">
    <div className="wrap stats stagger" id="trustStats">
      <div className="stat"><div className="num"><span className="count" data-target={98}>0</span><span className="pct">%</span></div><div className="lbl">Sprint Visibility</div></div>
      <div className="stat"><div className="num"><span className="count" data-target={45}>0</span><span className="pct">%</span></div><div className="lbl">Faster Delivery</div></div>
      <div className="stat"><div className="num"><span className="count" data-target={60}>0</span><span className="pct">%</span></div><div className="lbl">Less Context Switching</div></div>
      <div className="stat"><div className="num"><span className="count" data-target={100}>0</span><span className="pct">%</span></div><div className="lbl">Team Alignment</div></div>
    </div>
  </section>
  {/* PROBLEM */}
  <section className="section-pad">
    <div className="wrap">
      <div className="center reveal" style={{maxWidth: 720}}>
        <span className="eyebrow">The problem</span>
        <h2 className="h-section" style={{marginTop: 18}}>Modern Engineering Teams Are Drowning In Tool Chaos</h2>
        <p className="sub center" style={{marginTop: 16}}>Every workflow lives in a different app. Status gets lost in translation. Engineers spend more time syncing tools than shipping software.</p>
      </div>
      <div className="problem-grid">
        <div className="pain-list stagger">
          <div className="pain"><div className="pi"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round"><rect x={3} y={3} width={18} height={18} rx={2} /><path d="M9 9h6v6H9z" /></svg></div><div><div className="pt">Tasks in Jira</div><div className="ps">Disconnected from execution</div></div><span className="tag">Siloed</span></div>
          <div className="pain"><div className="pi"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" /></svg></div><div><div className="pt">Chat in Slack</div><div className="ps">Decisions buried in threads</div></div><span className="tag">Lost</span></div>
          <div className="pain"><div className="pi"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round"><rect x={3} y={3} width={18} height={18} rx={2} /><path d="M3 9h18M9 21V9" /></svg></div><div><div className="pt">Reports in Excel</div><div className="ps">Stale the moment they're built</div></div><span className="tag">Manual</span></div>
          <div className="pain"><div className="pi"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round"><path d="M12 1v6m0 6v6M5 12H1m22 0h-4" /><circle cx={12} cy={12} r={3} /></svg></div><div><div className="pt">Standups in Messages</div><div className="ps">No structure, no record</div></div><span className="tag">Ad hoc</span></div>
          <div className="pain"><div className="pi"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" /><path d="M12 9v4m0 4h.01" /></svg></div><div><div className="pt">Blockers everywhere</div><div className="ps">No owner, no escalation path</div></div><span className="tag">Untracked</span></div>
        </div>
        <div className="chaos-viz reveal">
          <svg className="chaos-lines" viewBox="0 0 400 340" preserveAspectRatio="none">
            <line x1={70} y1={60} x2={200} y2={170} stroke="#fecaca" strokeWidth="1.5" strokeDasharray="5 5" />
            <line x1={330} y1={80} x2={200} y2={170} stroke="#fecaca" strokeWidth="1.5" strokeDasharray="5 5" />
            <line x1={50} y1={190} x2={200} y2={170} stroke="#fecaca" strokeWidth="1.5" strokeDasharray="5 5" />
            <line x1={340} y1={280} x2={200} y2={170} stroke="#fecaca" strokeWidth="1.5" strokeDasharray="5 5" />
            <line x1={150} y1={300} x2={200} y2={170} stroke="#fecaca" strokeWidth="1.5" strokeDasharray="5 5" />
          </svg>
          <div className="chaos-node cn-1"><span className="nd" style={{background: '#2563eb'}} />Jira</div>
          <div className="chaos-node cn-2"><span className="nd" style={{background: '#4a154b'}} />Slack</div>
          <div className="chaos-node cn-3"><span className="nd" style={{background: '#059669'}} />Excel</div>
          <div className="chaos-node cn-4"><span className="nd" style={{background: '#0ea5e9'}} />Messages</div>
          <div className="chaos-node cn-5"><span className="nd" style={{background: '#dc2626'}} />Email</div>
          <div style={{position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%,-50%)', width: 84, height: 84, borderRadius: '50%', background: '#fff', border: '2px dashed #fca5a5', display: 'grid', placeItems: 'center', textAlign: 'center', fontSize: 11, fontWeight: 700, color: '#dc2626', zIndex: 2, boxShadow: 'var(--shadow-sm)'}}>Your<br />Team</div>
        </div>
      </div>
      <div className="unify reveal">
        <h3>One Platform. <span className="o">One Workflow.</span> One Source of Truth.</h3>
        <p>SprintOS replaces the fragmented stack with a single intelligent workspace.</p>
      </div>
    </div>
  </section>
  {/* PLATFORM OVERVIEW */}
  <section className="section-pad" id="platform" style={{background: 'var(--bg-soft)', borderTop: '1px solid var(--border-soft)', borderBottom: '1px solid var(--border-soft)'}}>
    <div className="wrap">
      <div className="center reveal" style={{maxWidth: 680}}>
        <span className="eyebrow">Platform overview</span>
        <h2 className="h-section" style={{marginTop: 18}}>Meet SprintOS</h2>
        <p className="sub center" style={{marginTop: 16}}>Everything an engineering organization needs to plan, execute, collaborate and measure unified in one elegant workspace.</p>
      </div>
      <div className="plat-grid stagger">
        <div className="plat-card"><div className="plat-ic"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round"><path d="M9 11l3 3L22 4" /><path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11" /></svg></div><h3>Agile Planning</h3><p>Roadmaps, sprints and backlogs that stay in sync with the work as it happens.</p></div>
        <div className="plat-card"><div className="plat-ic"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round"><path d="M13 2L3 14h9l-1 8 10-12h-9z" /></svg></div><h3>Sprint Execution</h3><p>Run sprints with live boards, story points and automated workflow tracking.</p></div>
        <div className="plat-card"><div className="plat-ic"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" /></svg></div><h3>Collaboration</h3><p>Project channels, threads and mentions keep context next to the work.</p></div>
        <div className="plat-card"><div className="plat-ic"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round"><path d="M3 3v18h18" /><path d="M7 14l4-4 3 3 5-6" /></svg></div><h3>Analytics</h3><p>Velocity, burndown and workload insights generated automatically in real time.</p></div>
        <div className="plat-card"><div className="plat-ic"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" /><circle cx={9} cy={7} r={4} /><path d="M23 21v-2a4 4 0 0 0-3-3.87" /></svg></div><h3>Team Management</h3><p>Roles, capacity and assignments that balance load across the whole org.</p></div>
        <div className="plat-card"><div className="plat-ic"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" /></svg></div><h3>Security</h3><p>Enterprise-grade authentication, audit logs and granular access control.</p></div>
      </div>
    </div>
  </section>
  {/* CORE MODULES */}
  <section className="section-pad" id="modules">
    <div className="wrap">
      <div className="center reveal" style={{maxWidth: 680}}>
        <span className="eyebrow">Core modules</span>
        <h2 className="h-section" style={{marginTop: 18}}>Eight modules. One workflow.</h2>
        <p className="sub center" style={{marginTop: 16}}>Each module is powerful on its own and unstoppable together. Every action flows into a single source of truth.</p>
      </div>
      <div className="mod-grid stagger">
        <div className="mod"><span className="idx">01</span><div className="mod-ic"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round"><path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z" /></svg></div><h3>Project Hub</h3><ul><li>Project lifecycle</li><li>Team assignments</li><li>Dedicated project channels</li></ul></div>
        <div className="mod"><span className="idx">02</span><div className="mod-ic"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round"><path d="M13 2L3 14h9l-1 8 10-12h-9z" /></svg></div><h3>Sprint Planning</h3><ul><li>Sprint goals</li><li>Sprint lifecycle</li><li>Sprint health monitoring</li></ul></div>
        <div className="mod"><span className="idx">03</span><div className="mod-ic"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round"><path d="M9 11l3 3L22 4" /><path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11" /></svg></div><h3>Task Management</h3><ul><li>Story points &amp; priorities</li><li>Subtasks &amp; attachments</li><li>Workflow tracking</li></ul></div>
        <div className="mod"><span className="idx">04</span><div className="mod-ic"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round"><rect x={3} y={3} width={7} height={18} rx={1} /><rect x={14} y={3} width={7} height={11} rx={1} /></svg></div><h3>Agile Boards</h3><ul><li>Kanban management</li><li>Drag &amp; drop workflows</li><li>WIP limits &amp; swimlanes</li></ul></div>
        <div className="mod"><span className="idx">05</span><div className="mod-ic"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" /><path d="M12 9v4m0 4h.01" /></svg></div><h3>Blocker Tracking</h3><ul><li>Issue escalation</li><li>Resolution workflows</li><li>Blocker analytics</li></ul></div>
        <div className="mod"><span className="idx">06</span><div className="mod-ic"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round"><circle cx={12} cy={12} r={10} /><path d="M12 6v6l4 2" /></svg></div><h3>Daily Standups</h3><ul><li>Structured updates</li><li>Accountability tracking</li><li>Async by default</li></ul></div>
        <div className="mod"><span className="idx">07</span><div className="mod-ic"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" /></svg></div><h3>Collaboration Chat</h3><ul><li>Project &amp; sprint channels</li><li>DMs &amp; threads</li><li>Mentions &amp; reactions</li></ul></div>
        <div className="mod"><span className="idx">08</span><div className="mod-ic"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round"><path d="M3 3v18h18" /><path d="M7 14l4-4 3 3 5-6" /></svg></div><h3>Analytics Dashboard</h3><ul><li>Velocity &amp; burndown</li><li>Team workload</li><li>Productivity tracking</li></ul></div>
      </div>
    </div>
  </section>
  {/* HOW IT WORKS */}
  <section className="section-pad" style={{background: 'var(--bg-soft)', borderTop: '1px solid var(--border-soft)', borderBottom: '1px solid var(--border-soft)'}}>
    <div className="wrap">
      <div className="center reveal" style={{maxWidth: 620}}>
        <span className="eyebrow">How it works</span>
        <h2 className="h-section" style={{marginTop: 18}}>From plan to delivery in one flow</h2>
      </div>
      <div className="steps">
        <div className="step reveal"><div className="ring"><span className="n">1</span><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round"><path d="M9 11l3 3L22 4" /><path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11" /></svg></div><h3>Plan</h3><p>Set sprint goals, groom the backlog and assign story points collaboratively.</p></div>
        <div className="step reveal"><div className="ring"><span className="n">2</span><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round"><path d="M13 2L3 14h9l-1 8 10-12h-9z" /></svg></div><h3>Execute</h3><p>Move work across agile boards while progress updates automatically.</p></div>
        <div className="step reveal"><div className="ring"><span className="n">3</span><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" /><circle cx={9} cy={7} r={4} /><path d="M23 21v-2a4 4 0 0 0-3-3.87" /></svg></div><h3>Collaborate</h3><p>Discuss in context with channels, standups and instant blocker resolution.</p></div>
        <div className="step reveal"><div className="ring"><span className="n">4</span><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" /><path d="M22 4L12 14.01l-3-3" /></svg></div><h3>Deliver</h3><p>Ship on time and review velocity, quality and impact in real time.</p></div>
      </div>
    </div>
  </section>
  {/* DEEP FEATURES */}
  <section className="section-pad" id="features">
    <div className="wrap">
      <div className="center reveal" style={{maxWidth: 680}}>
        <span className="eyebrow">Deep dive</span>
        <h2 className="h-section" style={{marginTop: 18}}>Built for how engineering really works</h2>
      </div>
      {/* F1 */}
      <div className="feat">
        <div className="feat-text reveal">
          <span className="eyebrow">Project &amp; Sprint Management</span>
          <h3>Plan sprints that actually reflect reality</h3>
          <p>Connect roadmaps to live sprints. Sprint health updates the instant work moves no manual status reports, ever.</p>
          <ul className="feat-list">
            <li><span className="ck"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={3} strokeLinecap="round" strokeLinejoin="round"><path d="M20 6L9 17l-5-5" /></svg></span> Goal-driven sprint lifecycle</li>
            <li><span className="ck"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={3} strokeLinecap="round" strokeLinejoin="round"><path d="M20 6L9 17l-5-5" /></svg></span> Capacity &amp; velocity forecasting</li>
            <li><span className="ck"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={3} strokeLinecap="round" strokeLinejoin="round"><path d="M20 6L9 17l-5-5" /></svg></span> Real-time sprint health scoring</li>
          </ul>
          <div className="feat-metrics">
            <div className="fm"><div className="v">2 days</div><div className="l">avg. ahead of schedule</div></div>
            <div className="fm"><div className="v">0</div><div className="l">manual status updates</div></div>
          </div>
        </div>
        <div className="feat-visual reveal">
          <div className="mock">
            <div className="mock-bar"><span className="dot r" /><span className="dot y" /><span className="dot g" /><span className="mt">Sprint Board</span><span className="mp">Sprint 24</span></div>
            <div className="mock-body">
              <div className="kanban">
                <div className="kcol"><div className="kh">To Do <span className="cnt">5</span></div>
                  <div className="kcard"><span className="ktag t-orange">Feature</span><div className="ktitle">OAuth device flow</div><div className="kmeta"><span className="pts">5 pts</span><span className="av" style={{background: '#325470'}}>SM</span></div></div>
                  <div className="kcard"><span className="ktag t-blue">Bug</span><div className="ktitle">Fix retry on timeout</div><div className="kmeta"><span className="pts">3 pts</span><span className="av" style={{background: '#2563eb'}}>RK</span></div></div>
                </div>
                <div className="kcol"><div className="kh">In Progress <span className="cnt">3</span></div>
                  <div className="kcard"><span className="ktag t-purple">Chore</span><div className="ktitle">Migrate to Vite 5</div><div className="kmeta"><span className="pts">8 pts</span><span className="av" style={{background: '#7c3aed'}}>AL</span></div></div>
                  <div className="kcard"><span className="ktag t-orange">Feature</span><div className="ktitle">Burndown widget</div><div className="kmeta"><span className="pts">5 pts</span><span className="av" style={{background: '#0ea5e9'}}>JD</span></div></div>
                </div>
                <div className="kcol"><div className="kh">Done <span className="cnt">6</span></div>
                  <div className="kcard"><span className="ktag t-green">Feature</span><div className="ktitle">Role-based access</div><div className="kmeta"><span className="pts">8 pts</span><span className="av" style={{background: '#059669'}}>MP</span></div></div>
                  <div className="kcard"><span className="ktag t-green">Bug</span><div className="ktitle">Audit log export</div><div className="kmeta"><span className="pts">2 pts</span><span className="av" style={{background: '#dc2626'}}>TR</span></div></div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
      {/* F2 */}
      <div className="feat rev">
        <div className="feat-text reveal">
          <span className="eyebrow">Task Intelligence</span>
          <h3>Every task carries its full context</h3>
          <p>Story points, priorities, subtasks, attachments and dependencies live on a single card with workflow tracking that surfaces risk before it becomes a blocker.</p>
          <ul className="feat-list">
            <li><span className="ck"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={3} strokeLinecap="round" strokeLinejoin="round"><path d="M20 6L9 17l-5-5" /></svg></span> Story points, priorities &amp; subtasks</li>
            <li><span className="ck"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={3} strokeLinecap="round" strokeLinejoin="round"><path d="M20 6L9 17l-5-5" /></svg></span> Attachments &amp; rich descriptions</li>
            <li><span className="ck"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={3} strokeLinecap="round" strokeLinejoin="round"><path d="M20 6L9 17l-5-5" /></svg></span> Automated workflow tracking</li>
          </ul>
          <div className="feat-metrics">
            <div className="fm"><div className="v">142</div><div className="l">active tasks tracked</div></div>
            <div className="fm"><div className="v">3.2×</div><div className="l">faster triage</div></div>
          </div>
        </div>
        <div className="feat-visual reveal">
          <div className="mock">
            <div className="mock-bar"><span className="dot r" /><span className="dot y" /><span className="dot g" /><span className="mt">Task · SPR-482</span><span className="mp">High priority</span></div>
            <div className="mock-body">
              <div style={{fontSize: 16, fontWeight: 700, marginBottom: 4}}>Implement refresh token rotation</div>
              <div style={{fontSize: 13, color: 'var(--ink-2)', marginBottom: 16}}>Rotate refresh tokens on every use and invalidate the prior token to mitigate replay attacks.</div>
              <div style={{display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 18}}>
                <span className="kcard" style={{margin: 0, padding: '6px 11px', fontSize: 12, fontWeight: 600}}>⚡ 5 story points</span>
                <span className="kcard" style={{margin: 0, padding: '6px 11px', fontSize: 12, fontWeight: 600, color: 'var(--orange-deep)'}}>● High</span>
                <span className="kcard" style={{margin: 0, padding: '6px 11px', fontSize: 12, fontWeight: 600}}>📎 2 files</span>
              </div>
              <div style={{fontSize: 12, fontWeight: 700, color: 'var(--ink-2)', marginBottom: 10}}>SUBTASKS · 2 of 3</div>
              <div className="workload" id="taskSubs">
                <div style={{display: 'flex', alignItems: 'center', gap: 10, fontSize: 13}}><span style={{width: 18, height: 18, borderRadius: '50%', background: '#059669', display: 'grid', placeItems: 'center'}}><svg viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth={3} style={{width: 11, height: 11}}><path d="M20 6L9 17l-5-5" /></svg></span> Add rotation middleware</div>
                <div style={{display: 'flex', alignItems: 'center', gap: 10, fontSize: 13}}><span style={{width: 18, height: 18, borderRadius: '50%', background: '#059669', display: 'grid', placeItems: 'center'}}><svg viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth={3} style={{width: 11, height: 11}}><path d="M20 6L9 17l-5-5" /></svg></span> Invalidate prior token</div>
                <div style={{display: 'flex', alignItems: 'center', gap: 10, fontSize: 13, color: 'var(--ink-2)'}}><span style={{width: 18, height: 18, borderRadius: '50%', border: '2px solid var(--border)'}} /> Add integration tests</div>
              </div>
            </div>
          </div>
        </div>
      </div>
      {/* F3 */}
      <div className="feat">
        <div className="feat-text reveal">
          <span className="eyebrow">Real-Time Collaboration</span>
          <h3>Conversations that stay next to the work</h3>
          <p>Project channels, sprint channels, DMs, threads and mentions all linked directly to tasks so context never lives in a separate app.</p>
          <ul className="feat-list">
            <li><span className="ck"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={3} strokeLinecap="round" strokeLinejoin="round"><path d="M20 6L9 17l-5-5" /></svg></span> Project &amp; sprint channels</li>
            <li><span className="ck"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={3} strokeLinecap="round" strokeLinejoin="round"><path d="M20 6L9 17l-5-5" /></svg></span> Threads, mentions &amp; reactions</li>
            <li><span className="ck"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={3} strokeLinecap="round" strokeLinejoin="round"><path d="M20 6L9 17l-5-5" /></svg></span> Tasks linked inline to messages</li>
          </ul>
          <div className="feat-metrics">
            <div className="fm"><div className="v">60%</div><div className="l">less context switching</div></div>
            <div className="fm"><div className="v">&lt;1 min</div><div className="l">avg. blocker response</div></div>
          </div>
        </div>
        <div className="feat-visual reveal">
          <div className="mock chat-mock">
            <div className="mock-bar"><span className="dot r" /><span className="dot y" /><span className="dot g" /><span className="mt">#sprint-24</span><span className="mp">12 online</span></div>
            <div className="mock-body">
              <div className="chat-wrap">
                <div className="chat-side">
                  <div className="chan on"><span className="h">#</span> sprint-24</div>
                  <div className="chan"><span className="h">#</span> project-hub</div>
                  <div className="chan"><span className="h">#</span> blockers</div>
                  <div className="chan"><span className="h">#</span> standup</div>
                  <div className="chan"><span className="h">@</span> Maya P.</div>
                </div>
                <div className="chat-main">
                  <div className="msg"><span className="av" style={{background: '#7c3aed'}}>AL</span><div className="body"><div className="nm">Alex L. <span>9:14 AM</span></div><div className="tx">Vite 5 migration is on <span className="mn">@SPR-471</span> should unblock the build pipeline.</div></div></div>
                  <div className="msg"><span className="av" style={{background: '#325470'}}>MP</span><div className="body"><div className="nm">Maya P. <span>9:16 AM</span></div><div className="tx">Nice. I'll move the burndown widget into review once tests pass ✅</div></div></div>
                  <div className="msg"><span className="av" style={{background: '#0ea5e9'}}>JD</span><div className="body"><div className="nm">Jordan D. <span>9:18 AM</span></div><div className="tx">Flagged a blocker on <span className="mn">@SPR-482</span> needs a security review.</div></div></div>
                  <div className="chat-input">Message #sprint-24<span className="send"><svg viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round"><path d="M22 2L11 13M22 2l-7 20-4-9-9-4z" /></svg></span></div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
      {/* F4 */}
      <div className="feat rev">
        <div className="feat-text reveal">
          <span className="eyebrow">Analytics &amp; Insights</span>
          <h3>Decisions backed by live data</h3>
          <p>Velocity, burndown and workload metrics are generated continuously so you spot risk early and balance the team before anyone burns out.</p>
          <ul className="feat-list">
            <li><span className="ck"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={3} strokeLinecap="round" strokeLinejoin="round"><path d="M20 6L9 17l-5-5" /></svg></span> Velocity &amp; burndown trends</li>
            <li><span className="ck"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={3} strokeLinecap="round" strokeLinejoin="round"><path d="M20 6L9 17l-5-5" /></svg></span> Team workload balancing</li>
            <li><span className="ck"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={3} strokeLinecap="round" strokeLinejoin="round"><path d="M20 6L9 17l-5-5" /></svg></span> Productivity tracking</li>
          </ul>
          <div className="feat-metrics">
            <div className="fm"><div className="v">98%</div><div className="l">sprint visibility</div></div>
            <div className="fm"><div className="v">Real-time</div><div className="l">always up to date</div></div>
          </div>
        </div>
        <div className="feat-visual reveal">
          <div className="mock">
            <div className="mock-bar"><span className="dot r" /><span className="dot y" /><span className="dot g" /><span className="mt">Team Workload</span><span className="mp">This sprint</span></div>
            <div className="mock-body">
              <div className="workload wl-anim">
                <div className="wl"><span className="nm"><span className="av" style={{background: '#325470', width: 20, height: 20}}>SM</span>Sam</span><div className="track"><div className="fill f-orange" data-w={92} /></div><span className="pc">92%</span></div>
                <div className="wl"><span className="nm"><span className="av" style={{background: '#2563eb', width: 20, height: 20}}>RK</span>Riya</span><div className="track"><div className="fill f-green" data-w={68} /></div><span className="pc">68%</span></div>
                <div className="wl"><span className="nm"><span className="av" style={{background: '#7c3aed', width: 20, height: 20}}>AL</span>Alex</span><div className="track"><div className="fill f-amber" data-w={81} /></div><span className="pc">81%</span></div>
                <div className="wl"><span className="nm"><span className="av" style={{background: '#0ea5e9', width: 20, height: 20}}>JD</span>Jordan</span><div className="track"><div className="fill f-green" data-w={54} /></div><span className="pc">54%</span></div>
                <div className="wl"><span className="nm"><span className="av" style={{background: '#dc2626', width: 20, height: 20}}>TR</span>Tara</span><div className="track"><div className="fill f-red" data-w={98} /></div><span className="pc">98%</span></div>
              </div>
              <div className="nrow" style={{marginTop: 16, background: 'rgba(50,84,112,.06)', borderColor: 'rgba(50,84,112,.2)'}}><div className="ni" style={{background: 'var(--orange)'}}><svg viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 9v4m0 4h.01" /><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" /></svg></div><div><div className="nt">Tara is over capacity</div><div className="ns">Suggested: reassign 2 tasks to Jordan</div></div></div>
            </div>
          </div>
        </div>
      </div>
      {/* F5 */}
      <div className="feat">
        <div className="feat-text reveal">
          <span className="eyebrow">Security &amp; Compliance</span>
          <h3>Enterprise-grade by default</h3>
          <p>JWT auth, refresh token rotation, audit logging and device detection protect every action without slowing your team down.</p>
          <ul className="feat-list">
            <li><span className="ck"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={3} strokeLinecap="round" strokeLinejoin="round"><path d="M20 6L9 17l-5-5" /></svg></span> SOC 2 Type II compliant</li>
            <li><span className="ck"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={3} strokeLinecap="round" strokeLinejoin="round"><path d="M20 6L9 17l-5-5" /></svg></span> End-to-end audit trail</li>
            <li><span className="ck"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={3} strokeLinecap="round" strokeLinejoin="round"><path d="M20 6L9 17l-5-5" /></svg></span> Granular role-based access</li>
          </ul>
          <div className="feat-metrics">
            <div className="fm"><div className="v">99.99%</div><div className="l">uptime SLA</div></div>
            <div className="fm"><div className="v">256-bit</div><div className="l">encryption at rest</div></div>
          </div>
        </div>
        <div className="feat-visual reveal">
          <div className="mock">
            <div className="mock-bar"><span className="dot r" /><span className="dot y" /><span className="dot g" /><span className="mt">Audit Log</span><span className="mp">Live</span></div>
            <div className="mock-body">
              <div className="notif">
                <div className="nrow"><div className="ni" style={{background: '#059669'}}><svg viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" /></svg></div><div><div className="nt">Token rotated successfully</div><div className="ns">session · device verified</div></div><span className="ntime">2m ago</span></div>
                <div className="nrow"><div className="ni" style={{background: '#2563eb'}}><svg viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><rect x={3} y={11} width={18} height={11} rx={2} /><path d="M7 11V7a5 5 0 0 1 10 0v4" /></svg></div><div><div className="nt">New sign-in · MacBook Pro</div><div className="ns">Pune, IN · device recognized</div></div><span className="ntime">14m ago</span></div>
                <div className="nrow"><div className="ni" style={{background: 'var(--orange)'}}><svg viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><path d="M18.36 6.64a9 9 0 1 1-12.73 0" /><path d="M12 2v10" /></svg></div><div><div className="nt">Brute-force attempt blocked</div><div className="ns">5 failed attempts · IP throttled</div></div><span className="ntime">1h ago</span></div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </section>
  {/* ANALYTICS SHOWCASE */}
  <section className="section-pad" id="analytics" style={{background: 'var(--bg-soft)', borderTop: '1px solid var(--border-soft)', borderBottom: '1px solid var(--border-soft)'}}>
    <div className="wrap">
      <div className="center reveal" style={{maxWidth: 680}}>
        <span className="eyebrow">Analytics</span>
        <h2 className="h-section" style={{marginTop: 18}}>Your delivery, fully measured</h2>
        <p className="sub center" style={{marginTop: 16}}>Every chart updates the moment work moves. No exports, no spreadsheets, no stale reports.</p>
      </div>
      <div className="charts">
        {/* Velocity */}
        <div className="chart-card c-span-3 reveal chart-anim">
          <div className="chart-head"><div><div className="ct">Sprint Velocity</div><div className="cs">Story points completed per sprint</div></div><span className="cbadge" style={{background: '#ecfdf5', color: '#059669'}}>▲ 18%</span></div>
          <svg className="svg-chart" viewBox="0 0 360 180" style={{height: 180}}>
            <line x1={0} y1={150} x2={360} y2={150} stroke="var(--border)" strokeWidth={1} />
            <g className="bars-v">
              <rect className="bar-rect" x={14} y={150} width={36} height={0} rx={5} fill="#D8E2EA" data-h={62} />
              <rect className="bar-rect" x={68} y={150} width={36} height={0} rx={5} fill="#B0C5D5" data-h={78} />
              <rect className="bar-rect" x={122} y={150} width={36} height={0} rx={5} fill="#7E9DB6" data-h={70} />
              <rect className="bar-rect" x={176} y={150} width={36} height={0} rx={5} fill="#4C7596" data-h={96} />
              <rect className="bar-rect" x={230} y={150} width={36} height={0} rx={5} fill="#325470" data-h={110} />
              <rect className="bar-rect" x={284} y={150} width={36} height={0} rx={5} fill="#213B52" data-h={130} />
            </g>
            <g fontSize={10} fill="var(--ink-2)" textAnchor="middle"><text x={32} y={166}>S19</text><text x={86} y={166}>S20</text><text x={140} y={166}>S21</text><text x={194} y={166}>S22</text><text x={248} y={166}>S23</text><text x={302} y={166}>S24</text></g>
          </svg>
        </div>
        {/* Burndown */}
        <div className="chart-card c-span-3 reveal chart-anim">
          <div className="chart-head"><div><div className="ct">Burndown Chart</div><div className="cs">Remaining work · Sprint 24</div></div><span className="cbadge" style={{background: 'rgba(50,84,112,.1)', color: 'var(--orange-deep)'}}>2d ahead</span></div>
          <svg className="svg-chart" viewBox="0 0 360 180" style={{height: 180}}>
            <defs><linearGradient id="bd" x1={0} y1={0} x2={0} y2={1}><stop offset={0} stopColor="rgba(50,84,112,.22)" /><stop offset={1} stopColor="rgba(50,84,112,0)" /></linearGradient></defs>
            <line x1={0} y1={150} x2={360} y2={150} stroke="var(--border)" strokeWidth={1} />
            <path d="M10,20 L350,150" fill="none" stroke="var(--border)" strokeWidth="1.5" strokeDasharray="5 5" />
            <path className="line-draw" d="M10,20 L67,42 L124,55 L181,72 L238,112 L295,128 L350,138" fill="none" stroke="var(--orange)" strokeWidth={3} strokeLinecap="round" strokeLinejoin="round" />
            <path d="M10,20 L67,42 L124,55 L181,72 L238,112 L295,128 L350,138 L350,150 L10,150 Z" fill="url(#bd)" className="area-fade" />
            <g><circle cx={350} cy={138} r="4.5" fill="#325470" /><circle cx={350} cy={138} r={8} fill="none" stroke="rgba(50,84,112,.3)" strokeWidth={2} /></g>
          </svg>
        </div>
        {/* Workload */}
        <div className="chart-card c-span-2 reveal chart-anim">
          <div className="chart-head"><div><div className="ct">Team Workload</div><div className="cs">Capacity used</div></div></div>
          <div className="workload wl-anim2">
            <div className="wl"><span className="nm" style={{fontSize: 12}}>Backend</span><div className="track"><div className="fill f-orange" data-w={88} /></div><span className="pc">88%</span></div>
            <div className="wl"><span className="nm" style={{fontSize: 12}}>Frontend</span><div className="track"><div className="fill f-amber" data-w={74} /></div><span className="pc">74%</span></div>
            <div className="wl"><span className="nm" style={{fontSize: 12}}>Platform</span><div className="track"><div className="fill f-green" data-w={61} /></div><span className="pc">61%</span></div>
            <div className="wl"><span className="nm" style={{fontSize: 12}}>QA</span><div className="track"><div className="fill f-red" data-w={95} /></div><span className="pc">95%</span></div>
          </div>
        </div>
        {/* Blocker categories donut */}
        <div className="chart-card c-span-2 reveal chart-anim">
          <div className="chart-head"><div><div className="ct">Blocker Categories</div><div className="cs">Last 30 days</div></div></div>
          <div className="donut-wrap">
            <svg viewBox="0 0 120 120" style={{width: 120, height: 120}}>
              <circle cx={60} cy={60} r={46} fill="none" stroke="var(--border-soft)" strokeWidth={16} />
              <circle className="donut-seg" cx={60} cy={60} r={46} fill="none" stroke="#325470" strokeWidth={16} strokeDasharray="0 289" data-len={116} transform="rotate(-90 60 60)" strokeLinecap="round" />
              <circle className="donut-seg" cx={60} cy={60} r={46} fill="none" stroke="#7E9DB6" strokeWidth={16} strokeDasharray="0 289" data-len={78} data-offset={-116} transform="rotate(-90 60 60)" strokeLinecap="round" />
              <circle className="donut-seg" cx={60} cy={60} r={46} fill="none" stroke="#2563eb" strokeWidth={16} strokeDasharray="0 289" data-len={58} data-offset={-194} transform="rotate(-90 60 60)" strokeLinecap="round" />
              <text x={60} y={58} textAnchor="middle" fontSize={22} fontWeight={700} fill="var(--ink)">37</text>
              <text x={60} y={74} textAnchor="middle" fontSize={9} fill="var(--ink-2)">total</text>
            </svg>
            <div className="donut-leg">
              <div className="lg"><span className="sw" style={{background: '#325470'}} />Dependencies <span className="v">40%</span></div>
              <div className="lg"><span className="sw" style={{background: '#7E9DB6'}} />Reviews <span className="v">27%</span></div>
              <div className="lg"><span className="sw" style={{background: '#2563eb'}} />Infra <span className="v">20%</span></div>
              <div className="lg"><span className="sw" style={{background: 'var(--border)'}} />Other <span className="v">13%</span></div>
            </div>
          </div>
        </div>
        {/* Productivity timeline */}
        <div className="chart-card c-span-2 reveal chart-anim">
          <div className="chart-head"><div><div className="ct">Productivity Timeline</div><div className="cs">Tasks closed / day</div></div></div>
          <svg className="svg-chart" viewBox="0 0 200 120" style={{height: 120}}>
            <path className="line-draw" d="M5,90 L35,70 L65,82 L95,48 L125,58 L155,30 L195,42" fill="none" stroke="var(--orange)" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
            <circle cx={155} cy={30} r="3.5" fill="#325470" />
            <g fontSize={8} fill="var(--ink-2)" textAnchor="middle"><text x={5} y={112}>M</text><text x={35} y={112}>T</text><text x={65} y={112}>W</text><text x={95} y={112}>T</text><text x={125} y={112}>F</text><text x={155} y={112}>S</text><text x={195} y={112}>S</text></g>
          </svg>
        </div>
      </div>
    </div>
  </section>
  {/* ROLES */}
  <section className="section-pad">
    <div className="wrap">
      <div className="center reveal" style={{maxWidth: 680}}>
        <span className="eyebrow">Role-based access</span>
        <h2 className="h-section" style={{marginTop: 18}}>The right access for every role</h2>
        <p className="sub center" style={{marginTop: 16}}>Granular permissions ensure everyone sees exactly what they need nothing more, nothing less.</p>
      </div>
      <div className="roles stagger">
        <div className="role">
          <div className="rtag">Admin</div>
          <div className="ricon"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" /><path d="M9 12l2 2 4-4" /></svg></div>
          <h3>Admin</h3>
          <p className="rd">Full control over the organization, security and configuration.</p>
          <ul>
            <li><span className="rc"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={3}><path d="M20 6L9 17l-5-5" /></svg></span> Manage users, roles &amp; billing</li>
            <li><span className="rc"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={3}><path d="M20 6L9 17l-5-5" /></svg></span> Configure security policies</li>
            <li><span className="rc"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={3}><path d="M20 6L9 17l-5-5" /></svg></span> Access full audit logs</li>
            <li><span className="rc"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={3}><path d="M20 6L9 17l-5-5" /></svg></span> Org-wide analytics</li>
          </ul>
        </div>
        <div className="role feature">
          <div className="rtag">Product Manager</div>
          <div className="ricon"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round"><path d="M9 11l3 3L22 4" /><path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11" /></svg></div>
          <h3>Product Manager</h3>
          <p className="rd">Owns roadmaps, sprints and delivery across teams.</p>
          <ul>
            <li><span className="rc"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={3}><path d="M20 6L9 17l-5-5" /></svg></span> Create projects &amp; sprints</li>
            <li><span className="rc"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={3}><path d="M20 6L9 17l-5-5" /></svg></span> Assign &amp; prioritize tasks</li>
            <li><span className="rc"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={3}><path d="M20 6L9 17l-5-5" /></svg></span> Manage blockers &amp; escalations</li>
            <li><span className="rc"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={3}><path d="M20 6L9 17l-5-5" /></svg></span> Team &amp; velocity analytics</li>
          </ul>
        </div>
        <div className="role">
          <div className="rtag">Developer</div>
          <div className="ricon"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round"><path d="M16 18l6-6-6-6M8 6l-6 6 6 6" /></svg></div>
          <h3>Developer</h3>
          <p className="rd">Focused on execution, collaboration and shipping work.</p>
          <ul>
            <li><span className="rc"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={3}><path d="M20 6L9 17l-5-5" /></svg></span> Pick up &amp; update tasks</li>
            <li><span className="rc"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={3}><path d="M20 6L9 17l-5-5" /></svg></span> Move work on agile boards</li>
            <li><span className="rc"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={3}><path d="M20 6L9 17l-5-5" /></svg></span> Raise &amp; resolve blockers</li>
            <li><span className="rc"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={3}><path d="M20 6L9 17l-5-5" /></svg></span> Collaborate in channels</li>
          </ul>
        </div>
      </div>
    </div>
  </section>
  {/* SECURITY */}
  <section className="section-pad" id="security" style={{paddingTop: 0}}>
    <div className="wrap">
      <div className="sec-wrap">
        <div className="grid-bg" />
        <div className="sec-head reveal">
          <span className="eyebrow" style={{background: 'rgba(50,84,112,.15)', borderColor: 'rgba(50,84,112,.3)', color: 'var(--orange-soft)'}}>Enterprise security</span>
          <h2 style={{marginTop: 18}}>Security that doesn't get in the way</h2>
          <p>Defense-in-depth across every layer authentication, sessions and continuous monitoring built in from day one.</p>
        </div>
        <div className="sec-grid stagger">
          <div className="sec-block"><div className="si"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round"><rect x={3} y={11} width={18} height={11} rx={2} /><path d="M7 11V7a5 5 0 0 1 10 0v4" /></svg></div><h3>JWT Authentication</h3><p>Signed, short-lived access tokens validate every request without server-side session lookups.</p></div>
          <div className="sec-block"><div className="si"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round"><path d="M23 4v6h-6M1 20v-6h6" /><path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15" /></svg></div><h3>Refresh Token Rotation</h3><p>Each refresh issues a new token and invalidates the prior one, neutralizing replay attacks.</p></div>
          <div className="sec-block"><div className="si"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" /><path d="M14 2v6h6M9 13h6M9 17h6" /></svg></div><h3>Audit Logs</h3><p>Every action is recorded with actor, device and timestamp for complete traceability.</p></div>
          <div className="sec-block"><div className="si"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round"><circle cx={12} cy={12} r={10} /><path d="M12 6v6l4 2" /></svg></div><h3>Session Management</h3><p>View, label and revoke active sessions across devices from a single control panel.</p></div>
          <div className="sec-block"><div className="si"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round"><path d="M18.36 6.64a9 9 0 1 1-12.73 0" /><path d="M12 2v10" /></svg></div><h3>Brute Force Protection</h3><p>Adaptive rate limiting and IP throttling stop credential-stuffing attempts automatically.</p></div>
          <div className="sec-block"><div className="si"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round"><rect x={5} y={2} width={14} height={20} rx={2} /><path d="M12 18h.01" /></svg></div><h3>Device Detection</h3><p>New devices and locations are fingerprinted and flagged before access is granted.</p></div>
        </div>
      </div>
    </div>
  </section>
  {/* TECH STACK */}
  <section className="section-pad" style={{background: 'var(--bg-soft)', borderTop: '1px solid var(--border-soft)', borderBottom: '1px solid var(--border-soft)'}}>
    <div className="wrap">
      <div className="center reveal" style={{maxWidth: 620}}>
        <span className="eyebrow">Technology</span>
        <h2 className="h-section" style={{marginTop: 18}}>Built on a modern, proven stack</h2>
      </div>
      <div className="stack-grid stagger">
        <div className="stack-col">
          <h4>Frontend</h4>
          <div className="tech"><span className="tlogo" style={{color: '#61dafb'}}>⚛</span><span className="tn">React</span></div>
          <div className="tech"><span className="tlogo" style={{color: '#3178c6'}}>TS</span><span className="tn">TypeScript</span></div>
          <div className="tech"><span className="tlogo" style={{color: '#646cff'}}>⚡</span><span className="tn">Vite</span></div>
          <div className="tech"><span className="tlogo" style={{color: '#06b6d4'}}>~</span><span className="tn">Tailwind</span></div>
        </div>
        <div className="stack-col">
          <h4>Backend</h4>
          <div className="tech"><span className="tlogo" style={{color: '#539e43'}}>N</span><span className="tn">Node.js</span></div>
          <div className="tech"><span className="tlogo" style={{color: '#111827'}}>ex</span><span className="tn">Express</span></div>
        </div>
        <div className="stack-col">
          <h4>Database</h4>
          <div className="tech"><span className="tlogo" style={{color: '#336791'}}>PG</span><span className="tn">PostgreSQL</span></div>
        </div>
        <div className="stack-col">
          <h4>Infrastructure</h4>
          <div className="tech"><span className="tlogo" style={{color: '#2496ed'}}>🐳</span><span className="tn">Docker</span></div>
          <div className="tech"><span className="tlogo" style={{color: '#111827'}}>GH</span><span className="tn">GitHub Actions</span></div>
          <div className="tech"><span className="tlogo" style={{color: '#111827'}}>▲</span><span className="tn">Vercel</span></div>
          <div className="tech"><span className="tlogo" style={{color: '#46e3b7'}}>R</span><span className="tn">Render</span></div>
        </div>
      </div>
    </div>
  </section>
  {/* FINAL CTA */}
  <section className="section-pad fcta" id="cta">
    <div className="wrap">
      <div className="fcta-card reveal">
        <div className="blob-c" />
        <h2>Ready To Run Engineering Like A High-Performance Organization?</h2>
        <p>Replace fragmented workflows with one operating system for planning, execution, collaboration, and delivery.</p>
        <div className="fcta-actions">
          <a href="#contact" className="btn btn-primary magnetic">
            Request Demo
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12h14M13 6l6 6-6 6" /></svg>
          </a>
          <a href="#contact" className="btn btn-light">Contact Sales</a>
        </div>
      </div>
    </div>
  </section>
  {/* FOOTER */}
  <footer id="contact">
    <div className="wrap">
      <div className="foot-grid">
        <div className="foot-brand">
          <a href="#" className="brand"><span className="logo-mark"><svg viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 12l4-4 4 4 4-6 6 8" /></svg></span>SprintOS</a>
          <p>The Operating System for Engineering Excellence. One workspace for planning, execution, collaboration and delivery.</p>
          <div className="foot-social">
            <a href="#" aria-label="X"><svg viewBox="0 0 24 24" fill="currentColor"><path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" /></svg></a>
            <a href="#" aria-label="LinkedIn"><svg viewBox="0 0 24 24" fill="currentColor"><path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433a2.062 2.062 0 0 1-2.063-2.065 2.064 2.064 0 1 1 2.063 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z" /></svg></a>
            <a href="#" aria-label="GitHub"><svg viewBox="0 0 24 24" fill="currentColor"><path d="M12 .297c-6.63 0-12 5.373-12 12 0 5.303 3.438 9.8 8.205 11.385.6.113.82-.258.82-.577 0-.285-.01-1.04-.015-2.04-3.338.724-4.042-1.61-4.042-1.61C4.422 18.07 3.633 17.7 3.633 17.7c-1.087-.744.084-.729.084-.729 1.205.084 1.838 1.236 1.838 1.236 1.07 1.835 2.809 1.305 3.495.998.108-.776.417-1.305.76-1.605-2.665-.3-5.466-1.332-5.466-5.93 0-1.31.465-2.38 1.235-3.22-.135-.303-.54-1.523.105-3.176 0 0 1.005-.322 3.3 1.23.96-.267 1.98-.399 3-.405 1.02.006 2.04.138 3 .405 2.28-1.552 3.285-1.23 3.285-1.23.645 1.653.24 2.873.12 3.176.765.84 1.23 1.91 1.23 3.22 0 4.61-2.805 5.625-5.475 5.92.42.36.81 1.096.81 2.22 0 1.606-.015 2.896-.015 3.286 0 .315.21.69.825.57C20.565 22.092 24 17.592 24 12.297c0-6.627-5.373-12-12-12" /></svg></a>
          </div>
        </div>
        <div className="foot-col"><h5>Platform</h5><a href="#platform">Overview</a><a href="#modules">Modules</a><a href="#features">Features</a><a href="#analytics">Analytics</a></div>
        <div className="foot-col"><h5>Features</h5><a href="#features">Sprint Planning</a><a href="#features">Task Management</a><a href="#features">Collaboration</a><a href="#analytics">Reporting</a></div>
        <div className="foot-col"><h5>Security</h5><a href="#security">Authentication</a><a href="#security">Audit Logs</a><a href="#security">Compliance</a><a href="#security">Sessions</a></div>
        <div className="foot-col"><h5>Resources</h5><a href="#">Documentation</a><a href="#">API Reference</a><a href="#">Changelog</a><a href="#">Status</a></div>
      </div>
      <div className="foot-bottom">
        <p>© 2026 SprintOS. The Operating System for Engineering Excellence.</p>
        <div className="links"><a href="#">Privacy</a><a href="#">Terms</a><a href="#contact">Contact</a></div>
      </div>
    </div>
  </footer>
</div>

      </div>
    </>
  );
}
