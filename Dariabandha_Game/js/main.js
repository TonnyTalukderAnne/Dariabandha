'use strict';
/* =========================================================================
   main.js — boots the app, wires every button, and runs the round loop.
   ========================================================================= */
(function () {
  const S = DB.state.s;
  let paused = false;
  let running = false;
  let lastTs = 0;
  let awaitingStart = false;
  let turnedToastShown = false;

  /* ---------- tutorial content (built here since it's just 3 short static
     steps with an inline diagram each — no need for a templating system) --------- */
  const TUTORIAL_DIAGRAMS = [
    // step 1: guard lines
    '<svg viewBox="0 0 140 140"><rect x="10" y="10" width="120" height="120" rx="12" fill="#D8EFC9"/>' +
      '<line x1="20" y1="40" x2="120" y2="40" stroke="#8B5A2E" stroke-width="3" stroke-dasharray="5 5"/>' +
      '<line x1="20" y1="70" x2="120" y2="70" stroke="#8B5A2E" stroke-width="3" stroke-dasharray="5 5"/>' +
      '<line x1="20" y1="100" x2="120" y2="100" stroke="#8B5A2E" stroke-width="3" stroke-dasharray="5 5"/>' +
      '<circle cx="45" cy="40" r="7" fill="#3A342A"/><circle cx="95" cy="70" r="7" fill="#3A342A"/><circle cx="55" cy="100" r="7" fill="#3A342A"/></svg>',
    // step 2: vertical lane
    '<svg viewBox="0 0 140 140"><rect x="10" y="10" width="120" height="120" rx="12" fill="#D8EFC9"/>' +
      '<rect x="55" y="10" width="30" height="120" fill="#6FB3D9" opacity=".4"/>' +
      '<circle cx="70" cy="75" r="9" fill="#E8B93A" stroke="#3A342A" stroke-width="2"/></svg>',
    // step 3: circuit there-and-back
    '<svg viewBox="0 0 140 140"><rect x="10" y="10" width="120" height="120" rx="12" fill="#D8EFC9"/>' +
      '<path d="M70 118 L70 22" stroke="#E4694F" stroke-width="4" fill="none" marker-end="url(#arrow)"/>' +
      '<path d="M60 118 L60 22" stroke="#2E7EA8" stroke-width="4" fill="none" marker-end="url(#arrow2)" transform="scale(-1,1) translate(-140,0)"/>' +
      '<defs><marker id="arrow" markerWidth="8" markerHeight="8" refX="4" refY="4" orient="auto"><path d="M0,0 L8,4 L0,8 Z" fill="#E4694F"/></marker>' +
      '<marker id="arrow2" markerWidth="8" markerHeight="8" refX="4" refY="4" orient="auto"><path d="M0,0 L8,4 L0,8 Z" fill="#2E7EA8"/></marker></defs></svg>',
  ];
  const TUTORIAL_KEYS = [
    ['tutorial.step1Title', 'tutorial.step1Body'],
    ['tutorial.step2Title', 'tutorial.step2Body'],
    ['tutorial.step3Title', 'tutorial.step3Body'],
  ];
  let tutorialIdx = 0;

  function renderTutorialStep() {
    const content = document.getElementById('tutorial-step-content');
    const [titleKey, bodyKey] = TUTORIAL_KEYS[tutorialIdx];
    content.innerHTML =
      '<div class="tutorial-diagram">' + TUTORIAL_DIAGRAMS[tutorialIdx] + '</div>' +
      '<h3>' + DB.i18n.t(titleKey) + '</h3><p>' + DB.i18n.t(bodyKey) + '</p>';
    const dots = document.getElementById('tutorial-dots');
    dots.innerHTML = '';
    TUTORIAL_KEYS.forEach((_, i) => {
      const d = document.createElement('div');
      d.className = 'tutorial-dot' + (i === tutorialIdx ? ' active' : '');
      dots.appendChild(d);
    });
    document.getElementById('tutorial-next-btn').textContent =
      tutorialIdx === TUTORIAL_KEYS.length - 1 ? DB.i18n.t('tutorial.start') : DB.i18n.t('tutorial.next');
  }

  function openTutorial() {
    tutorialIdx = 0;
    renderTutorialStep();
    paused = true;
    DB.ui.openModal('modal-tutorial');
  }
  function closeTutorial() {
    DB.ui.closeModal('modal-tutorial');
    paused = false;
  }

  /* ---------- screen flow ---------- */
  function leaveSplash() {
    DB.ui.showScreen('screen-menu');
  }
  function goMenu() { DB.ui.showScreen('screen-menu'); }

  function goSetup() {
    DB.ui.initSetupScreen();
    DB.ui.showScreen('screen-setup');
  }

  let touchBound = false;
  let resizeBound = false;

  function beginMatch() {
    DB.ui.readSetupIntoState();
    DB.state.resetMatch();
    DB.ui.showScreen('screen-game');
    DB.board.mount(document.getElementById('court-container'));
    if (!touchBound) {
      DB.input.bindTouchControls(document.getElementById('touch-controls'));
      touchBound = true;
    }
    if (!resizeBound) {
      window.addEventListener('resize', DB.board.measure);
      resizeBound = true;
    }
    startRoundSetup();
    if (!DB.state.s.tutorialSeen) openTutorial();
    startLoop();
  }

  function startRoundSetup() {
    const layer = document.getElementById('entity-layer');
    DB.entities.setup(layer, S.difficulty);
    DB.ui.updateHud();
    S.roundPhase = 'idle';
    awaitingStart = true;
    turnedToastShown = false;
    DB.ui.toast('toast.yourTurnRunner', { name: DB.state.displayName(S.runner) }, 2400);
    DB.input.setEnabled(true);
  }

  function beginCountdownAndRun() {
    if (!awaitingStart || paused) return;
    awaitingStart = false;
    DB.ui.countdown(() => { S.roundPhase = 'outbound'; });
  }

  function endRound(winnerRole) {
    S.roundPhase = 'ended';
    const winnerId = winnerRole === 'runner' ? S.runner : S.guard;
    S.players[winnerId].score += 1;
    DB.ui.updateHud();

    if (winnerRole === 'runner') {
      DB.ui.toast('game.circuitComplete', { name: DB.state.displayName(S.runner) }, 2000);
    } else {
      const pos = DB.entities.getRunnerPos();
      DB.entities.tagVisualAt(pos.x, pos.y);
      DB.entities.playTagPop();
      DB.ui.toast('game.tagged', { name: DB.state.displayName(S.runner) }, 2000);
    }

    if (S.players[winnerId].score >= S.matchTarget) {
      setTimeout(() => finishMatch(winnerId), 1500);
      return;
    }
    setTimeout(() => {
      DB.state.swapRoles();
      S.round += 1;
      startRoundSetup();
    }, 1600);
  }

  function finishMatch(winnerId) {
    stopLoop();
    DB.ui.showVictory(winnerId);
  }

  /* ---------- round loop ---------- */
  function tick(ts) {
    if (!running) return;
    const dt = Math.min(0.05, (ts - lastTs) / 1000 || 0);
    lastTs = ts;

    if (!paused && (S.roundPhase === 'outbound' || S.roundPhase === 'return')) {
      const hit = DB.entities.step(dt, DB.input.keys);
      if (hit) {
        endRound('guard');
      } else {
        const trans = DB.entities.checkPhaseTransition();
        if (trans === 'turned' && !turnedToastShown) {
          turnedToastShown = true;
          DB.ui.toast('game.returning', null, 1400);
        } else if (trans === 'completed') {
          endRound('runner');
        }
      }
    }
    requestAnimationFrame(tick);
  }
  function startLoop() { running = true; lastTs = performance.now(); requestAnimationFrame(tick); }
  function stopLoop() { running = false; DB.input.setEnabled(false); }

  /* ---------- pause ---------- */
  function pauseGame() {
    if (document.getElementById('screen-game').hidden) return;
    if (!document.getElementById('modal-tutorial').hidden) return; // don't stack on top of the tutorial
    paused = true;
    DB.input.setEnabled(false);
    DB.ui.openModal('modal-pause');
  }
  function resumeGame() {
    paused = false;
    DB.input.setEnabled(true);
    DB.ui.closeModal('modal-pause');
  }
  function restartMatch() {
    DB.ui.closeModal('modal-pause');
    paused = false;
    DB.state.resetMatch();
    startRoundSetup();
  }
  function quitToMenu() {
    DB.ui.closeModal('modal-pause');
    paused = false;
    stopLoop();
    goMenu();
  }

  /* ---------- wiring ---------- */
  function wireGlobalButtons() {
    document.getElementById('lang-btn').addEventListener('click', () => {
      const menu = document.getElementById('lang-menu');
      const willOpen = menu.hidden;
      menu.hidden = !willOpen;
      document.getElementById('lang-btn').setAttribute('aria-expanded', String(willOpen));
    });
    document.addEventListener('click', (e) => {
      const wrap = document.getElementById('lang-switcher-wrap');
      if (wrap && !wrap.contains(e.target)) DB.ui.closeLangMenu();
    });

    document.getElementById('screen-splash').addEventListener('click', leaveSplash);
    window.addEventListener('keydown', (e) => {
      if (!document.getElementById('screen-splash').hidden && (e.code === 'Space' || e.key === 'Enter')) leaveSplash();
    });

    document.getElementById('menu-play-btn').addEventListener('click', goSetup);
    document.getElementById('menu-howto-btn').addEventListener('click', () => DB.ui.openModal('modal-howto'));
    document.getElementById('menu-settings-btn').addEventListener('click', () => DB.ui.openModal('modal-settings'));
    document.getElementById('menu-about-btn').addEventListener('click', () => DB.ui.openModal('modal-about'));

    document.getElementById('setup-back-btn').addEventListener('click', goMenu);
    document.getElementById('setup-start-btn').addEventListener('click', beginMatch);

    document.getElementById('tutorial-next-btn').addEventListener('click', () => {
      if (tutorialIdx < TUTORIAL_KEYS.length - 1) { tutorialIdx++; renderTutorialStep(); }
      else { DB.state.markTutorialSeen(); closeTutorial(); }
    });
    document.getElementById('tutorial-skip-btn').addEventListener('click', () => {
      DB.state.markTutorialSeen(); closeTutorial();
    });

    document.getElementById('howto-close-btn').addEventListener('click', () => DB.ui.closeModal('modal-howto'));
    document.getElementById('about-close-btn').addEventListener('click', () => DB.ui.closeModal('modal-about'));
    document.getElementById('settings-close-btn').addEventListener('click', () => DB.ui.closeModal('modal-settings'));

    document.getElementById('btn-pause').addEventListener('click', pauseGame);
    document.getElementById('pause-resume-btn').addEventListener('click', resumeGame);
    document.getElementById('pause-restart-btn').addEventListener('click', restartMatch);
    document.getElementById('pause-quit-btn').addEventListener('click', quitToMenu);

    document.getElementById('btn-fullscreen').addEventListener('click', DB.ui.toggleFullscreen);

    document.getElementById('victory-rematch-btn').addEventListener('click', () => {
      DB.ui.showScreen('screen-game');
      DB.state.resetMatch();
      startRoundSetup();
      startLoop();
    });
    document.getElementById('victory-menu-btn').addEventListener('click', goMenu);

    DB.input.onSpace(() => { if (!document.getElementById('screen-game').hidden) beginCountdownAndRun(); });
    DB.input.onEscape(() => {
      if (document.getElementById('screen-game').hidden) return;
      if (!document.getElementById('modal-pause').hidden) resumeGame(); else pauseGame();
    });
  }

  function boot() {
    DB.ui.cache();
    DB.state.loadSettings();
    DB.i18n.set(DB.i18n.detect());
    DB.ui.buildLangMenu();
    DB.i18n.applyStatic(document);
    DB.ui.initSettingsUI();
    DB.input.init();
    wireGlobalButtons();

    setTimeout(() => { DB.ui.showScreen('screen-splash'); }, 550);
  }

  document.addEventListener('DOMContentLoaded', boot);
})();
