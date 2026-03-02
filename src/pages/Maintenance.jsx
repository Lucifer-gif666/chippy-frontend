import { useState, useEffect } from "react";

const MAINTENANCE_DURATION_HOURS = 12;
// Set your maintenance start time here (adjust to actual start)
const MAINTENANCE_START = new Date(Date.now()); // starts now
const MAINTENANCE_END = new Date(MAINTENANCE_START.getTime() + MAINTENANCE_DURATION_HOURS * 60 * 60 * 1000);

const MAINTENANCE_ITEMS = [
  {
    icon: "🛡️",
    title: "Security Patches",
    description: "Applying critical security updates to protect your data and accounts.",
  },
  {
    icon: "⚡",
    title: "Performance Optimization",
    description: "Upgrading database indexes and caching layers for faster load times.",
  },
  {
    icon: "🔧",
    title: "Bug Fixes",
    description: "Resolving reported issues with booking flows, notifications, and scheduling.",
  },
  {
    icon: "🗄️",
    title: "Database Migration",
    description: "Migrating resident records to the new schema for improved reliability.",
  },
  {
    icon: "🚀",
    title: "Feature Rollout",
    description: "Deploying new modules: enhanced resident dashboard and admin reporting.",
  },
  {
    icon: "☁️",
    title: "Infrastructure Upgrade",
    description: "Scaling server capacity to support increased usage across all residencies.",
  },
];

function pad(n) {
  return String(n).padStart(2, "0");
}

