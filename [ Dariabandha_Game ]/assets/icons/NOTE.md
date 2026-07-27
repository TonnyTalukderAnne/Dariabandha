Icons are inlined as a single <svg><defs><symbol>...</symbol></defs></svg> block directly
inside index.html rather than kept here as a separate loadable file.

Why: browsers (Chrome in particular) block `<use xlink:href="external.svg#id">` reads and
JS `fetch()` of local files when a page is opened directly via `file://` — which is the
one guarantee this project has to meet ("opening index.html must immediately start the
game", no server). Inlining sidesteps that entirely and keeps every icon reliably
colorable via `currentColor`.

If you later serve this project from a real server (not `file://`), you're free to move
the `<symbol>` definitions from `index.html` into a real `icons.svg` here and reference it
externally — no other code needs to change.
