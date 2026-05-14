import { useState, useEffect } from "react";
import Lenis from "lenis";
import { motion, AnimatePresence } from "framer-motion";
import {
  Menu, X, Download, ArrowRight, Play, Check,
  AppWindow, Sparkles, Lock, Rocket, Cpu, Eye, Star,
  Package, Plug, Terminal, CheckCircle, RefreshCw, Zap as ZapIcon,
  CheckSquare, BarChart2, Lightbulb, ChevronUp
} from "lucide-react";
import "./App.css";

/* ─── Data ─── */
const SITE = { name: "Oryonix AI", chrome: "#", github: "https://github.com/user/oryonix-ai" };
const NAV = [
  { label: "Features", href: "#features" },
  { label: "Demo", href: "#demo" },
  { label: "How It Works", href: "#how-it-works" },
  { label: "Open Source", href: "#open-source" },
];
const FEATURES = [
  { Icon: AppWindow, title: "Multi-Tab Control", desc: "Navigate, open, close, and switch between multiple tabs simultaneously." },
  { Icon: Sparkles, title: "Natural Language", desc: "Just describe your task in plain English — no coding, no scripts required." },
  { Icon: Lock, title: "Privacy First", desc: "Runs entirely on your machine with Ollama. Your data never leaves your computer." },
  { Icon: Rocket, title: "60-Second Setup", desc: "Install the extension, run Ollama, and you're automating in under a minute." },
  { Icon: Cpu, title: "Any LLM, Your Choice", desc: "Bring your own model — Ollama, OpenAI, Anthropic, Groq, or any compatible API." },
  { Icon: Eye, title: "Smart Page Reading", desc: "Understands page structure, forms, buttons — the agent sees what you see." },
];
const STEPS = [
  { n: 1, Icon: Package, title: "Install", desc: "Add from Chrome Web Store. One click, zero config." },
  { n: 2, Icon: Plug, title: "Connect", desc: "Run Ollama locally — your AI, your machine, your rules." },
  { n: 3, Icon: Terminal, title: "Command", desc: "Type what you want in the side panel. Plain English." },
  { n: 4, Icon: CheckCircle, title: "Done", desc: "Watch the agent work autonomously. Review the results." },
];
const TESTIMONIALS = [
  { q: "This replaced three separate browser automation tools for me. The natural language interface is a game-changer.", name: "Alex Chen", role: "Full-Stack Developer", av: "AC" },
  { q: "Finally, browser automation that respects my privacy. Running locally with Ollama gives me full control.", name: "Sarah Martinez", role: "Security Engineer", av: "SM" },
  { q: "I use it daily for testing workflows. The multi-tab support saves me hours every week.", name: "James Park", role: "QA Lead", av: "JP" },
  { q: "Open source, local-first, and it actually works. This is how AI tools should be built.", name: "Priya Sharma", role: "DevOps Engineer", av: "PS" },
];
const OS_FEATURES = ["Full multi-tab browser agent", "Local LLM support (Ollama)", "Custom LLM endpoint support", "Smart page reading & interaction", "Tab grouping & management", "MIT Licensed — forever free"];
const FOOTER_COLS = [
  { title: "Product", links: [{ l: "Features", h: "#features" }, { l: "Demo", h: "#demo" }, { l: "How It Works", h: "#how-it-works" }, { l: "Changelog", h: "#" }] },
  { title: "Resources", links: [{ l: "Documentation", h: "#" }, { l: "Getting Started", h: "#" }, { l: "API Reference", h: "#" }, { l: "FAQ", h: "#" }] },
  { title: "Connect", links: [{ l: "GitHub", h: SITE.github }, { l: "Twitter", h: "#" }, { l: "Discord", h: "#" }, { l: "Report a Bug", h: "#" }] },
];

