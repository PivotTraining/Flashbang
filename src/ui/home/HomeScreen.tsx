import HeroScene from "./HeroScene";
import { useScreenStore, type Screen } from "../../state/screenStore";

// LOCKED home screen layout (handoff doc §5): top nav, left stacked cards,
// center equipped character on glowing platform, bottom nav. Dark/purple
// cinematic style. No reward wheels, chests, or promo clutter.

const TOP_NAV: { label: string; screen: Screen }[] = [
  { label: "Home", screen: "home" },
  { label: "Play", screen: "play" },
  { label: "Study", screen: "study" },
  { label: "Characters", screen: "characters" },
  { label: "Settings", screen: "settings" },
  { label: "Friends", screen: "friends" },
  { label: "Legendary Shop", screen: "shop" },
];

const LEFT_CARDS: { label: string; sub: string; screen: Screen; accent: string }[] = [
  { label: "Play", sub: "Jump into battle.", screen: "play", accent: "#f5b942" },
  { label: "Ranked Arena", sub: "Compete. Rise. Be legend.", screen: "ranked", accent: "#a855f7" },
  { label: "Story Mode", sub: "Fight. Unlock. Conquer.", screen: "story", accent: "#34d399" },
  { label: "Events", sub: "Limited time. Big rewards.", screen: "events", accent: "#fb7185" },
  { label: "Training", sub: "Practice. Improve. Master.", screen: "training", accent: "#38bdf8" },
];

const BOTTOM_NAV: { label: string; screen: Screen }[] = [
  { label: "Powers", screen: "powers" },
  { label: "Ball", screen: "ball" },
  { label: "Dragons", screen: "dragons" },
  { label: "Loadout", screen: "loadout" },
  { label: "Achievements", screen: "achievements" },
  { label: "Missions", screen: "missions" },
  { label: "Leaderboard", screen: "leaderboard" },
];

export default function HomeScreen() {
  const navigate = useScreenStore((s) => s.navigate);
  const screen = useScreenStore((s) => s.screen);

  return (
    <div style={styles.root}>
      <HeroScene />

      {/* top navigation */}
      <nav style={styles.topNav}>
        <span style={styles.logo}>FLASH BANG</span>
        <div style={styles.topLinks}>
          {TOP_NAV.map((item) => (
            <button
              key={item.label}
              style={{
                ...styles.topLink,
                ...(screen === item.screen ? styles.topLinkActive : {}),
              }}
              onClick={() => navigate(item.screen)}
            >
              {item.label}
            </button>
          ))}
        </div>
      </nav>

      {/* left stacked cards */}
      <div style={styles.leftStack}>
        {LEFT_CARDS.map((card) => (
          <button
            key={card.label}
            style={{ ...styles.card, borderColor: card.accent }}
            onClick={() => navigate(card.screen)}
          >
            <span style={{ ...styles.cardLabel, color: card.accent }}>
              {card.label}
            </span>
            <span style={styles.cardSub}>{card.sub}</span>
          </button>
        ))}
      </div>

      {/* bottom navigation */}
      <nav style={styles.bottomNav}>
        {BOTTOM_NAV.map((item) => (
          <button
            key={item.label}
            style={styles.bottomLink}
            onClick={() => navigate(item.screen)}
          >
            {item.label}
          </button>
        ))}
      </nav>
    </div>
  );
}

const styles: Record<string, React.CSSProperties> = {
  root: {
    position: "relative",
    width: "100vw",
    height: "100vh",
    overflow: "hidden",
    background: "#07040e",
    color: "#e9e4f5",
  },
  topNav: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    padding: "14px 26px",
    background: "linear-gradient(180deg, rgba(7,4,14,0.92), rgba(7,4,14,0))",
    zIndex: 2,
  },
  logo: {
    fontSize: 20,
    fontWeight: 900,
    letterSpacing: 3,
    color: "#c9a6ff",
    textShadow: "0 0 14px rgba(138,59,255,0.7)",
  },
  topLinks: { display: "flex", gap: 4 },
  topLink: {
    background: "none",
    border: "none",
    color: "#b6aecb",
    fontSize: 13,
    fontWeight: 600,
    letterSpacing: 0.6,
    padding: "8px 12px",
    cursor: "pointer",
    borderBottom: "2px solid transparent",
    textTransform: "uppercase",
  },
  topLinkActive: {
    color: "#f5b942",
    borderBottom: "2px solid #f5b942",
  },
  leftStack: {
    position: "absolute",
    left: 26,
    top: "50%",
    transform: "translateY(-50%)",
    display: "flex",
    flexDirection: "column",
    gap: 12,
    zIndex: 2,
    width: 250,
  },
  card: {
    display: "flex",
    flexDirection: "column",
    alignItems: "flex-start",
    gap: 3,
    padding: "13px 16px",
    background: "rgba(12,8,22,0.82)",
    border: "1px solid",
    borderRadius: 10,
    cursor: "pointer",
    textAlign: "left",
    backdropFilter: "blur(4px)",
    transition: "transform 0.12s ease",
  },
  cardLabel: {
    fontSize: 17,
    fontWeight: 800,
    letterSpacing: 1.2,
    textTransform: "uppercase",
  },
  cardSub: { fontSize: 11.5, color: "#9d94b8", fontWeight: 500 },
  bottomNav: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    display: "flex",
    justifyContent: "center",
    gap: 6,
    padding: "12px 20px 16px",
    background: "linear-gradient(0deg, rgba(7,4,14,0.94), rgba(7,4,14,0))",
    zIndex: 2,
  },
  bottomLink: {
    background: "rgba(20,13,36,0.85)",
    border: "1px solid rgba(138,59,255,0.35)",
    color: "#cdc3e6",
    fontSize: 12,
    fontWeight: 700,
    letterSpacing: 0.8,
    textTransform: "uppercase",
    padding: "10px 16px",
    borderRadius: 8,
    cursor: "pointer",
  },
};
