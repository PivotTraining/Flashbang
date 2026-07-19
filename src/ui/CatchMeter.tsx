import { useBallStore } from "../state/ballStore";
import { DEFAULT_CATCH_CONFIG } from "../systems/catchTiming";

// Curved timing meter, visible only during the catch decision — never
// permanent HUD clutter (handoff doc §11).
export default function CatchMeter() {
  const state = useBallStore((s) => s.state);
  const marker = useBallStore((s) => s.catchMarker);

  if (state !== "CatchWindow") return null;

  const cfg = DEFAULT_CATCH_CONFIG;
  const toPct = (v: number) => `${v * 100}%`;

  return (
    <div style={styles.wrap}>
      <div style={styles.track}>
        <div
          style={{
            ...styles.zone,
            left: toPct(Math.max(0, cfg.greenStart - cfg.yellowPadding)),
            width: toPct(
              Math.min(1, cfg.greenEnd + cfg.yellowPadding) -
                Math.max(0, cfg.greenStart - cfg.yellowPadding),
            ),
            background: "#f4c95d",
          }}
        />
        <div
          style={{
            ...styles.zone,
            left: toPct(cfg.greenStart),
            width: toPct(cfg.greenEnd - cfg.greenStart),
            background: "#3ddc84",
          }}
        />
        <div style={{ ...styles.marker, left: toPct(marker) }} />
      </div>
      <div style={styles.hint}>Tap SPACE to catch</div>
    </div>
  );
}

const styles: Record<string, React.CSSProperties> = {
  wrap: {
    position: "absolute",
    bottom: "18%",
    left: "50%",
    transform: "translateX(-50%)",
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    gap: 8,
    pointerEvents: "none",
  },
  track: {
    position: "relative",
    width: 260,
    height: 14,
    borderRadius: 999,
    background: "rgba(0,0,0,0.55)",
    border: "1px solid rgba(255,255,255,0.6)",
    overflow: "hidden",
  },
  zone: {
    position: "absolute",
    top: 0,
    bottom: 0,
  },
  marker: {
    position: "absolute",
    top: -3,
    width: 4,
    height: 20,
    background: "#fff",
    borderRadius: 2,
    transform: "translateX(-50%)",
    boxShadow: "0 0 6px rgba(255,255,255,0.9)",
  },
  hint: {
    color: "#fff",
    fontSize: 13,
    fontWeight: 600,
    textShadow: "0 1px 3px rgba(0,0,0,0.6)",
  },
};