/* ─── SVG Icons ─── */
const GithubIcon = ({ size = 20 }: { size?: number }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor">
    <path d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.23-.015-2.235-3.015.555-3.795-.735-4.035-1.41-.135-.345-.72-1.41-1.23-1.695-.42-.225-1.02-.78-.015-.795.945-.015 1.62.87 1.845 1.23 1.08 1.815 2.805 1.305 3.495.99.105-.78.42-1.305.765-1.605-2.67-.3-5.46-1.335-5.46-5.925 0-1.305.465-2.385 1.23-3.225-.12-.3-.54-1.53.12-3.18 0 0 1.005-.315 3.3 1.23.96-.27 1.98-.405 3-.405s2.04.135 3 .405c2.295-1.56 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.765.84 1.23 1.905 1.23 3.225 0 4.605-2.805 5.625-5.475 5.925.435.375.81 1.095.81 2.22 0 1.605-.015 2.895-.015 3.3 0 .315.225.69.825.57A12.02 12.02 0 0024 12c0-6.63-5.37-12-12-12z"/>
  </svg>
);

/* ─── Animation helpers ─── */
const fadeUp = { hidden: { opacity: 0, y: 30 }, show: { opacity: 1, y: 0 } };
const stagger = { show: { transition: { staggerChildren: 0.1 } } };

/* ═══════════ NAVBAR ═══════════ */
function Navbar() {
  const [scrolled, setScrolled] = useState(false);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const fn = () => setScrolled(window.scrollY > 20);
    window.addEventListener("scroll", fn, { passive: true });
    return () => window.removeEventListener("scroll", fn);
  }, []);

  return (
    <header className={`nav ${scrolled ? "nav--scrolled" : ""}`}>
      <nav className="container nav__inner">
        <a href="/" className="nav__logo"><span className="nav__logo-icon">⚡</span><span className="accent-text">Oryonix AI</span></a>
        <ul className="nav__links">
          {NAV.map(n => <li key={n.href}><a href={n.href} className="nav__link">{n.label}</a></li>)}
        </ul>
        <a href={SITE.chrome} className="btn btn--primary btn--sm nav__cta">Install Free</a>
        <button className="nav__burger" onClick={() => setOpen(!open)} aria-label="Toggle menu">
          {open ? <X size={22} /> : <Menu size={22} />}
        </button>
        <AnimatePresence>
          {open && (
            <motion.div className="nav__mobile" initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}>
              {NAV.map(n => <a key={n.href} href={n.href} className="nav__mobile-link" onClick={() => setOpen(false)}>{n.label}</a>)}
              <a href={SITE.chrome} className="btn btn--primary">Install Free</a>
            </motion.div>
          )}
        </AnimatePresence>
      </nav>
    </header>
  );
}

