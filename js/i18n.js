'use strict';
/* =========================================================================
   i18n.js — translation engine. Dictionaries live in /lang/*.js and attach
   themselves to window.DB_LANG before this file runs (see index.html load
   order). This file only knows how to look keys up, interpolate, and apply
   them to the DOM — it owns no language text itself.
   ========================================================================= */
var DB = window.DB = window.DB || {};

DB.i18n = (function () {
  const SUPPORTED = ['en', 'bn', 'ko', 'ar', 'es'];
  const RTL = new Set(['ar']);
  let current = 'en';

  function available() {
    return SUPPORTED.filter((code) => !!window.DB_LANG[code]);
  }

  function detect() {
    try {
      const saved = localStorage.getItem('db_lang');
      if (saved && window.DB_LANG[saved]) return saved;
    } catch (e) { /* localStorage unavailable */ }
    const nav = (navigator.language || 'en').slice(0, 2).toLowerCase();
    return window.DB_LANG[nav] ? nav : 'en';
  }

  function isRTL(code) { return RTL.has(code || current); }

  function set(code) {
    if (!window.DB_LANG[code]) code = 'en';
    current = code;
    try { localStorage.setItem('db_lang', code); } catch (e) { /* ignore */ }
    document.documentElement.setAttribute('lang', code);
    document.documentElement.setAttribute('dir', isRTL(code) ? 'rtl' : 'ltr');
    document.body.classList.toggle('rtl', isRTL(code));
  }

  function get() { return current; }

  function t(key, params) {
    const table = window.DB_LANG[current] || window.DB_LANG.en;
    let str = table[key];
    if (str === undefined) {
      str = (window.DB_LANG.en && window.DB_LANG.en[key]) || key;
    }
    if (params) {
      Object.keys(params).forEach((k) => {
        str = str.replace(new RegExp('\\{' + k + '\\}', 'g'), params[k]);
      });
    }
    return str;
  }

  function applyStatic(root) {
    const scope = root || document;
    scope.querySelectorAll('[data-t]').forEach((el) => {
      const key = el.getAttribute('data-t');
      const argsAttr = el.getAttribute('data-t-args');
      let params = null;
      if (argsAttr) { try { params = JSON.parse(argsAttr); } catch (e) { params = null; } }
      el.textContent = t(key, params);
    });
    scope.querySelectorAll('[data-t-placeholder]').forEach((el) => {
      el.setAttribute('placeholder', t(el.getAttribute('data-t-placeholder')));
    });
    scope.querySelectorAll('[data-t-aria]').forEach((el) => {
      el.setAttribute('aria-label', t(el.getAttribute('data-t-aria')));
    });
  }

  return { available, detect, isRTL, set, get, t, applyStatic };
})();
