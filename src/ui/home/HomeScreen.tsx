import HeroScene from "./HeroScene";
import { useScreenStore, type Screen } from "../../state/screenStore";
import {
  BallIcon,
  ChevronIcon,
  CoinIcon,
  CrownIcon,
  DragonIcon,
  FriendsIcon,
  GemIcon,
  LeaderboardIcon,
  LoadoutIcon,
  MailIcon,
  MissionsIcon,
  PowersIcon,
  ShardIcon,
  TrophyIcon,
} from "./icons";

// LOCKED home screen layout (handoff doc §5): top nav, left stacked cards,
// center equipped character on a glowing platform, bottom nav. No daily
// reward wheels, free chests, or right-side promo column.

const TOP_NAV: { label: string; screen: Screen }[] = [
  { label: "Home", screen: "home" },
  { label: "Play", screen: "play" },
  { label: "Study", screen: "study" },
  { label: "Characters", screen: "characters" },
  { label: "Settings", screen: "settings" },
  { label: "Friends", screen: "friends" },
  { label: "Legendary Shop", screen: "shop" },
];

const LEFT_CARDS: {
  label: string;
  sub: string;
  screen: Screen;
  accent: string;
  badge?: string;
}[] = [
  { label: "Play", sub: "Jump into battle.", screen: "play", accent: "#f5b942" },
  { label: "Ranked Arena", sub: "Compete. Rise. Be legend.", screen: "ranked", accent: "#a855f7" },
  { label: "Story Mode", sub: "Fight. Unlock. Conquer.", screen: "story", accent: "#34d399" },
  { label: "Events", sub: "Limited time. Big rewards.", screen: "events", accent: "#fb7185", badge: "3" },
  { label: "Training", sub: "Practice. Improve. Master.", screen: "training", accent: "#38bdf8" },
  { label: "My Career", sub: "Build your legacy.", screen: "career", accent: "#facc15" },
];

const BOTTOM_NAV: {
  label: string;
  screen: Screen;
  Icon: (p: { size?: number }) => JSX.Element;
  badge?: string;
}[] = [
  { label: "Powers", screen: "powers", Icon: PowersIcon },
  { label: "Ball", screen: "ball", Icon: BallIcon },
  { label: "Dragons", screen: "dragons", Icon: DragonIcon },
  { label: "Loadout", screen: "loadout", Icon: LoadoutIcon },
  { label: "Achievements", screen: "achievements", Icon: TrophyIcon },
  { label: "Missions", screen: "missions", Icon: MissionsIcon, badge: "7" },
  { label: "Leaderboard", screen: "leaderboard", Icon: LeaderboardIcon },
];

