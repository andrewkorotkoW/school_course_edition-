import { MAP_HEIGHT, MAP_WIDTH, type ParkRoute } from "./parkRoute";

// Процедурная иллюстрация-заглушка ночного парка. Рисуется один раз в <canvas> при
// монтировании ParkBoard. В проде её место займёт один большой webp от художника
// (той же геометрии 2000×1100) — компонент и маршрут от этого не меняются.

const FONT = '-apple-system, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif';

const C = {
  skyTop: "#121637",
  skyMid: "#2a2a6a",
  skyHor: "#5b3f86",
  grass: "#1f3c4a",
  grass2: "#27495a",
  path: "#8f7a64",
  pathEdge: "#5b4a3c",
  warm: "#ffd27a",
  orange: "#ff7a3d",
  green: "#2fa88a",
  yellow: "#ffc94d",
  pink: "#ff6fa3",
  cyan: "#6fd9ff",
};

type Ctx = CanvasRenderingContext2D;

const rnd = (seed: number) => {
  const x = Math.sin(seed * 12.9898 + 78.233) * 43758.5453;
  return x - Math.floor(x);
};

const hexToRgb = (hex: string) => {
  const n = parseInt(hex.slice(1), 16);
  return [n >> 16, (n >> 8) & 255, n & 255] as const;
};

function glow(c: Ctx, x: number, y: number, r: number, hex: string, alpha: number) {
  const [rr, gg, bb] = hexToRgb(hex);
  const g = c.createRadialGradient(x, y, 0, x, y, r);
  g.addColorStop(0, `rgba(${rr},${gg},${bb},${alpha})`);
  g.addColorStop(1, `rgba(${rr},${gg},${bb},0)`);
  c.fillStyle = g;
  c.beginPath();
  c.arc(x, y, r, 0, Math.PI * 2);
  c.fill();
}

function bulbs(c: Ctx, x0: number, y0: number, x1: number, y1: number, n: number, cols: string[], sag: number) {
  for (let i = 0; i <= n; i++) {
    const t = i / n;
    const x = x0 + (x1 - x0) * t;
    const y = y0 + (y1 - y0) * t + Math.sin(t * Math.PI) * sag;
    const col = cols[i % cols.length];
    glow(c, x, y, 10, col === "#fff" ? "#ffffff" : col, 0.35);
    c.fillStyle = col;
    c.beginPath();
    c.arc(x, y, 2.8, 0, Math.PI * 2);
    c.fill();
  }
}

function wire(c: Ctx, x0: number, y0: number, x1: number, y1: number, sag: number) {
  c.strokeStyle = "rgba(0,0,0,.45)";
  c.lineWidth = 1.3;
  c.beginPath();
  c.moveTo(x0, y0);
  c.quadraticCurveTo((x0 + x1) / 2, (y0 + y1) / 2 + sag * 2, x1, y1);
  c.stroke();
}

function ferris(c: Ctx, x: number, y: number, R: number) {
  glow(c, x, y, R * 1.5, "#ff78b4", 0.18);
  c.strokeStyle = "#3b2d5c";
  c.lineWidth = 8;
  c.beginPath();
  c.moveTo(x - R * 0.9, y + R + 44);
  c.lineTo(x, y);
  c.lineTo(x + R * 0.9, y + R + 44);
  c.stroke();
  c.strokeStyle = "#6f5a9a";
  c.lineWidth = 3;
  for (let i = 0; i < 12; i++) {
    const a = (i / 12) * Math.PI * 2;
    c.beginPath();
    c.moveTo(x, y);
    c.lineTo(x + Math.cos(a) * R, y + Math.sin(a) * R);
    c.stroke();
  }
  c.strokeStyle = "#8a74c0";
  c.lineWidth = 6;
  c.beginPath();
  c.arc(x, y, R, 0, Math.PI * 2);
  c.stroke();
  const cols = [C.pink, C.yellow, C.cyan, C.green, C.orange];
  for (let i = 0; i < 12; i++) {
    const a = (i / 12) * Math.PI * 2;
    const gx = x + Math.cos(a) * R;
    const gy = y + Math.sin(a) * R;
    glow(c, gx, gy, 18, cols[i % 5], 0.35);
    c.fillStyle = cols[i % 5];
    c.beginPath();
    c.roundRect(gx - 12, gy - 2, 24, 18, 6);
    c.fill();
    c.fillStyle = "rgba(255,255,255,.35)";
    c.fillRect(gx - 8, gy + 2, 16, 6);
  }
  for (let i = 0; i < 40; i++) {
    const a = (i / 40) * Math.PI * 2;
    c.fillStyle = i % 2 ? C.warm : "#fff";
    c.beginPath();
    c.arc(x + Math.cos(a) * R, y + Math.sin(a) * R, 2, 0, Math.PI * 2);
    c.fill();
  }
  c.fillStyle = "#2a2050";
  c.beginPath();
  c.arc(x, y, 10, 0, Math.PI * 2);
  c.fill();
  c.fillStyle = C.yellow;
  c.beginPath();
  c.arc(x, y, 4.5, 0, Math.PI * 2);
  c.fill();
}

