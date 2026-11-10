import test from 'node:test';
import assert from 'node:assert/strict';
import {oneWayAnova} from '../src/anova-analysis.ts';
import {currentAnovaObservations, runAnovaExperiment, validateAnovaExperiment, type AnovaExperimentInput} from '../src/anova-experiment.ts';
import type {DotPlotGroup} from '../src/scene-document.ts';

const source = [{resourceId:'synthetic-data'}] as unknown as DotPlotGroup['source'];
const values = [[93,95,94,92,96,94], [97,99,98,100,96,98], [94,93,92,95,91,93]];
function groups(rows:readonly (readonly number[])[] = values):DotPlotGroup[] {
  return rows.map((row, i) => ({id:`method-${i}`, label:`Method ${i}`, source,
    data:row.map((value, j) => ({id:`preparation-${i}-${j}`, value, source})),
  }));
}
function input(p:Partial<AnovaExperimentInput['parameters']> = {}, authored:readonly DotPlotGroup[] = groups()):AnovaExperimentInput {
  return {groups:authored, unit:'percent recovery', parameters:{betweenScale:1, withinScale:1, view:0, ...p}};
}
function close(actual:number, expected:number, tolerance=1e-9):void {
  assert.ok(Number.isFinite(actual) && Math.abs(actual - expected) <= tolerance, `${actual} != ${expected}`);
}
function probability(actual:number|null, expected:number):void {
  assert.ok(actual !== null && actual > 0);
  close(actual! / expected, 1, 2e-10);
  close(Math.log(actual!), Math.log(expected), 2e-10);
}
function finitePlots(result:ReturnType<typeof runAnovaExperiment>):void {
  for (const panel of result.experiment.panels) {
    for (const trace of panel.traces) for (const point of trace.points) {
      assert.ok(Number.isFinite(point.x) && Number.isFinite(point.y));
    }
    for (const marker of panel.markers ?? []) assert.ok(Number.isFinite(marker.x));
    for (const domain of [panel.xDomain, panel.yDomain]) if (domain) domain.forEach(value => assert.ok(Number.isFinite(value)));
  }
  for (const readout of result.experiment.readouts) if (typeof readout.value === 'number') assert.ok(Number.isFinite(readout.value));
}
function deepFreeze<T>(value:T):T {
  if (value && typeof value === 'object') {
    for (const child of Object.values(value)) deepFreeze(child);
    Object.freeze(value);
  }
  return value;
}

test('exact ties separate deterministically, with aligned residuals and exact reset', () => {
  const authored = deepFreeze(groups());
  const before = JSON.stringify(authored);
  const baseline = runAnovaExperiment(input({}, authored));
  const panel = baseline.experiment.panels[0];
  const dots = panel.traces.filter(trace => trace.style === 'points' && !trace.emphasis).flatMap(trace => trace.points);
  assert.equal(dots.length, 18);
  assert.equal(new Set(dots.map(point => JSON.stringify(point))).size, 18);
  for (const [i, group] of authored.entries()) {
    const points = panel.traces.find(trace => trace.label === group.label)!.points;
    for (const [j, row] of group.data.entries()) {
      assert.equal(points[j].y, row.value);
      assert.ok(Math.abs(points[j].x - (i + 1)) <= .18 + 1e-12);
      const tied = group.data.map((value, index) => ({value, index})).filter(entry => entry.value.value === row.value);
      close(tied.reduce((sum, entry) => sum + points[entry.index].x, 0) / tied.length, i + 1);
      if (tied.length === 1) assert.equal(points[j].x, i + 1);
      else assert.ok(tied.every((entry, index) => index === 0 || points[tied[index - 1].index].x < points[entry.index].x));
    }
  }
  assert.deepEqual(panel.traces.find(trace => trace.label === 'Current group means')!.points.map(point => point.x), [1,2,3]);
  const residual = runAnovaExperiment(input({view:1}, authored));
  for (const group of authored) {
    const points = residual.experiment.panels[0].traces.find(trace => trace.label === group.label)!.points;
    group.data.forEach((row, index) => {
      const segment = residual.experiment.panels[0].traces.find(trace => trace.label === `${row.id}: fitted to observed (residual)`)!;
      assert.equal(segment.points[0].x, points[index].x);
      assert.deepEqual(segment.points[1], points[index]);
    });
  }
  runAnovaExperiment(input({betweenScale:2, withinScale:.5}, authored));
  assert.deepEqual(runAnovaExperiment(input({}, authored)), baseline);
  assert.deepEqual(baseline.observations.map(row => row.value), authored.flatMap(group => group.data.map(row => row.value)));
  assert.equal(JSON.stringify(authored), before);
  const reference = runAnovaExperiment(input({view:2}, authored));
  assert.deepEqual(reference.analysis, baseline.analysis);
  assert.equal(reference.experiment.panels[0].yDomain, undefined);
  close(reference.experiment.panels[0].xDomain![1], 25.2);
  assert.equal(reference.experiment.panels[0].markers![0].x, 21);
});

