import React, { useState } from "react";
import "./App.css";


/**
 * Orbitals Writing System
 * Glyph Generator v0.1
 * ----------------------
 */

/* ────────── constants ────────── */
const ALPHABET = "ABCDEFGHIJKLMNOPQRSTUVWXYZ".split("");
const TWO_PI = Math.PI * 2;
const WHEEL_OFFSET = 0; // A at 12 o’clock
const LEAD_IN_PX = 7; // radial gap after start‑dot
const RING_MARGIN_PX = 15; // space between letters and labels
const PAL_SPLIT = 1; // no radial split; leaf shape via perpendicular bow   // radius offset for palindrome halves
const STROKE_OUT = 0;
const STROKE_IN = 2;
const RADIAL_FACTOR = 0.8;
const PULL_FACTOR = 0.4;

/* ────────── helpers ────────── */
const angleOf = (ch) => {
  const idx = ALPHABET.indexOf(ch.toUpperCase());
  if (idx === -1) return null;
  return Math.PI / 2 - ((idx + WHEEL_OFFSET) * TWO_PI) / 26;
};
const polarToXY = (a, r, c) => ({ x: c + r * Math.cos(a), y: c - r * Math.sin(a) });
const isPerfectPalindrome = (w) => {
  const s = w.toUpperCase().replace(/[^A-Z]/g, "");
  return s && s === [...s].reverse().join("") && s[0] === s[s.length - 1];
};

/* ────────── build glyph ────────── */
function buildGlyph(word, wheelR, C) {
  const pal = isPerfectPalindrome(word);
  const baseR = wheelR - RING_MARGIN_PX;
  const letters = (word || "").toUpperCase().replace(/[^A-Z]/g, "").split("");
  if (!letters.length) return { d: "", dot: null, rings: [] };

  const pts = [], rings = [];
  const half = Math.floor((letters.length - 1) / 2);

  letters.forEach((ch, i) => {
    const ang = angleOf(ch); if (ang == null) return;
    let r = baseR;
    if (pal) r += i <= half ? PAL_SPLIT : -PAL_SPLIT;
    const p = polarToXY(ang, r, C);
    (i > 0 && ch === letters[i - 1]) ? rings.push(p) : pts.push({ ...p, ang });
  });

  /* store exact letter position for dot */
  const dot = { ...pts[0] };

  /* lead‑in: radial inward only */
  const v = { x: C - pts[0].x, y: C - pts[0].y };
  const len = Math.hypot(v.x, v.y) || 1;
  pts[0].x += (v.x / len) * LEAD_IN_PX;
  pts[0].y += (v.y / len) * LEAD_IN_PX;

  let d = `M ${pts[0].x.toFixed(2)} ${pts[0].y.toFixed(2)}`;
  for (let i = 1; i < pts.length; i++) {
    const A = pts[i - 1], B = pts[i];

    let ctrl;
    if (pal) {
      /* perpendicular leaf‑style control point */
      const seg = { x: B.x - A.x, y: B.y - A.y };
      const segLen = Math.hypot(seg.x, seg.y) || 1;
      const perp = { x: seg.y / segLen, y: -seg.x / segLen };
      const sign = i - 1 <= half ? -1 : 1; // outward left then right
      const factor = baseR * 0.3; // flare strength independent of split
      ctrl = { x: (A.x + B.x) / 2 + perp.x * factor * sign, y: (A.y + B.y) / 2 + perp.y * factor * sign };
    } else {
      /* radial‑then‑pull rule */
      const mid = { x: (A.x + B.x) / 2, y: (A.y + B.y) / 2 };
      const toC = { x: C - mid.x, y: C - mid.y };
      const ctrl1 = { x: mid.x + toC.x * RADIAL_FACTOR, y: mid.y + toC.y * RADIAL_FACTOR };
      ctrl = { x: ctrl1.x + (B.x - ctrl1.x) * PULL_FACTOR, y: ctrl1.y + (B.y - ctrl1.y) * PULL_FACTOR };
    }

    d += ` Q ${ctrl.x.toFixed(2)} ${ctrl.y.toFixed(2)} ${B.x.toFixed(2)} ${B.y.toFixed(2)}`;
  }
  return { d, dot, rings };
}

/* ────────── Glyph component ────────── */
function Glyph({ word, size = 170, wheelRadius = 80, showWheel = true, showGlyphCaption = true }) {
  const C = size / 2;
  const { d, dot, rings } = buildGlyph(word, wheelRadius, C);

  return (
    <figure className="Glyph">
      <svg viewBox={`0 0 ${size} ${size}`} width={size} height={size} className="rounded bg-white">
        {showWheel && ALPHABET.map((l) => {
          const p = polarToXY(angleOf(l), wheelRadius, C);
          return <text key={l} x={p.x} y={p.y} fontSize="8" textAnchor="middle" alignmentBaseline="middle" fill="#bbb">{l}</text>;
        })}
        <path d={d} stroke="black" strokeWidth={STROKE_OUT} strokeOpacity="0.25" fill="none" strokeLinecap="round" strokeLinejoin="round" />
        <path d={d} stroke="black" strokeWidth={STROKE_IN} fill="none" strokeLinecap="round" strokeLinejoin="round" />
        {dot && <circle cx={dot.x} cy={dot.y} r="3" fill="black" />}
        {rings.map((p, i) => <circle key={i} cx={p.x} cy={p.y} r="4.5" fill="none" stroke="black" strokeWidth="2" />)}
      </svg>
      {showGlyphCaption && <figcaption>{word}</figcaption>}
    </figure>
  );
}

/* ────────── App component ────────── */
function App() {
  const [input, setInput] = useState("HELLO SUN EARTH LOVE");
  const [showWheel, setShowWheel] = useState(true);
  const [showGlyphCaption, setShowGlyphCaption] = useState(true);
  const words = input.split(/\s+/).map((w) => w.trim()).filter(Boolean);
  return (
    <div className="App">
      <div className="GlyphGenerator">
        <h1>Orbitals</h1>
        <p>A playful visual writing & information-encoding system that turns any word into a flowing glyph orbiting an alphabet wheel.<br/></p>
        <textarea value={input} placeholder="Type words separated by whitespace…" onChange={(e) => setInput(e.target.value)} />
          <div className="Controls">
            <label><input type="checkbox" checked={showWheel} onChange={(e) => setShowWheel(e.target.checked)} /> Show alphabet wheel</label>
            <label><input type="checkbox" checked={showGlyphCaption} onChange={(e) => setShowGlyphCaption(e.target.checked)} /> Show caption</label>
          </div>
        <div className="GlyphContainer">
          {words.map((w) => <Glyph key={w} word={w} showWheel={showWheel} showGlyphCaption={showGlyphCaption} />)}
        </div>
      </div>
    </div>
  )
}

export default App;