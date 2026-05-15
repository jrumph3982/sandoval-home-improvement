'use strict';

// ─────────────────────────────────────────────────────────────────────────────
// State
// ─────────────────────────────────────────────────────────────────────────────
const S = {
  mode: 'room',
  roomPts: [],
  roomDone: false,
  obs: [],          // [ [{x,y},...] ] — completed obstruction polygons
  cur: [],          // in-progress polygon points (feet)
  zoom: 30,         // px per foot
  ox: 60,           // canvas origin x offset (px) — world (0,0) maps here
  oy: 60,           // canvas origin y offset (px)
  snapX: 0,
  snapY: 0,
  hovObs: -1,       // hovered obstruction index in delete mode
  panning: false,
  panStartCx: 0, panStartCy: 0,
  panStartOx: 0, panStartOy: 0,
  obsNames: [],    // parallel to obs — name for each obstruction
  pendingObs: null, // polygon waiting for name modal
};

let labelHits = []; // rebuilt each draw() — [{lx, ly, pts, i, j}]
let hovLabel = null; // currently hovered label hit
let hovVert = null;  // {pts, i} — hovered vertex in move mode
let dragVert = null; // {pts, i} — vertex being dragged
let hovObsMove = -1; // obstruction index hovered for whole-shape drag
let dragObs = null;  // {idx, origPts, startSnapX, startSnapY}

// Touch state
let touchMoved = false, touchStartX = 0, touchStartY = 0;
let pinchStartDist = 0, pinchStartZoom = 0;
let panTwoFinger = false;
let panStartMidX = 0, panStartMidY = 0, panStartOxT = 0, panStartOyT = 0;

// ─────────────────────────────────────────────────────────────────────────────
// Canvas
// ─────────────────────────────────────────────────────────────────────────────
let canvas, ctx;

function setupCanvas() {
  canvas = document.getElementById('fp-canvas');
  ctx = canvas.getContext('2d');
  resizeCanvas();
  window.addEventListener('resize', resizeCanvas);
}

function resizeCanvas() {
  const wrap = document.getElementById('fp-canvas-wrap');
  canvas.width = wrap.clientWidth;
  canvas.height = wrap.clientHeight;
  draw();
}

// ─────────────────────────────────────────────────────────────────────────────
// Coordinate utilities
// ─────────────────────────────────────────────────────────────────────────────
function w2c(wx, wy) {
  return { cx: wx * S.zoom + S.ox, cy: wy * S.zoom + S.oy };
}
function c2w(cx, cy) {
  return { x: (cx - S.ox) / S.zoom, y: (cy - S.oy) / S.zoom };
}
function snapPt(cx, cy) {
  const w = c2w(cx, cy);
  return { x: Math.round(w.x), y: Math.round(w.y) };
}
function worldDist(ax, ay, bx, by) {
  return Math.sqrt((ax - bx) ** 2 + (ay - by) ** 2);
}
function canvasDist(a, b) {
  return Math.sqrt((a.cx - b.cx) ** 2 + (a.cy - b.cy) ** 2);
}

// ─────────────────────────────────────────────────────────────────────────────
// Geometry
// ─────────────────────────────────────────────────────────────────────────────
function polyArea(pts) {
  let a = 0;
  const n = pts.length;
  for (let i = 0; i < n; i++) {
    const j = (i + 1) % n;
    a += pts[i].x * pts[j].y - pts[j].x * pts[i].y;
  }
  return Math.abs(a) / 2;
}

function getNetArea() {
  if (!S.roomDone) return 0;
  const gross = polyArea(S.roomPts);
  const obsTotal = S.obs.reduce((sum, o) => sum + polyArea(o), 0);
  return Math.max(0, gross - obsTotal);
}

function ptInPoly(px, py, pts) {
  let inside = false;
  const n = pts.length;
  for (let i = 0, j = n - 1; i < n; j = i++) {
    const xi = pts[i].x, yi = pts[i].y, xj = pts[j].x, yj = pts[j].y;
    if (((yi > py) !== (yj > py)) && px < ((xj - xi) * (py - yi)) / (yj - yi) + xi) {
      inside = !inside;
    }
  }
  return inside;
}

function getBB(pts) {
  let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
  pts.forEach(p => {
    const c = w2c(p.x, p.y);
    if (c.cx < minX) minX = c.cx;
    if (c.cy < minY) minY = c.cy;
    if (c.cx > maxX) maxX = c.cx;
    if (c.cy > maxY) maxY = c.cy;
  });
  return { minX, minY, maxX, maxY };
}