test('response domains cover scale corners and stay fixed across all display settings', () => {
  const baseline = runAnovaExperiment(input());
  const domain = baseline.experiment.panels[0].yDomain!;
  assert.ok(domain[0] > 0);
  for (const betweenScale of [0,.4,1,2.2,3]) for (const withinScale of [0,.7,1,2.6,3]) {
    for (const view of [0,1]) {
      const result = runAnovaExperiment(input({betweenScale,withinScale,view}));
      const panel = result.experiment.panels[0];
      const expected = domain.map(value => value - (view === 1 ? baseline.analysis.grandMean : 0));
      assert.deepEqual(panel.yDomain, expected);
      for (const trace of panel.traces) for (const point of trace.points) {
        assert.ok(point.y >= expected[0] && point.y <= expected[1]);
      }
      finitePlots(result);
    }
  }
  const equal = runAnovaExperiment(input({}, groups([[7,7],[7,7]])));
  const equalDomain = equal.experiment.panels[0].yDomain!;
  assert.ok(equalDomain[0] < 7 && equalDomain[1] > 7);
  finitePlots(equal);
});

test('18 preparations reproduce gold results, complete readouts and finite plots in every view', () => {
  const baseline = runAnovaExperiment(input());
  const a = baseline.analysis;
  assert.deepEqual(a.groups.map(group => group.mean), [94,98,93]);
  close(a.grandMean, 95);
  assert.deepEqual(a.ss, {between:84, within:30, total:114});
  assert.deepEqual(a.df, {between:2, within:15, total:17});
  assert.deepEqual(a.ms, {between:42, within:2});
  close(a.inference.f!, 21);
  probability(a.inference.p, 4.48356040690602e-5);
  close(a.etaSquared!, 84 / 114); close(a.omegaSquared!, 80 / 116);
  const labels = baseline.experiment.readouts.map(row => row.label);
  for (const label of ['N','k','F','p-value','Eta squared','Omega squared','df total','MS within (percent recovery)²']) assert.ok(labels.includes(label));
  for (const view of [0,1,2]) {
    const result = runAnovaExperiment(input({view}));
    assert.deepEqual(result.analysis, a);
    assert.deepEqual(result.experiment.readouts, baseline.experiment.readouts);
    finitePlots(result);
  }
  const reference = runAnovaExperiment(input({view:2})).experiment.panels[0];
  assert.ok(reference.xDomain![1] >= 21);
  assert.equal(reference.markers![0].x, 21);
  assert.ok(reference.traces.reduce((n, trace) => n + trace.points.length, 0) <= 161);
});

test('between and within controls refit actual values and give the expected F factor', () => {
  for (const [betweenScale, withinScale] of [[2,.5], [.5,2], [0,1], [3,3]]) {
    const result = runAnovaExperiment(input({betweenScale, withinScale}));
    close(result.analysis.inference.f!, 21 * (betweenScale / withinScale) ** 2);
    close(result.analysis.ss.between, 84 * betweenScale ** 2);
    close(result.analysis.ss.within, 30 * withinScale ** 2);
    assert.deepEqual(result.analysis, oneWayAnova(result.observations));
    finitePlots(result);
  }
});

test('a source value edit changes actual SS and p, including transformed execution', () => {
  const edited = groups();
  edited[0] = {...edited[0], data:edited[0].data.map((row, i) => i === 0 ? {...row, value:99} : row)};
  const changed = runAnovaExperiment(input({}, edited));
  close(changed.analysis.grandMean, 95 + 1 / 3);
  close(changed.analysis.ss.between, 76); close(changed.analysis.ss.within, 48); close(changed.analysis.ss.total, 124);
  close(changed.analysis.inference.f!, 11.875);
  assert.notEqual(changed.analysis.inference.p, runAnovaExperiment(input()).analysis.inference.p);
  const transformed = runAnovaExperiment(input({betweenScale:2, withinScale:.5}, edited));
  close(transformed.analysis.inference.f!, 11.875 * 16);
  assert.deepEqual(transformed.analysis, oneWayAnova(transformed.observations));
});

