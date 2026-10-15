import { useEffect, useRef } from 'react';
import type { FxKind } from '../lib/miniNicheCore';

// Efeito animado próprio de cada ramo, desenhado num <canvas> por cima do fundo da capa
// (e por baixo do texto). Leve de propósito:
// - só anima enquanto a capa aparece na tela e a aba está aberta;
// - densidade de pixels limitada e menos partículas nas miniaturas (que rodam a 30 quadros);
// - com "reduzir movimento", desenha um quadro parado;
// - reage ao toque (estourar bolhas, limpar o vidro, faíscas...), sem atrapalhar os botões.

export type FxColors = { bg: string; ink: string; accent: string; accent2: string; fx1: string; fx2: string; fx3: string };
type Env = { w: number; h: number; dark: boolean; thumb: boolean; k: number; c: FxColors };
type Scene = {
  step(dt: number, t: number): void;
  draw(g: CanvasRenderingContext2D, t: number): void;
  tap?(x: number, y: number): void;
  move?(x: number, y: number, vx: number, vy: number): void;
};

// ---------- utilidades ----------
const TAU = Math.PI * 2;
const rnd = (a: number, b: number) => a + Math.random() * (b - a);
const pick = <T,>(a: T[]) => a[Math.floor(Math.random() * a.length)];
const clamp = (v: number, a: number, b: number) => Math.max(a, Math.min(b, v));
function rgb(c: string): [number, number, number] {
  let s = (c || '#888888').replace('#', '');
  if (s.length === 3) s = s.split('').map(x => x + x).join('');
  const v = parseInt(s.slice(0, 6), 16) || 0;
  return [(v >> 16) & 255, (v >> 8) & 255, v & 255];
}
const rgba = (c: string, a: number) => { const [r, g, b] = rgb(c); return `rgba(${r},${g},${b},${clamp(a, 0, 1).toFixed(3)})`; };
function mix(a: string, b: string, t: number) {
  const A = rgb(a), B = rgb(b);
  return '#' + A.map((x, i) => Math.round(x + (B[i] - x) * t).toString(16).padStart(2, '0')).join('');
}
const lum = (c: string) => { const [r, g, b] = rgb(c).map(v => v / 255); return 0.2126 * r + 0.7152 * g + 0.0722 * b; };

function leafPath(g: CanvasRenderingContext2D, s: number) {
  g.beginPath(); g.moveTo(-s, 0); g.quadraticCurveTo(0, -s * 0.62, s, 0); g.quadraticCurveTo(0, s * 0.62, -s, 0); g.closePath();
}
function starPath(g: CanvasRenderingContext2D, x: number, y: number, s: number, inner = 0.24) {
  g.beginPath();
  for (let i = 0; i < 8; i++) { const a = i * Math.PI / 4 - Math.PI / 2, r = i % 2 ? s * inner : s; g.lineTo(x + Math.cos(a) * r, y + Math.sin(a) * r); }
  g.closePath();
}
function heartPath(g: CanvasRenderingContext2D, s: number) {
  g.beginPath(); g.moveTo(0, s * 0.35);
  g.bezierCurveTo(-s * 1.1, -s * 0.35, -s * 0.45, -s * 1.05, 0, -s * 0.45);
  g.bezierCurveTo(s * 0.45, -s * 1.05, s * 1.1, -s * 0.35, 0, s * 0.35); g.closePath();
}
function pawPath(g: CanvasRenderingContext2D, s: number) {
  g.beginPath(); g.ellipse(0, s * 0.32, s * 0.55, s * 0.45, 0, 0, TAU);
  for (const [x, y] of [[-0.58, -0.22], [-0.2, -0.52], [0.2, -0.52], [0.58, -0.22]]) { g.moveTo(x * s + s * 0.17, y * s); g.ellipse(x * s, y * s, s * 0.17, s * 0.22, 0, 0, TAU); }
}

// Folhas, grãos, pétalas e glitter caindo: partícula genérica.
type Fall = { x: number; y: number; vx: number; vy: number; rot: number; vr: number; ph: number; vph: number; s: number; col: string; kind: number; tv?: number };
function fallers(e: Env, count: number, make: (top: boolean) => Fall) {
  // tv: velocidade de queda "normal"; o que foi jogado para cima volta a cair com gravidade.
  const mk = (top: boolean) => { const p = make(top); p.tv ??= p.vy; return p; };
  const list: Fall[] = [];
  for (let i = 0; i < count; i++) list.push(mk(false));
  return {
    list,
    step(dt: number, t: number, sway = 12, settle = 1.6) {
      for (let i = 0; i < list.length; i++) {
        const p = list[i], tv = p.tv ?? 30;
        if (p.vy < tv) p.vy = Math.min(tv, p.vy + 340 * dt); else p.vy += (tv - p.vy) * Math.min(1, dt * 2);
        p.x += (p.vx + Math.sin(t * 1.2 + p.ph * 3) * sway) * dt; p.y += p.vy * dt; p.rot += p.vr * dt; p.ph += p.vph * dt;
        p.vx *= Math.pow(0.4, dt * settle);
        if (p.y > e.h + 24 || p.y < -120 || p.x < -40 || p.x > e.w + 40) list[i] = mk(true);
      }
    },
    push(x: number, y: number, vx: number, vy: number, radius = 110) {
      for (const p of list) {
        const d = Math.hypot(p.x - x, p.y - y);
        if (d < radius) { const f = 1 - d / radius; p.vx = clamp(p.vx + vx * 0.45 * f, -420, 420); p.y += vy * 0.02 * f; p.vr += (Math.random() - 0.5) * 6 * f; }
      }
    },
  };
}

