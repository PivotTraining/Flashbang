import { useEffect, useRef, useState } from "react";
import { useCombatStore, MAX_CONDITION, type FighterId } from "../combat/combatStore";
import { MOVES, type MoveId } from "../combat/moves";
import { clearVirtualMovement, setVirtualMovement } from "../input/useKeyboard";

function ConditionBar({ value, align, label, accent }: { value: number; align: "left" | "right"; label: string; accent: string }) {
  const [chip, setChip] = useState(value);
  useEffect(() => {
    const id = setTimeout(() => setChip(value), 260);
    return () => clearTimeout(id);
  }, [value]);

  const pct = (value / MAX_CONDITION) * 100;
  const chipPct = (Math.max(chip, value) / MAX_CONDITION) * 100;

  return (
    <div style={{ flex: 1, textAlign: align, minWidth: 0 }}>
      <div style={{ display: "flex", justifyContent: align === "left" ? "flex-start" : "flex-end", alignItems: "center", gap: 7, marginBottom: 4 }}>
        <span style={{ fontSize: 10, fontWeight: 950, letterSpacing: 1.5, color: "rgba(244,249,255,.92)", textShadow: `0 0 10px ${accent}66` }}>{label}</span>
        <span style={{ width: 6, height: 6, borderRadius: "50%", background: accent, boxShadow: `0 0 12px ${accent}` }} />
      </div>
      <div style={{ position: "relative", height: 16, padding: 2, background: "rgba(4,6,13,.76)", border: "1px solid rgba(255,255,255,.18)", clipPath: align === "left" ? "polygon(0 0,100% 0,96% 100%,0 100%)" : "polygon(4% 0,100% 0,100% 100%,0 100%)", overflow: "hidden", boxShadow: "0 8px 24px rgba(0,0,0,.28)" }}>
        <div style={{ position: "absolute", top: 2, bottom: 2, left: align === "left" ? 2 : "auto", right: align === "right" ? 2 : "auto", width: `calc(${chipPct}% - 4px)`, background: "rgba(255,80,90,.58)", transition: "width 420ms ease-out", transform: align === "right" ? "scaleX(-1)" : undefined }} />
        <div style={{ position: "absolute", top: 2, bottom: 2, left: align === "left" ? 2 : "auto", right: align === "right" ? 2 : "auto", width: `calc(${pct}% - 4px)`, background: `linear-gradient(90deg, ${accent}, #dff5ff)`, boxShadow: `0 0 16px ${accent}aa`, transition: "width 110ms linear", transform: align === "right" ? "scaleX(-1)" : undefined }} />
      </div>
    </div>
  );
}

const moveButtonBase: React.CSSProperties = {
  position: "absolute",
  width: 42,
  height: 42,
  borderRadius: "50%",
  border: "1px solid rgba(180,218,255,.26)",
  color: "rgba(245,250,255,.94)",
  background: "linear-gradient(145deg, rgba(18,23,39,.8), rgba(5,8,16,.76))",
  display: "grid",
  placeItems: "center",
  fontSize: 18,
  fontWeight: 900,
  boxShadow: "0 6px 18px rgba(0,0,0,.34), inset 0 1px 0 rgba(255,255,255,.08)",
  touchAction: "none",
  userSelect: "none",
  WebkitUserSelect: "none",
};

function AbilityButton({ label, icon, accent, onDown }: { label: string; icon: string; accent: string; onDown: () => void }) {
  return (
    <button
      data-ui
      onPointerDown={onDown}
      style={{
        width: 62,
        height: 62,
        borderRadius: "50%",
        border: `1px solid ${accent}99`,
        background: `radial-gradient(circle at 35% 28%, ${accent}55, rgba(8,10,20,.92) 62%)`,
        color: "white",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        gap: 1,
        boxShadow: `0 8px 22px rgba(0,0,0,.34), 0 0 18px ${accent}35, inset 0 1px 0 rgba(255,255,255,.12)`,
        touchAction: "none",
        userSelect: "none",
        WebkitUserSelect: "none",
      }}
    >
      <span style={{ fontSize: 20, lineHeight: 1, textShadow: `0 0 12px ${accent}` }}>{icon}</span>
      <span style={{ fontSize: 7, lineHeight: 1, fontWeight: 950, letterSpacing: 0.55 }}>{label}</span>
    </button>
  );
}