test('exact reset, stable semantic identities and provenance without source mutation', () => {
  const authored = deepFreeze(groups([[.1,.2,.4], [.7,.8,1.1]]));
  const before = JSON.stringify(authored);
  runAnovaExperiment(input({betweenScale:2.3, withinScale:.7}, authored));
  const reset = currentAnovaObservations(input({}, authored));
  assert.deepEqual(reset, authored.flatMap(group => group.data.map(row => ({id:row.id, group:group.id, value:row.value}))));
  const changed = currentAnovaObservations(input({betweenScale:0, withinScale:3}, authored));
  assert.deepEqual(changed.map(row => [row.id,row.group]), reset.map(row => [row.id,row.group]));
  assert.equal(JSON.stringify(authored), before);
  const relabelled = authored.map(group => ({...group, label:'Same human label'}));
  assert.deepEqual(runAnovaExperiment(input({}, relabelled)).analysis, runAnovaExperiment(input({}, authored)).analysis);
});

test('generic unequal groups use weighted means, arbitrary IDs and authored units', () => {
  const authored = groups([[0,2], [3,4,5], [-2,0,2,4]]).map((group, i) => ({...group, id:['__proto__','任意 / α','x|y'][i]}));
  const request = {...input({}, authored), unit:'mg/L', groupAxisLabel:'Treatment', responseAxisLabel:'Concentration (mg/L)'};
  const result = runAnovaExperiment(request);
  close(result.analysis.grandMean, 2);
  assert.deepEqual(result.analysis.groups.map(group => group.n), [2,3,4]);
  assert.deepEqual(result.analysis.groups.map(group => group.group), authored.map(group => group.id));
  assert.equal(result.experiment.panels[0].xLabel, 'Treatment');
  assert.equal(result.experiment.panels[0].yLabel, 'Concentration (mg/L)');
  assert.deepEqual(result.analysis, oneWayAnova(result.observations));
  finitePlots(result);
});

test('zero within variance and all-equal data have explicit undefined inference', () => {
  for (const view of [0,1,2]) for (const betweenScale of [0,1]) {
    const result = runAnovaExperiment(input({withinScale:0, betweenScale, view}));
    assert.deepEqual(result.analysis.inference, {status:'zero-error-variance', f:null, p:null});
    assert.equal(result.experiment.readouts.find(row => row.label === 'F')!.value, 'Undefined');
    assert.equal(result.experiment.readouts.find(row => row.label === 'p-value')!.value, 'Undefined');
    if (view === 2) assert.equal(result.experiment.panels.length, 0);
    if (betweenScale === 0) {
      assert.equal(result.analysis.etaSquared, null);
      assert.equal(result.analysis.omegaSquared, null);
      assert.equal(result.experiment.readouts.find(row => row.label === 'Eta squared')!.value, 'Undefined');
    }
    finitePlots(result);
  }
  const equal = runAnovaExperiment(input({}, groups([[7,7], [7,7,7]])));
  assert.equal(equal.analysis.omegaSquared, null);
});

test('F endpoints are finite for numerator df one and two; large F is explicitly truncated', () => {
  for (const authored of [groups([[1,3], [1,3]]), groups()]) {
    const result = runAnovaExperiment(input({view:2}, authored));
    finitePlots(result);
    assert.ok(result.experiment.panels[0].traces[0].points[0].x > 0);
  }
  const huge = runAnovaExperiment(input({view:2, withinScale:1e-4}));
  assert.ok(huge.analysis.inference.f! > 1e6);
  assert.equal(huge.experiment.panels[0].markers!.length, 0);
  assert.ok(huge.experiment.note.includes('beyond the drawing limit'));
  probability(huge.analysis.inference.p, oneWayAnova(huge.observations).inference.p!);
  finitePlots(huge);
});

test('invalid transport, provenance, identity and unsupported group features fail closed', () => {
  const reject = (request:AnovaExperimentInput) => assert.throws(() => runAnovaExperiment(request));
  for (const unit of ['', ' \t']) reject({...input(), unit});
  for (const differenceUnit of ['', ' \t']) reject({...input(), differenceUnit});
  reject({...input(), responseAxisLabel:' '});
  reject({...input(), groupAxisLabel:''});
  reject({...input(), parameters:undefined} as unknown as AnovaExperimentInput);
  reject(input({}, [])); reject(input({}, groups().slice(0,1)));
  const patches:Record<string,unknown>[] = [
    {id:' '}, {id:'method-1'}, {label:''}, {source:[]}, {source:[{resourceId:' '}]},
    {source:[{}]}, {x:1}, {x:undefined}, {summary:undefined}, {interval:undefined}, {data:[]},
  ];
  for (const patch of patches) {
    const authored = groups(); authored[0] = {...authored[0], ...patch} as DotPlotGroup;
    reject(input({}, authored));
  }
  for (const patch of [{id:''}, {id:'preparation-1-0'}, {source:[]}, {source:[{resourceId:''}]}, {label:' '}, {value:NaN}, {value:Infinity}, {value:-Infinity}]) {
    const authored = groups();
    authored[0] = {...authored[0], data:authored[0].data.map((row, i) => i ? row : {...row, ...patch})} as DotPlotGroup;
    reject(input({}, authored));
  }
  reject(input({}, groups([[1], [2,3]])));
});