/* ═══════════ HERO ═══════════ */
function Hero() {
  return (
    <section className="hero" id="hero">
      <div className="hero__glow" />
      <div className="hero__grid" />
      <div className="container hero__inner">
        <motion.div className="hero__content" initial={{ opacity: 0, y: 40 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1] }}>
          <motion.div className="hero__badge" initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: 0.1 }}>
            <span className="hero__badge-dot" />Open Source & Free Forever
          </motion.div>
          <h1 className="hero__title">Your AI Co-pilot<br /><span className="accent-text">for the Browser</span></h1>
          <p className="hero__sub">Tell it what to do. Watch it work.<br className="hide-mobile" />Open source & privacy-first.</p>
          <div className="hero__actions">
            <a href={SITE.chrome} className="btn btn--primary btn--lg"><Download size={18} />Install Free</a>
            <a href="#demo" className="btn btn--glass btn--lg">Watch Demo<ArrowRight size={16} /></a>
          </div>
        </motion.div>

        <motion.div className="mockup" initial={{ opacity: 0, y: 60 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3, duration: 0.8, ease: [0.16, 1, 0.3, 1] }}>
          <div className="mockup__frame">
            <div className="mockup__bar">
              <div className="mockup__dots"><span className="dot dot--r" /><span className="dot dot--y" /><span className="dot dot--g" /></div>
              <div className="mockup__url">oryonix.ai</div>
            </div>
            <div className="mockup__body">
              <div className="mockup__panel">
                <div className="mockup__panel-head"><span className="mockup__panel-icon"><ZapIcon size={16} strokeWidth={2} fill="currentColor" /></span>Oryonix AI</div>
                <div className="mockup__input"><span>Book a flight to NYC for next Friday...</span><span className="mockup__cursor" /></div>
                <div className="mockup__status"><span className="mockup__status-dot" />Agent is working...</div>
                <div className="mockup__steps">
                  <div className="mockup__step mockup__step--done"><Check size={16} strokeWidth={2} style={{display:'inline', marginRight:'6px'}} /> Opened Google Flights</div>
                  <div className="mockup__step mockup__step--done"><Check size={16} strokeWidth={2} style={{display:'inline', marginRight:'6px'}} /> Entered destination: NYC</div>
                  <div className="mockup__step mockup__step--active"><RefreshCw size={16} strokeWidth={2} className="animate-spin" style={{display:'inline', marginRight:'6px'}} /> Selecting date...</div>
                </div>
              </div>
              <div className="mockup__page">
                <div className="skel skel--h" /><div className="skel-grid"><div className="skel skel--card" /><div className="skel skel--card" /><div className="skel skel--card" /></div>
              </div>
            </div>
          </div>
        </motion.div>

        <motion.div className="trust" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.8 }}>
          <div className="trust__item"><span className="trust__val"><Star size={16} className="trust__star" /> 4.9</span><span className="trust__label">Chrome Rating</span></div>
          <div className="trust__div" />
          <div className="trust__item"><span className="trust__val">100%</span><span className="trust__label">Open Source</span></div>
          <div className="trust__div" />
          <div className="trust__item"><span className="trust__val">0 bytes</span><span className="trust__label">Data Shared</span></div>
        </motion.div>
      </div>
    </section>
  );
}

/* ═══════════ FEATURES ═══════════ */
function Features() {
  return (
    <section className="section section-alt" id="features">
      <div className="container">
        <div className="section__head">
          <h2>Everything you need to <span className="accent-text">automate the web</span></h2>
          <p>No coding. No cloud. Just natural language.</p>
        </div>
        <motion.div className="features__grid" variants={stagger} initial="hidden" whileInView="show" viewport={{ once: true, margin: "-50px" }}>
          {FEATURES.map(f => (
            <motion.div key={f.title} className="card" variants={fadeUp} transition={{ duration: 0.5, ease: [0.16,1,0.3,1] }}>
              <div className="card__icon"><f.Icon size={24} strokeWidth={1.5} /></div>
              <h3 className="card__title">{f.title}</h3>
              <p className="card__desc">{f.desc}</p>
            </motion.div>
          ))}
        </motion.div>
      </div>
    </section>
  );
}

/* ═══════════ DEMO ═══════════ */
function Demo() {
  return (
    <section className="section" id="demo">
      <div className="container">
        <div className="section__head">
          <h2>See it <span className="accent-text">in action</span></h2>
          <p>Watch the agent complete real tasks — autonomously.</p>
        </div>
        <motion.div className="demo" initial={{ opacity: 0, y: 40 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true, margin: "-80px" }} transition={{ duration: 0.6, ease: [0.16,1,0.3,1] }}>
          <div className="demo__player">
            <div className="demo__overlay"><button className="demo__play" aria-label="Play demo"><Play size={32} fill="currentColor" /></button><p className="demo__play-text">Watch 60s Demo</p></div>
            <div className="demo__terminal">
              <div className="term__line"><span className="term__prompt">$</span> Tell the agent: "Compare prices for AirPods on Amazon and Best Buy"</div>
              <div className="term__line term__out"><CheckSquare size={16} strokeWidth={2} className="text-success" style={{display:'inline', marginRight:'8px', verticalAlign:'text-bottom'}} /> Opened Amazon.com — searching for AirPods Pro...</div>
              <div className="term__line term__out"><CheckSquare size={16} strokeWidth={2} className="text-success" style={{display:'inline', marginRight:'8px', verticalAlign:'text-bottom'}} /> Opened BestBuy.com — searching for AirPods Pro...</div>
              <div className="term__line term__out"><BarChart2 size={16} strokeWidth={2} className="text-accent" style={{display:'inline', marginRight:'8px', verticalAlign:'text-bottom'}} /> Amazon: $199.99 | Best Buy: $189.99</div>
              <div className="term__line term__result"><Lightbulb size={16} strokeWidth={2} className="text-accent" style={{display:'inline', marginRight:'8px', verticalAlign:'text-bottom'}} /> Best Buy is $10 cheaper. Task complete.</div>
            </div>
          </div>
          <div className="demo__tags">
            {["Compare prices", "Fill forms", "Research topics", "Test workflows"].map(t => <span key={t} className="tag">{t}</span>)}
          </div>
        </motion.div>
      </div>
    </section>
  );
}

