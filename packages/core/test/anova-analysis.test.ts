import test from 'node:test';
import assert from 'node:assert/strict';
import {oneWayAnova, balancedTwoWayAnova, fSurvival, type OneWayObservation, type TwoWayObservation} from '../src/anova-analysis.ts';

const close = (actual:number, expected:number, tolerance=1e-9) =>
  assert.ok(Number.isFinite(actual) && Math.abs(actual - expected) <= tolerance, `${actual} != ${expected}`);
function probability(actual:number|null, expected:number):void {
  assert.notEqual(actual, null);
  assert.ok(actual! > 0 && actual! <= 1, `Invalid positive probability: ${actual}`);
  assert.ok(Math.abs(actual! / expected - 1) < 2e-10, `${actual} != ${expected} (relative)`);
  close(Math.log(actual!), Math.log(expected), 2e-10);
}
const sum = (values:readonly number[]) => values.reduce((a, b) => a + b, 0);
const riverValues = [[93,95,94,92,96,94], [97,99,98,100,96,98], [94,93,92,95,91,93]];
const wastewaterValues = [[90,91,92,92,93,94], [84,85,86,86,87,88], [92,93,94,95,96,94]];
const groups = ['A', 'B', 'C'];
function river():OneWayObservation[] {
  return riverValues.flatMap((values, i) => values.map((value, j) => ({id:`River-${groups[i]}-${j}`, group:groups[i], value})));
}
function master():TwoWayObservation[] {
  return [riverValues, wastewaterValues].flatMap((site, s) => site.flatMap((values, i) => values.map((value, j) => ({
    id:`${s === 0 ? 'River' : 'Wastewater'}-${groups[i]}-${j}`,
    factorA:groups[i], factorB:s === 0 ? 'River' : 'Wastewater', value,
  }))));
}
function frozen<T extends object>(values:T[]):readonly Readonly<T>[] {
  return Object.freeze(values.map(value => Object.freeze(value)));
}

test('River one-way reproduces independent reference values and per-ID fits', () => {
  const input = frozen(river());
  const before = JSON.stringify(input);
  const result = oneWayAnova(input);
  assert.deepEqual(result.groups, [
    {group:'A', n:6, mean:94}, {group:'B', n:6, mean:98}, {group:'C', n:6, mean:93},
  ]);
  close(result.grandMean, 95);
  close(result.ss.between, 84); close(result.ss.within, 30); close(result.ss.total, 114);
  assert.deepEqual(result.df, {between:2, within:15, total:17});
  close(result.ms.between, 42); close(result.ms.within, 2);
  assert.equal(result.inference.status, 'ok'); close(result.inference.f!, 21);
  probability(result.inference.p, 4.48356040690602e-5);
  close(result.etaSquared!, 84 / 114); close(result.omegaSquared!, 80 / 116);
  close(result.ss.total, result.ss.between + result.ss.within);
  assert.deepEqual(result.observations.map(value => value.id), input.map(value => value.id));
  for (const group of result.groups) {
    const fits = result.observations.filter((_, i) => input[i].group === group.group);
    close(sum(fits.map(value => value.residual)), 0);
    for (const fit of fits) close(fit.fitted, group.mean);
  }
  result.observations.forEach((fit, i) => close(fit.fitted + fit.residual, input[i].value));
  assert.equal(JSON.stringify(input), before);
  assert.deepEqual(oneWayAnova(input), result);
});

