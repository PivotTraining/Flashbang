import { useEffect, useState } from "react";
import { useBallStore } from "../state/ballStore";
import CatchMeter from "./CatchMeter";

// Minimal HUD only — no health bars, damage numbers, portraits, or ability
// buttons during normal play (handoff doc §4, LOCKED).
export default function HUD() {
  const state = useBallStore((s) => s.state);
  const lastResult = useBallStore((s) => s.lastResult);
  const throwCount = useBallStore((s) => s.throwCount);
  const [resultFlash, setResultFlash] = useState<string | null>(null);

  useEffect(() => {
    if (!lastResult) return;
    setResultFlash(lastResult);
    const t = setTimeout(() => setResultFlash(null), 900);
    return () => clearTimeout(t);
  }, [lastResult]);

  const instruction =
    state === "Held"
      ? "WASD to move · drag mouse to look · SPACE to throw"
      : state === "CatchWindow"
        ? "Your turn. Catch the ball."
        : state === "Loose"
          ? "Missed — resetting…"
          : "";

  return (
    <div style={{ position: "absolute", inset: 0, pointerEvents: "none" }}>
      <div style={topBar}>
        <span style={title}>FLASH BANG — Training</span>
        <span style={counter}>Catches: {throwCount}</span>
      </div>

      {instruction && <div style={instructionStyle}>{instruction}</div>}

      {resultFlash && (
        <div style={{ ...resultStyle, color: resultColor(resultFlash) }}>
          {resultFlash.toUpperCase()}
        </div>
      )}

      <CatchMeter />
    </div>
  );
}

function resultColor(result: string) {
  if (result === "Perfect") return "#3ddc84";
  if (result === "Risk") return "#f4c95d";
  return "#ff5d5d";
}

const topBar: React.CSSProperties = {
  position: "absolute",
  top: 0,
  left: 0,
  right: 0,
  display: "flex",
  justifyContent: "space-between",
  padding: "14px 20px",
  color: "#fff",
  textShadow: "0 1px 3px rgba(0,0,0,0.6)",
  fontSize: 14,
  fontWeight: 600,
  letterSpacing: 0.5,
};

const title: React.CSSProperties = { opacity: 0.9 };
const counter: React.CSSProperties = { opacity: 0.75 };

const instructionStyle: React.CSSProperties = {
  position: "absolute",
  bottom: "8%",
  left: "50%",
  transform: "translateX(-50%)",
  color: "#fff",
  fontSize: 15,
  fontWeight: 500,
  textShadow: "0 1px 3px rgba(0,0,0,0.6)",
};

const resultStyle: React.CSSProperties = {
  position: "absolute",
  top: "38%",
  left: "50%",
  transform: "translateX(-50%)",
  fontSize: 34,
  fontWeight: 800,
  letterSpacing: 1,
  textShadow: "0 2px 6px rgba(0,0,0,0.6)",
};