function coaster(c: Ctx, x: number, y: number, len: number) {
  const prof = (t: number) => y - (Math.sin(t * Math.PI * 1.5) * 70 + Math.sin(t * 6) * 12 + 70) * (1 - t * 0.2);
  c.strokeStyle = "#2c3d66";
  c.lineWidth = 3;
  for (let i = 0; i <= 16; i++) {
    const t = i / 16;
    const px = x + t * len;
    c.beginPath();
    c.moveTo(px, prof(t));
    c.lineTo(px, y + 12);
    c.stroke();
  }
  c.strokeStyle = "#7fb3ff";
  c.lineWidth = 7;
  c.beginPath();
  for (let i = 0; i <= 70; i++) {
    const t = i / 70;
    c.lineTo(x + t * len, prof(t));
  }
  c.stroke();
  c.strokeStyle = "#1c2a4a";
  c.lineWidth = 2;
  c.beginPath();
  for (let i = 0; i <= 70; i++) {
    const t = i / 70;
    c.lineTo(x + t * len, prof(t) + 7);
  }
  c.stroke();
  for (let k = 0; k < 3; k++) {
    const t = 0.3 + k * 0.05;
    const px = x + t * len;
    const py = prof(t) - 9;
    glow(c, px, py, 16, C.orange, 0.3);
    c.fillStyle = k ? C.yellow : C.orange;
    c.beginPath();
    c.roundRect(px - 12, py - 7, 24, 14, 4);
    c.fill();
  }
}

function horse(c: Ctx, x: number, y: number, col: string) {
  c.strokeStyle = "#f3e3c3";
  c.lineWidth = 2.5;
  c.beginPath();
  c.moveTo(x, y - 36);
  c.lineTo(x, y + 14);
  c.stroke();
  c.fillStyle = col;
  c.beginPath();
  c.ellipse(x, y, 14, 7.5, 0, 0, Math.PI * 2);
  c.fill();
  c.beginPath();
  c.ellipse(x + 12, y - 10, 6.5, 5, -0.5, 0, Math.PI * 2);
  c.fill();
  c.fillRect(x + 7, y - 12, 4, 9);
  c.strokeStyle = col;
  c.lineWidth = 2.5;
  for (const dx of [-8, -3, 4, 9]) {
    c.beginPath();
    c.moveTo(x + dx, y + 5);
    c.lineTo(x + dx - 1, y + 15);
    c.stroke();
  }
  c.strokeStyle = "#c96a8a";
  c.lineWidth = 2;
  c.beginPath();
  c.moveTo(x - 13, y - 2);
  c.quadraticCurveTo(x - 21, y + 2, x - 17, y + 9);
  c.stroke();
  c.fillStyle = "#3a2e26";
  c.beginPath();
  c.arc(x + 14, y - 11, 1.2, 0, Math.PI * 2);
  c.fill();
}

