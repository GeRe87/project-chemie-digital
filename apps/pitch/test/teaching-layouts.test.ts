import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
const source=(name:string)=>readFileSync(new URL('../src/'+name,import.meta.url),'utf8');

test('ordinary teaching layouts share one frame and balanced split without scene identities',()=>{
 const css=source('teaching-layouts.css');
 assert.match(css,/--pcd-slide-inset:/u);assert.match(css,/--pcd-slide-gap:/u);
 assert.match(css,/grid-template-columns: repeat\(2, minmax\(0, 1fr\)\)/u);
 assert.doesNotMatch(css,/level5|rv-n|pc-n|\[id[=\^]/u);
 assert.match(css,/:not\(:where\(:has\(\[data-diagram-type="flow"\]/u);
});

test('interactive widgets share a readable type floor instead of 13-18px local fonts',()=>{
 const css=source('distribution-experiment.css');
 assert.doesNotMatch(css,/\b(?:font|font-size):\s*(?:1[0-9])px/u);
 assert.doesNotMatch(css,/\bsection\b|data-composition/u);
 assert.match(source('interactive-primitives.css'),/max\(22px/u);
 assert.match(css,/min-height:44px/u);
});

test('auto-height evidence retains visible SVGs and aligned padded panels',()=>{
 const stages=source('learning-stage-primitives.css');
 assert.match(stages,/\[data-composition-profile="info-visual"\] \[data-chart-block-id\] > \.d3-chart-figure > \.d3-chart-svg\s*\{\s*flex:none;min-height:0;height:auto;max-height:none;width:100%;/u);
 assert.match(source('teaching-layouts.css'),/> \.pcd-composition-region > :first-child\s*\{\s*margin-top: 0;/u);
 assert.match(source('teaching-surfaces.css'),/\.reveal \.formula-with-legend\s*\{\s*box-sizing: border-box;\s*padding: var\(--pcd-panel-padding\);/u);
});

test('every shared bordered teaching panel owns interior spacing, including ordinary prose',()=>{
 const css=source('teaching-surfaces.css');
 assert.match(css,/\.reveal :is\(\.definition-list-entry, \.formula-with-legend, \[data-component-kind="info-surface"\], \[data-component-kind="prompt"\], \.code-function-workbench\)\s*\{\s*padding: var\(--pcd-panel-padding\);/u);
});