// ─────────────────────────────────────────────────────────────────────────────
// Drawing
// ─────────────────────────────────────────────────────────────────────────────
function draw() {
  if (!ctx) return;
  labelHits = [];
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  drawGrid();
  if (S.roomDone) drawRoom();
  drawObstructions();
  drawPendingObs();
  if (S.mode === 'move') {
    drawMoveHandles();
  } else {
    drawCurrentShape();
    if (S.mode !== 'delete') drawSnapDot();
  }
  updatePanel();
}

function drawGrid() {
  const step = S.zoom;
  const x0 = Math.floor(-S.ox / step) - 1;
  const y0 = Math.floor(-S.oy / step) - 1;
  const x1 = Math.ceil((canvas.width - S.ox) / step) + 1;
  const y1 = Math.ceil((canvas.height - S.oy) / step) + 1;

  ctx.lineWidth = 0.5;
  for (let gx = x0; gx <= x1; gx++) {
    ctx.strokeStyle = gx % 5 === 0 ? 'rgba(100,116,139,0.35)' : 'rgba(203,213,225,0.55)';
    const px = gx * step + S.ox;
    ctx.beginPath(); ctx.moveTo(px, 0); ctx.lineTo(px, canvas.height); ctx.stroke();
  }
  for (let gy = y0; gy <= y1; gy++) {
    ctx.strokeStyle = gy % 5 === 0 ? 'rgba(100,116,139,0.35)' : 'rgba(203,213,225,0.55)';
    const py = gy * step + S.oy;
    ctx.beginPath(); ctx.moveTo(0, py); ctx.lineTo(canvas.width, py); ctx.stroke();
  }
}

function tracePoly(pts) {
  if (pts.length < 2) return;
  const p0 = w2c(pts[0].x, pts[0].y);
  ctx.beginPath();
  ctx.moveTo(p0.cx, p0.cy);
  for (let i = 1; i < pts.length; i++) {
    const p = w2c(pts[i].x, pts[i].y);
    ctx.lineTo(p.cx, p.cy);
  }
  ctx.closePath();
}

function drawRoom() {
  if (S.roomPts.length < 3) return;
  tracePoly(S.roomPts);
  ctx.fillStyle = 'rgba(37,99,235,0.07)';
  ctx.fill();
  ctx.strokeStyle = '#2563eb';
  ctx.lineWidth = 2;
  ctx.stroke();
  drawWallLabels(S.roomPts, '#1d4ed8');
  S.roomPts.forEach((pt, i) => {
    const c = w2c(pt.x, pt.y);
    ctx.beginPath();
    ctx.arc(c.cx, c.cy, i === 0 ? 5 : 3.5, 0, Math.PI * 2);
    ctx.fillStyle = '#2563eb';
    ctx.fill();
  });
}

function drawObstructions() {
  S.obs.forEach((obs, idx) => {
    if (obs.length < 3) return;
    const isHov = idx === S.hovObs;

    tracePoly(obs);
    ctx.fillStyle = isHov ? 'rgba(239,68,68,0.15)' : 'rgba(100,116,139,0.12)';
    ctx.fill();

    // diagonal hatch
    ctx.save();
    tracePoly(obs);
    ctx.clip();
    ctx.strokeStyle = isHov ? 'rgba(239,68,68,0.3)' : 'rgba(100,116,139,0.22)';
    ctx.lineWidth = 1;
    const bb = getBB(obs);
    const span = bb.maxY - bb.minY;
    for (let d = bb.minX - span; d < bb.maxX + span; d += 10) {
      ctx.beginPath();
      ctx.moveTo(d, bb.minY);
      ctx.lineTo(d + span, bb.maxY);
      ctx.stroke();
    }
    ctx.restore();

    tracePoly(obs);
    ctx.strokeStyle = isHov ? '#dc2626' : '#64748b';
    ctx.lineWidth = isHov ? 2 : 1.5;
    ctx.stroke();

    drawWallLabels(obs, isHov ? '#b91c1c' : '#475569');
  });
}

function drawWallLabels(pts, color) {
  if (S.zoom < 18 || pts.length < 2) return;
  const fs = Math.max(10, Math.min(12, S.zoom * 0.38));
  ctx.font = `600 ${fs}px -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif`;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';

  const n = pts.length;
  for (let i = 0; i < n; i++) {
    const j = (i + 1) % n;
    const a = pts[i], b = pts[j];
    const len = worldDist(a.x, a.y, b.x, b.y);
    if (len < 0.4) continue;

    const midC = w2c((a.x + b.x) / 2, (a.y + b.y) / 2);
    const angle = Math.atan2(b.y - a.y, b.x - a.x);
    const off = 15;
    const lx = midC.cx + Math.sin(angle) * off;
    const ly = midC.cy - Math.cos(angle) * off;

    // Register hit target for hover/click detection
    labelHits.push({ lx, ly, pts, i, j });

    const label = len.toFixed(1) + '’';
    const tw = ctx.measureText(label).width;
    const bx = lx - tw / 2 - 4, by = ly - fs / 2 - 2, bw = tw + 8, bh = fs + 4;

    const isHov = hovLabel && hovLabel.pts === pts && hovLabel.i === i;
    ctx.fillStyle = isHov ? 'rgba(234,88,12,0.15)' : 'rgba(255,255,255,0.92)';
    ctx.fillRect(bx, by, bw, bh);
    if (isHov) {
      ctx.strokeStyle = '#ea580c';
      ctx.lineWidth = 1.5;
      ctx.strokeRect(bx, by, bw, bh);
    }
    ctx.fillStyle = isHov ? '#ea580c' : (color || '#334155');
    ctx.fillText(label, lx, ly);
  }
}

