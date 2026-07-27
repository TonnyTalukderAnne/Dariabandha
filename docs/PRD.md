# Product Requirements Document — Dariabandha: The Guarded Court

## Section 1 — Project Overview

**Project name**: Dariabandha: The Guarded Court
**Description**: A real-time, 2-player local (hotseat) browser adaptation of the
traditional Bangladeshi field game Dariabandha, built with plain HTML/CSS/JS and a
CSS-only pseudo-3D board.
**Vision**: Make an authentic, disappearing folk game legible and fun for someone who
has never heard of it, in under 3 minutes, without losing what makes the original
mechanic interesting.
**Objectives**: (1) faithfully represent the guard-line / circuit-completion mechanic,
(2) be genuinely fun to replay, (3) run in any modern browser and deploy cleanly to
GitHub Pages / Netlify / Vercel with zero build step, (4) be fully localized in 5
languages including right-to-left Arabic, (5) match or exceed the visual and
code-quality bar of the Yutnori project without reusing any of its assets or code.
**Target audience**: see docs/5W1H.md → WHO.
**Expected experience**: open `index.html` → pick names/photos → 60–90 second tutorial
(skippable) → best-of-N round match, each round ~5–20 seconds of real-time dodging →
victory screen → rematch.

## Section 2 — Core Gameplay

- **Objective**: score more round-wins than your opponent before the match target is
  reached (default: first to 5).
- **Roles**: exactly one Runner and one Daria Guard (roaming defender) per round, plus
  5 AI Line Guards, one per guard-line. Roles swap every round.
- **Movement**: Runner uses Arrow keys; Daria Guard uses WASD. Both move freely inside
  the court bounds at equal speed. Line Guards patrol left–right along their fixed line
  only, at a speed set by the match's difficulty setting.
- **Safe zones**: the start baseline and the far baseline are untaggable strips — you
  cannot be tagged in the instant of spawning or immediately after turning around.
- **Circuit**: Runner must travel from the start baseline to the far baseline (phase
  "Outbound"), then back to the start baseline (phase "Return"). Reaching the far
  baseline mid-run does not score by itself — only completing the full return does.
- **Tagging**: a Line Guard or the Daria Guard scores a tag if their hitbox overlaps the
  Runner's while the Runner is outside a safe zone. A tag immediately ends the round.
- **Scoring**: Runner success = 1 point for the Runner's controlling player. Tag success
  = 1 point for the Guard's controlling player. Points persist across the whole match.
- **Round system**: rounds are untimed (a round always ends in a tag or a completed
  circuit — no draws), keeping the "who dares go for it" tension the real game has.
- **Match end**: first player to reach the target score wins the match outright.
- **Tie handling**: since every round has a definite winner, the running score can never
  itself tie *and* end the match — the match simply continues until the target is
  reached by one side.
- **Restart**: "Rematch" replays instantly with the same players/settings; "Main Menu"
  returns to setup.

## Section 3 — Game States

`Loading → Splash → Main Menu → [Settings | Language Select | Player Setup
(nickname + photo upload) | Tutorial | How To Play] → Ready (coin flip / role reveal)
→ Gameplay (Countdown → Active Round → Round Result) → (loop rounds) → Victory →
Rematch or Main Menu`, with `Pause/Resume` reachable from Gameplay at any time.

## Section 4 — User Experience

Understandable in under 3 minutes: the Main Menu's primary action is "Play," which
leads straight into player setup, an optional one-time interactive tutorial, and then
the match — no walls of text required before the first round. Every button gives
immediate visual feedback (hover lift, press-down, glow/pulse highlights). Movement,
guard patrol, tags, and round transitions all use eased CSS transitions or
requestAnimationFrame interpolation — nothing snaps instantly except the tag moment
itself, which is intentionally sharp for readability.

## Section 5 — User Interface

Persistent HUD during gameplay: round/turn indicator (who is Runner vs Guard right
now), both players' scores, match-target reminder, pause/fullscreen/language/settings
buttons. Setup screens: nickname fields, photo upload with circular preview (reusing
the "default avatar if none uploaded" pattern), match-length and difficulty pickers.
Modal panels (glassmorphism cards) for Settings, How To Play, Pause, and Victory.

## Section 6 — Accessibility

- Full keyboard control for both players simultaneously (distinct key sets), plus
  on-screen touch D-pads that auto-appear on touch/small-pointer devices.
- Large, high-contrast text on all HUD elements; color is never the *only* signal
  (the Runner's safe/danger state is also shown via an icon and a text cue, not color
  alone, for color-blind accessibility).
- `prefers-reduced-motion` is honored automatically, and is also exposed as a manual
  "Reduce motion" toggle in Settings for players whose OS-level preference doesn't
  reflect what they want in this specific game.
- Layout is fluid/responsive from small tablets up to ultrawide desktops.

## Section 7 — Localization

English, Bangla, Korean, Arabic (full RTL — mirrored layout, not just mirrored text),
and Spanish. Every button, panel, tooltip, tutorial step, rule explanation, and
notification string is translated (see `/lang`). Language choice persists locally and
auto-detects the browser's language on first run, same UX pattern as any well-built
multilingual web app.

## Section 8 — Project Structure

```
dariabandha/
├── index.html
├── README.md
├── LICENSE
├── css/            variables, base, layout, board, characters, ui, animations, responsive
├── js/             state, board, entities, input, i18n, ui, main
├── lang/           en.js, bn.js, ko.js, ar.js, es.js
├── assets/
│   ├── images/     original SVG default avatars + decorative alpona-inspired border art
│   └── icons/      original SVG icon set (pause, fullscreen, language, close, etc.)
└── docs/           RESEARCH.md, 5W1H.md, PRD.md
```

### Note on project decisions (see README for full detail)
- **No audio**: per the finalized project brief, this build intentionally ships with no
  sound effects, no background music, and no `/audio` folder. Feedback is delivered
  entirely through motion, highlight, and transition design instead — see `css/ui.css`
  and `css/animations.css`.
- **Fonts**: the UI loads Google Fonts (Baloo 2 for display type; Hind Siliguri, Noto
  Sans Bengali/Arabic/KR for body text per-script) from the Google Fonts CDN, since this
  build targets standard web deployment (GitHub Pages / Netlify / Vercel) rather than a
  strict offline-only guarantee. The same real system-font fallback chain from the
  original offline-only draft is kept as a safety net if the CDN is unreachable.
