'use strict';
/* =========================================================================
   state.js — single source of truth for match/round state.
   ========================================================================= */
var DB = window.DB = window.DB || {};

DB.state = (function () {
  const DEFAULT_AVATARS = ['assets/images/avatar-default-a.svg', 'assets/images/avatar-default-b.svg'];

  function freshPlayer(id, defaultNameKey) {
    return {
      id,
      name: '',
      nameKey: defaultNameKey,
      photo: DEFAULT_AVATARS[id === 'a' ? 0 : 1],
      score: 0,
    };
  }

  const s = {
    players: { a: freshPlayer('a', 'setup.namePlaceholderA'), b: freshPlayer('b', 'setup.namePlaceholderB') },
    matchTarget: 5,
    difficulty: 'normal',
    round: 1,
    runner: 'a',        // which player id is Running this round
    guard: 'b',
    roundPhase: 'idle',  // idle | countdown | outbound | returning | roundEnd
    tutorialSeen: false,
    settings: { reducedMotion: false },
  };

  function resetMatch() {
    s.players.a.score = 0;
    s.players.b.score = 0;
    s.round = 1;
    s.runner = 'a';
    s.guard = 'b';
    s.roundPhase = 'idle';
  }

  function swapRoles() {
    const r = s.runner; s.runner = s.guard; s.guard = r;
  }

  function displayName(id) {
    const p = s.players[id];
    return p.name && p.name.trim() ? p.name.trim() : DB.i18n.t(p.nameKey);
  }

  function loadSettings() {
    try {
      const raw = localStorage.getItem('db_settings');
      if (raw) Object.assign(s.settings, JSON.parse(raw));
      s.tutorialSeen = localStorage.getItem('db_tutorial_seen') === '1';
    } catch (e) { /* ignore */ }
  }
  function saveSettings() {
    try { localStorage.setItem('db_settings', JSON.stringify(s.settings)); } catch (e) { /* ignore */ }
  }
  function markTutorialSeen() {
    s.tutorialSeen = true;
    try { localStorage.setItem('db_tutorial_seen', '1'); } catch (e) { /* ignore */ }
  }

  return { s, resetMatch, swapRoles, displayName, loadSettings, saveSettings, markTutorialSeen, DEFAULT_AVATARS };
})();