export default function BattleHUD() {
  const player = useCombatStore((s) => s.player);
  const enemy = useCombatStore((s) => s.enemy);
  const combo = useCombatStore((s) => s.combo);
  const lastHit = useCombatStore((s) => s.lastHit);
  const winner = useCombatStore((s) => s.winner);
  const reset = useCombatStore((s) => s.reset);

  const [flash, setFlash] = useState<{ id: number; attacker: FighterId } | null>(null);
  const lastId = useRef(0);

  useEffect(() => {
    if (!lastHit || lastHit.id === lastId.current) return;
    lastId.current = lastHit.id;
    setFlash({ id: lastHit.id, attacker: lastHit.attacker });
    const t = setTimeout(() => setFlash(null), 130);
    return () => clearTimeout(t);
  }, [lastHit]);

  const attack = (moveId: MoveId) => useCombatStore.getState().tryMove("player", moveId);
  const guard = (on: boolean) => useCombatStore.getState().setGuard("player", on);

  const holdMove = (x: number, z: number) => (e: React.PointerEvent<HTMLButtonElement>) => {
    e.currentTarget.setPointerCapture?.(e.pointerId);
    setVirtualMovement(x, z);
  };
  const releaseMove = () => clearVirtualMovement();

  return (
    <>
      {flash && flash.attacker === "enemy" && (
        <div style={{ position: "absolute", inset: 0, background: "radial-gradient(circle, transparent 42%, rgba(255,36,66,.46))", pointerEvents: "none", zIndex: 5 }} />
      )}

      <div style={{ position: "absolute", top: 15, left: 0, right: 0, display: "flex", gap: "clamp(72px, 18vw, 190px)", padding: "0 clamp(18px, 5vw, 56px)", alignItems: "flex-start", pointerEvents: "none", zIndex: 7 }}>
        <ConditionBar value={player.condition} align="left" label="PLAYER" accent="#4da8ff" />
        <ConditionBar value={enemy.condition} align="right" label="RIVAL" accent="#ff4d72" />
      </div>

      {combo > 1 && (
        <div style={{ position: "absolute", top: 76, left: "clamp(18px, 5vw, 54px)", fontSize: 34, fontWeight: 950, fontStyle: "italic", color: "#ffe56d", textShadow: "0 0 20px rgba(255,211,63,.8)", pointerEvents: "none", zIndex: 7 }}>
          {combo}<span style={{ fontSize: 12, marginLeft: 5, letterSpacing: 1.2 }}>HIT</span>
        </div>
      )}

      {lastHit && lastHit.attacker === "player" && (
        <div key={lastHit.id} style={{ position: "absolute", top: 116, left: "clamp(18px, 5vw, 54px)", fontSize: 10, fontWeight: 900, letterSpacing: 1.2, color: lastHit.blocked ? "#9cafc8" : MOVES[lastHit.moveId].color, textShadow: "0 0 14px currentColor", pointerEvents: "none", zIndex: 7 }}>
          {lastHit.blocked ? "BLOCKED" : MOVES[lastHit.moveId].name.toUpperCase()}
        </div>
      )}

      <div data-ui style={{ position: "absolute", left: "max(14px, env(safe-area-inset-left))", bottom: "max(14px, env(safe-area-inset-bottom))", width: 138, height: 138, borderRadius: "50%", background: "radial-gradient(circle, rgba(20,28,47,.48), rgba(4,7,15,.22) 64%, transparent 66%)", border: "1px solid rgba(126,187,255,.14)", boxShadow: "0 12px 38px rgba(0,0,0,.25), inset 0 0 26px rgba(74,148,255,.08)", zIndex: 9 }}>
        <div style={{ position: "absolute", left: 49, top: 49, width: 40, height: 40, borderRadius: "50%", background: "radial-gradient(circle at 35% 30%, rgba(132,195,255,.3), rgba(8,12,22,.82))", border: "1px solid rgba(151,204,255,.22)", boxShadow: "0 0 18px rgba(82,160,255,.16)" }} />
        <button data-ui aria-label="Move forward" style={{ ...moveButtonBase, left: 48, top: 0 }} onPointerDown={holdMove(0, -1)} onPointerUp={releaseMove} onPointerCancel={releaseMove} onPointerLeave={releaseMove}>↑</button>
        <button data-ui aria-label="Move left" style={{ ...moveButtonBase, left: 0, top: 48 }} onPointerDown={holdMove(-1, 0)} onPointerUp={releaseMove} onPointerCancel={releaseMove} onPointerLeave={releaseMove}>←</button>
        <button data-ui aria-label="Move right" style={{ ...moveButtonBase, right: 0, top: 48 }} onPointerDown={holdMove(1, 0)} onPointerUp={releaseMove} onPointerCancel={releaseMove} onPointerLeave={releaseMove}>→</button>
        <button data-ui aria-label="Move back" style={{ ...moveButtonBase, left: 48, bottom: 0 }} onPointerDown={holdMove(0, 1)} onPointerUp={releaseMove} onPointerCancel={releaseMove} onPointerLeave={releaseMove}>↓</button>
      </div>

      <div data-ui style={{ position: "absolute", right: "max(14px, env(safe-area-inset-right))", bottom: "max(12px, env(safe-area-inset-bottom))", display: "grid", gridTemplateColumns: "repeat(3, 62px)", gap: 8, alignItems: "center", justifyItems: "center", zIndex: 9 }}>
        <AbilityButton label="PUNCH" icon="✊" accent="#4aa7ff" onDown={() => attack("punch")} />
        <AbilityButton label="ROUND" icon="◒" accent="#38c4ff" onDown={() => attack("roundKick")} />
        <AbilityButton label="SPIN" icon="↻" accent="#8c68ff" onDown={() => attack("spinKick")} />
        <AbilityButton label="UP KICK" icon="↥" accent="#ffae4c" onDown={() => attack("risingKick")} />
        <AbilityButton label="SWEEP" icon="⌁" accent="#ff4f98" onDown={() => attack("legSweep")} />
        <AbilityButton label="POWER" icon="✦" accent="#a45dff" onDown={() => attack("ballThrow")} />
        <button
          data-ui
          onPointerDown={() => guard(true)}
          onPointerUp={() => guard(false)}
          onPointerCancel={() => guard(false)}
          onPointerLeave={() => guard(false)}
          style={{
            gridColumn: "1 / span 3",
            width: 154,
            height: 35,
            borderRadius: 999,
            border: `1px solid ${player.guarding ? "rgba(100,255,180,.85)" : "rgba(116,213,164,.38)"}`,
            background: player.guarding ? "linear-gradient(90deg, rgba(37,146,89,.9), rgba(35,192,119,.8))" : "linear-gradient(90deg, rgba(15,48,37,.9), rgba(11,73,49,.8))",
            color: "white",
            fontSize: 8,
            fontWeight: 950,
            letterSpacing: 1.4,
            boxShadow: player.guarding ? "0 0 22px rgba(70,255,155,.28)" : "0 8px 18px rgba(0,0,0,.25)",
            touchAction: "none",
          }}
        >
          ◇ HOLD GUARD
        </button>
      </div>

      {winner && (
        <div style={{ position: "absolute", inset: 0, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", background: "radial-gradient(circle, rgba(17,13,31,.58), rgba(3,4,10,.9))", backdropFilter: "blur(8px)", zIndex: 20 }}>
          <div style={{ fontSize: "clamp(48px, 10vw, 86px)", fontWeight: 950, fontStyle: "italic", letterSpacing: 3, color: winner === "player" ? "#ffe76a" : "#ff5478", textShadow: "0 0 36px currentColor" }}>{winner === "player" ? "K.O." : "DEFEATED"}</div>
          <button data-ui onClick={reset} style={{ marginTop: 24, background: "linear-gradient(180deg, rgba(255,255,255,.14), rgba(255,255,255,.06))", border: "1px solid rgba(255,255,255,.34)", color: "#fff", fontSize: 10, fontWeight: 900, letterSpacing: 1.4, padding: "11px 28px", borderRadius: 999, cursor: "pointer" }}>FIGHT AGAIN</button>
        </div>
      )}
    </>
  );
}
