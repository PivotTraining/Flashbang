import { useEffect, useRef, useState } from "react";
import { useCombatStore, MAX_CONDITION, type FighterId } from "../combat/combatStore";
import { MOVES } from "../combat/moves";

function ConditionBar({
  value,
  align,
  label,
  accent,
}: {
  value: number;
  align: "left" | "right";
  label: string;
  accent: string;
}) {
  // Lagging "chip" bar drains behind the real value so the size of a hit is
  // visible after the fact — a standard fighting-game read.
  const [chip, setChip] = useState(value);
  useEffect(() => {
    const id = setTimeout(() => setChip(value), 260);
    return () => clearTimeout(id);
  }, [value]);

  const pct = (value / MAX_CONDITION) * 100;
  const chipPct = (Math.max(chip, value) / MAX_CONDITION) * 100;

  return (
    <div style={{ flex: 1, textAlign: align }}>
      <div
        style={{
          fontSize: 11,
          fontWeight: 800,
          letterSpacing: 1.4,
          color: "rgba(255,255,255,0.82)",
          marginBottom: 5,
        }}
      >
        {label}
      </div>
      <div
        style={{
          position: "relative",
          height: 14,
          background: "rgba(0,0,0,0.55)",
          border: "1px solid rgba(255,255,255,0.22)",
          borderRadius: 3,
          overflow: "hidden",
          transform: align === "right" ? "scaleX(-1)" : undefined,
        }}
      >
        <div
          style={{
            position: "absolute",
            inset: 0,
            width: `${chipPct}%`,
            background: "rgba(255,90,90,0.55)",
            transition: "width 420ms ease-out",
          }}
        />
        <div
          style={{
            position: "absolute",
            inset: 0,
            width: `${pct}%`,
            background: `linear-gradient(90deg, ${accent}, ${accent}cc)`,
            boxShadow: `0 0 12px ${accent}99`,
            transition: "width 120ms linear",
          }}
        />
      </div>
    </div>
  );
}

export default function BattleHUD() {
  const player = useCombatStore((s) => s.player);
  const enemy = useCombatStore((s) => s.enemy);
  const combo = useCombatStore((s) => s.combo);
  const lastHit = useCombatStore((s) => s.lastHit);
  const winner = useCombatStore((s) => s.winner);
  const reset = useCombatStore((s) => s.reset);

  // Impact flash tint, keyed off hit id so repeat hits retrigger it.
  const [flash, setFlash] = useState<{ id: number; attacker: FighterId } | null>(null);
  const lastId = useRef(0);
  useEffect(() => {
    if (!lastHit || lastHit.id === lastId.current) return;
    lastId.current = lastHit.id;
    setFlash({ id: lastHit.id, attacker: lastHit.attacker });
    const t = setTimeout(() => setFlash(null), 130);
    return () => clearTimeout(t);
  }, [lastHit]);

  return (
    <>
      {flash && flash.attacker === "enemy" && (
        <div
          style={{
            position: "absolute",
            inset: 0,
            background: "radial-gradient(circle, transparent 45%, rgba(255,40,60,0.5))",
            pointerEvents: "none",
            zIndex: 5,
          }}
        />
      )}

      <div
        style={{
          position: "absolute",
          top: 16,
          left: 0,
          right: 0,
          display: "flex",
          gap: 22,
          padding: "0 26px",
          alignItems: "flex-start",
          pointerEvents: "none",
          zIndex: 4,
        }}
      >
        <ConditionBar value={player.condition} align="left" label="YOU" accent="#4da3ff" />
        <ConditionBar value={enemy.condition} align="right" label="SPARRING BOT" accent="#ff4d6d" />
      </div>

      {combo > 1 && (
        <div
          style={{
            position: "absolute",
            top: 92,
            left: 30,
            fontSize: 34,
            fontWeight: 900,
            fontStyle: "italic",
            color: "#ffd23f",
            textShadow: "0 0 18px rgba(255,210,63,0.7)",
            pointerEvents: "none",
            zIndex: 4,
          }}
        >
          {combo}
          <span style={{ fontSize: 15, marginLeft: 4 }}>HIT</span>
        </div>
      )}

      {lastHit && lastHit.attacker === "player" && (
        <div
          key={lastHit.id}
          style={{
            position: "absolute",
            top: 140,
            left: 30,
            fontSize: 13,
            fontWeight: 800,
            letterSpacing: 1,
            color: lastHit.blocked ? "#8fa3bf" : MOVES[lastHit.moveId].color,
            pointerEvents: "none",
            zIndex: 4,
          }}
        >
          {lastHit.blocked ? "BLOCKED" : MOVES[lastHit.moveId].name.toUpperCase()}
        </div>
      )}

      {winner && (
        <div
          style={{
            position: "absolute",
            inset: 0,
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            background: "rgba(4,2,12,0.72)",
            zIndex: 6,
          }}
        >
          <div
            style={{
              fontSize: 52,
              fontWeight: 900,
              fontStyle: "italic",
              letterSpacing: 2,
              color: winner === "player" ? "#ffd23f" : "#ff4d6d",
              textShadow: "0 0 30px currentColor",
            }}
          >
            {winner === "player" ? "K.O." : "DEFEATED"}
          </div>
          <button
            data-ui
            onClick={reset}
            style={{
              marginTop: 26,
              background: "rgba(255,255,255,0.1)",
              border: "1px solid rgba(255,255,255,0.45)",
              color: "#fff",
              fontSize: 13,
              fontWeight: 800,
              letterSpacing: 1.2,
              padding: "12px 30px",
              borderRadius: 8,
              cursor: "pointer",
            }}
          >
            FIGHT AGAIN
          </button>
        </div>
      )}

      <div
        style={{
          position: "absolute",
          bottom: 16,
          left: 0,
          right: 0,
          textAlign: "center",
          fontSize: 11,
          letterSpacing: 0.8,
          color: "rgba(255,255,255,0.55)",
          pointerEvents: "none",
          zIndex: 4,
        }}
      >
        SWIPE or I/J/K/L to attack · WASD move · SHIFT guard
      </div>
    </>
  );
}