test('bounded scales, integer views, total count and group count are enforced', () => {
  for (const key of ['betweenScale','withinScale'] as const) for (const value of [-1,3.0001,NaN,Infinity,-Infinity]) {
    assert.throws(() => validateAnovaExperiment(input({[key]:value})));
  }
  for (const view of [-1,.5,3,NaN,Infinity]) assert.throws(() => validateAnovaExperiment(input({view})));
  assert.throws(() => validateAnovaExperiment(input({}, groups(Array.from({length:21}, () => [1,2])))));
  assert.throws(() => validateAnovaExperiment(input({}, groups([Array(500).fill(1), Array(501).fill(2)]))));
  validateAnovaExperiment(input({}, groups([Array(500).fill(1), Array(500).fill(2)])));
  validateAnovaExperiment(input({}, groups(Array.from({length:20}, () => [1,2]))));
});

test('finite input whose arithmetic overflows is rejected without modifying data', () => {
  const authored = deepFreeze(groups([[Number.MAX_VALUE,Number.MAX_VALUE], [0,0]]));
  const before = JSON.stringify(authored);
  assert.throws(() => runAnovaExperiment(input({betweenScale:3}, authored)), RangeError);
  assert.throws(() => runAnovaExperiment(input({}, authored)), RangeError);
  assert.equal(JSON.stringify(authored), before);
});


test('response and difference units label distinct quantities without changing numeric results', () => {
  const baseline = runAnovaExperiment(input());
  for (const view of [0,1,2]) {
    const result = runAnovaExperiment({...input({view}), unit:'%', differenceUnit:'percentage points'});
    assert.deepEqual(result.observations, baseline.observations);
    assert.deepEqual(result.analysis, baseline.analysis);
    assert.deepEqual(result.experiment.readouts.map(row => row.value), baseline.experiment.readouts.map(row => row.value));
    const readouts = new Map(result.experiment.readouts.map(row => [row.label, row.value]));
    assert.equal(readouts.get('Grand mean (%)'), 95);
    for (const [i, mean] of [94,98,93].entries()) assert.equal(readouts.get(`Method ${i}: mean (%)`), mean);
    for (const [key, value] of Object.entries({between:84, within:30, total:114})) {
      assert.equal(readouts.get(`SS ${key} (percentage points)²`), value);
    }
    assert.equal(readouts.get('MS between (percentage points)²'), 42);
    assert.equal(readouts.get('MS within (percentage points)²'), 2);
    for (const label of ['F','p-value','Eta squared','Omega squared']) assert.ok(readouts.has(label));
    assert.ok(!result.experiment.readouts.some(row => /^(SS|MS) .*\(%\)/.test(row.label)));
    const panel = result.experiment.panels[0];
    if (view === 0) assert.equal(panel.yLabel, 'Response (%)');
    if (view === 1) assert.equal(panel.yLabel, 'Departure from grand mean (percentage points)');
    if (view === 2) {
      assert.equal(panel.xLabel, 'F statistic');
      assert.equal(panel.yLabel, 'Reference density');
    }
    finitePlots(result);
  }
});

test('difference units default to ordinary response units and accept arbitrary authored labels', () => {
  for (const view of [0,1,2]) {
    const request = {...input({view}), unit:'mg/L'};
    const result = runAnovaExperiment(request);
    assert.deepEqual(result, runAnovaExperiment({...request, differenceUnit:'mg/L'}));
    const labels = result.experiment.readouts.map(row => row.label);
    assert.ok(labels.includes('Grand mean (mg/L)'));
    for (const key of ['between','within','total']) assert.ok(labels.includes(`SS ${key} (mg/L)²`));
    for (const key of ['between','within']) assert.ok(labels.includes(`MS ${key} (mg/L)²`));
    if (view === 0) assert.equal(result.experiment.panels[0].yLabel, 'Response (mg/L)');
    if (view === 1) assert.equal(result.experiment.panels[0].yLabel, 'Departure from grand mean (mg/L)');
  }
  const result = runAnovaExperiment({...input({view:1}), unit:'%', differenceUnit:'pp'});
  assert.equal(result.experiment.panels[0].yLabel, 'Departure from grand mean (pp)');
  assert.equal(result.experiment.readouts.find(row => row.label === 'MS within (pp)²')!.value, 2);
});