function findLabelHit(cx, cy) {
  const threshold = 18;
  for (const h of labelHits) {
    if (Math.sqrt((h.lx - cx) ** 2 + (h.ly - cy) ** 2) <= threshold) return h;
  }
  return null;
}

function drawCurrentShape() {
  if (S.cur.length === 0) return;
  const color = S.mode === 'room' ? '#2563eb' : '#ea580c';
  const mc = w2c(S.snapX, S.snapY);

  ctx.beginPath();
  const p0c = w2c(S.cur[0].x, S.cur[0].y);
  ctx.moveTo(p0c.cx, p0c.cy);
  for (let i = 1; i < S.cur.length; i++) {
    const pc = w2c(S.cur[i].x, S.cur[i].y);
    ctx.lineTo(pc.cx, pc.cy);
  }
  ctx.lineTo(mc.cx, mc.cy);
  ctx.strokeStyle = color;
  ctx.lineWidth = 2;
  ctx.setLineDash([6, 4]);
  ctx.stroke();
  ctx.setLineDash([]);

  // placed point dots
  S.cur.forEach((pt, i) => {
    const pc = w2c(pt.x, pt.y);
    ctx.beginPath();
    ctx.arc(pc.cx, pc.cy, i === 0 ? 6 : 4, 0, Math.PI * 2);
    ctx.fillStyle = i === 0 ? color : 'white';
    ctx.fill();
    ctx.strokeStyle = color;
    ctx.lineWidth = 1.5;
    ctx.stroke();
  });

  // close-hint ring when cursor near first point
  if (S.cur.length >= 3) {
    if (canvasDist(mc, p0c) <= 15) {
      ctx.beginPath();
      ctx.arc(p0c.cx, p0c.cy, 13, 0, Math.PI * 2);
      ctx.strokeStyle = color;
      ctx.lineWidth = 2;
      ctx.setLineDash([3, 3]);
      ctx.stroke();
      ctx.setLineDash([]);
    }
  }
}

function drawSnapDot() {
  const mc = w2c(S.snapX, S.snapY);
  if (mc.cx < 0 || mc.cx > canvas.width || mc.cy < 0 || mc.cy > canvas.height) return;
  const color = S.mode === 'room' ? '#2563eb' : '#ea580c';
  ctx.beginPath();
  ctx.arc(mc.cx, mc.cy, 3, 0, Math.PI * 2);
  ctx.fillStyle = color;
  ctx.fill();
}

function findNearestVertex(cx, cy) {
  const threshold = 14;
  let best = null, bestD = Infinity;
  const check = (pts, source) => {
    pts.forEach((pt, i) => {
      const c = w2c(pt.x, pt.y);
      const d = Math.sqrt((c.cx - cx) ** 2 + (c.cy - cy) ** 2);
      if (d < threshold && d < bestD) { bestD = d; best = { pts, i, source }; }
    });
  };
  check(S.roomPts, 'room');
  S.obs.forEach((obs, idx) => check(obs, idx));
  return best;
}

function drawMoveHandles() {
  const drawDot = (pt, color, r) => {
    const c = w2c(pt.x, pt.y);
    ctx.beginPath();
    ctx.arc(c.cx, c.cy, r, 0, Math.PI * 2);
    ctx.fillStyle = color;
    ctx.fill();
    ctx.strokeStyle = '#fff';
    ctx.lineWidth = 1.5;
    ctx.stroke();
  };
  S.roomPts.forEach((pt, i) => {
    const isHov = hovVert && hovVert.pts === S.roomPts && hovVert.i === i;
    const isDrag = dragVert && dragVert.pts === S.roomPts && dragVert.i === i;
    drawDot(pt, (isHov || isDrag) ? '#ea580c' : '#2563eb', (isHov || isDrag) ? 7 : 5);
  });
  S.obs.forEach((obs, idx) => {
    obs.forEach((pt, i) => {
      const isHov = hovVert && hovVert.pts === obs && hovVert.i === i;
      const isDrag = dragVert && dragVert.pts === obs && dragVert.i === i;
      const isObsHov = hovObsMove === idx;
      drawDot(pt, (isHov || isDrag) ? '#ea580c' : (isObsHov ? '#f59e0b' : '#64748b'), (isHov || isDrag) ? 7 : 5);
    });
  });
}