function carousel(c: Ctx, x: number, y: number) {
  glow(c, x, y - 34, 100, "#ffd278", 0.22);
  c.fillStyle = "#4a3466";
  c.beginPath();
  c.ellipse(x, y + 20, 86, 22, 0, 0, Math.PI * 2);
  c.fill();
  c.fillStyle = "#6a4f8c";
  c.beginPath();
  c.ellipse(x, y + 11, 86, 22, 0, 0, Math.PI * 2);
  c.fill();
  c.strokeStyle = "#f3e3c3";
  c.lineWidth = 3;
  for (const dx of [-56, -22, 22, 56]) {
    c.beginPath();
    c.moveTo(x + dx, y + 13);
    c.lineTo(x + dx, y - 50);
    c.stroke();
  }
  const horses: Array<[string, number]> = [["#fff1d6", -56], ["#ffc2d9", -19], ["#cfe9ff", 19], ["#ffe39a", 56]];
  horses.forEach(([col, dx], i) => horse(c, x + dx, y - 10 + (i % 2) * 4, col));
  c.fillStyle = "#ffe9b8";
  c.beginPath();
  c.ellipse(x, y - 50, 88, 20, 0, 0, Math.PI * 2);
  c.fill();
  const roof = c.createLinearGradient(x - 88, 0, x + 88, 0);
  roof.addColorStop(0, "#ff6fa3");
  roof.addColorStop(0.5, "#fff0c8");
  roof.addColorStop(1, "#ff6fa3");
  c.fillStyle = roof;
  c.beginPath();
  c.moveTo(x - 90, y - 50);
  c.lineTo(x, y - 122);
  c.lineTo(x + 90, y - 50);
  c.closePath();
  c.fill();
  c.strokeStyle = "rgba(120,40,80,.5)";
  c.lineWidth = 1.5;
  for (let i = -3; i <= 3; i++) {
    c.beginPath();
    c.moveTo(x, y - 122);
    c.lineTo(x + i * 26, y - 50);
    c.stroke();
  }
  bulbs(c, x - 90, y - 50, x + 90, y - 50, 13, [C.warm, "#fff"], 0);
  c.fillStyle = C.yellow;
  c.beginPath();
  c.moveTo(x, y - 140);
  c.lineTo(x + 18, y - 131);
  c.lineTo(x, y - 122);
  c.fill();
}

function duck(c: Ctx, x: number, y: number) {
  c.fillStyle = "#ffd84d";
  c.beginPath();
  c.ellipse(x, y, 12, 7.5, 0, 0, Math.PI * 2);
  c.fill();
  c.beginPath();
  c.arc(x + 9, y - 9, 6.5, 0, Math.PI * 2);
  c.fill();
  c.fillStyle = "#ff8a3d";
  c.beginPath();
  c.moveTo(x + 14, y - 9);
  c.lineTo(x + 22, y - 7);
  c.lineTo(x + 14, y - 5);
  c.fill();
  c.fillStyle = "#3a2e26";
  c.beginPath();
  c.arc(x + 10, y - 11, 1.4, 0, Math.PI * 2);
  c.fill();
}

function ring(c: Ctx, x: number, y: number) {
  c.lineWidth = 8;
  c.strokeStyle = "#fff";
  c.beginPath();
  c.ellipse(x, y, 14, 9, 0, 0, Math.PI * 2);
  c.stroke();
  c.strokeStyle = "#e8463a";
  for (let i = 0; i < 4; i++) {
    c.beginPath();
    c.ellipse(x, y, 14, 9, 0, (i * Math.PI) / 2, (i * Math.PI) / 2 + 0.7);
    c.stroke();
  }
}

