import {oneWayAnova, fSurvival, type OneWayObservation, type OneWayResult} from './anova-analysis.ts';
import {fPdf} from './distribution-math.ts';
import type {DotPlotGroup} from './scene-document.ts';
import type {ExperimentPanel, ExperimentResult, ExperimentTrace} from './distribution-experiment.ts';

export interface AnovaParameters {
  readonly betweenScale:number;
  readonly withinScale:number;
  readonly view:number;
}

export interface AnovaExperimentInput {
  readonly groups:readonly DotPlotGroup[];
  readonly unit:string;
  readonly differenceUnit?:string;
  readonly parameters:AnovaParameters;
  readonly groupAxisLabel?:string;
  readonly responseAxisLabel?:string;
}

export interface AnovaExperimentResult {
  readonly observations:readonly OneWayObservation[];
  readonly analysis:OneWayResult;
  readonly experiment:ExperimentResult;
}

function nonblank(value:unknown, name:string):void {
  if (typeof value !== 'string' || !value.trim()) throw new Error(`${name} must be nonblank`);
}

function provenance(value:unknown):void {
  if (!Array.isArray(value) || value.length === 0) throw new Error('Provenance is required');
  for (const reference of value) {
    if (!reference || typeof reference !== 'object') throw new Error('Invalid provenance');
    nonblank((reference as {resourceId?:unknown}).resourceId, 'Provenance resource ID');
  }
}

function finite(value:number):number {
  if (!Number.isFinite(value)) throw new RangeError('ANOVA transform exceeds the finite numeric range');
  return value;
}

/** Validate the bounded transport before fitting or constructing plot points. */
export function validateAnovaExperiment(input:AnovaExperimentInput):void {
  nonblank(input.unit, 'Response unit');
  if (input.differenceUnit !== undefined) nonblank(input.differenceUnit, 'Difference unit');
  if (input.groupAxisLabel !== undefined) nonblank(input.groupAxisLabel, 'Group axis label');
  if (input.responseAxisLabel !== undefined) nonblank(input.responseAxisLabel, 'Response axis label');
  const p = input.parameters;
  if (!p || !Number.isFinite(p.betweenScale) || p.betweenScale < 0 || p.betweenScale > 3 ||
      !Number.isFinite(p.withinScale) || p.withinScale < 0 || p.withinScale > 3 ||
      !Number.isInteger(p.view) || p.view < 0 || p.view > 2) {
    throw new Error('ANOVA requires scales in [0,3] and integer view in [0,2]');
  }
  if (!Array.isArray(input.groups) || input.groups.length < 2 || input.groups.length > 20) {
    throw new Error('ANOVA requires between 2 and 20 groups');
  }
  let total = 0;
  for (const group of input.groups) {
    if (!group || !Array.isArray(group.data) || group.data.length < 2) throw new Error('Each group requires at least two observations');
    total += group.data.length;
    if (total > 1000) throw new Error('ANOVA permits at most 1000 observations');
  }
  const groupIds = new Set<string>();
  const observationIds = new Set<string>();
  for (const group of input.groups) {
    nonblank(group.id, 'Group ID');
    if (groupIds.has(group.id)) throw new Error('Duplicate group ID');
    groupIds.add(group.id);
    nonblank(group.label, 'Group label');
    provenance(group.source);
    if ('x' in group || 'summary' in group || 'interval' in group) throw new Error('Group x, summary and interval are unsupported');
    for (const observation of group.data) {
      if (!observation) throw new Error('Invalid observation');
      nonblank(observation.id, 'Observation ID');
      if (observationIds.has(observation.id)) throw new Error('Duplicate observation ID');
      observationIds.add(observation.id);
      if (observation.label !== undefined) nonblank(observation.label, 'Observation label');
      provenance(observation.source);
      if (!Number.isFinite(observation.value)) throw new Error('Observation values must be finite');
    }
  }
}

/** Labels and provenance stay on the authored groups; semantic IDs survive every view. */
export function currentAnovaObservations(input:AnovaExperimentInput):readonly OneWayObservation[] {
  validateAnovaExperiment(input);
  const original = input.groups.flatMap(group => group.data.map(observation => ({
    id:observation.id, group:group.id, value:observation.value,
  })));
  const {betweenScale, withinScale} = input.parameters;
  // Identity is exact, including values whose centered reconstruction would round.
  if (betweenScale === 1 && withinScale === 1) return original;
  const baseline = oneWayAnova(original);
  const means = new Map(baseline.groups.map(group => [group.group, group.mean]));
  return original.map(observation => {
    const mean = means.get(observation.group)!;
    const between = betweenScale === 0 ? 0 : finite(betweenScale * finite(mean - baseline.grandMean));
    const within = withinScale === 0 ? 0 : finite(withinScale * finite(observation.value - mean));
    return {...observation, value:finite(finite(baseline.grandMean + between) + within)};
  });
}

