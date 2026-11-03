import test from 'node:test';
import assert from 'node:assert/strict';
import {experimentPlotGeometry,wrapExperimentAxis} from '../src/experiment-layout.ts';

test('plot coordinates follow the real column and do not use a fixed 960px canvas',()=>{
 assert.equal(experimentPlotGeometry(600,1).plotWidth,600);
 assert.equal(experimentPlotGeometry(1320,2).plotWidth,652);
 assert.equal(experimentPlotGeometry(600,2).stacked,false);
 assert.equal(experimentPlotGeometry(600,2).plotWidth,292);
 assert.equal(experimentPlotGeometry(480,2).stacked,true);
 assert.equal(experimentPlotGeometry(480,2).plotWidth,480);
 assert.equal(experimentPlotGeometry(1320,2).stacked,false);
 assert.equal(experimentPlotGeometry(0,1).plotWidth,640);
 assert.equal(experimentPlotGeometry(NaN,1).plotWidth,640);
});

test('narrow axes wrap complete titles instead of reducing label size or dropping words',()=>{
 const label='Normal density (L/mg)';
 const lines=wrapExperimentAxis(label,210);
 assert(lines.length>1);assert.equal(lines.join(' '),label);
 assert.deepEqual(wrapExperimentAxis(label,600),[label]);
});
