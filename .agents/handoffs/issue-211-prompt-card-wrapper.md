# Issue #211 — Prompt-card wrapper collapse

## Observed browser failure

The Introduction Round displayed six independent visual grid items instead of three cards:
- BACKGROUND heading and its body separated,
- CHEMOMETRICS EXPERIENCE heading and its body separated,
- PROGRAMMING heading and its body separated.

## Root cause

The shared DefinitionList baseline in `foundation-card-grid-layout.css` intentionally uses:

```css
.reveal .definition-list > .definition-list-entry {
  display: contents;
}
```

That supports older table-like DefinitionList presentations. Every established card layout explicitly resets `.definition-list-entry` to a box. The new `prompt-card-grid` omitted this reset, so its wrapper had no generated box and its `dt` / `dd` children became grid items themselves.

## Fix

`prompt-card-grid-layout.css` now explicitly applies:

```css
display: flex;
flex-direction: column;
```

to each prompt `.definition-list-entry`.

This restores one visual card per semantic DefinitionListEntry without changing RDF, SceneDocument, renderer markup, layout inference, or Introduction-specific identities.

A focused Pitch regression asserts this interaction between the global flattened baseline and the prompt-card override.

## Verify

```powershell
npm run test:pitch
npm run pitch:intro
```

Expected Introduction Round: exactly three intact cards with title and body grouped inside each border.