function referencePanel(analysis:OneWayResult, notes:string[]):ExperimentPanel|undefined {
  const f = analysis.inference.f;
  if (f === null) return undefined;
  // A bounded drawing is not the domain of integration used for the p-value.
  const limit = 1e6;
  const upper = f >= limit / 1.2 ? limit : Math.max(8, f * 1.2);
  const first = Math.min(1e-4, upper / 1600);
  const density = (x:number):number => {
    const y = fPdf(x, analysis.df.between, analysis.df.within);
    if (!Number.isFinite(y) || y < 0) throw new RangeError('F density exceeds the finite numeric range');
    return y;
  };
  const sample = (lo:number, hi:number, count:number) => Array.from({length:count}, (_, i) => {
    const x = lo + (hi - lo) * i / (count - 1);
    return {x, y:density(x)};
  });
  const traces:ExperimentTrace[] = [{label:'F distribution under equal population means', style:'line', points:sample(first, upper, 81)}];
  if (f < upper) traces.push({label:'Right tail (visible portion)', style:'area', points:sample(Math.max(first, f), upper, 80)});
  notes.push(`The F drawing starts at ${first}, a positive point, to avoid a potentially infinite endpoint density at zero. It ends at ${upper}; the omitted tail continues to infinity. The p-value is the analytic full right-tail probability, not a sampled area.`);
  if (f > upper) notes.push(`The actual F statistic (${f}) lies beyond the drawing limit (${upper}); its marker and visible right-tail shading are omitted.`);
  return {
    xLabel:'F statistic', yLabel:'Reference density', traces, xDomain:[0, upper],
    markers:f <= upper ? [{x:f, label:'Actual F statistic'}] : [],
  };
}

/** Stable display positions separate exact ties without changing measured values. */
function observationPositions(input:AnovaExperimentInput, observations:readonly OneWayObservation[]):Map<string,number> {
  const positions = new Map<string,number>();
  for (const [index, group] of input.groups.entries()) {
    const ties = new Map<number,OneWayObservation[]>();
    for (const observation of observations.filter(row => row.group === group.id)) {
      const rows = ties.get(observation.value) ?? [];
      rows.push(observation);
      ties.set(observation.value, rows);
    }
    for (const rows of ties.values()) rows.forEach((row, i) => {
      const offset = rows.length === 1 ? 0 : .18 * (2 * i / (rows.length - 1) - 1);
      positions.set(row.id, index + 1 + offset);
    });
  }
  return positions;
}

/** Bound all legal scale settings using the original, weighted baseline. */
function responseDomain(input:AnovaExperimentInput):{domain:readonly [number,number]; center:number} {
  const original = input.groups.flatMap(group => group.data.map(row => ({id:row.id, group:group.id, value:row.value})));
  const baseline = oneWayAnova(original);
  const means = new Map(baseline.groups.map(group => [group.group, group.mean]));
  let lower = baseline.grandMean, upper = baseline.grandMean;
  const include = (value:number) => {
    finite(value);
    lower = Math.min(lower, value);
    upper = Math.max(upper, value);
  };
  for (const betweenScale of [0,3]) for (const withinScale of [0,3]) {
    for (const observation of original) {
      const mean = means.get(observation.group)!;
      const between = betweenScale === 0 ? 0 : finite(betweenScale * finite(mean - baseline.grandMean));
      const within = withinScale === 0 ? 0 : finite(withinScale * finite(observation.value - mean));
      const fitted = finite(baseline.grandMean + between);
      include(fitted);
      include(finite(fitted + within));
    }
  }
  const span = finite(upper - lower);
  const padding = span > 0 ? Math.max(Number.MIN_VALUE, finite(span * .08)) : Math.max(1, Math.abs(baseline.grandMean) * .08);
  return {domain:[finite(lower - padding), finite(upper + padding)], center:baseline.grandMean};
}

