'use strict';
/* =========================================================================
   ui.js — screen transitions, modals, HUD, setup form wiring.
   Game-loop/gameplay orchestration lives in main.js; this file only reads
   and writes DOM + DB.state, it does not run the round loop itself.
   ========================================================================= */
var DB = window.DB = window.DB || {};

DB.ui = (function () {
  const LANG_NAMES = { en: 'English', bn: 'বাংলা', ko: '한국어', ar: 'العربية', es: 'Español' };
  let els = {};

  function q(id) { return document.getElementById(id); }

  function cache() {
    els = {
      langBtn: q('lang-btn'), langBtnLabel: q('lang-btn-label'), langMenu: q('lang-menu'),
      screens: Array.from(document.querySelectorAll('.screen')),

      setupAvatarA: q('setup-avatar-a'), setupAvatarB: q('setup-avatar-b'),
      setupFileA: q('setup-file-a'), setupFileB: q('setup-file-b'),
      setupNameA: q('setup-name-a'), setupNameB: q('setup-name-b'),
      setupLengthGroup: q('setup-length-group'), setupDiffGroup: q('setup-diff-group'),

      hudAvatarA: q('hud-avatar-a'), hudAvatarB: q('hud-avatar-b'),
      hudNameA: q('hud-name-a'), hudNameB: q('hud-name-b'),
      hudPointsA: q('hud-points-a'), hudPointsB: q('hud-points-b'),
      hudRoleA: q('hud-role-a'), hudRoleB: q('hud-role-b'),
      chipA: q('hud-score-a'), chipB: q('hud-score-b'),
      roundBanner: q('round-banner'),

      courtContainer: q('court-container'),
      statusToast: q('status-toast'),
      countdownOverlay: q('countdown-overlay'), countdownNum: q('countdown-num'),
      touchControls: q('touch-controls'),

      victoryAvatar: q('victory-avatar'), victoryTitle: q('victory-title'), victoryScore: q('victory-score'),

      btnFullscreen: q('btn-fullscreen'),
      settingsMotion: q('settings-motion-toggle'),
    };
  }

  function showScreen(id) {
    els.screens.forEach((s) => { s.hidden = s.id !== id; });
  }

  function buildLangMenu() {
    const avail = DB.i18n.available();
    els.langMenu.innerHTML = '';
    avail.forEach((code) => {
      const btn = document.createElement('button');
      btn.className = 'lang-option';
      btn.dataset.lang = code;
      btn.textContent = LANG_NAMES[code] || code;
      btn.addEventListener('click', () => {
        DB.i18n.set(code);
        refreshAllText();
        highlightLangMenu();
        closeLangMenu();
      });
      els.langMenu.appendChild(btn);
    });
    highlightLangMenu();
  }
  function highlightLangMenu() {
    els.langMenu.querySelectorAll('.lang-option').forEach((b) => {
      b.classList.toggle('active', b.dataset.lang === DB.i18n.get());
    });
    els.langBtnLabel.textContent = LANG_NAMES[DB.i18n.get()] || DB.i18n.get();
  }
  function closeLangMenu() { els.langMenu.hidden = true; els.langBtn.setAttribute('aria-expanded', 'false'); }

  function refreshAllText() {
    DB.i18n.applyStatic(document);
    updateHud();
    if (!q('screen-victory').hidden) renderVictoryText();
  }

  /* ---------- generic modal helpers ---------- */
  function openModal(id) {
    const el = q(id);
    if (!el) return;
    el.hidden = false;
  }
  function closeModal(id) {
    const el = q(id);
    if (!el) return;
    el.hidden = true;
  }

  /* ---------- toast ---------- */
  let toastTimer = null;
  function toast(key, params, duration) {
    if (!els.statusToast) return;
    els.statusToast.textContent = DB.i18n.t(key, params);
    els.statusToast.classList.remove('show'); void els.statusToast.offsetWidth;
    els.statusToast.classList.add('show');
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => els.statusToast.classList.remove('show'), duration || 1800);
  }

  /* ---------- countdown ---------- */
  function countdown(onDone) {
    const seq = ['3', '2', '1', DB.i18n.t('game.go')];
    let i = 0;
    els.countdownOverlay.hidden = false;
    function tick() {
      els.countdownNum.textContent = seq[i];
      els.countdownNum.style.animation = 'none'; void els.countdownNum.offsetWidth;
      els.countdownNum.style.animation = '';
      i++;
      if (i < seq.length) setTimeout(tick, 650);
      else setTimeout(() => { els.countdownOverlay.hidden = true; onDone && onDone(); }, 550);
    }
    tick();
  }

  /* ---------- setup screen ---------- */
  function bindAvatarUpload(fileInput, imgEl, playerId) {
    fileInput.addEventListener('change', () => {
      const file = fileInput.files && fileInput.files[0];
      if (!file) return;
      const reader = new FileReader();
      reader.onload = () => {
        imgEl.src = reader.result;
        DB.state.s.players[playerId].photo = reader.result;
      };
      reader.readAsDataURL(file);
    });
  }

  function bindOptionGroup(groupEl, onSelect) {
    groupEl.querySelectorAll('.option-pill').forEach((btn) => {
      btn.addEventListener('click', () => {
        groupEl.querySelectorAll('.option-pill').forEach((b) => b.classList.remove('selected'));
        btn.classList.add('selected');
        onSelect(btn.dataset.value);
      });
    });
  }

  function initSetupScreen() {
    bindAvatarUpload(els.setupFileA, els.setupAvatarA, 'a');
    bindAvatarUpload(els.setupFileB, els.setupAvatarB, 'b');
    bindOptionGroup(els.setupLengthGroup, (v) => { DB.state.s.matchTarget = Number(v); });
    bindOptionGroup(els.setupDiffGroup, (v) => { DB.state.s.difficulty = v; });
    els.setupAvatarA.src = DB.state.s.players.a.photo;
    els.setupAvatarB.src = DB.state.s.players.b.photo;
  }

  function readSetupIntoState() {
    DB.state.s.players.a.name = els.setupNameA.value.trim();
    DB.state.s.players.b.name = els.setupNameB.value.trim();
  }

  /* ---------- HUD ---------- */
  function updateHud() {
    const s = DB.state.s;
    els.hudAvatarA.src = s.players.a.photo;
    els.hudAvatarB.src = s.players.b.photo;
    els.hudNameA.textContent = DB.state.displayName('a');
    els.hudNameB.textContent = DB.state.displayName('b');
    els.hudPointsA.textContent = s.players.a.score;
    els.hudPointsB.textContent = s.players.b.score;
    els.hudRoleA.textContent = DB.i18n.t(s.runner === 'a' ? 'game.roleRunner' : 'game.roleGuard');
    els.hudRoleB.textContent = DB.i18n.t(s.runner === 'b' ? 'game.roleRunner' : 'game.roleGuard');
    els.chipA.classList.toggle('active', s.runner === 'a');
    els.chipB.classList.toggle('active', s.runner === 'b');
    els.roundBanner.textContent = DB.i18n.t('game.roundOf', { n: s.round });
  }

  /* ---------- victory ---------- */
  let lastWinnerId = 'a';
  function renderVictoryText() {
    const s = DB.state.s;
    els.victoryTitle.textContent = DB.i18n.t('victory.title', { name: DB.state.displayName(lastWinnerId) });
    els.victoryScore.textContent = DB.i18n.t('victory.finalScore', { a: s.players.a.score, b: s.players.b.score });
  }
  function showVictory(winnerId) {
    lastWinnerId = winnerId;
    els.victoryAvatar.src = DB.state.s.players[winnerId].photo;
    renderVictoryText();
    showScreen('screen-victory');
  }

  /* ---------- settings ---------- */
  function applyReducedMotion(on) {
    document.body.classList.toggle('force-reduced-motion', on);
  }
  function initSettingsUI() {
    els.settingsMotion.checked = DB.state.s.settings.reducedMotion;
    applyReducedMotion(els.settingsMotion.checked);
    els.settingsMotion.addEventListener('change', () => {
      DB.state.s.settings.reducedMotion = els.settingsMotion.checked;
      applyReducedMotion(els.settingsMotion.checked);
      DB.state.saveSettings();
    });
  }

  function toggleFullscreen() {
    if (!document.fullscreenElement) document.documentElement.requestFullscreen?.().catch(() => {});
    else document.exitFullscreen?.();
  }

  return {
    cache, showScreen, buildLangMenu, highlightLangMenu, closeLangMenu, refreshAllText,
    openModal, closeModal, toast, countdown,
    initSetupScreen, readSetupIntoState, updateHud, showVictory,
    initSettingsUI, toggleFullscreen,
    get els() { return els; },
  };
})();
