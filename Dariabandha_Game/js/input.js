'use strict';
/* =========================================================================
   input.js — keyboard (Arrows for Runner, WASD for Daria Guard) and touch
   D-pad input, normalized into one shared state object read every frame.
   ========================================================================= */
var DB = window.DB = window.DB || {};

DB.input = (function () {
  const keys = { up: false, down: false, left: false, right: false, w: false, a: false, s: false, d: false };
  const specialHandlers = { space: [], escape: [] };

  const KEY_MAP = {
    ArrowUp: 'up', ArrowDown: 'down', ArrowLeft: 'left', ArrowRight: 'right',
    w: 'w', W: 'w', a: 'a', A: 'a', s: 's', S: 's', d: 'd', D: 'd',
    // Fallback for keyboards where the arrow keys double as a numeric keypad
    // (NumLock on sends plain digits instead of Arrow* — common on compact/
    // budget keyboards): 8/2/4/6 work as an alternate Runner control, laid
    // out like a phone dial pad (8=up, 2=down, 4=left, 6=right).
    '8': 'up', '2': 'down', '4': 'left', '6': 'right',
  };

  function onKeyDown(e) {
    if (KEY_MAP[e.key]) { keys[KEY_MAP[e.key]] = true; e.preventDefault(); }
    if (e.code === 'Space') { specialHandlers.space.forEach((fn) => fn()); e.preventDefault(); }
    if (e.key === 'Escape') { specialHandlers.escape.forEach((fn) => fn()); }
  }
  function onKeyUp(e) {
    if (KEY_MAP[e.key]) { keys[KEY_MAP[e.key]] = false; }
  }

  function bindTouchButton(el, key) {
    if (!el) return;
    const on = (e) => { keys[key] = true; e.preventDefault(); };
    const off = (e) => { keys[key] = false; if (e) e.preventDefault(); };
    el.addEventListener('touchstart', on, { passive: false });
    el.addEventListener('touchend', off, { passive: false });
    el.addEventListener('touchcancel', off, { passive: false });
    el.addEventListener('mousedown', on);
    el.addEventListener('mouseup', off);
    el.addEventListener('mouseleave', off);
  }

  function init() {
    window.addEventListener('keydown', onKeyDown);
    window.addEventListener('keyup', onKeyUp);
    window.addEventListener('blur', reset);
  }

  function bindTouchControls(root) {
    if (!root) return;
    bindTouchButton(root.querySelector('[data-touch="runner-up"]'), 'up');
    bindTouchButton(root.querySelector('[data-touch="runner-down"]'), 'down');
    bindTouchButton(root.querySelector('[data-touch="runner-left"]'), 'left');
    bindTouchButton(root.querySelector('[data-touch="runner-right"]'), 'right');
    bindTouchButton(root.querySelector('[data-touch="daria-up"]'), 'w');
    bindTouchButton(root.querySelector('[data-touch="daria-down"]'), 's');
    bindTouchButton(root.querySelector('[data-touch="daria-left"]'), 'a');
    bindTouchButton(root.querySelector('[data-touch="daria-right"]'), 'd');
  }

  function onSpace(fn) { specialHandlers.space.push(fn); }
  function onEscape(fn) { specialHandlers.escape.push(fn); }

  function reset() { Object.keys(keys).forEach((k) => { keys[k] = false; }); }
  function setEnabled(v) { if (!v) reset(); }

  return { keys, init, bindTouchControls, onSpace, onEscape, reset, setEnabled };
})();
