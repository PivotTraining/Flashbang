import { useScreenStore, type Screen } from "../state/screenStore";

const STUB_COPY: Partial<Record<Screen, { title: string; note: string }>> = {
  play: { title: "Play", note: "Quick Play matchmaking arrives in a later pass. Train while you wait." },
  ranked: { title: "Ranked Arena", note: "Ranked battles unlock after the combat slice is complete." },
  story: { title: "Story Mode", note: "The mysterious ball. Flashy. The Key Holder. Coming in a later pass." },
  events: { title: "Events", note: "Limited-time events arrive after the core loop is proven." },
  career: { title: "My Career", note: "Create your legend — career mode is the next major build." },
  study: { title: "Study", note: "The giant legendary book of moves opens in a later pass." },
  characters: { title: "Characters", note: "Balls, Powers, Moves, Suits, and Voice collections coming soon." },
  settings: { title: "Settings", note: "Audio, subtitles, and accessibility options coming soon." },
  friends: { title: "Friends", note: "Friends and social features arrive with online play." },
  shop: { title: "Legendary Shop", note: "Earn coins in battle first. The shop opens later." },
  powers: { title: "Powers", note: "Create and combine powers in a later pass." },
  ball: { title: "Ball", note: "Fire, Ice, Shadow, Lightning, Cosmic… collection coming soon." },
  dragons: { title: "Dragons", note: "Summons and finishers arrive with the cinematic pass." },
  loadout: { title: "Loadout", note: "Equip moves and gear once the collection exists." },
  achievements: { title: "Achievements", note: "Milestones tracking coming soon." },
  missions: { title: "Missions", note: "Sponsor and story missions arrive with career mode." },
  leaderboard: { title: "Leaderboard", note: "Rankings arrive with online play." },
};

export default function StubScreen({ screen }: { screen: Screen }) {
  const navigate = useScreenStore((s) => s.navigate);
  const copy = STUB_COPY[screen] ?? { title: screen, note: "Coming soon." };

  return (
    <div style={styles.root}>
      <h1 style={styles.title}>{copy.title}</h1>
      <p style={styles.note}>{copy.note}</p>
      <button style={styles.back} onClick={() => navigate("home")}>
        ← Back to Home
      </button>
    </div>
  );
}

const styles: Record<string, React.CSSProperties> = {
  root: {
    width: "100vw",
    height: "100vh",
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
    gap: 14,
    background:
      "radial-gradient(ellipse at 50% 30%, #1a1030 0%, #0b0716 55%, #07040e 100%)",
    color: "#e9e4f5",
  },
  title: {
    fontSize: 42,
    fontWeight: 900,
    letterSpacing: 3,
    textTransform: "uppercase",
    color: "#c9a6ff",
    textShadow: "0 0 18px rgba(138,59,255,0.6)",
    margin: 0,
  },
  note: { fontSize: 15, color: "#9d94b8", maxWidth: 420, textAlign: "center" },
  back: {
    marginTop: 10,
    background: "rgba(20,13,36,0.9)",
    border: "1px solid rgba(138,59,255,0.45)",
    color: "#cdc3e6",
    fontSize: 13,
    fontWeight: 700,
    letterSpacing: 0.8,
    padding: "11px 22px",
    borderRadius: 8,
    cursor: "pointer",
  },
};