function pool(c: Ctx, x: number, y: number) {
  c.fillStyle = "#2f5f78";
  c.beginPath();
  c.ellipse(x, y + 7, 150, 54, 0, 0, Math.PI * 2);
  c.fill();
  const w = c.createRadialGradient(x - 40, y - 12, 10, x, y, 150);
  w.addColorStop(0, "#8fd8ea");
  w.addColorStop(1, "#3f8db0");
  c.fillStyle = w;
  c.beginPath();
  c.ellipse(x, y, 140, 46, 0, 0, Math.PI * 2);
  c.fill();
  c.strokeStyle = "rgba(255,255,255,.55)";
  c.lineWidth = 2;
  for (let i = 0; i < 5; i++) {
    c.beginPath();
    c.ellipse(x - 70 + i * 34, y - 8 + (i % 2) * 12, 20, 6, 0, 0, Math.PI * 2);
    c.stroke();
  }
  duck(c, x + 70, y + 6);
  ring(c, x - 85, y + 2);
  c.fillStyle = "#5b4a7a";
  c.fillRect(x + 118, y - 150, 16, 148);
  c.fillStyle = "#7a67a0";
  c.fillRect(x + 108, y - 160, 36, 16);
  c.strokeStyle = "#36b1a8";
  c.lineWidth = 18;
  c.lineCap = "round";
  c.beginPath();
  c.moveTo(x + 126, y - 146);
  c.bezierCurveTo(x + 210, y - 136, x + 200, y - 50, x + 110, y - 62);
  c.bezierCurveTo(x + 30, y - 74, x + 50, y + 12, x + 86, y - 2);
  c.stroke();
  c.strokeStyle = "rgba(255,255,255,.35)";
  c.lineWidth = 4;
  c.beginPath();
  c.moveTo(x + 126, y - 150);
  c.bezierCurveTo(x + 210, y - 140, x + 200, y - 54, x + 110, y - 66);
  c.stroke();
  c.lineCap = "butt";
}

function tree(c: Ctx, x: number, y: number, s: number, dark: boolean) {
  c.fillStyle = dark ? "#16343a" : "#1f4a46";
  c.beginPath();
  c.ellipse(x, y + 2, 17 * s, 5 * s, 0, 0, Math.PI * 2);
  c.fill();
  c.fillStyle = "#5a3e2a";
  c.fillRect(x - 3 * s, y - 17 * s, 6 * s, 19 * s);
  const g = c.createRadialGradient(x - 6 * s, y - 38 * s, 2, x, y - 32 * s, 26 * s);
  g.addColorStop(0, dark ? "#2f6b55" : "#3f8a66");
  g.addColorStop(1, dark ? "#153a33" : "#1d4d40");
  c.fillStyle = g;
  c.beginPath();
  c.arc(x, y - 32 * s, 23 * s, 0, Math.PI * 2);
  c.arc(x - 15 * s, y - 21 * s, 16 * s, 0, Math.PI * 2);
  c.arc(x + 15 * s, y - 23 * s, 16 * s, 0, Math.PI * 2);
  c.fill();
}

function lamp(c: Ctx, x: number, y: number) {
  glow(c, x, y - 76, 105, "#ffd282", 0.22);
  c.fillStyle = "rgba(255,215,140,.12)";
  c.beginPath();
  c.ellipse(x, y, 66, 20, 0, 0, Math.PI * 2);
  c.fill();
  c.strokeStyle = "#2c2440";
  c.lineWidth = 3.5;
  c.beginPath();
  c.moveTo(x, y);
  c.lineTo(x, y - 76);
  c.stroke();
  c.fillStyle = "#2c2440";
  c.beginPath();
  c.roundRect(x - 8, y - 92, 16, 18, 3);
  c.fill();
  c.fillStyle = C.warm;
  c.beginPath();
  c.roundRect(x - 6, y - 90, 12, 14, 2);
  c.fill();
}

function cottonCandy(c: Ctx, x: number, y: number) {
  c.strokeStyle = "#fff";
  c.lineWidth = 2;
  c.beginPath();
  c.moveTo(x, y + 13);
  c.lineTo(x, y - 4);
  c.stroke();
  c.fillStyle = "#ffb3d1";
  for (const [dx, dy, r] of [[0, -9, 9], [-7, -4, 6.5], [7, -3, 6.5], [0, -16, 5.5]]) {
    c.beginPath();
    c.arc(x + dx, y + dy, r, 0, Math.PI * 2);
    c.fill();
  }
}

function iceCream(c: Ctx, x: number, y: number) {
  c.fillStyle = "#e0a060";
  c.beginPath();
  c.moveTo(x - 7, y - 2);
  c.lineTo(x + 7, y - 2);
  c.lineTo(x, y + 15);
  c.fill();
  c.fillStyle = "#fff6e5";
  c.beginPath();
  c.arc(x, y - 7, 7.5, 0, Math.PI * 2);
  c.fill();
  c.fillStyle = "#ff8fb3";
  c.beginPath();
  c.arc(x - 3, y - 13, 5.5, 0, Math.PI * 2);
  c.fill();
  c.fillStyle = "#7dd6c4";
  c.beginPath();
  c.arc(x + 4, y - 13, 5.5, 0, Math.PI * 2);
  c.fill();
}

