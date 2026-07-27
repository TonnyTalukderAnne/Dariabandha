'use strict';
/* =========================================================================
   entities.js — runner, roaming (Daria) guard, and patrolling line guards.
   All positions are in the board's percentage coordinate space; real-pixel
   conversion (for fair circular collision on a non-square court) happens
   through DB.board.pxDistance().
   ========================================================================= */
var DB = window.DB = window.DB || {};

DB.entities = (function () {
  const B = DB.board;
  const BASE_SPEED_PX = 150;   // runner & daria speed
  const TAG_DISTANCE_PX = 32;
  const DIFFICULTY_SPEED = { easy: 66, normal: 92, hard: 122 };
  const DIFFICULTY_SEEK = { easy: 0, normal: 0.15, hard: 0.34 };

  let runner, daria, guards = [];
  let els = {};

  function makeEntity(kind, playerId) {
    const wrap = document.createElement('div');
    wrap.className = 'entity ' + (playerId ? 'player-' + playerId : 'guard') + (kind === 'daria' ? ' daria' : '') + (kind === 'guard' ? ' guard' : '');
    wrap.innerHTML =
      '<div class="entity-shadow"></div>' +
      '<div class="entity-body"><img alt=""></div>' +
      (playerId ? '<div class="entity-nametag"></div>' : '');
    return wrap;
  }

  function setup(layerEl, difficulty) {
    layerEl.innerHTML = '';
    els = {};

    runner = { x: 50, y: 96, phase: 'outbound', vx: 0, vy: 0, moving: false };
    daria = { x: 50, y: 50, moving: false };
    guards = B.lines.map((y, i) => ({
      y, x: 20 + (i % 2 === 0 ? 0 : 40) + (i * 11) % 55,
      dir: i % 2 === 0 ? 1 : -1,
      speed: DIFFICULTY_SPEED[difficulty] || DIFFICULTY_SPEED.normal,
      seek: DIFFICULTY_SEEK[difficulty] || 0,
    }));

    const runnerId = DB.state.s.runner;
    const guardId = DB.state.s.guard;

    els.runner = makeEntity('runner', runnerId);
    els.runner.querySelector('img').src = DB.state.s.players[runnerId].photo;
    const rnt = els.runner.querySelector('.entity-nametag');
    if (rnt) rnt.textContent = DB.state.displayName(runnerId);
    layerEl.appendChild(els.runner);

    els.daria = makeEntity('daria', guardId);
    els.daria.querySelector('img').src = DB.state.s.players[guardId].photo;
    const dnt = els.daria.querySelector('.entity-nametag');
    if (dnt) dnt.textContent = DB.state.displayName(guardId);
    layerEl.appendChild(els.daria);

    els.guards = guards.map(() => {
      const el = makeEntity('lineguard', null);
      layerEl.appendChild(el);
      return el;
    });

    positionAll();
  }

  function position(el, x, y) {
    el.style.left = x + '%';
    el.style.top = y + '%';
  }

  function positionAll() {
    position(els.runner, runner.x, runner.y);
    position(els.daria, daria.x, daria.y);
    guards.forEach((g, i) => position(els.guards[i], g.x, g.y));
  }

  function inSafeZone(y) { return y <= B.PLAY_TOP || y >= B.PLAY_BOTTOM; }

  function step(dt, input) {
    // --- runner (arrow keys) ---
    let ix = (input.right ? 1 : 0) - (input.left ? 1 : 0);
    let iy = (input.down ? 1 : 0) - (input.up ? 1 : 0);
    runner.moving = !!(ix || iy);
    if (ix && iy) { ix *= 0.7071; iy *= 0.7071; }
    const rMoveX = (ix * BASE_SPEED_PX * dt / B.getFieldRect().width) * 100;
    const rMoveY = (iy * BASE_SPEED_PX * dt / B.getFieldRect().height) * 100;
    runner.x = B.clampX(runner.x + rMoveX, B.COURT_X_MIN, B.COURT_X_MAX);
    runner.y = B.clampY(runner.y + rMoveY, 1, 99);
    els.runner.classList.toggle('face-left', ix < 0);

    // --- daria (WASD), confined to the vertical lane horizontally ---
    let dx = (input.d ? 1 : 0) - (input.a ? 1 : 0);
    let dy = (input.s ? 1 : 0) - (input.w ? 1 : 0);
    daria.moving = !!(dx || dy);
    if (dx && dy) { dx *= 0.7071; dy *= 0.7071; }
    const dMoveX = (dx * BASE_SPEED_PX * dt / B.getFieldRect().width) * 100;
    const dMoveY = (dy * BASE_SPEED_PX * dt / B.getFieldRect().height) * 100;
    daria.x = B.clampX(daria.x + dMoveX, B.LANE_X_MIN, B.LANE_X_MAX);
    daria.y = B.clampY(daria.y + dMoveY, 3, 97);

    // --- AI line guards: ping-pong patrol with a mild seek bias ---
    guards.forEach((g) => {
      let target = g.x + g.dir * g.speed * dt;
      if (g.seek > 0 && Math.abs(runner.y - g.y) < 9) {
        const pull = (runner.x - g.x) * g.seek * dt * 4;
        target += pull;
      }
      if (target <= B.COURT_X_MIN) { target = B.COURT_X_MIN; g.dir = 1; }
      if (target >= B.COURT_X_MAX) { target = B.COURT_X_MAX; g.dir = -1; }
      g.x = target;
    });

    positionAll();
    updateAnimClasses();

    return checkCollisions();
  }

  function updateAnimClasses() {
    els.runner.classList.toggle('walking', runner.moving);
    els.daria.classList.toggle('walking', daria.moving);
    els.runner.classList.toggle('safe', inSafeZone(runner.y));
    guards.forEach((g, i) => els.guards[i].classList.toggle('walking', true));
  }

  function checkCollisions() {
    if (inSafeZone(runner.y)) return null;
    if (B.pxDistance(runner.x, runner.y, daria.x, daria.y) < TAG_DISTANCE_PX) return { by: 'daria' };
    for (let i = 0; i < guards.length; i++) {
      const g = guards[i];
      if (B.pxDistance(runner.x, runner.y, g.x, g.y) < TAG_DISTANCE_PX) return { by: 'line', index: i };
    }
    return null;
  }

  function checkPhaseTransition() {
    if (runner.phase === 'outbound' && runner.y <= B.PLAY_TOP - 4) {
      runner.phase = 'return';
      return 'turned';
    }
    if (runner.phase === 'return' && runner.y >= B.PLAY_BOTTOM + 4) {
      return 'completed';
    }
    return null;
  }

  function tagVisualAt(x, y) {
    const flash = document.getElementById('tag-flash');
    if (!flash) return;
    flash.style.setProperty('--tag-x', x + '%');
    flash.style.setProperty('--tag-y', y + '%');
    flash.classList.remove('show'); void flash.offsetWidth; flash.classList.add('show');
  }

  function playTagPop() {
    els.runner.classList.add('tagged');
  }

  function getRunnerPos() { return { x: runner.x, y: runner.y }; }

  return { setup, step, checkPhaseTransition, tagVisualAt, playTagPop, getRunnerPos, inSafeZone };
})();
