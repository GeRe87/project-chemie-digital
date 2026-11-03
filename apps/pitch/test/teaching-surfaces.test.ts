import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';

test('teaching panels share one appearance policy, independently of scene identities',()=>{
 const css=readFileSync(new URL('../src/teaching-surfaces.css',import.meta.url),'utf8');
 assert.match(css,/--pcd-panel-border:/u);
 assert.match(css,/border: var\(--pcd-panel-border\)/u);
 assert.match(css,/background: var\(--pcd-panel-background\)/u);
 assert.match(css,/box-shadow: none/u);
 assert.doesNotMatch(css,/level5|rv-n|pc-n|\[id[=\^]|data-source-resource/u);
 assert.match(css,/font-weight: 400/u);
});

test('layout styles do not repeat the historical redundant profile guard',()=>{
 const css=readFileSync(new URL('../src/learning-stage-primitives.css',import.meta.url),'utf8');
 assert.doesNotMatch(css,/:is\([^{}]*prompt-code[^{}]*\)\[data-composition-profile=/u);
 const cards=readFileSync(new URL('../src/card-primitives.css',import.meta.url),'utf8');
 assert.doesNotMatch(cards,/content: counter\(pcd-card/u);
 const readability=readFileSync(new URL('../src/lecture-readability.css',import.meta.url),'utf8');
 assert.doesNotMatch(readability,/definition-list-entry:nth-child/u);
 const charts=readFileSync(new URL('../src/chart-theme.css',import.meta.url),'utf8');
 assert.doesNotMatch(charts,/\.retro-neon-chart-header::after/u);
});

test('standard cards have one coloured header and decorative ordinal without numbering symbol legends',()=>{
 const css=readFileSync(new URL('../src/teaching-surfaces.css',import.meta.url),'utf8');
 assert.match(css,/:not\(\[data-symbol-legend="true"\]\)/u);
 assert.match(css,/background: var\(--pcd-card-header\)/u);
 assert.match(css,/content: attr\(data-card-number\) \/ ""/u);
 assert.match(css,/color: #fff/u);
 const renderer=readFileSync(new URL('../src/preview.ts',import.meta.url),'utf8');
 assert.match(renderer,/term\.setAttribute\("data-card-number", String\(index \+ 1\)\.padStart\(2, "0"\)\)/u);
});
