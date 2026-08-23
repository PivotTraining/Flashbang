import { COSTUME_ORDER, COSTUMES, type CostumeId, useFighterStyleStore } from "../state/fighterStyleStore";
import { useScreenStore } from "../state/screenStore";

function OutfitCard({ id, selected, onSelect }: { id: CostumeId; selected: boolean; onSelect: () => void }) {
  const c = COSTUMES[id];
  return (
    <button
      type="button"
      onClick={onSelect}
      style={{
        position: "relative",
        minWidth: 0,
        textAlign: "left",
        padding: 12,
        borderRadius: 14,
        border: `1px solid ${selected ? c.accent : "rgba(255,255,255,.14)"}`,
        background: selected
          ? `linear-gradient(145deg, ${c.secondary}88, rgba(7,9,17,.95) 62%)`
          : "linear-gradient(145deg, rgba(20,24,38,.88), rgba(7,9,17,.94))",
        color: "#f6f9ff",
        boxShadow: selected ? `0 0 26px ${c.energy}35, inset 0 0 22px ${c.secondary}45` : "0 10px 24px rgba(0,0,0,.24)",
        cursor: "pointer",
        overflow: "hidden",
      }}
    >
      <span style={{ display: "flex", gap: 8, marginBottom: 9 }}>
        {[c.base, c.secondary, c.accent].map((color) => (
          <span key={color} style={{ width: 18, height: 18, borderRadius: "50%", background: color, border: "1px solid rgba(255,255,255,.22)", boxShadow: `0 0 12px ${color}55` }} />
        ))}
      </span>
      <strong style={{ display: "block", fontSize: 13, letterSpacing: .8, textTransform: "uppercase" }}>{c.name}</strong>
      <span style={{ display: "block", marginTop: 3, fontSize: 9, color: "rgba(221,231,247,.68)", lineHeight: 1.35 }}>{c.subtitle}</span>
      {selected && <span style={{ position: "absolute", right: 10, top: 10, fontSize: 9, fontWeight: 900, letterSpacing: 1, color: c.accent }}>EQUIPPED</span>}
    </button>
  );
}

function FighterPanel({ side }: { side: "player" | "enemy" }) {
  const selected = useFighterStyleStore((s) => side === "player" ? s.playerCostume : s.enemyCostume);
  const setCostume = useFighterStyleStore((s) => side === "player" ? s.setPlayerCostume : s.setEnemyCostume);
  const c = COSTUMES[selected];

  return (
    <section style={{ flex: 1, minWidth: 0, border: `1px solid ${c.accent}35`, background: "rgba(5,8,15,.68)", borderRadius: 18, padding: 16, boxShadow: `inset 0 0 42px ${c.secondary}18` }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12, marginBottom: 12 }}>
        <div>
          <div style={{ fontSize: 10, fontWeight: 900, letterSpacing: 1.5, color: c.accent }}>{side === "player" ? "YOUR FIGHTER" : "RIVAL"}</div>
          <div style={{ fontSize: 23, fontWeight: 950, letterSpacing: 1.5 }}>{side === "player" ? "FLASH" : "CPU FIGHTER"}</div>
        </div>
        <div style={{ width: 62, height: 62, borderRadius: "50%", background: `radial-gradient(circle, ${c.accent} 0 12%, ${c.secondary} 34%, ${c.base} 70%)`, boxShadow: `0 0 28px ${c.energy}66` }} />
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(3, minmax(0, 1fr))", gap: 8 }}>
        {COSTUME_ORDER.map((id) => (
          <OutfitCard key={id} id={id} selected={id === selected} onSelect={() => setCostume(id)} />
        ))}
      </div>
    </section>
  );
}

export default function CostumeSelectScreen() {
  const navigate = useScreenStore((s) => s.navigate);

  return (
    <div style={{ minHeight: "100vh", boxSizing: "border-box", padding: "clamp(16px,3vw,34px)", background: "radial-gradient(circle at 50% 18%, #17213b, #080a12 48%, #03050a)", color: "#f6f9ff", fontFamily: "Inter, system-ui, sans-serif", overflow: "auto" }}>
      <div style={{ maxWidth: 1180, margin: "0 auto" }}>
        <header style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 16, marginBottom: 16 }}>
          <button type="button" onClick={() => navigate("home")} style={{ border: "1px solid rgba(255,255,255,.18)", background: "rgba(8,11,19,.82)", color: "#eaf2ff", padding: "10px 16px", borderRadius: 999, fontSize: 10, fontWeight: 900, letterSpacing: 1.2, cursor: "pointer" }}>← HOME</button>
          <div style={{ textAlign: "center" }}>
            <div style={{ fontSize: 10, letterSpacing: 2.4, color: "#74cfff", fontWeight: 900 }}>VERSUS SETUP</div>
            <h1 style={{ margin: "3px 0 0", fontSize: "clamp(26px,4vw,46px)", fontStyle: "italic", letterSpacing: 2 }}>CHOOSE THE COSTUMES</h1>
            <div style={{ marginTop: 4, color: "rgba(226,235,249,.65)", fontSize: 11 }}>Pick a real in-fight look for both fighters before the round starts.</div>
          </div>
          <div style={{ width: 82 }} />
        </header>

        <div style={{ display: "flex", gap: 14, alignItems: "stretch", flexWrap: "wrap" }}>
          <FighterPanel side="player" />
          <div style={{ alignSelf: "center", fontWeight: 950, fontStyle: "italic", fontSize: 34, color: "rgba(255,255,255,.56)", padding: "0 2px" }}>VS</div>
          <FighterPanel side="enemy" />
        </div>

        <div style={{ display: "flex", justifyContent: "center", marginTop: 18 }}>
          <button type="button" onClick={() => navigate("battle")} style={{ minWidth: 240, padding: "14px 28px", borderRadius: 999, border: "1px solid rgba(112,210,255,.72)", background: "linear-gradient(90deg,#1377d9,#6e50e8)", color: "white", fontSize: 13, fontWeight: 950, fontStyle: "italic", letterSpacing: 1.8, boxShadow: "0 10px 34px rgba(45,140,255,.28)", cursor: "pointer" }}>
            START FIGHT →
          </button>
        </div>
      </div>
    </div>
  );
}