// ---------- os 20 efeitos ----------
const SCENES: Record<FxKind, (e: Env) => Scene> = {
  // Pizzaria: vapor quente subindo do forno; o toque solta uma baforada.
  vapor(e) {
    type P = { x: number; y: number; r: number; vx: number; vy: number; life: number; max: number; s: number };
    const N = Math.round(14 * e.k);
    const make = (x = rnd(0, e.w), y = e.h + rnd(0, 30), burst = false): P => ({ x, y, r: rnd(18, 30), vx: burst ? rnd(-40, 40) : 0, vy: rnd(16, 30) * (burst ? 1.8 : 1), life: 0, max: rnd(5, 8), s: rnd(0, 99) });
    const ps: P[] = [];
    for (let i = 0; i < N; i++) { const p = make(); p.life = rnd(0, p.max); p.y = e.h * rnd(0.3, 1.05) - p.vy * p.life * 0.3; p.r += p.life * 7; ps.push(p); }
    // A capa é alta: parte do vapor nasce no meio dela, para aparecer logo de cara.
    const respawn = () => { const p = make(rnd(0, e.w), e.h * rnd(0.35, 1.05)); return p; };
    const col = mix(e.c.ink, '#ffffff', 0.55);
    return {
      step(dt, t) {
        for (let i = ps.length - 1; i >= 0; i--) {
          const p = ps[i]; p.life += dt; p.y -= p.vy * dt; p.x += (Math.sin(t * 0.7 + p.s) * 10 + p.vx) * dt; p.vx *= Math.pow(0.3, dt); p.r += dt * 7;
          if (p.life > p.max) { if (ps.length > N) ps.splice(i, 1); else ps[i] = respawn(); }
        }
      },
      draw(g, t) {
        g.globalCompositeOperation = e.dark ? 'screen' : 'source-over';
        for (const p of ps) {
          const a = Math.sin(Math.PI * p.life / p.max) * (e.dark ? 0.2 : 0.2);
          for (let j = 0; j < 3; j++) {
            const x = p.x + Math.sin(p.s + j * 2.1 + t * 0.5) * p.r * 0.35, y = p.y - j * p.r * 0.32;
            const gr = g.createRadialGradient(x, y, 0, x, y, p.r);
            gr.addColorStop(0, rgba(col, a)); gr.addColorStop(1, rgba(col, 0));
            g.fillStyle = gr; g.beginPath(); g.arc(x, y, p.r, 0, TAU); g.fill();
          }
        }
      },
      tap(x, y) { for (let i = 0; i < 5; i++) ps.push(make(x + rnd(-14, 14), y, true)); if (ps.length > N * 3) ps.splice(0, ps.length - N * 3); },
    };
  },

  // Restaurante: ervas e pimenta caindo; arrastar o dedo faz vento.
  temperos(e) {
    const greens = ['#5fa83f', '#79be52', '#8f9a3c'], grains = ['#d9472b', '#f2b705', mix(e.c.accent, '#ffffff', 0.2)];
    const make = (top: boolean): Fall => {
      const leaf = Math.random() < 0.55;
      return { x: rnd(0, e.w), y: top ? rnd(-60, -8) : rnd(0, e.h), vx: 0, vy: leaf ? rnd(20, 38) : rnd(34, 60), rot: rnd(0, TAU), vr: rnd(-2, 2), ph: rnd(0, TAU), vph: rnd(2, 5), s: leaf ? rnd(7, 12) : rnd(1.6, 3), col: leaf ? pick(greens) : pick(grains), kind: leaf ? 0 : 1 };
    };
    const f = fallers(e, Math.round(34 * e.k), make);
    return {
      step(dt, t) { f.step(dt, t, 14); },
      draw(g) {
        for (const p of f.list) {
          g.save(); g.translate(p.x, p.y); g.rotate(p.rot);
          if (p.kind === 0) {
            g.scale(1, 0.35 + 0.65 * Math.abs(Math.cos(p.ph)));
            leafPath(g, p.s); g.fillStyle = p.col; g.fill();
            g.strokeStyle = rgba('#1d3a12', 0.45); g.lineWidth = 0.8; g.beginPath(); g.moveTo(-p.s * 0.8, 0); g.lineTo(p.s * 0.8, 0); g.stroke();
          } else { g.fillStyle = p.col; g.beginPath(); g.ellipse(0, 0, p.s * 1.3, p.s, 0, 0, TAU); g.fill(); }
          g.restore();
        }
      },
      move(x, y, vx, vy) { f.push(x, y, vx, vy); },
      tap(x, y) { f.push(x, y, rnd(-500, 500), -300, 90); },
    };
  },

  // Cafeteria: grãos de café girando no ar; o toque joga os grãos para cima.
  graos(e) {
    const make = (top: boolean): Fall => ({ x: rnd(0, e.w), y: top ? rnd(-60, -10) : rnd(0, e.h), vx: 0, vy: rnd(26, 44), rot: rnd(0, TAU), vr: rnd(-1.2, 1.2), ph: rnd(0, TAU), vph: rnd(1.5, 3.5), s: rnd(8, 13), col: '', kind: 0 });
    const f = fallers(e, Math.round(16 * e.k), make);
    const light = mix('#8a5634', e.c.accent, 0.25), dark = '#3b2014';
    return {
      step(dt, t) { f.step(dt, t, 7); },
      draw(g) {
        for (const p of f.list) {
          const c = Math.cos(p.ph), sx = Math.max(0.22, Math.abs(c));
          g.save(); g.translate(p.x, p.y); g.rotate(p.rot); g.scale(sx, 1);
          const gr = g.createLinearGradient(-p.s, 0, p.s, 0); gr.addColorStop(0, light); gr.addColorStop(1, dark);
          g.fillStyle = gr; g.beginPath(); g.ellipse(0, 0, p.s * 0.74, p.s, 0, 0, TAU); g.fill();
          if (c > 0) { g.strokeStyle = '#1e0d06'; g.lineWidth = 1.3 / sx; g.beginPath(); g.moveTo(0, -p.s * 0.82); g.bezierCurveTo(-p.s * 0.38, -p.s * 0.28, p.s * 0.38, p.s * 0.28, 0, p.s * 0.82); g.stroke(); }
          g.fillStyle = rgba('#ffffff', 0.16); g.beginPath(); g.ellipse(-p.s * 0.3, -p.s * 0.42, p.s * 0.18, p.s * 0.3, 0, 0, TAU); g.fill();
          g.restore();
        }
      },
      move(x, y, vx, vy) { f.push(x, y, vx, vy, 80); },
      tap(x, y) {
        for (const p of f.list) { const d = Math.hypot(p.x - x, p.y - y); if (d < 120) { p.vy = -rnd(140, 240); p.vx = (p.x - x) * 3 + rnd(-60, 60); p.vr = rnd(-8, 8); } }
      },
    };
  },

  // Açaí e doces: calda escorrendo do topo, gotas pingando e granulado colorido.
  gotas(e) {
    const acai = mix(e.c.accent, '#3b0a45', 0.45);
    const cols = [acai, e.c.accent, mix(e.c.accent2, e.c.accent, 0.15)];
    type D = { x: number; w: number; len: number; max: number; sp: number; col: string; drop: { y: number; vy: number; r: number } | null };
    const drips: D[] = [];
    const newDrip = (x = rnd(10, e.w - 10)): D => ({ x, w: rnd(9, 15), len: rnd(6, 30), max: rnd(40, Math.max(60, e.h * 0.32)), sp: rnd(8, 20), col: pick(cols), drop: null });
    const count = Math.max(4, Math.round(e.w / 72));
    for (let i = 0; i < count; i++) drips.push(newDrip((i + 0.5) * e.w / count + rnd(-14, 14)));
    const sprinkle = ['#ff5a8a', '#ffd84d', '#2ec4b6', '#ffffff', e.c.accent];
    const makeS = (top: boolean): Fall => ({ x: rnd(0, e.w), y: top ? rnd(10, 30) : rnd(20, e.h), vx: 0, vy: rnd(18, 34), rot: rnd(0, TAU), vr: rnd(-3, 3), ph: 0, vph: 0, s: rnd(4, 7), col: pick(sprinkle), kind: 0 });
    const s = fallers(e, Math.round(22 * e.k), makeS);
    const band = (x: number, t: number) => 9 + Math.sin(x * 0.03 + t * 0.6) * 3 + Math.sin(x * 0.011 - t * 0.4) * 3;
    return {
      step(dt, t) {
        for (const d of drips) {
          d.len += d.sp * dt * (0.55 + 0.45 * Math.sin(t + d.x));
          if (d.len > d.max && !d.drop) { d.drop = { y: d.len + d.w * 0.5, vy: 40, r: d.w * 0.5 }; d.len = rnd(4, 12); d.max = rnd(40, Math.max(60, e.h * 0.32)); }
          if (d.drop) { d.drop.vy += 620 * dt; d.drop.y += d.drop.vy * dt; if (d.drop.y > e.h + 20) d.drop = null; }
        }
        s.step(dt, t, 6);
      },
      draw(g, t) {
        g.fillStyle = acai; g.beginPath(); g.moveTo(0, 0);
        for (let x = 0; x <= e.w + 8; x += 8) g.lineTo(x, band(x, t));
        g.lineTo(e.w, 0); g.closePath(); g.fill();
        for (const d of drips) {
          const top = band(d.x, t) - 2, hw = d.w * 0.34;
          const head = Math.max(top + 10, d.len);
          g.fillStyle = d.col; g.beginPath();
          g.moveTo(d.x - hw * 2, top); g.quadraticCurveTo(d.x - hw, top + 4, d.x - hw, top + 10);
          g.lineTo(d.x - hw, head); g.lineTo(d.x + hw, head);
          g.lineTo(d.x + hw, top + 10); g.quadraticCurveTo(d.x + hw, top + 4, d.x + hw * 2, top); g.closePath(); g.fill();
          g.beginPath(); g.arc(d.x, head + d.w * 0.12, d.w * 0.5, 0, TAU); g.fill();
          g.strokeStyle = rgba('#ffffff', 0.38); g.lineWidth = 1.6; g.lineCap = 'round';
          g.beginPath(); g.moveTo(d.x - hw * 0.45, top + 12); g.lineTo(d.x - hw * 0.45, head); g.stroke();
          g.fillStyle = rgba('#ffffff', 0.4); g.beginPath(); g.arc(d.x - d.w * 0.18, head, d.w * 0.12, 0, TAU); g.fill();
          if (d.drop) {
            g.fillStyle = d.col; g.beginPath(); g.ellipse(d.x, d.drop.y, d.drop.r * 0.85, d.drop.r * 1.15, 0, 0, TAU); g.fill();
            g.fillStyle = rgba('#ffffff', 0.45); g.beginPath(); g.arc(d.x - d.drop.r * 0.3, d.drop.y - d.drop.r * 0.35, d.drop.r * 0.25, 0, TAU); g.fill();
          }
        }
        g.lineCap = 'round'; g.lineWidth = 2.6;
        for (const p of s.list) {
          g.strokeStyle = p.col === '#ffffff' && !e.dark ? rgba(e.c.ink, 0.25) : p.col;
          const dx = Math.cos(p.rot) * p.s * 0.5, dy = Math.sin(p.rot) * p.s * 0.5;
          g.beginPath(); g.moveTo(p.x - dx, p.y - dy); g.lineTo(p.x + dx, p.y + dy); g.stroke();
        }
      },
      tap(x, y) {
        let near = drips[0];
        for (const d of drips) if (Math.abs(d.x - x) < Math.abs(near.x - x)) near = d;
        if (Math.abs(near.x - x) > 40 && drips.length < 12) { const d = newDrip(x); d.len = Math.min(y, e.h * 0.3); drips.push(d); }
        else near.len = near.max + 1;
        for (let i = 0; i < 8; i++) s.list.push({ ...makeS(false), x: x + rnd(-10, 10), y, vy: rnd(-80, 20), vx: rnd(-160, 160) });
        if (s.list.length > 60) s.list.splice(0, s.list.length - 60);
      },
    };
  },

  // Adega: bolhas de espumante subindo em fios; o toque abre uma garrafa.
  espumante(e) {
    type B = { x: number; y: number; r: number; vy: number; ph: number; vx: number };
    const bs: B[] = [];
    const streams = Array.from({ length: Math.max(3, Math.round(e.w / 85)) }, () => ({ x: rnd(16, e.w - 16), acc: 0, rate: rnd(3, 6) }));
    const cap = Math.round(150 * e.k);
    const col = e.dark ? mix(e.c.accent, '#ffffff', 0.25) : e.c.accent;
    for (let i = 0; i < cap * 0.5; i++) { const st = pick(streams); bs.push({ x: st.x, y: rnd(0, e.h), r: rnd(1.2, 3.4), vy: rnd(40, 120), ph: rnd(0, TAU), vx: 0 }); }
    return {
      step(dt, t) {
        for (const st of streams) { st.acc += dt * st.rate; while (st.acc > 1) { st.acc--; if (bs.length < cap) bs.push({ x: st.x + rnd(-2, 2), y: e.h + 4, r: rnd(1.1, 2.6), vy: rnd(30, 50), ph: rnd(0, TAU), vx: 0 }); } }
        for (let i = bs.length - 1; i >= 0; i--) {
          const b = bs[i]; b.vy = Math.min(150, b.vy + 45 * dt); b.y -= b.vy * dt; b.x += (Math.sin(t * 7 + b.ph) * 8 + b.vx) * dt; b.vx *= Math.pow(0.2, dt); b.r += dt * 0.25;
          if (b.y < -10) bs.splice(i, 1);
        }
      },
      draw(g) {
        g.globalCompositeOperation = e.dark ? 'lighter' : 'source-over';
        g.lineWidth = 0.9;
        for (const b of bs) {
          g.strokeStyle = rgba(col, 0.6); g.fillStyle = rgba(col, 0.08);
          g.beginPath(); g.arc(b.x, b.y, b.r, 0, TAU); g.fill(); g.stroke();
          g.fillStyle = rgba('#ffffff', e.dark ? 0.6 : 0.9); g.beginPath(); g.arc(b.x - b.r * 0.35, b.y - b.r * 0.35, b.r * 0.3, 0, TAU); g.fill();
        }
      },
      tap(x, y) { for (let i = 0; i < 26; i++) bs.push({ x: x + rnd(-6, 6), y: y + rnd(-6, 6), r: rnd(1.2, 4), vy: rnd(60, 220), ph: rnd(0, TAU), vx: rnd(-140, 140) }); if (bs.length > cap * 1.6) bs.splice(0, bs.length - cap * 1.6); },
    };
  },

  // Salão: mechas de seda ondulando; o dedo puxa os fios.
  seda(e) {
    const M = 7;
    const strands = Array.from({ length: M }, (_, i) => ({ base: e.h * (0.14 + i * (0.72 / (M - 1))), a: rnd(10, 24), k: rnd(0.007, 0.014), w: rnd(0.35, 0.75), ph: rnd(0, TAU), col: mix(e.c.accent, e.c.accent2, i / (M - 1)), lw: rnd(1.4, 2.6) }));
    let px = -999, py = -999, pull = 0;
    return {
      step(dt) { pull = Math.max(0, pull - dt * 0.9); },
      draw(g, t) {
        g.lineCap = 'round'; g.lineJoin = 'round';
        for (const s of strands) {
          const gr = g.createLinearGradient(0, 0, e.w, 0);
          gr.addColorStop(0, rgba(s.col, 0.08)); gr.addColorStop(0.2, rgba(s.col, e.dark ? 0.6 : 0.55)); gr.addColorStop(0.8, rgba(s.col, e.dark ? 0.6 : 0.55)); gr.addColorStop(1, rgba(s.col, 0.08));
          g.strokeStyle = gr;
          for (let lock = 0; lock < 3; lock++) {
            g.lineWidth = s.lw * (lock === 1 ? 1 : 0.6);
            g.beginPath();
            let first = true;
            for (let x = -20; x <= e.w + 20; x += 12) {
              let y = s.base + lock * 3 + s.a * Math.sin(s.k * x + s.w * t + s.ph + lock * 0.25) + s.a * 0.35 * Math.sin(2.3 * s.k * x - 0.7 * s.w * t + s.ph * 2);
              if (pull > 0) y += (py - s.base) * 0.5 * pull * Math.exp(-((x - px) ** 2) / 7200) * Math.exp(-((s.base - py) ** 2) / 26000);
              if (first) { g.moveTo(x, y); first = false; } else g.lineTo(x, y);
            }
            g.stroke();
          }
        }
      },
      move(x, y) { px = x; py = y; pull = Math.min(1, pull + 0.35); },
      tap(x, y) { px = x; py = y; pull = 1; },
    };
  },

  // Unhas e cílios: glitter metálico caindo e piscando na luz.
  glitter(e) {
    const metals = ['#c9a24a', '#e7c98a', '#d79b8f', e.c.accent, e.c.accent2, '#b9b2c9'];
    const make = (top: boolean): Fall => ({ x: rnd(0, e.w), y: top ? rnd(-30, -4) : rnd(0, e.h), vx: 0, vy: rnd(10, 26), rot: rnd(0, TAU), vr: rnd(-1.5, 1.5), ph: rnd(0, TAU), vph: rnd(2, 6), s: rnd(2.4, 4.8), col: pick(metals), kind: 0 });
    const f = fallers(e, Math.round(70 * e.k), make);
    return {
      step(dt, t) { f.step(dt, t, 5, 1); },
      draw(g) {
        for (const p of f.list) {
          const b = (Math.sin(p.ph) + 1) / 2, sx = Math.max(0.15, Math.abs(Math.cos(p.ph)));
          g.save(); g.translate(p.x, p.y); g.rotate(p.rot); g.scale(sx, 1);
          g.fillStyle = mix(p.col, e.dark ? '#ffffff' : '#fff7e6', b * 0.7);
          g.beginPath(); g.moveTo(0, -p.s); g.lineTo(p.s * 0.8, 0); g.lineTo(0, p.s); g.lineTo(-p.s * 0.8, 0); g.closePath(); g.fill();
          if (!e.dark) { g.strokeStyle = rgba(e.c.ink, 0.12); g.lineWidth = 0.5; g.stroke(); }
          g.restore();
          if (b > 0.88) { g.fillStyle = rgba(e.dark ? '#ffffff' : mix(p.col, '#ffffff', 0.1), (b - 0.88) * 9); starPath(g, p.x, p.y, p.s * 3.6, 0.15); g.fill(); }
        }
      },
      move(x, y, vx, vy) {
        for (const p of f.list) { const dx = p.x - x, dy = p.y - y, d = Math.hypot(dx, dy); if (d < 100 && d > 1) { const k = (1 - d / 100) * 90; p.vx += (-dy / d) * k + vx * 0.15; p.y += (dx / d) * k * 0.02; p.vph += 2; } }
      },
      tap(x, y) { for (let i = 0; i < 18; i++) f.list.push({ ...make(false), x, y, vx: rnd(-220, 220), vy: rnd(-60, 30) }); if (f.list.length > 120) f.list.splice(0, f.list.length - 120); },
    };
  },

  // Estética: pétalas caindo devagar, virando no ar; o dedo sopra.
  petalas(e) {
    const cols = [e.c.accent2, mix(e.c.accent2, '#ffffff', 0.4), mix(e.c.accent, '#ffffff', 0.55), mix(e.c.fx1, e.c.accent2, 0.4)];
    const make = (top: boolean): Fall => ({ x: rnd(0, e.w), y: top ? rnd(-50, -10) : rnd(0, e.h), vx: rnd(-8, 8), vy: rnd(18, 34), rot: rnd(0, TAU), vr: rnd(-1.4, 1.4), ph: rnd(0, TAU), vph: rnd(1.2, 2.6), s: rnd(9, 15), col: pick(cols), kind: 0 });
    const f = fallers(e, Math.round(20 * e.k), make);
    return {
      step(dt, t) { f.step(dt, t, 16, 1.2); },
      draw(g) {
        for (const p of f.list) {
          g.save(); g.translate(p.x, p.y); g.rotate(p.rot); g.scale(1, 0.3 + 0.7 * Math.abs(Math.cos(p.ph)));
          const gr = g.createRadialGradient(0, -p.s * 0.3, 0, 0, 0, p.s);
          gr.addColorStop(0, mix(p.col, '#ffffff', 0.45)); gr.addColorStop(1, p.col);
          g.fillStyle = gr; g.beginPath(); g.moveTo(0, -p.s);
          g.bezierCurveTo(p.s * 0.95, -p.s * 0.55, p.s * 0.7, p.s * 0.65, 0, p.s);
          g.bezierCurveTo(-p.s * 0.7, p.s * 0.65, -p.s * 0.95, -p.s * 0.55, 0, -p.s); g.fill();
          g.strokeStyle = rgba(e.c.accent, 0.16); g.lineWidth = 0.7; g.stroke();
          g.restore();
        }
      },
      move(x, y, vx, vy) { f.push(x, y, vx, vy, 120); },
      tap(x, y) { f.push(x, y, rnd(-500, 500), -200, 130); },
    };
  },

  // Barbearia: o dedo deixa um rastro de navalha brilhando, com faíscas; de tempos em tempos, um brilho cruza a capa.
  lamina(e) {
    type T = { x: number; y: number; a: number };
    type S = { x: number; y: number; vx: number; vy: number; life: number };
    let trail: T[] = [];
    const sparks: S[] = [];
    const motes = Array.from({ length: Math.round(34 * e.k) }, () => ({ x: rnd(0, e.w), y: rnd(0, e.h), ph: rnd(0, TAU), vy: rnd(-9, -3), r: rnd(1, 2.2) }));
    let sweepT = 1.2;
    const metal = mix(e.c.ink, '#ffffff', 0.6);
    return {
      step(dt) {
        sweepT += dt; if (sweepT > 2.6) sweepT = 0;
        trail = trail.filter(p => (p.a -= dt * 1.1) > 0);
        for (let i = sparks.length - 1; i >= 0; i--) { const s = sparks[i]; s.life -= dt; s.vy += 500 * dt; s.x += s.vx * dt; s.y += s.vy * dt; if (s.life <= 0) sparks.splice(i, 1); }
        for (const m of motes) { m.y += m.vy * dt; if (m.y < -4) { m.y = e.h + 4; m.x = rnd(0, e.w); } }
      },
      draw(g, t) {
        g.globalCompositeOperation = e.dark ? 'lighter' : 'source-over';
        for (const m of motes) { g.fillStyle = rgba(metal, 0.22 + 0.2 * Math.sin(t * 2 + m.ph)); g.beginPath(); g.arc(m.x, m.y, m.r, 0, TAU); g.fill(); }
        if (sweepT < 0.8) {
          const k = sweepT / 0.8, cx = -80 + k * (e.w + 160), cy = e.h * 0.35 + (k - 0.5) * -e.h * 0.25;
          const ang = -0.38, len = 220, dx = Math.cos(ang) * len / 2, dy = Math.sin(ang) * len / 2;
          const gr = g.createLinearGradient(cx - dx, cy - dy, cx + dx, cy + dy);
          gr.addColorStop(0, rgba(metal, 0)); gr.addColorStop(0.5, rgba('#ffffff', 0.85)); gr.addColorStop(1, rgba(metal, 0));
          g.strokeStyle = gr; g.lineWidth = 2.6; g.lineCap = 'round'; g.beginPath(); g.moveTo(cx - dx, cy - dy); g.lineTo(cx + dx, cy + dy); g.stroke();
          g.strokeStyle = rgba(e.c.accent, 0.22); g.lineWidth = 14; g.stroke();
        }
        if (trail.length > 1) {
          g.lineCap = 'round'; g.lineJoin = 'round';
          for (let pass = 0; pass < 2; pass++) {
            for (let i = 1; i < trail.length; i++) {
              const a = trail[i - 1], b = trail[i];
              g.strokeStyle = pass ? rgba('#ffffff', b.a * 0.95) : rgba(e.c.accent, b.a * 0.35);
              g.lineWidth = pass ? 0.8 + b.a * 2.4 : 4 + b.a * 8;
              g.beginPath(); g.moveTo(a.x, a.y); g.lineTo(b.x, b.y); g.stroke();
            }
          }
        }
        for (const s of sparks) { g.strokeStyle = rgba(s.life > 0.2 ? '#fff4d6' : '#ffb347', Math.min(1, s.life * 3)); g.lineWidth = 1.2; g.beginPath(); g.moveTo(s.x, s.y); g.lineTo(s.x - s.vx * 0.02, s.y - s.vy * 0.02); g.stroke(); }
      },
      move(x, y, vx, vy) {
        trail.push({ x, y, a: 1 }); if (trail.length > 40) trail.shift();
        if (Math.hypot(vx, vy) > 120 && sparks.length < 80) for (let i = 0; i < 2; i++) sparks.push({ x, y, vx: -vx * 0.15 + rnd(-90, 90), vy: -vy * 0.15 + rnd(-140, 20), life: rnd(0.25, 0.5) });
      },
      tap(x, y) { sweepT = 0; for (let i = 0; i < 12; i++) sparks.push({ x, y, vx: rnd(-200, 200), vy: rnd(-260, 0), life: rnd(0.3, 0.6) }); },
    };
  },

  // Dentista: brilhos de "sorriso limpo" acendendo e apagando, e bolhinhas de frescor.
  brilho(e) {
    type St = { x: number; y: number; life: number; dur: number; s: number; col: string; delay: number };
    const cols = [e.c.accent, e.c.accent2, mix(e.c.accent, '#ffffff', 0.3)];
    const make = (x = rnd(0, e.w), y = rnd(0, e.h * 0.85), delay = rnd(0, 2)): St => ({ x, y, life: 0, dur: rnd(1.6, 3), s: rnd(5, 11), col: pick(cols), delay });
    const stars: St[] = Array.from({ length: Math.round(12 * e.k) }, () => make());
    const bub = Array.from({ length: Math.round(10 * e.k) }, () => ({ x: rnd(0, e.w), y: rnd(0, e.h), r: rnd(2, 5), vy: rnd(10, 22), ph: rnd(0, TAU) }));
    return {
      step(dt) {
        for (let i = stars.length - 1; i >= 0; i--) { const s = stars[i]; if (s.delay > 0) { s.delay -= dt; continue; } s.life += dt; if (s.life > s.dur) { if (stars.length > 14 * e.k) stars.splice(i, 1); else stars[i] = make(); } }
        for (const b of bub) { b.y -= b.vy * dt; if (b.y < -8) { b.y = e.h + 8; b.x = rnd(0, e.w); } }
      },
      draw(g, t) {
        for (const b of bub) { g.strokeStyle = rgba(e.c.accent2, 0.35); g.lineWidth = 1; g.beginPath(); g.arc(b.x + Math.sin(t + b.ph) * 4, b.y, b.r, 0, TAU); g.stroke(); }
        for (const s of stars) {
          if (s.delay > 0) continue;
          const k = Math.sin(Math.PI * s.life / s.dur);
          const glow = g.createRadialGradient(s.x, s.y, 0, s.x, s.y, s.s * 1.8);
          glow.addColorStop(0, rgba(s.col, 0.22 * k)); glow.addColorStop(1, rgba(s.col, 0));
          g.fillStyle = glow; g.beginPath(); g.arc(s.x, s.y, s.s * 1.8, 0, TAU); g.fill();
          g.fillStyle = rgba(s.col, 0.9 * k); starPath(g, s.x, s.y, s.s * (0.4 + 0.6 * k), 0.22); g.fill();
        }
      },
      tap(x, y) { for (let i = 0; i < 6; i++) { const a = i * TAU / 6; stars.push(make(x + Math.cos(a) * 26, y + Math.sin(a) * 26, i * 0.06)); } },
    };
  },

  // Terapias: ondas calmas; o toque cria uma onda que se acalma sozinha.
  ondas(e) {
    const L = 5;
    const lines = Array.from({ length: L }, (_, i) => ({ base: e.h * (0.46 + i * 0.1), a: rnd(10, 20), k: rnd(0.01, 0.018), w: rnd(0.3, 0.6), ph: rnd(0, TAU), col: mix(e.c.accent, e.c.accent2, i / (L - 1)) }));
    const ripples: { x: number; y: number; age: number }[] = [];
    const dots = Array.from({ length: Math.round(9 * e.k) }, (_, i) => ({ line: i % L, x: rnd(0, e.w), v: rnd(10, 26) }));
    let lastMove = 0;
    const yAt = (ln: typeof lines[number], x: number, t: number) => {
      let y = ln.base + ln.a * Math.sin(ln.k * x + ln.w * t + ln.ph) + ln.a * 0.3 * Math.sin(2.1 * ln.k * x - ln.w * t);
      for (const r of ripples) y += 22 * Math.exp(-((x - r.x) ** 2) / 9000) * Math.sin((x - r.x) * 0.05 - r.age * 5) * Math.exp(-r.age * 1.1) * Math.exp(-((ln.base - r.y) ** 2) / 40000);
      return y;
    };
    let now = 0;
    return {
      step(dt, t) { now = t; for (let i = ripples.length - 1; i >= 0; i--) { ripples[i].age += dt; if (ripples[i].age > 4) ripples.splice(i, 1); } for (const d of dots) { d.x += d.v * dt; if (d.x > e.w + 10) d.x = -10; } },
      draw(g, t) {
        g.lineCap = 'round';
        lines.forEach((ln, i) => {
          g.strokeStyle = rgba(ln.col, 0.3 + i * 0.07); g.lineWidth = 2.2; g.beginPath();
          for (let x = -10; x <= e.w + 10; x += 10) { const y = yAt(ln, x, t); if (x === -10) g.moveTo(x, y); else g.lineTo(x, y); }
          g.stroke();
        });
        for (const d of dots) { const ln = lines[d.line]; g.fillStyle = rgba(ln.col, 0.55); g.beginPath(); g.arc(d.x, yAt(ln, d.x, t), 2.4, 0, TAU); g.fill(); }
      },
      tap(x, y) { ripples.push({ x, y, age: 0 }); if (ripples.length > 6) ripples.shift(); },
      move(x, y) { if (now - lastMove > 0.35) { lastMove = now; ripples.push({ x, y, age: 0.3 }); if (ripples.length > 6) ripples.shift(); } },
    };
  },

  // Veterinária: patinhas atravessando a capa; o toque solta corações.
  pegadas(e) {
    type W = { x: number; y: number; dir: number; turn: number; step: number; side: number; sp: number; s: number };
    type Pr = { x: number; y: number; a: number; s: number; age: number };
    const prints: Pr[] = [];
    const hearts: { x: number; y: number; age: number; s: number }[] = [];
    const spawn = (small = false): W => {
      const left = Math.random() < 0.5;
      return { x: left ? -20 : e.w + 20, y: rnd(e.h * 0.4, e.h * 0.9), dir: (left ? 0 : Math.PI) + rnd(-0.25, 0.25), turn: 0, step: 0, side: 1, sp: small ? 50 : 60, s: small ? rnd(7, 8) : rnd(9.5, 11) };
    };
    const walkers: W[] = [spawn(), ...(e.thumb ? [] : [spawn(true)])];
    walkers.forEach((w, i) => { w.x = i ? e.w * 0.7 : e.w * 0.2; });
    const col = e.dark ? mix(e.c.accent, '#ffffff', 0.3) : e.c.accent;
    return {
      step(dt) {
        walkers.forEach((w, i) => {
          w.turn += rnd(-1.2, 1.2) * dt; w.turn *= Math.pow(0.5, dt); w.dir += w.turn * dt;
          if (w.y < e.h * 0.3) w.dir += (Math.cos(w.dir) > 0 ? 1 : -1) * dt * 0.8;
          if (w.y > e.h * 0.95) w.dir -= (Math.cos(w.dir) > 0 ? 1 : -1) * dt * 0.8;
          w.x += Math.cos(w.dir) * w.sp * dt; w.y += Math.sin(w.dir) * w.sp * dt;
          w.step += dt;
          if (w.step > 0.42) {
            w.step = 0; w.side *= -1;
            const nx = -Math.sin(w.dir), ny = Math.cos(w.dir);
            prints.push({ x: w.x + nx * w.s * 0.9 * w.side, y: w.y + ny * w.s * 0.9 * w.side, a: w.dir, s: w.s, age: 0 });
            if (prints.length > 60) prints.shift();
          }
          if (w.x < -60 || w.x > e.w + 60) walkers[i] = spawn(i > 0);
        });
        for (const p of prints) p.age += dt;
        for (let i = hearts.length - 1; i >= 0; i--) { hearts[i].age += dt; if (hearts[i].age > 1.6) hearts.splice(i, 1); }
      },
      draw(g) {
        for (const p of prints) {
          const a = Math.max(0, 0.62 * (1 - p.age / 6)); if (!a) continue;
          g.save(); g.translate(p.x, p.y); g.rotate(p.a + Math.PI / 2); g.fillStyle = rgba(col, a); pawPath(g, p.s); g.fill(); g.restore();
        }
        for (const h of hearts) {
          const k = h.age / 1.6, sc = k < 0.2 ? (k / 0.2) * 1.2 : 1.2 - Math.min(0.2, (k - 0.2));
          g.save(); g.translate(h.x, h.y - k * 46); g.scale(sc, sc); g.fillStyle = rgba('#e2557a', 1 - k); heartPath(g, h.s); g.fill(); g.restore();
        }
      },
      tap(x, y) { for (let i = 0; i < 3; i++) hearts.push({ x: x + rnd(-16, 16), y: y + rnd(-6, 6), age: -i * 0.12, s: rnd(7, 11) }); },
    };
  },

  // Pet shop: bolhas de sabão; tocar numa bolha estoura (algumas têm uma patinha dentro).
  bolhas(e) {
    type B = { x: number; y: number; r: number; vy: number; ph: number; paw: boolean; pop: number };
    type Dr = { x: number; y: number; vx: number; vy: number; life: number };
    const N = Math.round(10 * e.k);
    const make = (bottom = true): B => ({ x: rnd(0, e.w), y: bottom ? e.h + rnd(20, 60) : rnd(0, e.h), r: rnd(10, 26), vy: rnd(14, 28), ph: rnd(0, TAU), paw: Math.random() < 0.3, pop: -1 });
    const bs: B[] = Array.from({ length: N }, () => make(false));
    const drops: Dr[] = [];
    const rims = [e.c.fx1, e.c.fx2, e.c.fx3];
    const pop = (b: B) => { b.pop = 0; for (let i = 0; i < 8; i++) { const a = i * TAU / 8; drops.push({ x: b.x + Math.cos(a) * b.r, y: b.y + Math.sin(a) * b.r, vx: Math.cos(a) * 90, vy: Math.sin(a) * 90 - 40, life: 0.45 }); } };
    return {
      step(dt, t) {
        for (let i = 0; i < bs.length; i++) {
          const b = bs[i];
          if (b.pop >= 0) { b.pop += dt; if (b.pop > 0.3) bs[i] = make(); continue; }
          b.y -= b.vy * dt; b.x += Math.sin(t * 0.9 + b.ph) * 12 * dt;
          if (b.y < -b.r - 10) bs[i] = make();
          else if (Math.random() < 0.02 * dt && b.y < e.h * 0.7) pop(b);
        }
        for (let i = drops.length - 1; i >= 0; i--) { const d = drops[i]; d.life -= dt; d.vy += 300 * dt; d.x += d.vx * dt; d.y += d.vy * dt; if (d.life <= 0) drops.splice(i, 1); }
      },
      draw(g, t) {
        for (const b of bs) {
          if (b.pop >= 0) {
            const k = b.pop / 0.3; g.strokeStyle = rgba(rims[0], (1 - k) * 0.8); g.lineWidth = 2 * (1 - k) + 0.3;
            g.beginPath(); g.arc(b.x, b.y, b.r * (1 + k * 0.5), 0, TAU); g.stroke(); continue;
          }
          const wob = 1 + Math.sin(t * 3 + b.ph) * 0.04;
          g.save(); g.translate(b.x, b.y); g.scale(wob, 2 - wob);
          const fill = g.createRadialGradient(0, 0, b.r * 0.6, 0, 0, b.r);
          fill.addColorStop(0, rgba('#ffffff', 0)); fill.addColorStop(1, rgba(rims[0], e.dark ? 0.18 : 0.14));
          g.fillStyle = fill; g.beginPath(); g.arc(0, 0, b.r, 0, TAU); g.fill();
          const rim = g.createLinearGradient(-b.r, -b.r, b.r, b.r);
          rim.addColorStop(0, rgba(rims[0], 0.85)); rim.addColorStop(0.5, rgba(rims[1], 0.7)); rim.addColorStop(1, rgba(rims[2], 0.85));
          g.strokeStyle = rim; g.lineWidth = 1.6; g.stroke();
          g.strokeStyle = rgba('#ffffff', 0.85); g.lineWidth = 2; g.lineCap = 'round'; g.beginPath(); g.arc(0, 0, b.r * 0.68, -2.5, -1.8); g.stroke();
          if (b.paw) { g.fillStyle = rgba(e.c.accent, 0.32); g.save(); g.scale(b.r / 24, b.r / 24); pawPath(g, 9); g.fill(); g.restore(); }
          g.restore();
        }
        for (const d of drops) { g.fillStyle = rgba(rims[2], d.life * 1.6); g.beginPath(); g.arc(d.x, d.y, 1.8, 0, TAU); g.fill(); }
      },
      tap(x, y) {
        const hit = bs.find(b => b.pop < 0 && Math.hypot(b.x - x, b.y - y) < b.r + 10);
        if (hit) pop(hit);
        else if (bs.length < N * 2) bs.push({ ...make(), x, y, r: rnd(14, 24) });
      },
    };
  },

  // Academia: ondas de impacto no ritmo do treino; o toque solta uma onda com energia.
  impacto(e) {
    type R = { x: number; y: number; age: number; max: number };
    type St = { x: number; y: number; vy: number; vx: number; len: number; life: number };
    const rings: R[] = [];
    const streaks: St[] = [];
    let beat = 0.4;
    const ring = (x: number, y: number, max = Math.max(e.w, e.h) * 0.7) => {
      rings.push({ x, y, age: 0, max });
      for (let i = 0; i < Math.round(10 * e.k); i++) streaks.push({ x: x + rnd(-40, 40), y: y + rnd(-10, 10), vx: rnd(-40, 40), vy: -rnd(160, 340), len: rnd(10, 28), life: rnd(0.5, 1) });
    };
    return {
      step(dt) {
        beat -= dt; if (beat <= 0) { beat = 1.6; ring(e.w * 0.5, e.h * 0.96); }
        for (let i = rings.length - 1; i >= 0; i--) { rings[i].age += dt; if (rings[i].age > 1.2) rings.splice(i, 1); }
        for (let i = streaks.length - 1; i >= 0; i--) { const s = streaks[i]; s.life -= dt; s.x += s.vx * dt; s.y += s.vy * dt; if (s.life <= 0) streaks.splice(i, 1); }
        if (streaks.length > 160) streaks.splice(0, streaks.length - 160);
      },
      draw(g) {
        g.globalCompositeOperation = e.dark ? 'lighter' : 'source-over';
        for (const r of rings) {
          const k = r.age / 1.2, ease = 1 - Math.pow(1 - k, 3);
          for (let j = 0; j < 2; j++) {
            const kk = Math.max(0, ease - j * 0.12);
            g.strokeStyle = rgba(j ? e.c.accent2 : e.c.accent, (1 - k) * 0.7); g.lineWidth = 5 * (1 - k) + 0.6;
            g.beginPath(); g.arc(r.x, r.y, r.max * kk, 0, TAU); g.stroke();
          }
        }
        g.lineCap = 'round';
        for (const s of streaks) {
          const gr = g.createLinearGradient(s.x, s.y, s.x, s.y + s.len);
          gr.addColorStop(0, rgba(e.c.accent2, Math.min(1, s.life * 1.5))); gr.addColorStop(1, rgba(e.c.accent, 0));
          g.strokeStyle = gr; g.lineWidth = 2; g.beginPath(); g.moveTo(s.x, s.y); g.lineTo(s.x - s.vx * 0.05, s.y + s.len); g.stroke();
        }
      },
      tap(x, y) { ring(x, y, Math.max(e.w, e.h) * 0.45); },
    };
  },

  // Pilates e yoga: círculos que "respiram" (4,5 s inspirando, 4,5 s soltando); o toque muda o centro.
  respira(e) {
    let cx = e.w * 0.78, cy = e.h * 0.24, tx = cx, ty = cy;
    const orbit = Array.from({ length: 9 }, (_, i) => ({ a: i * TAU / 9, d: 1.05 + 0.25 * Math.sin(i * 1.7), s: rnd(1.6, 2.8) }));
    return {
      step(dt) { cx += (tx - cx) * Math.min(1, dt * 1.5); cy += (ty - cy) * Math.min(1, dt * 1.5); },
      draw(g, t) {
        const b = (1 - Math.cos(TAU * t / 9)) / 2, R0 = Math.min(e.w, e.h) * 0.17 * (0.82 + 0.3 * b);
        const core = g.createRadialGradient(cx, cy, 0, cx, cy, R0 * 1.6);
        core.addColorStop(0, rgba(e.c.accent2, 0.32 * (0.6 + 0.4 * b))); core.addColorStop(1, rgba(e.c.accent2, 0));
        g.fillStyle = core; g.beginPath(); g.arc(cx, cy, R0 * 1.6, 0, TAU); g.fill();
        for (let i = 0; i < 4; i++) { g.strokeStyle = rgba(e.c.accent, 0.3 - i * 0.055); g.lineWidth = 1.4; g.beginPath(); g.arc(cx, cy, R0 * (0.55 + i * 0.32), 0, TAU); g.stroke(); }
        for (const o of orbit) {
          const a = o.a + t * 0.12 * (o.d > 1.1 ? 1 : -1), r = R0 * o.d * 1.25;
          g.fillStyle = rgba(e.c.accent, 0.5); g.beginPath(); g.arc(cx + Math.cos(a) * r, cy + Math.sin(a) * r, o.s, 0, TAU); g.fill();
        }
      },
      tap(x, y) { tx = clamp(x, 40, e.w - 40); ty = clamp(y, 40, e.h - 40); },
    };
  },

  // Oficina: faíscas de esmerilhadeira quicando no chão e engrenagens girando; o toque solta faíscas.
  faiscas(e) {
    type S = { x: number; y: number; vx: number; vy: number; life: number; max: number };
    const sp: S[] = [];
    const cap = Math.round(240 * e.k);
    const ex = () => e.w * 0.86, ey = () => e.h * 0.66;
    let cycle = 0, acc = 0;
    const emit = (x: number, y: number, ang: number, spread: number, n: number, speed = [220, 460]) => {
      for (let i = 0; i < n && sp.length < cap; i++) { const a = ang + rnd(-spread, spread), v = rnd(speed[0], speed[1]); sp.push({ x, y, vx: Math.cos(a) * v, vy: Math.sin(a) * v, life: 0, max: rnd(0.5, 1.05) }); }
    };
    const gear = (g: CanvasRenderingContext2D, x: number, y: number, r: number, teeth: number, rot: number) => {
      g.save(); g.translate(x, y); g.rotate(rot); g.beginPath();
      for (let i = 0; i < teeth * 2; i++) { const a0 = i * Math.PI / teeth, rr = i % 2 ? r : r * 1.22; g.arc(0, 0, rr, a0, a0 + Math.PI / teeth); }
      g.closePath(); g.stroke(); g.beginPath(); g.arc(0, 0, r * 0.35, 0, TAU); g.stroke(); g.restore();
    };
    return {
      step(dt) {
        cycle += dt; const on = cycle % 2.2 < 1.3;
        if (on) { acc += dt * 130 * e.k; const n = Math.floor(acc); acc -= n; emit(ex(), ey(), -2.55, 0.42, n); }
        for (let i = sp.length - 1; i >= 0; i--) {
          const s = sp[i]; s.life += dt; s.vy += 700 * dt; s.x += s.vx * dt; s.y += s.vy * dt;
          if (s.y > e.h - 3 && s.vy > 0) { s.y = e.h - 3; s.vy *= -0.35; s.vx *= 0.6; }
          if (s.life > s.max) sp.splice(i, 1);
        }
      },
      draw(g, t) {
        g.strokeStyle = rgba(e.c.ink, e.dark ? 0.1 : 0.14); g.lineWidth = 2;
        gear(g, e.w * 0.12, e.h * 0.84, 30, 10, t * 0.6); gear(g, e.w * 0.12 + 58, e.h * 0.84 - 26, 20, 7, -t * 0.6 * 10 / 7 + 0.2);
        g.globalCompositeOperation = e.dark ? 'lighter' : 'source-over';
        if (cycle % 2.2 < 1.3) { const glow = g.createRadialGradient(ex(), ey(), 0, ex(), ey(), 30); glow.addColorStop(0, rgba('#fff2b0', 0.7)); glow.addColorStop(1, rgba(e.c.accent, 0)); g.fillStyle = glow; g.beginPath(); g.arc(ex(), ey(), 30, 0, TAU); g.fill(); }
        g.lineCap = 'round'; g.lineWidth = 2.1;
        for (const s of sp) {
          const f = s.life / s.max;
          g.strokeStyle = rgba(f < 0.3 ? '#fff6d0' : f < 0.6 ? (e.dark ? e.c.accent : '#ff9d00') : '#ff5a00', 1 - f);
          g.beginPath(); g.moveTo(s.x, s.y); g.lineTo(s.x - s.vx * 0.026, s.y - s.vy * 0.026); g.stroke();
        }
      },
      tap(x, y) { emit(x, y, -Math.PI / 2, Math.PI, 50, [140, 420]); },
    };
  },

  // Lava-car: gotas no vidro escorrendo; arrastar o dedo limpa o vidro (e a chuva volta).
  chuva(e) {
    type D = { x: number; y: number; r: number };
    type Sl = { x: number; y: number; r: number; vy: number; stick: number; trail: number };
    const area = clamp((e.w * e.h) / (390 * 600), 0.5, 2);
    const N = Math.round(85 * area * e.k);
    const drops: D[] = Array.from({ length: N }, () => ({ x: rnd(0, e.w), y: rnd(0, e.h), r: rnd(0.8, 3.2) }));
    const newSl = (top = true): Sl => ({ x: rnd(0, e.w), y: top ? rnd(-30, -5) : rnd(0, e.h * 0.6), r: rnd(3.5, 6), vy: rnd(40, 110), stick: rnd(0, 0.6), trail: 0 });
    const sl: Sl[] = Array.from({ length: Math.round(6 * e.k) }, () => newSl(false));
    const wipes: { x: number; y: number; a: number }[] = [];
    let last: { x: number; y: number; at: number } | null = null;
    const rim = e.dark ? '#ffffff' : e.c.ink;
    const drawDrop = (g: CanvasRenderingContext2D, x: number, y: number, r: number) => {
      g.fillStyle = rgba(e.dark ? '#ffffff' : e.c.accent, e.dark ? 0.07 : 0.1); g.beginPath(); g.arc(x, y, r, 0, TAU); g.fill();
      g.strokeStyle = rgba(rim, e.dark ? 0.32 : 0.22); g.lineWidth = Math.max(0.6, r * 0.22); g.beginPath(); g.arc(x, y, r * 0.86, 0.15 * Math.PI, 0.95 * Math.PI); g.stroke();
      g.fillStyle = rgba('#ffffff', 0.75); g.beginPath(); g.arc(x - r * 0.35, y - r * 0.4, Math.max(0.5, r * 0.26), 0, TAU); g.fill();
    };
    return {
      step(dt) {
        if (drops.length < N && Math.random() < dt * 14) drops.push({ x: rnd(0, e.w), y: rnd(0, e.h), r: rnd(0.8, 3.2) });
        for (let i = 0; i < sl.length; i++) {
          const s = sl[i];
          if (s.stick > 0) { s.stick -= dt; continue; }
          s.y += s.vy * dt; s.trail += s.vy * dt;
          if (Math.random() < dt * 0.9) { s.stick = rnd(0.1, 0.6); s.vy = rnd(40, 140); }
          if (s.trail > 16) { s.trail = 0; drops.push({ x: s.x + rnd(-1, 1), y: s.y - s.r, r: s.r * rnd(0.25, 0.4) }); }
          for (let j = drops.length - 1; j >= 0; j--) { const d = drops[j]; if (d.y > s.y && Math.hypot(d.x - s.x, d.y - s.y) < s.r + d.r) { drops.splice(j, 1); s.r = Math.min(7, s.r + d.r * 0.12); } }
          if (s.y > e.h + 12) sl[i] = newSl();
        }
        if (drops.length > N * 1.4) drops.splice(0, drops.length - Math.round(N * 1.4));
        for (let i = wipes.length - 1; i >= 0; i--) { wipes[i].a -= dt * 1.4; if (wipes[i].a <= 0) wipes.splice(i, 1); }
      },
      draw(g) {
        if (wipes.length > 1) {
          g.lineCap = 'round'; g.lineJoin = 'round';
          for (let i = 1; i < wipes.length; i++) { g.strokeStyle = rgba(e.dark ? '#ffffff' : e.c.accent, wipes[i].a * 0.07); g.lineWidth = 46; g.beginPath(); g.moveTo(wipes[i - 1].x, wipes[i - 1].y); g.lineTo(wipes[i].x, wipes[i].y); g.stroke(); }
        }
        for (const d of drops) drawDrop(g, d.x, d.y, d.r);
        for (const s of sl) { g.save(); g.translate(s.x, s.y); g.scale(1, 1.18); drawDrop(g, 0, 0, s.r); g.restore(); }
      },
      move(x, y) {
        const now = performance.now();
        const from = last && now - last.at < 150 ? last : { x, y }; last = { x, y, at: now };
        const len = Math.max(1, Math.hypot(x - from.x, y - from.y));
        for (let j = drops.length - 1; j >= 0; j--) {
          const d = drops[j];
          const k = clamp(((d.x - from.x) * (x - from.x) + (d.y - from.y) * (y - from.y)) / (len * len), 0, 1);
          if (Math.hypot(d.x - (from.x + (x - from.x) * k), d.y - (from.y + (y - from.y) * k)) < 24) drops.splice(j, 1);
        }
        for (let i = 0; i < sl.length; i++) if (Math.hypot(sl[i].x - x, sl[i].y - y) < 28) sl[i] = newSl();
        wipes.push({ x, y, a: 1 }); if (wipes.length > 30) wipes.shift();
      },
      tap(x, y) { for (let i = 0; i < 12; i++) drops.push({ x: x + rnd(-30, 30), y: y + rnd(-30, 30), r: rnd(1, 3.6) }); },
    };
  },

  // Jardinagem: plantas brotando das bordas, abrindo folhas e flor; o toque planta uma muda.
  brotos(e) {
    type Leaf = { at: number; side: number; s: number; born: number };
    type Pl = { x: number; angles: number[]; len: number; target: number; leaves: Leaf[]; seed: number; bend: number; born: number; bloom: number };
    const SEG = 8;
    let clock = 0;
    const plant = (x: number, target = rnd(e.h * 0.2, e.h * 0.42)): Pl => {
      const bend = x < e.w / 2 ? -1 : 1;
      const angles: number[] = []; let a = -Math.PI / 2 + rnd(-0.15, 0.15) * bend;
      for (let i = 0; i < Math.ceil(target / SEG) + 1; i++) { a += rnd(-0.1, 0.1) + 0.012 * bend; angles.push(a); }
      return { x, angles, len: 0, target, leaves: [], seed: rnd(0, 99), bend, born: clock, bloom: -1 };
    };
    const plants: Pl[] = [e.w * 0.05, e.w * 0.17, e.w * 0.84, e.w * 0.96].map(x => plant(x + rnd(-8, 8)));
    if (!e.thumb && e.w > 520) plants.push(plant(e.w * 0.3), plant(e.w * 0.7));
    const leafCol = mix(e.c.accent, '#9fd48b', 0.35);
    return {
      step(dt) {
        clock += dt;
        for (const p of plants) {
          if (p.len < p.target) {
            const before = p.len; p.len = Math.min(p.target, p.len + 34 * dt);
            if (Math.floor(p.len / 20) > Math.floor(before / 20) && p.len > 14) p.leaves.push({ at: p.len, side: p.leaves.length % 2 ? 1 : -1, s: rnd(6, 10) * (1 - p.len / p.target * 0.35), born: clock });
          } else if (p.bloom < 0) p.bloom = clock;
        }
      },
      draw(g, t) {
        for (const p of plants) {
          const n = Math.floor(p.len / SEG), rest = (p.len % SEG) / SEG;
          const pts: [number, number, number][] = [[p.x, e.h + 2, p.angles[0]]];
          let x = p.x, y = e.h + 2;
          for (let i = 0; i <= n && i < p.angles.length; i++) {
            const sway = Math.sin(t * 1.1 + p.seed) * 0.05 * (i / Math.max(1, p.target / SEG));
            const a = p.angles[i] + sway, l = i === n ? SEG * rest : SEG;
            x += Math.cos(a) * l; y += Math.sin(a) * l; pts.push([x, y, a]);
          }
          g.strokeStyle = e.c.accent; g.lineCap = 'round';
          for (let i = 1; i < pts.length; i++) { g.lineWidth = 3.2 * (1 - i / (p.target / SEG + 2)) + 0.8; g.beginPath(); g.moveTo(pts[i - 1][0], pts[i - 1][1]); g.lineTo(pts[i][0], pts[i][1]); g.stroke(); }
          for (const lf of p.leaves) {
            const idx = Math.min(pts.length - 1, Math.round(lf.at / SEG)); const [lx, ly, la] = pts[idx];
            const k = Math.min(1, (clock - lf.born) / 0.6), grow = 1 + 2.70158 * Math.pow(k - 1, 3) + 1.70158 * Math.pow(k - 1, 2);
            g.save(); g.translate(lx, ly); g.rotate(la + lf.side * 1.0 + Math.sin(t * 1.4 + p.seed + lf.at) * 0.08); g.translate(lf.s * grow, 0);
            const gr = g.createLinearGradient(-lf.s, 0, lf.s, 0); gr.addColorStop(0, e.c.accent); gr.addColorStop(1, leafCol);
            g.fillStyle = gr; leafPath(g, lf.s * Math.max(0.05, grow)); g.fill(); g.restore();
          }
          if (p.bloom >= 0) {
            const k = Math.min(1, (clock - p.bloom) / 0.9), [fx, fy] = pts[pts.length - 1];
            g.fillStyle = e.c.accent2;
            for (let i = 0; i < 5; i++) { const a = i * TAU / 5 + t * 0.2; g.beginPath(); g.arc(fx + Math.cos(a) * 4.5 * k, fy + Math.sin(a) * 4.5 * k, 3.6 * k, 0, TAU); g.fill(); }
            g.fillStyle = '#fff3c4'; g.beginPath(); g.arc(fx, fy, 2.4 * k, 0, TAU); g.fill();
          }
        }
      },
      tap(x, y) { if (y > e.h * 0.35) { plants.push(plant(x, rnd(e.h * 0.15, Math.max(40, e.h - y + 30)))); if (plants.length > 10) plants.shift(); } },
    };
  },

  // Loja: etiquetas penduradas balançando como pêndulo; o dedo empurra.
  etiquetas(e) {
    const labels = ['NOVO', '-30%', '♥', 'TOP', '★', 'NOVO'];
    const cols = [e.c.accent, e.c.accent2, e.c.fx2 || '#ffd84d', '#ffffff', e.c.fx3];
    const K = clamp(Math.round(e.w / 78), 4, 7);
    const tags = Array.from({ length: K }, (_, i) => ({ ax: (i + 0.5) * e.w / K + rnd(-10, 10), L: rnd(34, 84), th: rnd(-0.25, 0.25), om: 0, label: labels[i % labels.length], col: cols[i % cols.length], ph: rnd(0, TAU) }));
    const conf = fallers(e, Math.round(10 * e.k), top => ({ x: rnd(0, e.w), y: top ? rnd(-30, -4) : rnd(0, e.h), vx: 0, vy: rnd(24, 44), rot: rnd(0, TAU), vr: rnd(-4, 4), ph: rnd(0, TAU), vph: rnd(3, 6), s: rnd(3, 5), col: pick(cols), kind: 0 }));
    const pos = (tg: typeof tags[number]) => ({ x: tg.ax + Math.sin(tg.th) * tg.L, y: Math.cos(tg.th) * tg.L });
    return {
      step(dt, t) {
        for (const tg of tags) {
          const wind = Math.sin(t * 0.8 + tg.ph) * 0.9;
          tg.om += (-(900 / tg.L) * Math.sin(tg.th) - 1.1 * tg.om + wind) * dt; tg.th += tg.om * dt;
        }
        conf.step(dt, t, 10);
      },
      draw(g) {
        for (const p of conf.list) { g.save(); g.translate(p.x, p.y); g.rotate(p.rot); g.scale(1, Math.abs(Math.cos(p.ph))); g.fillStyle = p.col === '#ffffff' && !e.dark ? rgba(e.c.ink, 0.2) : p.col; g.fillRect(-p.s, -p.s * 0.5, p.s * 2, p.s); g.restore(); }
        g.lineWidth = 1.5;
        for (const tg of tags) {
          const { x, y } = pos(tg);
          g.strokeStyle = rgba(e.c.ink, 0.55); g.beginPath(); g.moveTo(tg.ax, -2); g.lineTo(x, y); g.stroke();
          g.save(); g.translate(x, y); g.rotate(-tg.th);
          const W = 46, H = 26;
          g.fillStyle = rgba(e.c.ink, 0.9); roundRect(g, -W / 2 + 3, 3, W, H, 6); g.fill();
          g.fillStyle = tg.col; roundRect(g, -W / 2, 0, W, H, 6); g.fill();
          g.strokeStyle = e.c.ink; g.lineWidth = 2; g.stroke();
          g.fillStyle = e.c.bg; g.beginPath(); g.arc(0, 5.5, 2.4, 0, TAU); g.fill(); g.stroke();
          g.fillStyle = e.c.ink; g.font = '800 11px system-ui, sans-serif'; g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillText(tg.label, 0, 16.5);
          g.restore(); g.lineWidth = 1.5;
        }
      },
      move(x, y, vx) { for (const tg of tags) { const p = pos(tg); const d = Math.hypot(p.x - x, p.y + 13 - y); if (d < 70) tg.om += vx * 0.006 * (1 - d / 70); } },
      tap(x, y) { for (const tg of tags) { const p = pos(tg); const d = Math.hypot(p.x - x, p.y + 13 - y); if (d < 90) tg.om += (p.x < x ? -1 : 1) * 4 * (1 - d / 90); } },
    };
  },

  // Assistência técnica: trilhas de circuito com pulsos de energia correndo; o toque energiza a placa.
  circuito(e) {
    const cell = 24;
    type Tr = { pts: [number, number][]; cum: number[]; total: number };
    const dirs: [number, number][] = [[1, 0], [1, 1], [0, 1], [-1, 1], [-1, 0], [-1, -1], [0, -1], [1, -1]];
    const area = clamp((e.w * e.h) / (390 * 600), 0.5, 2);
    const traces: Tr[] = [];
    const gw = Math.floor(e.w / cell), gh = Math.floor(e.h / cell);
    for (let i = 0; i < Math.round(15 * area * (e.thumb ? 0.8 : 1)); i++) {
      let gx = Math.floor(rnd(0, gw + 1)), gy = Math.floor(rnd(0, gh + 1)), d = Math.floor(rnd(0, 4)) * 2;
      const pts: [number, number][] = [[gx * cell, gy * cell]];
      const steps = Math.floor(rnd(5, 14));
      for (let s = 0; s < steps; s++) {
        if (Math.random() < 0.28) d = (d + (Math.random() < 0.5 ? 1 : 7)) % 8;
        const nx = gx + dirs[d][0], ny = gy + dirs[d][1];
        if (nx < 0 || ny < 0 || nx > gw || ny > gh) break;
        gx = nx; gy = ny; pts.push([gx * cell, gy * cell]);
      }
      if (pts.length < 3) continue;
      const cum = [0]; for (let k = 1; k < pts.length; k++) cum.push(cum[k - 1] + Math.hypot(pts[k][0] - pts[k - 1][0], pts[k][1] - pts[k - 1][1]));
      traces.push({ pts, cum, total: cum[cum.length - 1] });
    }
    type Pu = { tr: Tr; pos: number; sp: number };
    const newPulse = (tr = pick(traces), pos = 0): Pu => ({ tr, pos, sp: rnd(90, 160) });
    const pulses: Pu[] = traces.length ? Array.from({ length: Math.round(8 * e.k) }, () => newPulse(undefined, rnd(0, 60))) : [];
    const at = (tr: Tr, d: number): [number, number] => {
      d = clamp(d, 0, tr.total); let k = 1; while (k < tr.cum.length - 1 && tr.cum[k] < d) k++;
      const f = (d - tr.cum[k - 1]) / Math.max(1, tr.cum[k] - tr.cum[k - 1]);
      return [tr.pts[k - 1][0] + (tr.pts[k][0] - tr.pts[k - 1][0]) * f, tr.pts[k - 1][1] + (tr.pts[k][1] - tr.pts[k - 1][1]) * f];
    };
    const flash: { x: number; y: number; a: number }[] = [];
    return {
      step(dt) {
        for (let i = 0; i < pulses.length; i++) { const p = pulses[i]; p.pos += p.sp * dt; if (p.pos > p.tr.total + 30) pulses[i] = newPulse(); }
        for (let i = flash.length - 1; i >= 0; i--) { flash[i].a -= dt * 1.5; if (flash[i].a <= 0) flash.splice(i, 1); }
        if (pulses.length > 30) pulses.splice(0, pulses.length - 30);
      },
      draw(g) {
        g.lineCap = 'round'; g.lineJoin = 'round';
        for (const tr of traces) {
          g.strokeStyle = rgba(e.c.accent, e.dark ? 0.22 : 0.17); g.lineWidth = 1.6; g.beginPath();
          tr.pts.forEach(([x, y], i) => (i ? g.lineTo(x, y) : g.moveTo(x, y))); g.stroke();
          for (const [x, y] of [tr.pts[0], tr.pts[tr.pts.length - 1]]) { g.fillStyle = e.c.bg; g.strokeStyle = rgba(e.c.accent, 0.4); g.lineWidth = 1.4; g.beginPath(); g.arc(x, y, 3, 0, TAU); g.fill(); g.stroke(); }
        }
        for (const p of pulses) {
          for (let k = 0; k < 7; k++) {
            const [x, y] = at(p.tr, p.pos - k * 5);
            if (p.pos - k * 5 < 0 || p.pos - k * 5 > p.tr.total) continue;
            g.fillStyle = rgba(k ? e.c.accent : e.c.accent2, (1 - k / 7) * (k ? 0.55 : 1)); g.beginPath(); g.arc(x, y, k ? 2.2 - k * 0.2 : 3, 0, TAU); g.fill();
          }
        }
        for (const f of flash) { const gr = g.createRadialGradient(f.x, f.y, 0, f.x, f.y, 26); gr.addColorStop(0, rgba(e.c.accent2, 0.45 * f.a)); gr.addColorStop(1, rgba(e.c.accent2, 0)); g.fillStyle = gr; g.beginPath(); g.arc(f.x, f.y, 26, 0, TAU); g.fill(); }
      },
      tap(x, y) {
        flash.push({ x, y, a: 1 });
        const near = traces.map(tr => { let best = Infinity, bd = 0; tr.pts.forEach(([px, py], i) => { const d = Math.hypot(px - x, py - y); if (d < best) { best = d; bd = tr.cum[i]; } }); return { tr, best, bd }; })
          .filter(o => o.best < 80).sort((a, b) => a.best - b.best).slice(0, 5);
        for (const o of near) pulses.push(newPulse(o.tr, o.bd));
      },
    };
  },

  // Corrida: linhas de velocidade cruzando a capa; o toque dá uma arrancada.
  pista(e) {
    type L = { x: number; y: number; len: number; sp: number; w: number; col: string; a: number };
    const cols = [e.c.accent, e.c.accent2, '#ffffff'];
    const make = (fromRight = true): L => ({ x: fromRight ? e.w + rnd(0, e.w) : rnd(-e.w * 0.2, e.w), y: rnd(e.h * 0.08, e.h * 0.96), len: rnd(50, 190), sp: rnd(420, 900), w: rnd(1, 2.6), col: pick(cols), a: rnd(0.25, 0.7) });
    const ls: L[] = []; for (let i = 0; i < Math.round(22 * e.k); i++) ls.push(make(false));
    let boost = 0;
    return {
      step(dt) {
        boost = Math.max(0, boost - dt * 1.6);
        for (let i = 0; i < ls.length; i++) { const l = ls[i]; l.x -= l.sp * (1 + boost * 2.2) * dt; if (l.x + l.len < -20) ls[i] = make(true); }
        if (ls.length > 60) ls.splice(0, ls.length - 60);
      },
      draw(g) {
        g.lineCap = 'round';
        for (const l of ls) {
          const len = l.len * (1 + boost * 1.4), dy = len * 0.14;
          const gr = g.createLinearGradient(l.x, l.y, l.x + len, l.y + dy);
          gr.addColorStop(0, rgba(l.col, l.a)); gr.addColorStop(1, rgba(l.col, 0));
          g.strokeStyle = gr; g.lineWidth = l.w; g.beginPath(); g.moveTo(l.x, l.y); g.lineTo(l.x + len, l.y + dy); g.stroke();
        }
      },
      tap(x, y) { boost = 1; for (let i = 0; i < 10; i++) { const l = make(false); l.x = x + rnd(-30, 60); l.y = y + rnd(-60, 60); l.sp *= 1.4; ls.push(l); } },
    };
  },

  // Moda: flashes de fotógrafo e paetês brilhando; o toque dispara um flash.
  flash(e) {
    type F = { x: number; y: number; t: number; max: number; s: number };
    type S = { x: number; y: number; vy: number; ph: number; s: number };
    const fl: F[] = [], sq: S[] = [];
    for (let i = 0; i < Math.round(26 * e.k); i++) sq.push({ x: rnd(0, e.w), y: rnd(0, e.h), vy: rnd(6, 16), ph: rnd(0, TAU), s: rnd(1.4, 3.2) });
    let next = 0.6;
    const pop = (x = rnd(e.w * 0.1, e.w * 0.9), y = rnd(e.h * 0.08, e.h * 0.7), s = rnd(40, 90)) => fl.push({ x, y, t: 0, max: 0.55, s });
    const gold = mix(e.c.accent2, '#ffffff', 0.3);
    return {
      step(dt) {
        next -= dt; if (next <= 0) { pop(); next = rnd(0.8, 2.2); }
        for (let i = fl.length - 1; i >= 0; i--) { fl[i].t += dt; if (fl[i].t > fl[i].max) fl.splice(i, 1); }
        for (const p of sq) { p.y += p.vy * dt; p.ph += dt * 3; if (p.y > e.h + 6) { p.y = -6; p.x = rnd(0, e.w); } }
      },
      draw(g) {
        for (const p of sq) {
          const a = 0.25 + 0.75 * Math.max(0, Math.sin(p.ph));
          g.fillStyle = rgba(gold, a * 0.9); g.beginPath(); g.moveTo(p.x, p.y - p.s); g.lineTo(p.x + p.s * 0.7, p.y); g.lineTo(p.x, p.y + p.s); g.lineTo(p.x - p.s * 0.7, p.y); g.closePath(); g.fill();
        }
        g.globalCompositeOperation = 'lighter';
        for (const f of fl) {
          const k = f.t / f.max, a = k < 0.15 ? k / 0.15 : 1 - (k - 0.15) / 0.85;
          const gr = g.createRadialGradient(f.x, f.y, 0, f.x, f.y, f.s);
          gr.addColorStop(0, rgba('#ffffff', 0.85 * a)); gr.addColorStop(0.25, rgba('#ffffff', 0.35 * a)); gr.addColorStop(1, rgba('#ffffff', 0));
          g.fillStyle = gr; g.beginPath(); g.arc(f.x, f.y, f.s, 0, TAU); g.fill();
          g.fillStyle = rgba('#ffffff', 0.9 * a); starPath(g, f.x, f.y, f.s * 0.55, 0.08); g.fill();
        }
      },
      tap(x, y) { pop(x, y, 110); },
    };
  },

  // Padaria: farinha flutuando no ar; o toque solta uma nuvem e arrastar faz vento.
  farinha(e) {
    type P = { x: number; y: number; vx: number; vy: number; r: number; a: number; ph: number; life: number; max: number };
    const dust = e.dark ? '#fff7ea' : mix(e.c.ink, '#ffffff', 0.72), husk = mix(e.c.accent2, e.c.ink, 0.15);
    const make = (x = rnd(0, e.w), y = rnd(0, e.h), puff = false): P => ({ x, y, vx: puff ? rnd(-90, 90) : rnd(-6, 6), vy: puff ? rnd(-80, 30) : rnd(4, 14), r: puff ? rnd(1.5, 4.5) : rnd(1, 3), a: rnd(0.25, 0.7), ph: rnd(0, TAU), life: 0, max: puff ? rnd(1.6, 3) : 1e9 });
    const ps: P[] = []; for (let i = 0; i < Math.round(60 * e.k); i++) ps.push(make());
    const husks = fallers(e, Math.round(7 * e.k), top => ({ x: rnd(0, e.w), y: top ? rnd(-40, -8) : rnd(0, e.h), vx: 0, vy: rnd(18, 30), rot: rnd(0, TAU), vr: rnd(-1.5, 1.5), ph: rnd(0, TAU), vph: rnd(1, 3), s: rnd(4, 6), col: husk, kind: 0 }));
    return {
      step(dt, t) {
        for (let i = ps.length - 1; i >= 0; i--) {
          const p = ps[i]; p.life += dt; p.ph += dt;
          p.x += (p.vx + Math.sin(t * 0.6 + p.ph) * 6) * dt; p.y += p.vy * dt; p.vx *= Math.pow(0.35, dt); p.vy += (8 - p.vy) * Math.min(1, dt * 0.8);
          if (p.life > p.max) { ps.splice(i, 1); continue; }
          if (p.y > e.h + 6 || p.x < -10 || p.x > e.w + 10) { ps[i] = make(rnd(0, e.w), -6); }
        }
        husks.step(dt, t, 10);
      },
      draw(g) {
        for (const p of ps) { const a = p.max < 1e9 ? p.a * (1 - p.life / p.max) : p.a; g.fillStyle = rgba(dust, a); g.beginPath(); g.arc(p.x, p.y, p.r, 0, TAU); g.fill(); }
        for (const p of husks.list) { g.save(); g.translate(p.x, p.y); g.rotate(p.rot); g.fillStyle = rgba(p.col, 0.8); g.beginPath(); g.ellipse(0, 0, p.s, p.s * 0.42, 0, 0, TAU); g.fill(); g.restore(); }
      },
      move(x, y, vx, vy) { for (const p of ps) { const d = Math.hypot(p.x - x, p.y - y); if (d < 100) { const f = 1 - d / 100; p.vx += vx * 0.25 * f; p.vy += vy * 0.12 * f; } } husks.push(x, y, vx, vy); },
      tap(x, y) { for (let i = 0; i < 26; i++) ps.push(make(x + rnd(-10, 10), y + rnd(-10, 10), true)); if (ps.length > 200) ps.splice(0, ps.length - 200); },
    };
  },

  // Imobiliária: uma planta baixa se desenhando por cima da foto, cômodo por cômodo.
  planta(e) {
    const W = e.w, H = Math.min(e.h, Math.max(260, e.w * 0.84));
    const col = '#ffffff';
    let segs: number[][] = [], prog = 0, hold = 0, fade = 1, pins: { x: number; y: number; t: number }[] = [];
    const build = () => {
      const x0 = W * rnd(0.1, 0.18), y0 = H * rnd(0.14, 0.22), w = W * rnd(0.62, 0.74), h = H * rnd(0.5, 0.62);
      const cx = x0 + w * rnd(0.42, 0.6), cy = y0 + h * rnd(0.45, 0.6), dx = x0 + w * rnd(0.22, 0.3);
      segs = [[x0, y0, x0 + w, y0], [x0 + w, y0, x0 + w, y0 + h], [x0 + w, y0 + h, x0, y0 + h], [x0, y0 + h, x0, y0],
        [cx, y0, cx, cy - 14], [cx, cy + 14, cx, y0 + h], [x0, cy, dx - 12, cy], [dx + 12, cy, x0 + w, cy],
        [x0 - 10, y0 - 14, x0 + w + 10, y0 - 14], [x0 - 14, y0, x0 - 14, y0 + h]];
      prog = 0; hold = 0; fade = 1;
    };
    build();
    const total = () => segs.reduce((a, [x1, y1, x2, y2]) => a + Math.hypot(x2 - x1, y2 - y1), 0);
    return {
      step(dt) {
        if (prog < 1) prog = Math.min(1, prog + dt * 0.28); else if (hold < 2.4) hold += dt; else { fade -= dt * 0.8; if (fade <= 0) build(); }
        for (let i = pins.length - 1; i >= 0; i--) { pins[i].t += dt; if (pins[i].t > 1.4) pins.splice(i, 1); }
      },
      draw(g) {
        const tot = total(); let left = prog * tot;
        g.lineCap = 'round';
        segs.forEach(([x1, y1, x2, y2], i) => {
          if (left <= 0) return;
          const len = Math.hypot(x2 - x1, y2 - y1), k = Math.min(1, left / len); left -= len;
          const dim = i >= 8;
          g.strokeStyle = rgba(col, (dim ? 0.38 : 0.62) * fade); g.lineWidth = dim ? 1 : 2.2; g.setLineDash(dim ? [4, 4] : []);
          g.beginPath(); g.moveTo(x1, y1); g.lineTo(x1 + (x2 - x1) * k, y1 + (y2 - y1) * k); g.stroke();
        });
        g.setLineDash([]);
        for (const p of pins) {
          const k = p.t / 1.4;
          g.strokeStyle = rgba(e.c.accent2, 0.8 * (1 - k)); g.lineWidth = 2; g.beginPath(); g.arc(p.x, p.y, 8 + k * 36, 0, TAU); g.stroke();
          g.fillStyle = rgba(e.c.accent2, 0.95 * (1 - k * 0.6)); g.beginPath(); g.arc(p.x, p.y - 12, 7, Math.PI * 0.85, Math.PI * 2.15); g.lineTo(p.x, p.y); g.closePath(); g.fill();
          g.fillStyle = rgba('#ffffff', 0.95 * (1 - k * 0.6)); g.beginPath(); g.arc(p.x, p.y - 12, 2.6, 0, TAU); g.fill();
        }
      },
      tap(x, y) { pins.push({ x, y, t: 0 }); },
    };
  },

  // Loja de carros: rastros de faróis e lanternas cruzando a noite; o toque acende o farol alto.
  farois(e) {
    type T = { x: number; y: number; len: number; sp: number; dir: 1 | -1; w: number };
    const make = (anywhere = false): T => { const dir = Math.random() < 0.5 ? 1 : -1; return { dir, x: anywhere ? rnd(0, e.w) : dir > 0 ? rnd(-e.w, -40) : e.w + rnd(40, e.w), y: e.h * rnd(0.5, 0.92), len: rnd(80, 220), sp: rnd(160, 380), w: rnd(1.5, 3.5) }; };
    const ts: T[] = []; for (let i = 0; i < Math.round(14 * e.k); i++) ts.push(make(true));
    const bokeh = Array.from({ length: Math.round(12 * e.k) }, () => ({ x: rnd(0, e.w), y: rnd(e.h * 0.05, e.h * 0.6), r: rnd(6, 18), ph: rnd(0, TAU), c: Math.random() < 0.5 ? e.c.accent : '#ffd9a0' }));
    let beam = 0;
    return {
      step(dt) {
        beam = Math.max(0, beam - dt * 1.2);
        for (let i = 0; i < ts.length; i++) { const t = ts[i]; t.x += t.dir * t.sp * dt; if ((t.dir > 0 && t.x - t.len > e.w + 20) || (t.dir < 0 && t.x + t.len < -20)) ts[i] = make(); }
        for (const b of bokeh) b.ph += dt * 0.8;
      },
      draw(g) {
        for (const b of bokeh) { const a = 0.08 + 0.1 * (1 + Math.sin(b.ph)) / 2; const gr = g.createRadialGradient(b.x, b.y, 0, b.x, b.y, b.r); gr.addColorStop(0, rgba(b.c, a)); gr.addColorStop(1, rgba(b.c, 0)); g.fillStyle = gr; g.beginPath(); g.arc(b.x, b.y, b.r, 0, TAU); g.fill(); }
        g.globalCompositeOperation = 'lighter'; g.lineCap = 'round';
        for (const t of ts) {
          const col = t.dir > 0 ? '#fff4d6' : '#ff2a1a';
          const x2 = t.x - t.dir * t.len;
          const gr = g.createLinearGradient(t.x, t.y, x2, t.y); gr.addColorStop(0, rgba(col, 0.85)); gr.addColorStop(1, rgba(col, 0));
          g.strokeStyle = gr; g.lineWidth = t.w; g.beginPath(); g.moveTo(t.x, t.y); g.lineTo(x2, t.y); g.stroke();
        }
        if (beam > 0) { const gr = g.createRadialGradient(e.w / 2, e.h * 0.4, 0, e.w / 2, e.h * 0.4, e.w * 0.8); gr.addColorStop(0, rgba('#ffffff', 0.32 * beam)); gr.addColorStop(1, rgba('#ffffff', 0)); g.fillStyle = gr; g.fillRect(0, 0, e.w, e.h); }
      },
      tap(x, y) { beam = 1; for (let i = 0; i < 4; i++) { const t = make(); t.y = clamp(y + rnd(-30, 30), 0, e.h); ts.push(t); } if (ts.length > 40) ts.splice(0, ts.length - 40); },
    };
  },

  // Produtos naturais: folhas caindo e girando; arrastar o dedo faz vento.
  folhas(e) {
    const greens = [e.c.fx1, mix(e.c.fx1, '#2d4a1f', 0.35), e.c.fx3, mix(e.c.fx2, e.c.fx1, 0.5)];
    const make = (top: boolean): Fall => ({ x: rnd(0, e.w), y: top ? rnd(-60, -10) : rnd(0, e.h), vx: rnd(-8, 8), vy: rnd(22, 40), rot: rnd(0, TAU), vr: rnd(-1.6, 1.6), ph: rnd(0, TAU), vph: rnd(1.5, 3.5), s: rnd(8, 15), col: pick(greens), kind: Math.random() < 0.15 ? 1 : 0 });
    const f = fallers(e, Math.round(20 * e.k), make);
    return {
      step(dt, t) { f.step(dt, t, 18); },
      draw(g) {
        for (const p of f.list) {
          g.save(); g.translate(p.x, p.y); g.rotate(p.rot);
          if (p.kind === 0) {
            g.scale(1, 0.3 + 0.7 * Math.abs(Math.cos(p.ph)));
            leafPath(g, p.s); g.fillStyle = rgba(p.col, 0.92); g.fill();
            g.strokeStyle = rgba(mix(p.col, '#1d2a14', 0.55), 0.7); g.lineWidth = 1; g.beginPath(); g.moveTo(-p.s * 0.85, 0); g.lineTo(p.s * 0.85, 0); g.stroke();
          } else { g.fillStyle = rgba(e.c.accent2, 0.85); g.beginPath(); g.ellipse(0, 0, p.s * 0.32, p.s * 0.2, 0, 0, TAU); g.fill(); }
          g.restore();
        }
      },
      move(x, y, vx, vy) { f.push(x, y, vx, vy, 120); },
      tap(x, y) { f.push(x, y, rnd(-600, 600), -200, 140); },
    };
  },
};