function booth(c: Ctx, x: number, y: number) {
  glow(c, x, y - 34, 70, "#ffc8e6", 0.2);
  c.fillStyle = "#5c2f5a";
  c.fillRect(x - 38, y - 44, 76, 46);
  c.fillStyle = "#ffd6ea";
  c.fillRect(x - 33, y - 40, 66, 20);
  const aw = c.createLinearGradient(x - 44, 0, x + 44, 0);
  for (let i = 0; i <= 8; i++) aw.addColorStop(i / 8, i % 2 ? "#fff" : C.pink);
  c.fillStyle = aw;
  c.beginPath();
  c.moveTo(x - 46, y - 44);
  c.lineTo(x + 46, y - 44);
  c.lineTo(x + 40, y - 60);
  c.lineTo(x - 40, y - 60);
  c.fill();
  cottonCandy(c, x - 17, y - 22);
  iceCream(c, x + 15, y - 22);
}

function fountain(c: Ctx, x: number, y: number) {
  glow(c, x, y - 22, 70, "#8cd2ff", 0.25);
  c.fillStyle = "#4e5f8a";
  c.beginPath();
  c.ellipse(x, y, 52, 18, 0, 0, Math.PI * 2);
  c.fill();
  c.fillStyle = "#7fc8e8";
  c.beginPath();
  c.ellipse(x, y - 3, 43, 12, 0, 0, Math.PI * 2);
  c.fill();
  c.fillStyle = "#6b7aa8";
  c.fillRect(x - 5, y - 40, 10, 38);
  c.beginPath();
  c.ellipse(x, y - 40, 16, 5.5, 0, 0, Math.PI * 2);
  c.fill();
  c.strokeStyle = "rgba(190,235,255,.9)";
  c.lineWidth = 2.5;
  for (const k of [-1, 1]) {
    c.beginPath();
    c.moveTo(x, y - 44);
    c.quadraticCurveTo(x + k * 28, y - 58, x + k * 34, y - 8);
    c.stroke();
  }
  c.beginPath();
  c.moveTo(x, y - 44);
  c.lineTo(x, y - 62);
  c.stroke();
}

function bench(c: Ctx, x: number, y: number) {
  c.fillStyle = "#5a3e2a";
  c.fillRect(x - 20, y - 11, 40, 5);
  c.fillRect(x - 20, y - 22, 40, 4);
  c.fillRect(x - 17, y - 6, 3, 8);
  c.fillRect(x + 14, y - 6, 3, 8);
  c.fillRect(x - 17, y - 22, 3, 11);
  c.fillRect(x + 14, y - 22, 3, 11);
  c.fillStyle = "#8a5f3f";
  c.fillRect(x - 20, y - 12, 40, 2);
}

function tent(c: Ctx, x: number, y: number) {
  glow(c, x, y - 44, 80, "#ff7878", 0.2);
  c.fillStyle = "#b53a4a";
  c.fillRect(x - 50, y - 38, 100, 38);
  for (let i = 0; i < 4; i++) {
    c.fillStyle = "#fff0e0";
    c.fillRect(x - 50 + i * 27, y - 38, 12, 38);
  }
  c.beginPath();
  c.moveTo(x - 58, y - 38);
  c.lineTo(x, y - 104);
  c.lineTo(x + 58, y - 38);
  c.closePath();
  c.fillStyle = "#e04a5a";
  c.fill();
  c.fillStyle = "#fff0e0";
  for (let i = -2; i <= 2; i += 2) {
    c.beginPath();
    c.moveTo(x, y - 104);
    c.lineTo(x + i * 14 - 6, y - 38);
    c.lineTo(x + i * 14 + 6, y - 38);
    c.fill();
  }
  c.fillStyle = "#3a2440";
  c.beginPath();
  c.moveTo(x - 11, y);
  c.lineTo(x, y - 22);
  c.lineTo(x + 11, y);
  c.fill();
  c.strokeStyle = "#fff";
  c.lineWidth = 2;
  c.beginPath();
  c.moveTo(x, y - 104);
  c.lineTo(x, y - 120);
  c.stroke();
  c.fillStyle = C.yellow;
  c.beginPath();
  c.moveTo(x, y - 120);
  c.lineTo(x + 16, y - 113);
  c.lineTo(x, y - 106);
  c.fill();
}