/** Refit actual current values on every call; no fixture or cached inference. */
export function runAnovaExperiment(input:AnovaExperimentInput):AnovaExperimentResult {
  const observations = currentAnovaObservations(input);
  const analysis = oneWayAnova(observations);
  const means = new Map(analysis.groups.map(group => [group.group, group.mean]));
  const positions = new Map(input.groups.map((group, i) => [group.id, i + 1]));
  const response = input.responseAxisLabel ?? `Response (${input.unit})`;
  const differenceUnit = input.differenceUnit ?? input.unit;
  const readouts:ExperimentResult['readouts'] = [];
  const add = (label:string, value:number|string|null) => readouts.push({label, value:value === null ? 'Undefined' : value});
  add('N', observations.length); add('k', analysis.groups.length);
  add(`Grand mean (${input.unit})`, analysis.grandMean);
  for (const group of input.groups) {
    const fit = analysis.groups.find(value => value.group === group.id)!;
    add(`${group.label}: n`, fit.n);
    add(`${group.label}: mean (${input.unit})`, fit.mean);
  }
  for (const key of ['between', 'within', 'total'] as const) {
    add(`SS ${key} (${differenceUnit})²`, analysis.ss[key]);
    add(`df ${key}`, analysis.df[key]);
  }
  add(`MS between (${differenceUnit})²`, analysis.ms.between);
  add(`MS within (${differenceUnit})²`, analysis.ms.within);
  add('F', analysis.inference.f);
  // Evaluate the existing direct survival function, never 1 - rounded CDF.
  add('p-value', analysis.inference.f === null ? null : fSurvival(analysis.inference.f, analysis.df.between, analysis.df.within));
  add('Eta squared', analysis.etaSquared); add('Omega squared', analysis.omegaSquared);
  const currentValues = new Map(observations.map(row => [row.id, row.value]));
  for (const group of input.groups) for (const observation of group.data) {
    add(`${observation.id}: original (${input.unit})`, observation.value);
    add(`${observation.id}: current (${input.unit})`, currentValues.get(observation.id)!);
  }
  const notes = [
    'Classical one-way fixed-effects ANOVA assumes independent preparations and, for F inference, Normal errors with a common variance. Independence is an authoring assumption, not established by these points. An omnibus result does not establish which pairs differ.',
    input.parameters.betweenScale === 1 && input.parameters.withinScale === 1
      ? 'Both scales are 1: the original authored values are used exactly.'
      : 'What-if values rescale group departures from the original grand mean and observations around their original group means; they are not new measured preparations.',
  ];
  if (analysis.inference.status === 'zero-error-variance') notes.push('Within-group variance is zero: F and p are undefined, including when group means differ. No valid F reference plot is shown.');
  if (analysis.etaSquared === null || analysis.omegaSquared === null) notes.push('All values are equal: eta squared and omega squared are undefined, not zero.');
  const panels:ExperimentPanel[] = [];
  if (input.parameters.view === 2) {
    const panel = referencePanel(analysis, notes);
    if (panel) panels.push(panel);
  } else {
    const deviation = input.parameters.view === 1;
    const bounds = responseDomain(input);
    const center = deviation ? bounds.center : 0;
    const dotPositions = observationPositions(input, observations);
    const traces:ExperimentTrace[] = [];
    if (deviation) {
      for (const observation of observations) traces.push({
        label:`${observation.id}: fitted to observed (residual)`, style:'trajectory', emphasis:'reference',
        points:[
          {x:dotPositions.get(observation.id)!, y:finite(means.get(observation.group)! - center)},
          {x:dotPositions.get(observation.id)!, y:finite(observation.value - center)},
        ],
      });
    }
    for (const group of input.groups) traces.push({
      label:group.label, style:'points', points:observations.filter(value => value.group === group.id).map(value => ({
        x:dotPositions.get(value.id)!, y:finite(value.value - center),
      })),
    });
    traces.push({label:'Current group means', style:'points', emphasis:'reference', points:analysis.groups.map(group => ({
      x:positions.get(group.group)!, y:finite(group.mean - center),
    }))});
    traces.push({label:'Current grand mean', style:'line', emphasis:'reference', points:[
      {x:0.5, y:deviation ? 0 : analysis.grandMean},
      {x:input.groups.length + 0.5, y:deviation ? 0 : analysis.grandMean},
    ]});
    panels.push({
      xLabel:input.groupAxisLabel ?? 'Group',
      yLabel:deviation ? `Departure from grand mean (${differenceUnit})` : response,
      traces, xDomain:[0.5, input.groups.length + 0.5],
      yDomain:[finite(bounds.domain[0] - center), finite(bounds.domain[1] - center)],
      xLabels:input.groups.map((group, i) => ({value:i + 1, label:group.label})),
    });
    if (deviation) notes.push('Zero is the current grand mean. Group-mean departures show between-group differences; segments from fitted to observed departures show within-group residuals.');
  }
  return {observations, analysis, experiment:{panels, readouts, note:notes.join(' ')}};
}