function roundRect(g: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number) {
  g.beginPath(); g.moveTo(x + r, y); g.arcTo(x + w, y, x + w, y + h, r); g.arcTo(x + w, y + h, x, y + h, r); g.arcTo(x, y + h, x, y, r); g.arcTo(x, y, x + w, y, r); g.closePath();
}

export function fxColors(vars: Record<string, string | number>): FxColors {
  const v = (k: string, d: string) => String(vars[k] ?? d);
  return { bg: v('--bg', '#ffffff'), ink: v('--ink', '#111111'), accent: v('--accent', '#2a6bff'), accent2: v('--accent2', '#7a5cff'), fx1: v('--fx1', '#2a6bff'), fx2: v('--fx2', '#7a5cff'), fx3: v('--fx3', '#16bfd6') };
}

export default function NicheFx({ kind, colors, thumb = false }: { kind: FxKind; colors: FxColors; thumb?: boolean }) {
  const ref = useRef<HTMLCanvasElement>(null);
  const key = `${kind}|${colors.bg}|${colors.ink}|${colors.accent}|${colors.accent2}|${colors.fx1}|${colors.fx2}|${colors.fx3}|${thumb}`;
  useEffect(() => {
    const cv = ref.current, host = cv?.parentElement;
    const g = cv?.getContext('2d');
    if (!cv || !host || !g || !SCENES[kind]) return;
    const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
    const dpr = Math.min(window.devicePixelRatio || 1, thumb ? 1 : 1.5);
    const env: Env = { w: 0, h: 0, thumb, dark: lum(colors.bg) < 0.4, k: thumb ? 0.6 : 1, c: colors };
    let scene: Scene | null = null, raf = 0, visible = true, last = 0, t = 0, acc = 0, builtW = 0;
    const paint = () => { if (!scene) return; g.setTransform(dpr, 0, 0, dpr, 0, 0); g.clearRect(0, 0, env.w, env.h); g.globalCompositeOperation = 'source-over'; scene.draw(g, t); };
    const size = () => {
      const w = host.clientWidth, h = host.clientHeight;
      if (!w || !h) return;
      env.w = w; env.h = h;
      cv.width = Math.round(w * dpr); cv.height = Math.round(h * dpr);
      if (!scene || Math.abs(w - builtW) > 40) {
        builtW = w; scene = SCENES[kind](env);
        if (reduce) { for (let i = 0; i < 150; i++) { t += 1 / 60; scene.step(1 / 60, t); } }
      }
      paint();
    };
    const frame = (now: number) => {
      raf = 0;
      if (!visible || document.hidden || !scene) return;
      let dt = Math.min(0.05, last ? (now - last) / 1000 : 1 / 60); last = now;
      if (thumb) { acc += dt; if (acc < 1 / 30) { raf = requestAnimationFrame(frame); return; } dt = Math.min(0.06, acc); acc = 0; }
      t += dt; scene.step(dt, t); paint();
      raf = requestAnimationFrame(frame);
    };
    const start = () => { if (!raf && visible && !document.hidden && !reduce && scene) { last = 0; raf = requestAnimationFrame(frame); } };
    size();
    const ro = 'ResizeObserver' in window ? new ResizeObserver(() => size()) : null;
    ro?.observe(host);
    const io = 'IntersectionObserver' in window ? new IntersectionObserver(([en]) => { visible = en.isIntersecting; if (visible) start(); }, { rootMargin: '60px' }) : null;
    io?.observe(host);
    const onVis = () => { if (!document.hidden) start(); };
    document.addEventListener('visibilitychange', onVis);
    // Toque e arrasto: coordenadas convertidas para a capa (funciona dentro de miniaturas escaladas).
    let lp: { x: number; y: number; time: number } | null = null;
    const point = (ev: PointerEvent) => { const r = cv.getBoundingClientRect(); return { x: (ev.clientX - r.left) * (env.w / (r.width || 1)), y: (ev.clientY - r.top) * (env.h / (r.height || 1)) }; };
    const down = (ev: PointerEvent) => { if (!scene || reduce) return; const p = point(ev); lp = { ...p, time: performance.now() }; scene.tap?.(p.x, p.y); start(); };
    const move = (ev: PointerEvent) => {
      if (!scene?.move || reduce) return;
      if (ev.pointerType !== 'mouse' && !ev.buttons && !ev.pressure) return;
      const p = point(ev), now = performance.now();
      const dt = lp ? Math.max(8, now - lp.time) / 1000 : 0.016;
      const vx = lp ? (p.x - lp.x) / dt : 0, vy = lp ? (p.y - lp.y) / dt : 0;
      lp = { ...p, time: now };
      scene.move(p.x, p.y, clamp(vx, -2000, 2000), clamp(vy, -2000, 2000));
    };
    if (!thumb) { host.addEventListener('pointerdown', down, { passive: true }); host.addEventListener('pointermove', move, { passive: true }); }
    start();
    return () => {
      cancelAnimationFrame(raf); ro?.disconnect(); io?.disconnect(); document.removeEventListener('visibilitychange', onVis);
      host.removeEventListener('pointerdown', down); host.removeEventListener('pointermove', move);
    };
  }, [key]);
  return <canvas ref={ref} className="mini-nichefx" aria-hidden="true" />;
}