function drawPendingObs() {
  if (!S.pendingObs || S.pendingObs.length < 3) return;
  tracePoly(S.pendingObs);
  ctx.fillStyle = 'rgba(100,116,139,0.08)';
  ctx.fill();
  ctx.strokeStyle = '#94a3b8';
  ctx.lineWidth = 1.5;
  ctx.setLineDash([5, 4]);
  ctx.stroke();
  ctx.setLineDash([]);
}

// ─────────────────────────────────────────────────────────────────────────────
// Side panel
// ─────────────────────────────────────────────────────────────────────────────
function updatePanel() {
  const gross = S.roomDone ? polyArea(S.roomPts) : 0;
  const obsTotal = S.obs.reduce((s, o) => s + polyArea(o), 0);
  const net = Math.max(0, gross - obsTotal);

  document.getElementById('area-gross').textContent = gross.toFixed(1);
  document.getElementById('area-obs').textContent = obsTotal.toFixed(1);
  document.getElementById('area-net').textContent = net.toFixed(1);

  const hv = document.getElementById('fp-handle-val');
  if (hv) hv.textContent = net.toFixed(1) + ' sq ft';

  const list = document.getElementById('obs-list');
  list.innerHTML = '';
  S.obs.forEach((o, i) => {
    const div = document.createElement('div');
    div.className = 'obs-item';
    const name = S.obsNames[i] || `#${i + 1}`;
    div.textContent = `${name}: ${polyArea(o).toFixed(1)} sq ft`;
    list.appendChild(div);
  });
}

// ─────────────────────────────────────────────────────────────────────────────
// Events
// ─────────────────────────────────────────────────────────────────────────────
function setupEvents() {
  canvas.addEventListener('mousemove', onMouseMove);
  canvas.addEventListener('mousedown', onMouseDown);
  canvas.addEventListener('mouseup', onMouseUp);
  canvas.addEventListener('dblclick', onDblClick);
  canvas.addEventListener('contextmenu', onContextMenu);
  canvas.addEventListener('wheel', onWheel, { passive: false });
  document.addEventListener('keydown', onKeyDown);
  canvas.addEventListener('touchstart', onTouchStart, { passive: false });
  canvas.addEventListener('touchmove', onTouchMove, { passive: false });
  canvas.addEventListener('touchend', onTouchEnd, { passive: false });
}

function getXY(e) {
  const r = canvas.getBoundingClientRect();
  return { cx: e.clientX - r.left, cy: e.clientY - r.top };
}

function onMouseMove(e) {
  const { cx, cy } = getXY(e);

  if (S.panning) {
    S.ox = S.panStartOx + (cx - S.panStartCx);
    S.oy = S.panStartOy + (cy - S.panStartCy);
    const sn = snapPt(cx, cy);
    S.snapX = sn.x; S.snapY = sn.y;
    draw();
    return;
  }

  const sn = snapPt(cx, cy);
  S.snapX = sn.x; S.snapY = sn.y;

  if (S.mode === 'move') {
    if (dragVert) {
      dragVert.pts[dragVert.i] = { x: sn.x, y: sn.y };
      draw();
      return;
    }
    if (dragObs) {
      const dx = sn.x - dragObs.startSnapX;
      const dy = sn.y - dragObs.startSnapY;
      S.obs[dragObs.idx] = dragObs.origPts.map(p => ({ x: p.x + dx, y: p.y + dy }));
      draw();
      return;
    }
    const vh = findNearestVertex(cx, cy);
    if (vh) {
      hovVert = vh; hovObsMove = -1;
      canvas.style.cursor = 'grab';
    } else {
      hovVert = null;
      let found = -1;
      S.obs.forEach((obs, idx) => { if (ptInPoly(sn.x, sn.y, obs)) found = idx; });
      hovObsMove = found;
      canvas.style.cursor = found >= 0 ? 'grab' : 'default';
    }
    draw();
    return;
  }

  // Label hover — only when not actively drawing and not in delete/move mode
  hovLabel = (S.mode !== 'delete' && S.cur.length === 0) ? findLabelHit(cx, cy) : null;

  if (hovLabel) {
    canvas.style.cursor = 'text';
  } else if (S.mode === 'delete') {
    let found = -1;
    S.obs.forEach((obs, idx) => { if (ptInPoly(sn.x, sn.y, obs)) found = idx; });
    S.hovObs = found;
    canvas.style.cursor = found >= 0 ? 'pointer' : 'default';
  } else {
    canvas.style.cursor = 'crosshair';
  }

  draw();
}