test('36 preparations reproduce balanced two-factor references and exact River subset', () => {
  const input = frozen(master());
  const before = JSON.stringify(input);
  const result = balancedTwoWayAnova(input);
  assert.deepEqual(input.filter(value => value.factorB === 'River').map(value => ({id:value.id, group:value.factorA, value:value.value})), river());
  const expected = new Map([
    ['A/River',94], ['B/River',98], ['C/River',93],
    ['A/Wastewater',92], ['B/Wastewater',86], ['C/Wastewater',94],
  ]);
  for (const cell of result.cells) {
    assert.equal(cell.n, 6);
    close(cell.mean, expected.get(`${cell.factorA}/${cell.factorB}`)!);
  }
  assert.deepEqual(result.marginalA, [{level:'A', n:12, mean:93}, {level:'B', n:12, mean:92}, {level:'C', n:12, mean:93.5}]);
  // The grand mean is weighted by all preparations, not rounded marginal means.
  close(result.grandMean, 92.83333333333333);
  assert.deepEqual(result.marginalB, [{level:'River', n:18, mean:95}, {level:'Wastewater', n:18, mean:90.66666666666667}]);
  close(result.ss.a, 14); close(result.ss.b, 169); close(result.ss.interaction, 278);
  close(result.ss.error, 60); close(result.ss.total, 521);
  assert.deepEqual(result.df, {a:2, b:1, interaction:2, error:30, total:35});
  close(result.ms.a, 7); close(result.ms.b, 169); close(result.ms.interaction, 139); close(result.ms.error, 2);
  close(result.inference.a.f!, 3.5); close(result.inference.b.f!, 84.5); close(result.inference.interaction.f!, 69.5);
  probability(result.inference.a.p, .043032141544534365);
  probability(result.inference.b.p, 3.1316422767576393e-10);
  probability(result.inference.interaction.p, 5.4766911673220446e-12);
  close(result.ss.total, result.ss.a + result.ss.b + result.ss.interaction + result.ss.error);
  assert.equal(result.replicates, 6);
  assert.deepEqual(result.observations.map(value => value.id), input.map(value => value.id));
  for (const cell of result.cells) {
    const fits = result.observations.filter((_, i) => input[i].factorA === cell.factorA && input[i].factorB === cell.factorB);
    close(sum(fits.map(value => value.residual)), 0);
    for (const fit of fits) close(fit.fitted, cell.mean);
  }
  result.observations.forEach((fit, i) => close(fit.fitted + fit.residual, input[i].value));
  assert.equal(JSON.stringify(input), before);
  assert.deepEqual(balancedTwoWayAnova(input), result);
});

test('one-way is invariant to order, arbitrary labels, common shift and nonzero scale', () => {
  const input = river();
  const baseline = oneWayAnova(input);
  const relabelled = input.map(value => ({...value, group:({'A':'任意 / α', 'B':'__proto__', 'C':'x|y'} as Record<string,string>)[value.group]})).reverse();
  const reordered = oneWayAnova(relabelled);
  close(reordered.ss.between, baseline.ss.between); close(reordered.ss.within, baseline.ss.within);
  probability(reordered.inference.p, baseline.inference.p!);
  const fits = new Map(baseline.observations.map(value => [value.id, value]));
  for (const fit of reordered.observations) assert.deepEqual(fit, fits.get(fit.id));
  for (const [shift, scale] of [[1000,1], [0,-3], [0,1e-6]]) {
    const result = oneWayAnova(input.map(value => ({...value, value:shift + scale * value.value})));
    close(result.grandMean, shift + scale * baseline.grandMean);
    close(result.ss.total / (scale * scale), baseline.ss.total, 1e-7);
    close(result.ss.between / (scale * scale), baseline.ss.between, 1e-7);
    close(result.ss.within / (scale * scale), baseline.ss.within, 1e-7);
    close(result.inference.f!, baseline.inference.f!, 1e-8);
    probability(result.inference.p, baseline.inference.p!);
    close(result.etaSquared!, baseline.etaSquared!); close(result.omegaSquared!, baseline.omegaSquared!);
  }
});

test('one current-value edit recomputes rather than using fixture identities', () => {
  const input = river();
  const result = oneWayAnova(input.map((value, i) => i === 0 ? {...value, value:99} : value));
  close(result.groups[0].mean, 95); close(result.grandMean, 95 + 1 / 3);
  close(result.ss.between, 76); close(result.ss.within, 48); close(result.ss.total, 124);
  close(result.inference.f!, 11.875);
  assert.notEqual(result.inference.p, oneWayAnova(input).inference.p);
  assert.equal(input[0].value, 93);
  const two = master();
  const changed = balancedTwoWayAnova(two.map((value, i) => i === 0 ? {...value, value:99} : value));
  close(changed.cells.find(cell => cell.factorA === 'A' && cell.factorB === 'River')!.mean, 95);
  close(changed.ss.error, 78);
  assert.notEqual(changed.ss.total, balancedTwoWayAnova(two).ss.total);
});