export default function HomeScreen() {
  const navigate = useScreenStore((s) => s.navigate);
  const screen = useScreenStore((s) => s.screen);

  return (
    <div style={styles.root}>
      <HeroScene />

      {/* ambient corner glows for depth */}
      <div style={styles.glowLeft} />
      <div style={styles.glowRight} />

      {/* ---------- top bar ---------- */}
      <header style={styles.topBar}>
        <div style={styles.profile}>
          <div style={styles.avatar}>
            <div style={styles.avatarInner} />
          </div>
          <div style={styles.profileText}>
            <div style={styles.nameRow}>
              <span style={styles.playerName}>FIGHTER</span>
              <CrownIcon size={15} />
            </div>
            <span style={styles.levelText}>LEVEL 1</span>
            <div style={styles.xpTrack}>
              <div style={styles.xpFill} />
            </div>
            <span style={styles.xpText}>XP 0 / 1,000</span>
          </div>
        </div>

        <nav style={styles.topLinks}>
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
        </nav>

        <div style={styles.rightCluster}>
          <div style={styles.currencies}>
            <div style={styles.currency}>
              <CoinIcon />
              <span style={styles.currencyValue}>0</span>
            </div>
            <div style={styles.currency}>
              <GemIcon />
              <span style={styles.currencyValue}>0</span>
            </div>
            <div style={styles.currency}>
              <ShardIcon />
              <span style={styles.currencyValue}>0</span>
            </div>
          </div>
          <button style={styles.iconButton} onClick={() => navigate("missions")}>
            <MailIcon />
          </button>
          <button style={styles.iconButton} onClick={() => navigate("friends")}>
            <FriendsIcon />
          </button>
        </div>
      </header>

      {/* ---------- left stacked cards ---------- */}
      <div style={styles.leftStack}>
        {LEFT_CARDS.map((card) => (
          <button
            key={card.label}
            style={{
              ...styles.card,
              borderColor: `${card.accent}66`,
              boxShadow: `inset 3px 0 0 ${card.accent}, 0 6px 22px rgba(0,0,0,0.55)`,
            }}
            onClick={() => navigate(card.screen)}
          >
            <span
              style={{
                ...styles.cardGlow,
                background: `radial-gradient(circle at 0% 50%, ${card.accent}2e, transparent 68%)`,
              }}
            />
            <span style={styles.cardText}>
              <span style={{ ...styles.cardLabel, color: card.accent }}>
                {card.label}
              </span>
              <span style={styles.cardSub}>{card.sub}</span>
            </span>
            {card.badge && <span style={styles.cardBadge}>{card.badge}</span>}
            <ChevronIcon size={17} color={card.accent} />
          </button>
        ))}
      </div>

      {/* ---------- bottom nav ---------- */}
      <nav style={styles.bottomNav}>
        {BOTTOM_NAV.map(({ label, screen: target, Icon, badge }) => (
          <button key={label} style={styles.bottomLink} onClick={() => navigate(target)}>
            <span style={styles.bottomIconWrap}>
              <Icon size={21} />
              {badge && <span style={styles.navBadge}>{badge}</span>}
            </span>
            <span style={styles.bottomLabel}>{label}</span>
          </button>
        ))}
      </nav>
    </div>
  );
}

const PANEL = "rgba(11,7,20,0.82)";