function onMouseDown(e) {
  const { cx, cy } = getXY(e);
  if (e.button === 1) {
    e.preventDefault();
    S.panning = true;
    S.panStartCx = cx; S.panStartCy = cy;
    S.panStartOx = S.ox; S.panStartOy = S.oy;
    canvas.style.cursor = 'grab';
    return;
  }
  if (e.button !== 0) return;

  if (S.mode === 'move') {
    const vh = findNearestVertex(cx, cy);
    if (vh) {
      dragVert = vh; hovVert = null;
      canvas.style.cursor = 'grabbing';
      return;
    }
    const sn = snapPt(cx, cy);
    let found = -1;
    S.obs.forEach((obs, idx) => { if (ptInPoly(sn.x, sn.y, obs)) found = idx; });
    if (found >= 0) {
      dragObs = { idx: found, origPts: S.obs[found].map(p => ({ ...p })), startSnapX: sn.x, startSnapY: sn.y };
      canvas.style.cursor = 'grabbing';
    }
    return;
  }

  handleClick();
}

function onMouseUp(e) {
  if (e.button === 1 || S.panning) {
    S.panning = false;
    canvas.style.cursor = (S.mode === 'delete' || S.mode === 'move') ? 'default' : 'crosshair';
  }
  if (dragVert || dragObs) {
    dragVert = null;
    dragObs = null;
    canvas.style.cursor = 'default';
    saveData();
    draw();
  }
}

function onDblClick() {
  if (S.cur.length >= 3) closeShape();
}

function onContextMenu(e) {
  e.preventDefault();
  if (S.cur.length >= 3) closeShape();
  else if (S.cur.length > 0) { S.cur.pop(); draw(); }
}

function onWheel(e) {
  e.preventDefault();
  const { cx, cy } = getXY(e);
  const wx = (cx - S.ox) / S.zoom;
  const wy = (cy - S.oy) / S.zoom;
  const delta = e.deltaY < 0 ? 4 : -4;
  S.zoom = Math.max(10, Math.min(80, S.zoom + delta));
  S.ox = cx - wx * S.zoom;
  S.oy = cy - wy * S.zoom;
  draw();
}