function car(c: Ctx, x: number, y: number, col: string) {
  c.fillStyle = "rgba(0,0,0,.35)";
  c.beginPath();
  c.ellipse(x, y + 11, 28, 8, 0, 0, Math.PI * 2);
  c.fill();
  c.fillStyle = col;
  c.beginPath();
  c.roundRect(x - 26, y - 6, 52, 17, 5);
  c.fill();
  c.beginPath();
  c.roundRect(x - 15, y - 19, 30, 15, 5);
  c.fill();
  c.fillStyle = "#bfe4ff";
  c.beginPath();
  c.roundRect(x - 12, y - 17, 11, 10, 2);
  c.fill();
  c.beginPath();
  c.roundRect(x + 1, y - 17, 11, 10, 2);
  c.fill();
  c.fillStyle = "#1b1b24";
  for (const dx of [-15, 15]) {
    c.beginPath();
    c.arc(x + dx, y + 11, 5.5, 0, Math.PI * 2);
    c.fill();
  }
  glow(c, x + 28, y + 1, 16, "#fff0c8", 0.5);
  c.fillStyle = "#fff6d0";
  c.beginPath();
  c.arc(x + 25, y + 1, 2.6, 0, Math.PI * 2);
  c.fill();
}

function parking(c: Ctx, x: number, y: number) {
  c.fillStyle = "#2b2d44";
  c.beginPath();
  c.roundRect(x - 150, y - 46, 300, 78, 12);
  c.fill();
  c.strokeStyle = "rgba(255,255,255,.25)";
  c.lineWidth = 2;
  for (let i = 0; i <= 5; i++) {
    c.beginPath();
    c.moveTo(x - 138 + i * 55, y - 40);
    c.lineTo(x - 138 + i * 55, y + 22);
    c.stroke();
  }
  const cars: Array<[string, number]> = [["#e8463a", -110], ["#3d8bff", -55], ["#ffc94d", 0], ["#5fcf9e", 55], ["#ff6fa3", 110]];
  cars.forEach(([col, dx]) => car(c, x + dx, y - 8, col));
}

function gate(c: Ctx, x: number, y: number, label: string) {
  c.strokeStyle = "#3d2b5e";
  c.lineWidth = 11;
  c.beginPath();
  c.moveTo(x - 100, y);
  c.lineTo(x - 100, y - 96);
  c.quadraticCurveTo(x, y - 170, x + 100, y - 96);
  c.lineTo(x + 100, y);
  c.stroke();
  c.fillStyle = "#4a3372";
  c.beginPath();
  c.roundRect(x - 86, y - 140, 172, 38, 10);
  c.fill();
  bulbs(c, x - 96, y - 102, x + 96, y - 102, 15, [C.warm, "#fff", C.yellow], 0);
  c.fillStyle = C.yellow;
  c.font = `800 18px ${FONT}`;
  c.textAlign = "center";
  c.fillText(label.toUpperCase(), x, y - 115);
  glow(c, x, y - 106, 80, C.yellow, 0.18);
}

function balloons(c: Ctx, x: number, y: number) {
  [C.pink, C.yellow, C.cyan].forEach((col, i) => {
    const bx = x + i * 13 - 13;
    const by = y - 32 - (i % 2) * 11;
    c.strokeStyle = "rgba(255,255,255,.4)";
    c.lineWidth = 1;
    c.beginPath();
    c.moveTo(x, y);
    c.lineTo(bx, by + 11);
    c.stroke();
    c.fillStyle = col;
    c.beginPath();
    c.ellipse(bx, by, 7.5, 9.5, 0, 0, Math.PI * 2);
    c.fill();
    c.fillStyle = "rgba(255,255,255,.5)";
    c.beginPath();
    c.arc(bx - 2, by - 3, 2, 0, Math.PI * 2);
    c.fill();
  });
}