test('two-way preserves decomposition under reordering, relabelling, shift and scale', () => {
  const input = master();
  const baseline = balancedTwoWayAnova(input);
  for (const [shift, scale] of [[1000,1], [0,-2], [0,1e-6]]) {
    const result = balancedTwoWayAnova(input.map(value => ({...value,
      factorA:`arbitrary/${value.factorA}`, factorB:`__proto__/${value.factorB}`,
      value:shift + scale * value.value,
    })).reverse());
    close(result.grandMean, shift + scale * baseline.grandMean);
    for (const key of ['a','b','interaction','error','total'] as const) close(result.ss[key] / (scale * scale), baseline.ss[key], 1e-7);
    for (const key of ['a','b','interaction'] as const) {
      close(result.inference[key].f!, baseline.inference[key].f!, 1e-8);
      probability(result.inference[key].p, baseline.inference[key].p!);
    }
    const fits = new Map(baseline.observations.map(value => [value.id, value]));
    for (const fit of result.observations) {
      close(fit.fitted, shift + scale * fits.get(fit.id)!.fitted);
      close(fit.residual, scale * fits.get(fit.id)!.residual);
    }
  }
});

test('additive interaction projection preserves margins and residuals; half amplitude quarters SS', () => {
  const input = master();
  const baseline = balancedTwoWayAnova(input);
  for (const lambda of [0, .5, 1]) {
    const projected = input.map((value, i) => {
      const a = baseline.marginalA.find(margin => margin.level === value.factorA)!.mean;
      const b = baseline.marginalB.find(margin => margin.level === value.factorB)!.mean;
      const additive = a + b - baseline.grandMean;
      const interaction = baseline.observations[i].fitted - additive;
      return {...value, value:additive + lambda * interaction + baseline.observations[i].residual};
    });
    const result = balancedTwoWayAnova(projected);
    close(result.ss.interaction, lambda * lambda * 278);
    if (lambda === .5) close(result.ss.interaction, 69.5);
    close(result.ss.a, baseline.ss.a); close(result.ss.b, baseline.ss.b); close(result.ss.error, baseline.ss.error);
    close(result.grandMean, baseline.grandMean);
    result.marginalA.forEach((margin, i) => close(margin.mean, baseline.marginalA[i].mean));
    result.marginalB.forEach((margin, i) => close(margin.mean, baseline.marginalB[i].mean));
    result.observations.forEach((fit, i) => close(fit.residual, baseline.observations[i].residual));
    close(result.ss.total, result.ss.a + result.ss.b + result.ss.interaction + result.ss.error);
  }
});

test('equal means and explicit zero-error/all-equal conventions', () => {
  const equalMeans = oneWayAnova([
    {id:'a1', group:'a', value:1}, {id:'a2', group:'a', value:3},
    {id:'b1', group:'b', value:1}, {id:'b2', group:'b', value:3},
  ]);
  assert.deepEqual(equalMeans.inference, {status:'ok', f:0, p:1});
  assert.equal(equalMeans.etaSquared, 0);
  close(equalMeans.omegaSquared!, -1 / 3);
  for (const allEqual of [false, true]) {
    const one = oneWayAnova(river().map(value => ({...value, value:allEqual ? 7 : groups.indexOf(value.group)})));
    assert.deepEqual(one.inference, {status:'zero-error-variance', f:null, p:null});
    if (allEqual) {
      assert.equal(one.etaSquared, null);
      assert.equal(one.omegaSquared, null);
    } else {
      close(one.etaSquared!, 1);
      close(one.omegaSquared!, 1);
    }
    const two = balancedTwoWayAnova(master().map(value => ({...value, value:allEqual ? 7 : groups.indexOf(value.factorA) + (value.factorB === 'River' ? 0 : 4)})));
    for (const inference of Object.values(two.inference)) assert.deepEqual(inference, {status:'zero-error-variance', f:null, p:null});
    assert.equal(two.ss.error, 0);
    if (allEqual) for (const ss of Object.values(two.ss)) assert.equal(ss, 0);
  }
  const twoEqual = balancedTwoWayAnova(master().map((value, i) => ({...value, value:i % 2 ? 3 : 1})));
  for (const inference of Object.values(twoEqual.inference)) assert.deepEqual(inference, {status:'ok', f:0, p:1});
});