/* ═══════════ HOW IT WORKS ═══════════ */
function HowItWorks() {
  return (
    <section className="section section-alt" id="how-it-works">
      <div className="container">
        <div className="section__head">
          <h2>Up and running in <span className="accent-text">60 seconds</span></h2>
          <p>From install to automation — four simple steps.</p>
        </div>
        <motion.div className="steps" variants={stagger} initial="hidden" whileInView="show" viewport={{ once: true, margin: "-50px" }}>
          {STEPS.map((s, i) => (
            <motion.div key={s.n} className="step-card" variants={fadeUp} transition={{ duration: 0.5, ease: [0.16,1,0.3,1] }}>
              <div className="step-card__num">{s.n}</div>
              <span className="step-card__icon"><s.Icon size={28} strokeWidth={1.5} /></span>
              <h3 className="step-card__title">{s.title}</h3>
              <p className="step-card__desc">{s.desc}</p>
              {i < STEPS.length - 1 && <div className="step-card__connector" />}
            </motion.div>
          ))}
        </motion.div>
      </div>
    </section>
  );
}

/* ═══════════ OPEN SOURCE ═══════════ */
function OpenSource() {
  return (
    <section className="section" id="open-source">
      <div className="container">
        <div className="section__head">
          <h2>Free forever. <span className="accent-text">Open source always.</span></h2>
          <p>No paywalls. No telemetry. No vendor lock-in. MIT licensed.</p>
        </div>
        <motion.div className="os-card" initial={{ opacity: 0, y: 30 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: 0.6, ease: [0.16,1,0.3,1] }}>
          <div className="os-card__features">
            {OS_FEATURES.map(f => <div key={f} className="os-card__feat"><Check size={18} className="os-card__check" /><span>{f}</span></div>)}
          </div>
          <div className="os-card__actions">
            <a href={SITE.github} className="btn btn--glass btn--lg" target="_blank" rel="noopener noreferrer"><GithubIcon size={20} />Star on GitHub</a>
            <a href={SITE.chrome} className="btn btn--primary btn--lg" target="_blank" rel="noopener noreferrer"><Download size={18} />Install Extension</a>
          </div>
          <div className="os-card__stats">
            <div className="os-card__stat"><span className="os-card__stat-val">MIT</span><span className="os-card__stat-label">License</span></div>
            <div className="os-card__stat-div" />
            <div className="os-card__stat"><span className="os-card__stat-val">$0</span><span className="os-card__stat-label">Forever</span></div>
            <div className="os-card__stat-div" />
            <div className="os-card__stat"><span className="os-card__stat-val">0</span><span className="os-card__stat-label">Telemetry</span></div>
          </div>
        </motion.div>
      </div>
    </section>
  );
}

/* ═══════════ TESTIMONIALS ═══════════ */
function Testimonials() {
  return (
    <section className="section section-alt">
      <div className="container">
        <div className="section__head">
          <h2>Loved by <span className="accent-text">developers</span></h2>
          <p>See what people are saying about Oryonix AI.</p>
        </div>
        <motion.div className="test-grid" variants={stagger} initial="hidden" whileInView="show" viewport={{ once: true, margin: "-50px" }}>
          {TESTIMONIALS.map(t => (
            <motion.div key={t.name} className="test-card" variants={fadeUp} transition={{ duration: 0.5, ease: [0.16,1,0.3,1] }}>
              <p className="test-card__quote">&ldquo;{t.q}&rdquo;</p>
              <div className="test-card__author">
                <div className="test-card__avatar">{t.av}</div>
                <div><div className="test-card__name">{t.name}</div><div className="test-card__role">{t.role}</div></div>
              </div>
            </motion.div>
          ))}
        </motion.div>
      </div>
    </section>
  );
}