function onKeyDown(e) {
  const tag = document.activeElement?.tagName;
  if (tag === 'INPUT' || tag === 'TEXTAREA') return;

  if (e.key === 'Escape') {
    S.cur = []; draw();
  } else if ((e.key === 'Backspace' || e.key === 'Delete') && S.cur.length > 0) {
    S.cur.pop(); draw(); e.preventDefault();
  } else if (e.key === 'Enter' && S.cur.length >= 3) {
    closeShape();
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// Touch events
// ─────────────────────────────────────────────────────────────────────────────
function getTouchXY(t) {
  const r = canvas.getBoundingClientRect();
  return { cx: t.clientX - r.left, cy: t.clientY - r.top };
}

function onTouchStart(e) {
  e.preventDefault();
  if (e.touches.length === 2) {
    // Cancel any single-finger operation
    if (dragVert || dragObs) { dragVert = null; dragObs = null; }
    S.panning = false;
    panTwoFinger = true;
    const t0 = getTouchXY(e.touches[0]);
    const t1 = getTouchXY(e.touches[1]);
    panStartMidX = (t0.cx + t1.cx) / 2;
    panStartMidY = (t0.cy + t1.cy) / 2;
    pinchStartDist = Math.hypot(t1.cx - t0.cx, t1.cy - t0.cy);
    pinchStartZoom = S.zoom;
    panStartOxT = S.ox; panStartOyT = S.oy;
    return;
  }
  if (e.touches.length !== 1) return;
  const { cx, cy } = getTouchXY(e.touches[0]);
  touchStartX = cx; touchStartY = cy;
  touchMoved = false;
  panTwoFinger = false;

  if (S.mode === 'move') {
    const vh = findNearestVertex(cx, cy);
    if (vh) { dragVert = vh; return; }
    const sn = snapPt(cx, cy);
    let found = -1;
    S.obs.forEach((obs, idx) => { if (ptInPoly(sn.x, sn.y, obs)) found = idx; });
    if (found >= 0) {
      dragObs = { idx: found, origPts: S.obs[found].map(p => ({ ...p })), startSnapX: sn.x, startSnapY: sn.y };
      return;
    }
    // No vertex or obs hit in move mode → start pan
    S.panning = true;
    S.panStartCx = cx; S.panStartCy = cy;
    S.panStartOx = S.ox; S.panStartOy = S.oy;
    return;
  }

  const sn = snapPt(cx, cy);
  S.snapX = sn.x; S.snapY = sn.y;
  draw();
}

function onTouchMove(e) {
  e.preventDefault();
  if (e.touches.length === 2 && panTwoFinger) {
    const t0 = getTouchXY(e.touches[0]);
    const t1 = getTouchXY(e.touches[1]);
    const midX = (t0.cx + t1.cx) / 2;
    const midY = (t0.cy + t1.cy) / 2;
    const dist = Math.hypot(t1.cx - t0.cx, t1.cy - t0.cy);
    const newZoom = Math.max(10, Math.min(80, Math.round(pinchStartZoom * dist / pinchStartDist)));
    const wx = (panStartMidX - panStartOxT) / pinchStartZoom;
    const wy = (panStartMidY - panStartOyT) / pinchStartZoom;
    S.zoom = newZoom;
    S.ox = panStartOxT + (midX - panStartMidX) - wx * (newZoom - pinchStartZoom);
    S.oy = panStartOyT + (midY - panStartMidY) - wy * (newZoom - pinchStartZoom);
    draw();
    return;
  }
  if (e.touches.length !== 1 || panTwoFinger) return;
  const { cx, cy } = getTouchXY(e.touches[0]);

  if (S.panning) {
    S.ox = S.panStartOx + (cx - S.panStartCx);
    S.oy = S.panStartOy + (cy - S.panStartCy);
    const sn = snapPt(cx, cy);
    S.snapX = sn.x; S.snapY = sn.y;
    touchMoved = true;
    draw();
    return;
  }
  if (dragVert) {
    const sn = snapPt(cx, cy);
    dragVert.pts[dragVert.i] = { x: sn.x, y: sn.y };
    touchMoved = true;
    draw();
    return;
  }
  if (dragObs) {
    const sn = snapPt(cx, cy);
    const dx = sn.x - dragObs.startSnapX;
    const dy = sn.y - dragObs.startSnapY;
    S.obs[dragObs.idx] = dragObs.origPts.map(p => ({ x: p.x + dx, y: p.y + dy }));
    touchMoved = true;
    draw();
    return;
  }

  const dx = cx - touchStartX, dy = cy - touchStartY;
  if (Math.hypot(dx, dy) > 8) touchMoved = true;
  const sn = snapPt(cx, cy);
  S.snapX = sn.x; S.snapY = sn.y;
  draw();
}

function onTouchEnd(e) {
  e.preventDefault();
  if (panTwoFinger) { panTwoFinger = false; return; }
  if (S.panning) { S.panning = false; return; }
  if (dragVert || dragObs) {
    dragVert = null; dragObs = null;
    saveData(); draw(); return;
  }
  if (!touchMoved && e.changedTouches.length > 0) {
    const { cx, cy } = getTouchXY(e.changedTouches[0]);
    // Check for label tap (wall length edit)
    if (S.cur.length === 0 && S.mode !== 'delete' && S.mode !== 'move') {
      const lh = findLabelHit(cx, cy);
      if (lh) { hovLabel = lh; startLabelEdit(lh); touchMoved = false; return; }
    }
    const sn = snapPt(cx, cy);
    S.snapX = sn.x; S.snapY = sn.y;
    handleClick();
  }
  touchMoved = false;
}

// ─────────────────────────────────────────────────────────────────────────────
// Panel + toolbar helpers
// ─────────────────────────────────────────────────────────────────────────────
function togglePanel() {
  document.getElementById('fp-panel').classList.toggle('panel-open');
}

function undoPoint() {
  if (S.cur.length > 0) { S.cur.pop(); draw(); }
}

function handleClick() {
  // If the length editor is open, let its blur handler close it
  const lenInput = document.getElementById('fp-len-input');
  if (lenInput && lenInput.style.display === 'block') return;

  if (S.mode === 'delete') {
    if (S.hovObs >= 0) {
      S.obs.splice(S.hovObs, 1);
      S.obsNames.splice(S.hovObs, 1);
      S.hovObs = -1;
      draw();
    }
    return;
  }

  // Label click — edit that wall's length (only when not mid-draw)
  if (S.cur.length === 0 && hovLabel) {
    startLabelEdit(hovLabel);
    return;
  }

  if (S.cur.length >= 3) {
    const p0c = w2c(S.cur[0].x, S.cur[0].y);
    const mc = w2c(S.snapX, S.snapY);
    if (canvasDist(mc, p0c) <= 15) { closeShape(); return; }
  }

  if (S.cur.length > 0) {
    const last = S.cur[S.cur.length - 1];
    if (last.x === S.snapX && last.y === S.snapY) return;
  }

  S.cur.push({ x: S.snapX, y: S.snapY });
  draw();
}

function closeShape() {
  if (S.cur.length < 3) return;
  if (S.mode === 'room') {
    S.roomPts = [...S.cur];
    S.roomDone = true;
    S.cur = [];
    setMode('obstruction');
  } else {
    S.pendingObs = [...S.cur];
    S.cur = [];
    draw();
    showObsNameModal();
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// Mode
// ─────────────────────────────────────────────────────────────────────────────
function setMode(mode) {
  S.mode = mode;
  S.cur = [];
  S.hovObs = -1;
  hovVert = null;
  dragVert = null;
  hovObsMove = -1;
  dragObs = null;

  document.querySelectorAll('.fp-tool').forEach(b => {
    b.removeAttribute('data-active');
  });
  const btn = document.getElementById('tool-' + mode);
  if (btn) btn.setAttribute('data-active', mode);

  canvas.style.cursor = (mode === 'delete' || mode === 'move') ? 'default' : 'crosshair';

  const mob = document.documentElement.classList.contains('is-mobile');
  const hints = {
    room: mob
      ? 'Tap to place wall corners. Tap the first point to close the room. Use 2 fingers to pan/zoom.'
      : 'Click to place wall corners. Click the first point (or double-click / Enter) to close the room. Right-click undoes the last point.',
    obstruction: mob
      ? 'Tap to outline an obstruction. Tap the first point to close. Use 2 fingers to pan/zoom.'
      : 'Click to outline an obstruction (column, island, stairs, etc.). Double-click or click the first point to close. Right-click undoes last point.',
    delete: mob
      ? 'Tap an obstruction to remove it.'
      : 'Hover over an obstruction and click to remove it.',
    move: mob
      ? 'Drag a corner handle to move it. Drag inside an obstruction to move the whole shape.'
      : 'Drag a corner handle to reposition it. Drag inside an obstruction to move the whole shape.',
  };
  document.getElementById('fp-hint').textContent = hints[mode] || '';
  draw();
}

// ─────────────────────────────────────────────────────────────────────────────
// Zoom / Fit
// ─────────────────────────────────────────────────────────────────────────────
function zoomBy(delta) {
  const cx = canvas.width / 2, cy = canvas.height / 2;
  const wx = (cx - S.ox) / S.zoom;
  const wy = (cy - S.oy) / S.zoom;
  S.zoom = Math.max(10, Math.min(80, S.zoom + delta));
  S.ox = cx - wx * S.zoom;
  S.oy = cy - wy * S.zoom;
  draw();
}

function fitToRoom() {
  const pts = S.roomDone ? S.roomPts : S.cur;
  if (pts.length < 2) return;
  const margin = 72;
  let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
  pts.forEach(p => {
    if (p.x < minX) minX = p.x; if (p.y < minY) minY = p.y;
    if (p.x > maxX) maxX = p.x; if (p.y > maxY) maxY = p.y;
  });
  const dw = Math.max(maxX - minX, 1), dh = Math.max(maxY - minY, 1);
  S.zoom = Math.max(10, Math.min(80, Math.floor(Math.min(
    (canvas.width - 2 * margin) / dw,
    (canvas.height - 2 * margin) / dh
  ))));
  const cw = canvas.width - 2 * margin, ch = canvas.height - 2 * margin;
  S.ox = margin + (cw - dw * S.zoom) / 2 - minX * S.zoom;
  S.oy = margin + (ch - dh * S.zoom) / 2 - minY * S.zoom;
  draw();
}

// ─────────────────────────────────────────────────────────────────────────────
// Persistence
// ─────────────────────────────────────────────────────────────────────────────
const FP_DATA_KEY = 'sandoval_floorplan_data';
const FP_SQFT_KEY = 'sandoval_floorplan_sqft';

function saveData() {
  localStorage.setItem(FP_DATA_KEY, JSON.stringify({
    roomName: document.getElementById('room-name')?.value || '',
    roomPts: S.roomPts,
    roomDone: S.roomDone,
    obs: S.obs,
    obsNames: S.obsNames,
    zoom: S.zoom,
    ox: S.ox,
    oy: S.oy,
  }));
}

function loadData() {
  try {
    const raw = localStorage.getItem(FP_DATA_KEY);
    if (!raw) return false;
    const d = JSON.parse(raw);
    const nameEl = document.getElementById('room-name');
    if (nameEl && d.roomName) nameEl.value = d.roomName;
    S.roomPts = d.roomPts || [];
    S.roomDone = !!d.roomDone;
    S.obs = d.obs || [];
    S.obsNames = d.obsNames || [];
    if (d.zoom) S.zoom = d.zoom;
    if (d.ox != null) S.ox = d.ox;
    if (d.oy != null) S.oy = d.oy;
    return S.roomDone || S.roomPts.length > 0;
  } catch (e) { return false; }
}

// ─────────────────────────────────────────────────────────────────────────────
// Label editing
// ─────────────────────────────────────────────────────────────────────────────
function startLabelEdit(hit) {
  const input = document.getElementById('fp-len-input');
  const len = worldDist(hit.pts[hit.i].x, hit.pts[hit.i].y, hit.pts[hit.j].x, hit.pts[hit.j].y);
  input.value = len.toFixed(2);
  // Position the input centred on the label
  input.style.left = Math.round(hit.lx - 38) + 'px';
  input.style.top  = Math.round(hit.ly - 14) + 'px';
  input.style.display = 'block';
  input._hit = hit;
  setTimeout(() => { input.focus(); input.select(); }, 0);
}

function applyLabelEdit(input) {
  if (input.style.display !== 'block') return; // already handled
  const newLen = parseFloat(input.value);
  input.style.display = 'none';
  input.blur();
  if (!isNaN(newLen) && newLen > 0) {
    const { pts, i, j } = input._hit;
    const dx = pts[j].x - pts[i].x;
    const dy = pts[j].y - pts[i].y;
    const curLen = Math.sqrt(dx * dx + dy * dy);
    if (curLen > 0) {
      pts[j] = {
        x: pts[i].x + (dx / curLen) * newLen,
        y: pts[i].y + (dy / curLen) * newLen,
      };
      saveData();
    }
  }
  draw();
}

function cancelLabelEdit(input) {
  if (input.style.display !== 'block') return;
  input.style.display = 'none';
  input.blur();
  draw();
}

// ─────────────────────────────────────────────────────────────────────────────
// Actions (called from HTML)
// ─────────────────────────────────────────────────────────────────────────────
function sendToEstimate() {
  const net = getNetArea();
  saveData();
  localStorage.setItem(FP_SQFT_KEY, net.toFixed(1));
  window.location.href = 'estimate.html';
}

function clearAll() {
  if (!confirm('Clear the entire floor plan and start over?')) return;
  S.roomPts = []; S.roomDone = false; S.obs = []; S.cur = []; S.hovObs = -1;
  S.obsNames = []; S.pendingObs = null;
  const nameEl = document.getElementById('room-name');
  if (nameEl) nameEl.value = '';
  setMode('room');
}

function showObsNameModal() {
  const modal = document.getElementById('obs-name-modal');
  const input = document.getElementById('obs-name-input');
  if (!modal || !input) { confirmObsName(''); return; }
  input.value = '';
  modal.style.display = 'flex';
  setTimeout(() => { input.focus(); }, 50);
}

function confirmObsName(name) {
  const modal = document.getElementById('obs-name-modal');
  if (modal) modal.style.display = 'none';
  if (!S.pendingObs) return;
  S.obs.push(S.pendingObs);
  S.obsNames.push((typeof name === 'string' ? name : document.getElementById('obs-name-input')?.value || '').trim());
  S.pendingObs = null;
  saveData();
  draw();
}

function skipObsName() { confirmObsName(''); }

function openFinalized() {
  if (!S.roomDone) { alert('Draw a room first.'); return; }
  saveData();
  window.location.href = 'floorplan-final.html';
}

function printPlan() {
  saveData();
  const img = document.getElementById('fp-print-img');
  if (img) img.src = canvas.toDataURL('image/png');

  const nameEl = document.getElementById('room-name');
  const pn = document.getElementById('fp-print-name');
  if (pn) pn.textContent = nameEl?.value || 'Floor Plan';

  const gross = S.roomDone ? polyArea(S.roomPts).toFixed(1) : '—';
  const obsTotal = S.obs.reduce((s, o) => s + polyArea(o), 0).toFixed(1);
  const net = getNetArea().toFixed(1);
  const ps = document.getElementById('fp-print-stats');
  if (ps) {
    ps.innerHTML = `
      <span>Gross Area: <strong>${gross} sq ft</strong></span>
      <span>Obstructions: <strong>−${obsTotal} sq ft</strong></span>
      <span>Net Area: <strong>${net} sq ft</strong></span>
      <span>Scale: 1 grid square = 1 ft</span>
    `;
  }
  window.print();
}

// ─────────────────────────────────────────────────────────────────────────────
// Init
// ─────────────────────────────────────────────────────────────────────────────
document.addEventListener('DOMContentLoaded', function () {
  setupCanvas();
  setupEvents();
  const hadData = loadData();
  if (hadData && S.roomDone) {
    setMode('obstruction');
    fitToRoom();
  } else {
    setMode('room');
  }
});