function trophy(c: Ctx, x: number, y: number) {
  glow(c, x, y - 30, 60, C.yellow, 0.5);
  c.fillStyle = "#7a5a1e";
  c.fillRect(x - 16, y - 2, 32, 7);
  c.fillRect(x - 7, y - 14, 14, 12);
  const g = c.createLinearGradient(x - 18, 0, x + 18, 0);
  g.addColorStop(0, "#ffe08a");
  g.addColorStop(0.5, "#ffc94d");
  g.addColorStop(1, "#d19a1e");
  c.fillStyle = g;
  c.beginPath();
  c.moveTo(x - 18, y - 46);
  c.lineTo(x + 18, y - 46);
  c.quadraticCurveTo(x + 16, y - 12, x, y - 12);
  c.quadraticCurveTo(x - 16, y - 12, x - 18, y - 46);
  c.fill();
  c.strokeStyle = "#d19a1e";
  c.lineWidth = 3.5;
  for (const k of [-1, 1]) {
    c.beginPath();
    c.arc(x + k * 22, y - 36, 8, k > 0 ? -Math.PI / 2 : Math.PI / 2, k > 0 ? Math.PI / 2 : -Math.PI / 2, k < 0);
    c.stroke();
  }
  c.fillStyle = "rgba(255,255,255,.6)";
  c.fillRect(x - 11, y - 42, 4, 18);
}

function road(c: Ctx, route: ParkRoute) {
  const trace = () => {
    c.beginPath();
    c.moveTo(route.curve[0].x, route.curve[0].y);
    for (const p of route.curve) c.lineTo(p.x, p.y);
  };
  c.lineCap = "round";
  c.lineJoin = "round";
  trace();
  c.strokeStyle = "rgba(0,0,0,.35)";
  c.lineWidth = 50;
  c.stroke();
  trace();
  c.strokeStyle = C.pathEdge;
  c.lineWidth = 44;
  c.stroke();
  trace();
  c.strokeStyle = C.path;
  c.lineWidth = 36;
  c.stroke();
  for (let d = 0; d < route.total; d += 9) {
    const p = route.pointAt(d);
    const q = route.pointAt(d + 1);
    const a = Math.atan2(q.y - p.y, q.x - p.x);
    for (let k = -1; k <= 1; k++) {
      const ox = Math.cos(a + Math.PI / 2) * k * 11;
      const oy = Math.sin(a + Math.PI / 2) * k * 11;
      c.fillStyle = `rgba(${(150 + rnd(d + k) * 40) | 0},${(120 + rnd(d + k + 1) * 30) | 0},${(95 + rnd(d + k + 2) * 25) | 0},.9)`;
      c.beginPath();
      c.ellipse(p.x + ox, p.y + oy, 4.5, 3.2, a, 0, Math.PI * 2);
      c.fill();
    }
  }
  trace();
  c.strokeStyle = "rgba(255,220,160,.12)";
  c.lineWidth = 66;
  c.stroke();
}