export default function MaintenanceScreen() {
  const [timeLeft, setTimeLeft] = useState(null);
  const [progress, setProgress] = useState(0);
  const [tick, setTick] = useState(0);

  useEffect(() => {
    function update() {
      const now = Date.now();
      const total = MAINTENANCE_END.getTime() - MAINTENANCE_START.getTime();
      const remaining = Math.max(0, MAINTENANCE_END.getTime() - now);
      const elapsed = total - remaining;
      setProgress(Math.min(100, (elapsed / total) * 100));

      const h = Math.floor(remaining / 3600000);
      const m = Math.floor((remaining % 3600000) / 60000);
      const s = Math.floor((remaining % 60000) / 1000);
      setTimeLeft({ h, m, s });
      setTick((t) => t + 1);
    }
    update();
    const id = setInterval(update, 1000);
    return () => clearInterval(id);
  }, []);

  const endTimeStr = MAINTENANCE_END.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  const endDateStr = MAINTENANCE_END.toLocaleDateString([], { weekday: "long", month: "long", day: "numeric" });

  return (
    <div style={styles.root}>
      {/* Animated grid background */}
      <div style={styles.gridBg} />
      <div style={styles.glow1} />
      <div style={styles.glow2} />

      <div style={styles.container}>
        {/* Logo / Brand */}
        <div style={styles.brand}>
          <div style={styles.logoMark}>
            <span style={styles.logoIcon}>🏠</span>
          </div>
          <div>
            <div style={styles.logoText}>CHIPPY</div>
            <div style={styles.logoSub}>Residency Management</div>
          </div>
        </div>

        {/* Status badge */}
        <div style={styles.statusBadge}>
          <span style={styles.pulseDot} />
          SCHEDULED MAINTENANCE IN PROGRESS
        </div>

        {/* Headline */}
        <h1 style={styles.headline}>
          We're upgrading<br />
          <span style={styles.headlineAccent}>for you.</span>
        </h1>
        <p style={styles.subline}>
          Chippy is currently undergoing planned maintenance. We'll be back online by{" "}
          <strong style={{ color: "#f0c040" }}>{endTimeStr}</strong> on {endDateStr}.
        </p>

        {/* Countdown */}
        {timeLeft && (
          <div style={styles.countdown}>
            <div style={styles.countUnit}>
              <div style={styles.countNum}>{pad(timeLeft.h)}</div>
              <div style={styles.countLabel}>Hours</div>
            </div>
            <div style={styles.countSep}>:</div>
            <div style={styles.countUnit}>
              <div style={styles.countNum}>{pad(timeLeft.m)}</div>
              <div style={styles.countLabel}>Minutes</div>
            </div>
            <div style={styles.countSep}>:</div>
            <div style={styles.countUnit}>
              <div style={styles.countNum}>{pad(timeLeft.s)}</div>
              <div style={styles.countLabel}>Seconds</div>
            </div>
          </div>
        )}

        {/* Progress bar */}
        <div style={styles.progressWrap}>
          <div style={styles.progressBg}>
            <div style={{ ...styles.progressFill, width: `${progress}%` }} />
          </div>
          <div style={styles.progressLabel}>{progress.toFixed(1)}% complete</div>
        </div>

        {/* What we're doing */}
        <div style={styles.section}>
          <div style={styles.sectionTitle}>What's happening during this maintenance window</div>
          <div style={styles.grid}>
            {MAINTENANCE_ITEMS.map((item, i) => (
              <div key={i} style={styles.card}>
                <div style={styles.cardIcon}>{item.icon}</div>
                <div style={styles.cardTitle}>{item.title}</div>
                <div style={styles.cardDesc}>{item.description}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Contact note */}
        <div style={styles.footer}>
          <p>
            Need urgent help? Contact your admin or email{" "}
            <span style={styles.link}>support@chippy.app</span>
          </p>
          <p style={styles.footerNote}>We apologize for the inconvenience and appreciate your patience.</p>
        </div>
      </div>

      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Syne:wght@700;800&family=DM+Sans:wght@400;500&display=swap');
        @keyframes pulse { 0%,100%{opacity:1;transform:scale(1)} 50%{opacity:0.5;transform:scale(1.4)} }
        @keyframes fillbar { from{width:0} }
        @keyframes fadeUp { from{opacity:0;transform:translateY(24px)} to{opacity:1;transform:translateY(0)} }
        @keyframes shimmer {
          0%{background-position:200% center}
          100%{background-position:-200% center}
        }
      `}</style>
    </div>
  );
}

const styles = {
  root: {
    minHeight: "100vh",
    background: "#0a0c14",
    color: "#e8eaf0",
    fontFamily: "'DM Sans', sans-serif",
    position: "relative",
    overflow: "hidden",
    display: "flex",
    alignItems: "flex-start",
    justifyContent: "center",
  },
  gridBg: {
    position: "fixed",
    inset: 0,
    backgroundImage: `linear-gradient(rgba(255,255,255,0.03) 1px, transparent 1px),
      linear-gradient(90deg, rgba(255,255,255,0.03) 1px, transparent 1px)`,
    backgroundSize: "40px 40px",
    pointerEvents: "none",
    zIndex: 0,
  },
  glow1: {
    position: "fixed",
    top: "-200px",
    left: "-200px",
    width: "600px",
    height: "600px",
    borderRadius: "50%",
    background: "radial-gradient(circle, rgba(240,192,64,0.12) 0%, transparent 70%)",
    pointerEvents: "none",
    zIndex: 0,
  },
  glow2: {
    position: "fixed",
    bottom: "-200px",
    right: "-200px",
    width: "700px",
    height: "700px",
    borderRadius: "50%",
    background: "radial-gradient(circle, rgba(100,120,255,0.1) 0%, transparent 70%)",
    pointerEvents: "none",
    zIndex: 0,
  },
  container: {
    position: "relative",
    zIndex: 1,
    maxWidth: "860px",
    width: "100%",
    padding: "48px 24px 64px",
    animation: "fadeUp 0.7s ease both",
  },
  brand: {
    display: "flex",
    alignItems: "center",
    gap: "14px",
    marginBottom: "40px",
  },
  logoMark: {
    width: "48px",
    height: "48px",
    borderRadius: "12px",
    background: "linear-gradient(135deg, #f0c040, #e07820)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontSize: "22px",
    boxShadow: "0 4px 20px rgba(240,192,64,0.35)",
  },
  logoIcon: { lineHeight: 1 },
  logoText: {
    fontFamily: "'Syne', sans-serif",
    fontWeight: 800,
    fontSize: "22px",
    letterSpacing: "0.12em",
    color: "#fff",
  },
  logoSub: {
    fontSize: "11px",
    letterSpacing: "0.08em",
    color: "#666880",
    textTransform: "uppercase",
    marginTop: "2px",
  },
  statusBadge: {
    display: "inline-flex",
    alignItems: "center",
    gap: "8px",
    padding: "6px 16px",
    borderRadius: "999px",
    background: "rgba(240,192,64,0.1)",
    border: "1px solid rgba(240,192,64,0.25)",
    color: "#f0c040",
    fontSize: "11px",
    fontWeight: "500",
    letterSpacing: "0.1em",
    textTransform: "uppercase",
    marginBottom: "28px",
  },
  pulseDot: {
    display: "inline-block",
    width: "7px",
    height: "7px",
    borderRadius: "50%",
    background: "#f0c040",
    animation: "pulse 1.5s ease infinite",
  },
  headline: {
    fontFamily: "'Syne', sans-serif",
    fontWeight: 800,
    fontSize: "clamp(36px, 6vw, 62px)",
    lineHeight: 1.1,
    margin: "0 0 18px",
    color: "#fff",
  },
  headlineAccent: {
    background: "linear-gradient(90deg, #f0c040, #ff8c42, #f0c040)",
    backgroundSize: "200% auto",
    WebkitBackgroundClip: "text",
    WebkitTextFillColor: "transparent",
    backgroundClip: "text",
    animation: "shimmer 3s linear infinite",
  },
  subline: {
    fontSize: "16px",
    color: "#9294a8",
    lineHeight: 1.7,
    maxWidth: "540px",
    marginBottom: "40px",
  },
  countdown: {
    display: "flex",
    alignItems: "center",
    gap: "4px",
    marginBottom: "32px",
  },
  countUnit: {
    textAlign: "center",
    minWidth: "80px",
    background: "rgba(255,255,255,0.04)",
    border: "1px solid rgba(255,255,255,0.08)",
    borderRadius: "12px",
    padding: "16px 12px",
  },
  countNum: {
    fontFamily: "'Syne', sans-serif",
    fontWeight: 800,
    fontSize: "42px",
    color: "#fff",
    lineHeight: 1,
    letterSpacing: "-0.02em",
  },
  countLabel: {
    fontSize: "11px",
    color: "#555770",
    textTransform: "uppercase",
    letterSpacing: "0.08em",
    marginTop: "6px",
  },
  countSep: {
    fontFamily: "'Syne', sans-serif",
    fontWeight: 800,
    fontSize: "36px",
    color: "#333550",
    padding: "0 4px",
    marginBottom: "16px",
  },
  progressWrap: {
    marginBottom: "56px",
  },
  progressBg: {
    height: "6px",
    borderRadius: "99px",
    background: "rgba(255,255,255,0.07)",
    overflow: "hidden",
    marginBottom: "10px",
  },
  progressFill: {
    height: "100%",
    borderRadius: "99px",
    background: "linear-gradient(90deg, #f0c040, #ff8c42)",
    transition: "width 1s linear",
    boxShadow: "0 0 12px rgba(240,192,64,0.5)",
  },
  progressLabel: {
    fontSize: "12px",
    color: "#555770",
    letterSpacing: "0.05em",
  },
  section: {
    marginBottom: "48px",
  },
  sectionTitle: {
    fontFamily: "'Syne', sans-serif",
    fontWeight: 700,
    fontSize: "13px",
    textTransform: "uppercase",
    letterSpacing: "0.12em",
    color: "#555770",
    marginBottom: "24px",
    borderBottom: "1px solid rgba(255,255,255,0.06)",
    paddingBottom: "12px",
  },
  grid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fill, minmax(240px, 1fr))",
    gap: "16px",
  },
  card: {
    background: "rgba(255,255,255,0.03)",
    border: "1px solid rgba(255,255,255,0.07)",
    borderRadius: "14px",
    padding: "20px",
    transition: "border-color 0.2s",
  },
  cardIcon: {
    fontSize: "24px",
    marginBottom: "10px",
  },
  cardTitle: {
    fontFamily: "'Syne', sans-serif",
    fontWeight: 700,
    fontSize: "14px",
    color: "#e8eaf0",
    marginBottom: "6px",
  },
  cardDesc: {
    fontSize: "13px",
    color: "#666880",
    lineHeight: 1.6,
  },
  footer: {
    borderTop: "1px solid rgba(255,255,255,0.06)",
    paddingTop: "28px",
    textAlign: "center",
    fontSize: "14px",
    color: "#555770",
    lineHeight: 1.9,
  },
  link: {
    color: "#f0c040",
    textDecoration: "underline",
    cursor: "pointer",
  },
  footerNote: {
    fontSize: "12px",
    color: "#3a3c50",
  },
};