const styles: Record<string, React.CSSProperties> = {
  root: {
    position: "relative",
    width: "100vw",
    height: "100vh",
    overflow: "hidden",
    background: "#05030c",
    color: "#e9e4f5",
    userSelect: "none",
  },

  glowLeft: {
    position: "absolute",
    left: "-12%",
    top: "18%",
    width: "42%",
    height: "64%",
    background:
      "radial-gradient(ellipse at center, rgba(124,58,237,0.16), transparent 70%)",
    pointerEvents: "none",
    zIndex: 1,
  },
  glowRight: {
    position: "absolute",
    right: "-14%",
    top: "8%",
    width: "46%",
    height: "72%",
    background:
      "radial-gradient(ellipse at center, rgba(37,99,235,0.13), transparent 70%)",
    pointerEvents: "none",
    zIndex: 1,
  },

  topBar: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    display: "flex",
    alignItems: "flex-start",
    justifyContent: "space-between",
    gap: 20,
    padding: "12px 20px 26px",
    background:
      "linear-gradient(180deg, rgba(5,3,12,0.95) 12%, rgba(5,3,12,0.55) 62%, transparent)",
    zIndex: 3,
  },

  profile: { display: "flex", alignItems: "center", gap: 11, minWidth: 210 },
  avatar: {
    width: 46,
    height: 46,
    borderRadius: 12,
    background: "linear-gradient(145deg, #2a1650, #120a24)",
    border: "1.5px solid rgba(168,85,247,0.7)",
    boxShadow: "0 0 16px rgba(168,85,247,0.4)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    flexShrink: 0,
  },
  avatarInner: {
    width: 22,
    height: 22,
    borderRadius: "50%",
    background: "radial-gradient(circle at 35% 30%, #d8b4fe, #7c3aed 70%)",
    boxShadow: "0 0 12px rgba(168,85,247,0.9)",
  },
  profileText: { display: "flex", flexDirection: "column", gap: 2 },
  nameRow: { display: "flex", alignItems: "center", gap: 5 },
  playerName: {
    fontSize: 14,
    fontWeight: 900,
    letterSpacing: 1.4,
    color: "#f3ecff",
  },
  levelText: {
    fontSize: 10,
    fontWeight: 700,
    letterSpacing: 1,
    color: "#a78bfa",
  },
  xpTrack: {
    width: 128,
    height: 4,
    borderRadius: 999,
    background: "rgba(255,255,255,0.12)",
    overflow: "hidden",
    marginTop: 2,
  },
  xpFill: {
    width: "4%",
    height: "100%",
    background: "linear-gradient(90deg, #7c3aed, #c084fc)",
    boxShadow: "0 0 8px rgba(192,132,252,0.8)",
  },
  xpText: { fontSize: 9, color: "#8b81a8", letterSpacing: 0.4, marginTop: 1 },

  topLinks: {
    display: "flex",
    gap: 2,
    alignItems: "center",
    flexWrap: "wrap",
    justifyContent: "center",
    paddingTop: 6,
  },
  topLink: {
    background: "none",
    border: "none",
    color: "#b6aecb",
    fontSize: 12,
    fontWeight: 700,
    letterSpacing: 0.9,
    padding: "8px 11px",
    cursor: "pointer",
    borderBottom: "2px solid transparent",
    textTransform: "uppercase",
    whiteSpace: "nowrap",
  },
  topLinkActive: {
    color: "#f5b942",
    borderBottom: "2px solid #f5b942",
    textShadow: "0 0 14px rgba(245,185,66,0.55)",
  },

  rightCluster: { display: "flex", alignItems: "center", gap: 8, paddingTop: 4 },
  currencies: { display: "flex", gap: 6 },
  currency: {
    display: "flex",
    alignItems: "center",
    gap: 6,
    padding: "6px 11px",
    borderRadius: 8,
    background: PANEL,
    border: "1px solid rgba(168,85,247,0.28)",
  },
  currencyValue: {
    fontSize: 12,
    fontWeight: 800,
    color: "#efe8ff",
    letterSpacing: 0.4,
  },
  iconButton: {
    width: 36,
    height: 36,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 9,
    background: PANEL,
    border: "1px solid rgba(168,85,247,0.28)",
    cursor: "pointer",
  },

  leftStack: {
    position: "absolute",
    left: 22,
    top: "50%",
    transform: "translateY(-50%)",
    display: "flex",
    flexDirection: "column",
    gap: 9,
    zIndex: 3,
    width: 268,
  },
  card: {
    position: "relative",
    display: "flex",
    alignItems: "center",
    gap: 10,
    padding: "12px 14px",
    background: "linear-gradient(100deg, rgba(16,10,30,0.94), rgba(10,6,20,0.7))",
    border: "1px solid",
    borderRadius: 11,
    cursor: "pointer",
    textAlign: "left",
    overflow: "hidden",
    backdropFilter: "blur(6px)",
  },
  cardGlow: { position: "absolute", inset: 0, pointerEvents: "none" },
  cardText: {
    display: "flex",
    flexDirection: "column",
    gap: 2,
    flex: 1,
    position: "relative",
  },
  cardLabel: {
    fontSize: 16,
    fontWeight: 900,
    letterSpacing: 1.3,
    textTransform: "uppercase",
  },
  cardSub: { fontSize: 11, color: "#9d94b8", fontWeight: 500 },
  cardBadge: {
    background: "#ef4444",
    color: "#fff",
    fontSize: 10,
    fontWeight: 900,
    minWidth: 18,
    height: 18,
    borderRadius: 999,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    position: "relative",
    boxShadow: "0 0 10px rgba(239,68,68,0.7)",
  },

  bottomNav: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    display: "flex",
    justifyContent: "center",
    gap: 5,
    padding: "20px 20px 14px",
    background:
      "linear-gradient(0deg, rgba(5,3,12,0.96) 25%, rgba(5,3,12,0.6) 70%, transparent)",
    zIndex: 3,
  },
  bottomLink: {
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    gap: 5,
    minWidth: 88,
    padding: "9px 12px",
    background: PANEL,
    border: "1px solid rgba(168,85,247,0.26)",
    borderRadius: 10,
    cursor: "pointer",
  },
  bottomIconWrap: { position: "relative", display: "flex" },
  navBadge: {
    position: "absolute",
    top: -6,
    right: -9,
    background: "#ef4444",
    color: "#fff",
    fontSize: 9,
    fontWeight: 900,
    minWidth: 16,
    height: 16,
    borderRadius: 999,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    boxShadow: "0 0 8px rgba(239,68,68,0.7)",
  },
  bottomLabel: {
    fontSize: 10,
    fontWeight: 800,
    letterSpacing: 0.9,
    color: "#cdc3e6",
    textTransform: "uppercase",
  },
};
