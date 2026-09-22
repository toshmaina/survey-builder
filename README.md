# Survey Builder

Vanilla HTML/CSS/JS survey builder. No framework, no build step. Data lives
in `localStorage` — nothing leaves the browser.

## Run it

Because it uses ES modules, open it through a local server rather than
double-clicking the file (browsers block `file://` module imports):

```bash
cd survey-builder
python3 -m http.server 8080
# then open http://localhost:8080
```

Any static server works (`npx serve`, VS Code Live Server, etc.).

## Fonts

`css/fonts.css` declares `@font-face` rules for the same three local
families used on the Tatua site — Asap, Inter, and Lexend Deca — expected
under:

- `assets/fonts/asap/Asap-{Regular,Italic,Medium,MediumItalic,SemiBold,SemiBoldItalic,Bold,BoldItalic}.{woff2,woff,ttf}`
- `assets/fonts/inter/Inter-{Regular,SemiBold,Bold}.{woff2,woff,ttf}`
- `assets/fonts/lexend-deca/LexendDeca-Regular.{woff2,woff,ttf}`

Drop the actual font files into those folders and everything picks them up
automatically. `--font-family` in `tokens.css` defaults to Asap, with a
system-font fallback so the app still renders before the files are added.

## Theme settings widget

`js/theme.js` (ported from the Tatua site script) plus the toggle
button/panel markup in `index.html` let a viewer pick a color scheme
(blue/orange/purple), font family (Asap/Inter/Lexend Deca), base font size,
element spacing, and border radius — all applied live via CSS custom
properties on `<html>` and persisted to `localStorage` under the
`tatua-*` keys, the same mechanism as the main site. This is separate from
the app's own survey data storage in `js/storage.js`.

## Icons

`assets/icons/*.svg` — plain inline SVGs (clipboard, plus, edit, trash, eye,
chevron-left, chevron-right), referenced by `<img src="assets/icons/...">`.
Swap them for Tatua's actual icon set by replacing the files with the same
names, or add new ones and reference them from `components/*.js`.

## Structure

- `js/storage.js` — localStorage read/write
- `js/state.js` — in-memory store + CRUD + pub/sub (survey and question data)
- `js/router.js` — hash router (`#/surveys`, `#/surveys/:id`)
- `js/questionTypes.js` — registry of all 22 supported question types: their
  editable config, form fields, and end-user preview rendering
- `js/components/` — table, dialog, survey form, delete dialogs, question
  form, preview dialog, prev/next nav
- `js/views/` — the two pages (survey list, survey details)

## Adding a new question type

Add an entry to `QUESTION_TYPES` in `js/questionTypes.js`, then (if it needs
config beyond label/required/help text) extend `renderExtraFieldsHtml`,
`bindExtraFieldEvents`, `collectExtraFields`, and `renderPreviewInput` with a
case for its id. Every other file — the question form, the table, the
preview dialog — reads from this registry, so nothing else needs to change.