export function drawParkIllustration(c: Ctx, route: ParkRoute, gateLabel: string) {
  const W = MAP_WIDTH;
  const H = MAP_HEIGHT;

  const sky = c.createLinearGradient(0, 0, 0, 440);
  sky.addColorStop(0, C.skyTop);
  sky.addColorStop(0.55, C.skyMid);
  sky.addColorStop(1, C.skyHor);
  c.fillStyle = sky;
  c.fillRect(0, 0, W, H);
  for (let i = 0; i < 260; i++) {
    c.fillStyle = `rgba(255,255,255,${0.3 + rnd(i + 70) * 0.6})`;
    c.beginPath();
    c.arc(rnd(i) * W, rnd(i + 500) * 330, 0.6 + rnd(i + 900) * 1.5, 0, Math.PI * 2);
    c.fill();
  }
  glow(c, 1720, 110, 110, "#fff0c8", 0.35);
  c.fillStyle = "#fff4cf";
  c.beginPath();
  c.arc(1720, 110, 40, 0, Math.PI * 2);
  c.fill();
  c.fillStyle = C.skyMid;
  c.beginPath();
  c.arc(1737, 100, 33, 0, Math.PI * 2);
  c.fill();

  c.fillStyle = "#1b2c52";
  c.beginPath();
  c.moveTo(0, 400);
  for (let x = 0; x <= W; x += 40) c.lineTo(x, 372 + Math.sin(x / 130) * 20 + Math.cos(x / 61) * 9);
  c.lineTo(W, 520);
  c.lineTo(0, 520);
  c.fill();
  c.fillStyle = "#16233f";
  for (let i = 0; i < 100; i++) {
    const x = i * 21;
    const h = 22 + rnd(i + 33) * 44;
    c.beginPath();
    c.moveTo(x, 418);
    c.lineTo(x + 10, 418 - h);
    c.lineTo(x + 20, 418);
    c.fill();
  }
  const ground = c.createLinearGradient(0, 380, 0, H);
  ground.addColorStop(0, "#223e58");
  ground.addColorStop(0.35, C.grass2);
  ground.addColorStop(1, C.grass);
  c.fillStyle = ground;
  c.beginPath();
  c.moveTo(0, 410);
  c.quadraticCurveTo(W / 2, 360, W, 412);
  c.lineTo(W, H);
  c.lineTo(0, H);
  c.fill();
  for (let i = 0; i < 70; i++) {
    c.fillStyle = "rgba(120,200,160,.05)";
    c.beginPath();
    c.ellipse(rnd(i + 7) * W, 440 + rnd(i + 19) * (H - 460), 50 + rnd(i) * 70, 16 + rnd(i + 3) * 20, 0, 0, Math.PI * 2);
    c.fill();
  }

  coaster(c, 820, 410, 560);
  ferris(c, 330, 250, 120);
  for (let i = 0; i < 24; i++) tree(c, 40 + i * 84 + rnd(i) * 20, 426 + rnd(i + 2) * 10, 0.7 + rnd(i + 5) * 0.3, true);
  carousel(c, 1700, 300);

  road(c, route);

  pool(c, 420, 740);
  fountain(c, 1000, 700);
  booth(c, 1330, 820);
  tent(c, 1800, 820);
  parking(c, 1700, 1010);
  gate(c, 1000, 1100, gateLabel);
  for (const [x, y] of [[150, 560], [700, 680], [1180, 620], [1560, 700], [400, 980], [1250, 980], [1900, 700], [860, 860]]) lamp(c, x, y);
  wire(c, 150, 490, 520, 470, 12);
  bulbs(c, 150, 492, 520, 472, 14, [C.pink, C.yellow, C.cyan, C.green], 22);
  wire(c, 1180, 530, 1560, 610, 12);
  bulbs(c, 1180, 532, 1560, 612, 15, [C.yellow, C.pink, "#fff"], 22);
  const trees: Array<[number, number, number]> = [[80, 660, 1.1], [1960, 640, 1], [1940, 900, 1.2], [60, 900, 1.2], [640, 760, 0.8], [1120, 800, 0.9], [300, 1040, 0.9], [1480, 940, 1], [1700, 760, 0.9], [560, 1050, 1]];
  for (const [x, y, s] of trees) tree(c, x, y, s, false);
  balloons(c, 760, 660);
  balloons(c, 1400, 740);
  bench(c, 620, 820);
  bench(c, 1100, 880);
  bench(c, 1600, 760);
  const finish = route.pointAt(route.total);
  trophy(c, finish.x, finish.y - 4);

  for (let i = 0; i < 7; i++) {
    const fog = c.createRadialGradient(150 + i * 300, 1040, 10, 150 + i * 300, 1040, 240);
    fog.addColorStop(0, "rgba(214,196,255,.14)");
    fog.addColorStop(1, "rgba(214,196,255,0)");
    c.fillStyle = fog;
    c.fillRect(0, 760, W, 340);
  }
  const vignette = c.createRadialGradient(W / 2, H / 2, H * 0.35, W / 2, H / 2, H * 1.05);
  vignette.addColorStop(0, "rgba(0,0,0,0)");
  vignette.addColorStop(1, "rgba(5,6,20,.55)");
  c.fillStyle = vignette;
  c.fillRect(0, 0, W, H);
}