/* ═══════════ FINAL CTA ═══════════ */
function CTA() {
  return (
    <section className="section cta-section">
      <div className="cta-glow" />
      <div className="container">
        <motion.div className="cta-card" initial={{ opacity: 0, y: 30 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: 0.6, ease: [0.16,1,0.3,1] }}>
          <h2>Ready to put your browser on <span className="accent-text">autopilot?</span></h2>
          <p>Install in seconds. Start automating immediately. No account required.</p>
          <div className="cta-card__actions">
            <a href={SITE.chrome} className="btn btn--primary btn--lg"><Download size={18} />Install Free — Chrome Web Store</a>
            <a href={SITE.github} className="btn btn--glass btn--lg" target="_blank" rel="noopener noreferrer"><GithubIcon size={18} />Star on GitHub</a>
          </div>
        </motion.div>
      </div>
    </section>
  );
}

/* ═══════════ FOOTER ═══════════ */
function Footer() {
  return (
    <footer className="footer">
      <div className="container footer__inner">
        <div className="footer__brand">
          <a href="/" className="nav__logo"><span className="nav__logo-icon">⚡</span><span className="accent-text">Oryonix AI</span></a>
          <p className="footer__desc">AI-powered browser automation.<br />Open source & privacy-first.</p>
        </div>
        <div className="footer__cols">
          {FOOTER_COLS.map(c => (
            <div key={c.title} className="footer__col">
              <h4>{c.title}</h4>
              <ul>{c.links.map(l => <li key={l.l}><a href={l.h}>{l.l}</a></li>)}</ul>
            </div>
          ))}
        </div>
      </div>
      <div className="footer__bottom"><div className="container"><p>© {new Date().getFullYear()} Oryonix AI. Open Source under MIT License.</p></div></div>
    </footer>
  );
}

/* ═══════════════════════════════════════════
   AMBIENT BACKGROUND
   ═══════════════════════════════════════════ */
function AmbientBackground() {
  return (
    <div className="ambient-bg" aria-hidden="true">
      <div className="ambient-blob ambient-blob--1" />
      <div className="ambient-blob ambient-blob--2" />
      <div className="ambient-blob ambient-blob--3" />
      <div className="ambient-noise" />
    </div>
  );
}

/* ═══════════════════════════════════════════
   APP
   ═══════════════════════════════════════════ */
export default function App() {
  const [showTop, setShowTop] = useState(false);

  useEffect(() => {
    const handleScroll = () => setShowTop(window.scrollY > 400);
    window.addEventListener("scroll", handleScroll, { passive: true });

    const lenis = new Lenis({
      duration: 1.2,
      easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
      orientation: 'vertical',
      gestureOrientation: 'vertical',
      smoothWheel: true,
      wheelMultiplier: 1,
      touchMultiplier: 2,
    });

    function raf(time: number) {
      lenis.raf(time);
      requestAnimationFrame(raf);
    }

    requestAnimationFrame(raf);

    return () => {
      window.removeEventListener("scroll", handleScroll);
      lenis.destroy();
    };
  }, []);

  return (
    <>
      <AmbientBackground />
      <Navbar />
      <main id="main-content">
        <Hero />
        <Features />
        <Demo />
        <HowItWorks />
        <OpenSource />
        <Testimonials />
        <CTA />
      </main>
      <Footer />

      <AnimatePresence>
        {showTop && (
          <motion.button 
            className="scroll-top"
            onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
            initial={{ opacity: 0, y: 20, scale: 0.8 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.8 }}
            transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
            aria-label="Scroll to top"
          >
            <ChevronUp size={24} strokeWidth={2} />
          </motion.button>
        )}
      </AnimatePresence>
    </>
  );
}
