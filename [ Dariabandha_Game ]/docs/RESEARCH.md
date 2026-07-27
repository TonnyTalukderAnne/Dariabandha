# Research Summary — Dariabandha (দাড়িয়াবান্ধা)

## Sources
Wikipedia ("Dariyabandha"), The Daily Star / Asia News Network ("Roots and rules: the folk
games of Bangladesh"), Views Bangladesh, and general surveys of traditional Bangladeshi
rural games. Where regional sources disagreed on exact court dimensions or scoring detail,
the most commonly repeated version was used, and it is explicitly noted below where this
project simplifies or adapts a rule for a 2-player browser game.

## What the game is
- **Name meaning**: "Daria" = one who rows a boat; "Bandha" = barrier/obstacle. The name
  evokes players navigating past a line of guards, the way a boatman navigates obstacles.
- **Era/context**: A staple of the dry season in rural Bangladesh, played on empty
  harvested fields once the ground was firm enough to mark out a court with a spade.
  Enjoyed by children and adults, boys and girls alike, across almost all regions.
- **Court**: A rectangular field (badminton-court-like proportions) is divided by evenly
  spaced parallel lines into a row of "cross courts." A number of these lines run the
  width of the court; one line runs the full length down the center, forming a "vertical
  court" (corridor).
- **Teams**: Two teams. A toss decides which team attacks and which defends.
- **Defense**: One defender is posted in each cross-court (row) and may only move along
  that row's line. The defender guarding the frontmost row may also range across the
  entire central vertical corridor.
- **Attack**: Attacking players enter from the front of the court and must run through
  every row to the back of the court, then back again to the front, without being
  touched by a defender. Completing the full there-and-back circuit scores a point,
  traditionally called a "game."
- **Elimination / role reversal**: A validly-tagged attacker (the defender must be fully
  inside their own row when tagging — a foot on the boundary line invalidates the tag)
  is eliminated. In the common village version, a single successful tag ends the
  attacking side's turn and the roles swap. If a defender themselves steps on/over
  their line, they must leave their post and the attackers may claim that row.
- **No universal fixed rulebook**: Multiple sources explicitly note there is no single
  standardized rule set — regional and even neighborhood variations are the norm. The
  National Recreation Association of Bangladesh has one formal ruleset (used for
  organized/tournament play, with halves, referees, and judges), but the everyday
  village version is looser and faster to pick up.

## Why this version was chosen for the project
The tournament ruleset (6-a-side teams, 25-minute halves, a referee plus 6–12 line
judges, tiebreaker periods) is accurate but built for organized outdoor competition —
not for a 2-player browser session that a stranger to the game should understand in
under 3 minutes. This project follows the **everyday village version**: run the
gauntlet, don't get tagged, complete the circuit to score, roles swap on a tag. That
core loop is present in every source consulted and is what actually makes the game fun.

## Adaptation for a 2-player digital duel
Real Dariabandha is 4–6 players per side, moving simultaneously and continuously on an
open field. A faithful *direct port* of that isn't meaningfully playable by two people
on one keyboard. This project preserves the mechanic that makes the game what it is —
one side runs, dodges, and tries to complete a circuit; the other actively defends a
guarded lane — while scaling the team down to what two players can control at once:

- The **Runner** (attacking side) is one human-controlled character.
- The **Line Guards** (one per row) are simplified to disciplined lateral patrol
  AI — this mirrors "a defender may only move along their own line."
- The **Daria Guard** (front-row defender's extended privilege to roam the whole
  vertical corridor) is the second human player's character — giving both players an
  active, skill-based role every round, not a passive spectator role.
- Roles swap every round, exactly as in the source material.

This is stated openly in the README as a deliberate simplification, not presented as
the literal full-scale field game.
