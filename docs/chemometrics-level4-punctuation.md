# Level 4 punctuation rule

Do not use em dashes (Unicode U+2014) as sentence separators or label dividers.
Use a colon, comma, semicolon, parentheses or a separate sentence instead.
Mathematical minus signs, numeric ranges, hyphens in identifiers and list
markers are not affected.

The review corrected ten occurrences in Level 4 TriG, including four in the
active lecture, earlier examples, poll options and one source display title.
It also removed automatically inserted separators from the script's CSS,
diagram and graph fallback text, accessibility labels, theme labels and static
export. Resource identities, source URLs, scientific values, code and formulas
are unchanged. Shared generators use colons, so another view cannot silently
restore the prohibited punctuation.

`apps/pitch/test/level4-no-em-dash.test.ts` enforces the rule for authored Level 4
sources, all 65 compiled scenes, Reveal and script projections, and shared text
generators. It includes an explicit check that a numeric concentration range
remains intact. Existing text-output assertions follow the new punctuation.

This is a bounded local content correction, not lecture restructuring or an
external overall validation. No commit, PR, merge or deployment is included.

Verification: 111 selected Node tests and nine Python projection tests passed.
The normal-course browser check found no em dash in the mounted slides, all
65 script sections, script accessibility labels or CSS-generated definition
separators. Both local transports were regenerated from the canonical TriG.
