'use strict';
/* =========================================================================
   board.js — court geometry (percentage coordinate space) and DOM building.
   Coordinate space: x in [0,100] (left→right), y in [0,100] (start→finish).
   ========================================================================= */
var DB = window.DB = window.DB || {};

DB.board = (function () {
  const LINE_COUNT = 5;
  const SAFE_DEPTH = 10;             // % height of each safe zone
  const PLAY_TOP = SAFE_DEPTH;       // 10
  const PLAY_BOTTOM = 100 - SAFE_DEPTH; // 90
  const LANE_X_MIN = 33, LANE_X_MAX = 67;
  const COURT_X_MIN = 8, COURT_X_MAX = 92;

  const lines = [];
  for (let i = 1; i <= LINE_COUNT; i++) {
    lines.push(PLAY_TOP + ((PLAY_BOTTOM - PLAY_TOP) * i) / (LINE_COUNT + 1));
  }

  let fieldEl = null;
  let fieldRect = { width: 300, height: 460 }; // sane fallback before first measure

  function mount(container) {
    container.innerHTML = '';

    const plate = document.createElement('div');
    plate.className = 'court-plate';

    const field = document.createElement('div');
    field.className = 'court-field';
    field.id = 'court-field';

    field.appendChild(makeVerticalLane());
    lines.forEach((y, idx) => field.appendChild(makeGuardLine(y, idx)));
    field.appendChild(makeSafeZone('start', 'board.startLabel'));
    field.appendChild(makeSafeZone('finish', 'board.finishLabel'));
    ['tl', 'tr', 'bl', 'br'].forEach((corner) => field.appendChild(makeAlpona(corner)));

    const entityLayer = document.createElement('div');
    entityLayer.id = 'entity-layer';
    field.appendChild(entityLayer);

    const flash = document.createElement('div');
    flash.className = 'tag-flash';
    flash.id = 'tag-flash';
    field.appendChild(flash);

    plate.appendChild(field);
    container.appendChild(plate);
    fieldEl = field;
    measure();
  }

  function makeVerticalLane() {
    const el = document.createElement('div');
    el.className = 'vertical-lane';
    return el;
  }

  function makeGuardLine(y, idx) {
    const el = document.createElement('div');
    el.className = 'guard-line';
    el.style.top = y + '%';
    el.dataset.lineIndex = idx;
    return el;
  }

  function makeSafeZone(kind, labelKey) {
    const el = document.createElement('div');
    el.className = 'safe-zone ' + kind;
    const label = document.createElement('div');
    label.className = 'safe-zone-label';
    label.setAttribute('data-t', labelKey);
    el.appendChild(label);
    return el;
  }

  function makeAlpona(corner) {
    const wrap = document.createElement('div');
    wrap.className = 'alpona-corner ' + corner;
    wrap.innerHTML =
      '<svg viewBox="0 0 100 100" width="100%" height="100%" fill="none" xmlns="http://www.w3.org/2000/svg">' +
      '<path d="M4 4 Q40 4 40 40 Q40 4 76 4" stroke="#8B5A2E" stroke-width="4" stroke-linecap="round"/>' +
      '<circle cx="14" cy="14" r="5" fill="#E8B93A"/>' +
      '<path d="M4 20 Q20 20 20 4" stroke="#3E9B6F" stroke-width="3" fill="none" stroke-linecap="round"/>' +
      '<path d="M26 4 Q26 26 4 26" stroke="#E4694F" stroke-width="3" fill="none" stroke-linecap="round"/>' +
      '</svg>';
    return wrap;
  }

  function measure() {
    if (!fieldEl) return;
    const r = fieldEl.getBoundingClientRect();
    if (r.width > 0 && r.height > 0) fieldRect = { width: r.width, height: r.height };
  }

  function pctToPx(x, y) {
    return { x: (x / 100) * fieldRect.width, y: (y / 100) * fieldRect.height };
  }

  /** Real-pixel distance between two points given in percentage coordinates —
   *  needed because the court isn't square, so a naive percentage-distance
   *  would distort collision radii. */
  function pxDistance(x1, y1, x2, y2) {
    const p1 = pctToPx(x1, y1), p2 = pctToPx(x2, y2);
    return Math.hypot(p1.x - p2.x, p1.y - p2.y);
  }

  function clampX(x, min, max) { return Math.max(min, Math.min(max, x)); }
  function clampY(y, min, max) { return Math.max(min, Math.min(max, y)); }

  return {
    LINE_COUNT, SAFE_DEPTH, PLAY_TOP, PLAY_BOTTOM, LANE_X_MIN, LANE_X_MAX, COURT_X_MIN, COURT_X_MAX,
    lines, mount, measure, pctToPx, pxDistance, clampX, clampY,
    getFieldRect: () => fieldRect,
  };
})();