test('unequal one-way sample counts use an observation-weighted grand mean', () => {
  const result = oneWayAnova([
    {id:'a1', group:'a', value:0}, {id:'a2', group:'a', value:2},
    {id:'b1', group:'b', value:3}, {id:'b2', group:'b', value:4}, {id:'b3', group:'b', value:5},
  ]);
  close(result.grandMean, 2.8); close(result.ss.between, 10.8); close(result.ss.within, 4); close(result.ss.total, 14.8);
});

test('F survival retains tiny positive tails and avoids multiplication overflow', () => {
  assert.equal(fSurvival(0, 2, 15), 1);
  probability(fSurvival(21, 2, 15), 4.48356040690602e-5);
  probability(fSurvival(84.5, 1, 30), 3.1316422767576393e-10);
  probability(fSurvival(69.5, 2, 30), 5.4766911673220446e-12);
  // For df1=df2=2 the survival is exactly 1/(1+F).
  probability(fSurvival(1e308, 2, 2), 1e-308);
  for (const args of [[-1,2,3], [NaN,2,3], [Infinity,2,3], [1,0,3], [1,-1,3], [1,Infinity,3], [1,NaN,3], [1,2,0], [1,2,-1], [1,2,Infinity], [1,2,NaN]]) {
    assert.throws(() => fSurvival(args[0], args[1], args[2]), /finite/);
  }
});

test('F survival explicitly rejects unsupported numerical ranges', () => {
  for (const args of [[1, 1e308, 1e308], [1, Number.MIN_VALUE, 2]]) {
    assert.throws(() => fSurvival(args[0], args[1], args[2]), {
      name:'RangeError', message:/finite numeric range/,
    });
  }
});

test('invalid one-way IDs, labels, values and insufficient replication fail', () => {
  const input = river();
  assert.throws(() => oneWayAnova([]), /two groups/);
  assert.throws(() => oneWayAnova(input.filter(value => value.group === 'A')), /two groups/);
  assert.throws(() => oneWayAnova(input.filter(value => value.group !== 'A' || value.id === input[0].id)), /two observations/);
  for (const patch of [{id:' '}, {id:input[1].id}, {group:'\t'}, {value:NaN}, {value:Infinity}, {value:-Infinity}]) {
    assert.throws(() => oneWayAnova(input.map((value, i) => i === 0 ? {...value, ...patch} : value)));
  }
  assert.throws(() => oneWayAnova(input.map((value, i) => ({...value, value:i % 2 ? Number.MAX_VALUE : -Number.MAX_VALUE}))), /finite numeric range/);
});

test('invalid two-way IDs, levels, values, missing cells and imbalance fail without mutation', () => {
  const input = frozen(master());
  const before = JSON.stringify(input);
  assert.throws(() => balancedTwoWayAnova([]), /two levels/);
  assert.throws(() => balancedTwoWayAnova(input.filter(value => value.factorA === 'A')), /two levels/);
  assert.throws(() => balancedTwoWayAnova(input.filter(value => value.factorB === 'River')), /two levels/);
  assert.throws(() => balancedTwoWayAnova(input.filter(value => !(value.factorA === 'C' && value.factorB === 'Wastewater'))), /Missing crossed cell/);
  assert.throws(() => balancedTwoWayAnova(input.slice(1)), /Unbalanced/);
  assert.throws(() => balancedTwoWayAnova(input.filter((value, i) => !(value.factorA === 'A' && value.factorB === 'River') || i === 0)), /two replicates/);
  for (const patch of [{id:''}, {id:input[1].id}, {factorA:' '}, {factorB:'\n'}, {value:NaN}, {value:Infinity}, {value:-Infinity}]) {
    assert.throws(() => balancedTwoWayAnova(input.map((value, i) => i === 0 ? {...value, ...patch} : value)));
  }
  assert.equal(JSON.stringify(input), before);
});
