import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
const source=(name:string)=>readFileSync(new URL('../src/'+name,import.meta.url),'utf8');

test('slide view tabs reuse chart and formula regions without scientific identities',()=>{
 const runtime=source('scene-view-tabs.ts');
 assert.match(runtime,/data-chart-block-id/u);
 assert.match(runtime,/data-diagram-type="flow"/u);
 assert.match(runtime,/secondary\?\.querySelector\('\.formula-with-legend'\)/u);
 assert.doesNotMatch(runtime,/level5|pc-n|rv-n|runExperiment|cloneNode|innerHTML/u);
 for(const role of ['tablist','tab','tabpanel'])assert.match(runtime,new RegExp(`'${role}'`,'u'));
 assert.match(runtime,/'aria-selected'/u);assert.match(runtime,/'aria-controls'/u);
 assert.match(runtime,/removeEventListener\('keydown', keyboard, true\)/u);
 assert.match(runtime,/ArrowDown/u);assert.match(runtime,/ArrowUp/u);
 assert.match(runtime,/contenteditable/u);
});

test('tab panes are bounded on screen but complete in static/script/print views',()=>{
 const css=source('scene-view-tabs.css');
 assert.match(css,/height: 800px/u);
 assert.match(css,/overflow: auto/u);
 assert.match(css,/@media print/u);
 assert.match(css,/display: block !important; max-height: none; overflow: visible/u);
 assert.match(source('presentation-main.ts'),/slidesPdf \? \(\) => \{\} : mountSceneViewTabs/u);
});

test('single-column visuals fill the remaining height without stretching text or printed pages',()=>{
 const tabs=source('scene-view-tabs.css'),layouts=source('teaching-layouts.css');
 assert.match(tabs,/@media screen and \(min-width:701px\)/u);
 assert.match(tabs,/--pcd-experiment-fill-stage: 1/u);
 assert.match(tabs,/\.experiment-panels \{ flex: 1 1 240px/u);
 assert.match(layouts,/\[data-composition-main-count="1"\]:has\(> \[data-component-kind="visual"\], > \.media-reference\)/u);
 assert.match(layouts,/object-fit: contain/u);
});
