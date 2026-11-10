import {betaI} from './distribution-math.ts';

/** Independence of preparations is an authoring assumption, not inferred here. */
export type OneWayObservation = Readonly<{id:string; group:string; value:number}>;
export type TwoWayObservation = Readonly<{id:string; factorA:string; factorB:string; value:number}>;
export type Inference = Readonly<{
  status:'ok'|'zero-error-variance';
  f:number|null;
  p:number|null;
}>;
export type GroupMean = Readonly<{group:string; n:number; mean:number}>;
export type ObservationFit = Readonly<{id:string; fitted:number; residual:number}>;
export type OneWayResult = Readonly<{
  groups:readonly GroupMean[];
  grandMean:number;
  observations:readonly ObservationFit[];
  ss:Readonly<{between:number; within:number; total:number}>;
  df:Readonly<{between:number; within:number; total:number}>;
  ms:Readonly<{between:number; within:number}>;
  inference:Inference;
  etaSquared:number|null;
  omegaSquared:number|null;
}>;
export type TwoWayResult = Readonly<{
  cells:readonly Readonly<{factorA:string; factorB:string; n:number; mean:number}>[];
  marginalA:readonly Readonly<{level:string; n:number; mean:number}>[];
  marginalB:readonly Readonly<{level:string; n:number; mean:number}>[];
  grandMean:number;
  replicates:number;
  observations:readonly ObservationFit[];
  ss:Readonly<{a:number; b:number; interaction:number; error:number; total:number}>;
  df:Readonly<{a:number; b:number; interaction:number; error:number; total:number}>;
  ms:Readonly<{a:number; b:number; interaction:number; error:number}>;
  inference:Readonly<{a:Inference; b:Inference; interaction:Inference}>;
}>;

/** F right tail, evaluated directly rather than subtracting a rounded CDF.
 * Log ratios avoid overflow in df1 * f. Probabilities below the floating-point
 * range can still underflow; no artificial positive floor is applied.
 * Half-df underflow and invalid beta results raise a numerical-range error.
 */
export function fSurvival(f:number, df1:number, df2:number):number {
  if (!Number.isFinite(f) || f < 0 || !Number.isFinite(df1) || df1 <= 0 || !Number.isFinite(df2) || df2 <= 0) {
    throw new Error('F requires a finite nonnegative statistic and finite positive degrees of freedom');
  }
  const a = df2 / 2;
  const b = df1 / 2;
  if (a === 0 || b === 0) throw new RangeError('F survival exceeds the finite numeric range');
  if (f === 0) return 1;
  const logRatio = Math.log(df1) + Math.log(f) - Math.log(df2);
  const small = Math.exp(-Math.abs(logRatio));
  const z = logRatio >= 0 ? small / (1 + small) : 1 / (1 + small);
  const p = betaI(z, a, b);
  if (!Number.isFinite(p) || p < 0 || p > 1) throw new RangeError('F survival exceeds the finite numeric range');
  return p;
}

function finite(value:number):number {
  if (!Number.isFinite(value)) throw new RangeError('ANOVA arithmetic exceeds the finite numeric range');
  return value;
}

function average(values:readonly number[]):number {
  const origin = values[0];
  return finite(origin + values.reduce((sum, value) => finite(sum + finite(value - origin) / values.length), 0));
}

function squares(values:readonly number[]):number {
  return values.reduce((sum, value) => finite(sum + finite(value * value)), 0);
}

function label(value:string, name:string):void {
  if (typeof value !== 'string' || !value.trim()) throw new Error(`${name} must be nonblank`);
}

function validateObservation(observation:Readonly<{id:string; value:number}>, ids:Set<string>):void {
  label(observation.id, 'Observation ID');
  if (ids.has(observation.id)) throw new Error('Duplicate observation ID');
  ids.add(observation.id);
  if (!Number.isFinite(observation.value)) throw new Error('Observation values must be finite');
}

function infer(effectMS:number, errorMS:number, effectDF:number, errorDF:number):Inference {
  if (errorMS === 0) return {status:'zero-error-variance', f:null, p:null};
  const f = finite(effectMS / errorMS);
  return {status:'ok', f, p:fSurvival(f, effectDF, errorDF)};
}

/** Ordinary one-way fixed-effects decomposition using actual current values.
 * Total SS is computed directly, independently of its decomposition.
 * Zero error variance makes F and p undefined, even for separated means.
 * Eta is undefined when total SS is zero. Omega is the untruncated estimate
 * (SSbetween - dfBetween * MSwithin) / (SStotal + MSwithin); its denominator
 * is zero for all-equal data, yielding null rather than a fabricated effect.
 * Labels and IDs are exact strings; outputs follow first appearance/input order.
 */
export function oneWayAnova(input:readonly OneWayObservation[]):OneWayResult {
  const ids = new Set<string>();
  const grouped = new Map<string, number[]>();
  for (const observation of input) {
    validateObservation(observation, ids);
    label(observation.group, 'Group');
    const values = grouped.get(observation.group) ?? [];
    values.push(observation.value);
    grouped.set(observation.group, values);
  }
  if (grouped.size < 2) throw new Error('One-way ANOVA needs at least two groups');
  if ([...grouped.values()].some(values => values.length < 2)) throw new Error('Each group needs at least two observations');
  const groups = [...grouped].map(([group, values]) => ({group, n:values.length, mean:average(values)}));
  const means = new Map(groups.map(group => [group.group, group.mean]));
  const grandMean = average(input.map(observation => observation.value));
  const observations = input.map(observation => {
    const fitted = means.get(observation.group)!;
    return {id:observation.id, fitted, residual:finite(observation.value - fitted)};
  });
  const ss = {
    between:finite(groups.reduce((sum, group) => finite(sum + finite(group.n * (group.mean - grandMean) ** 2)), 0)),
    within:squares(observations.map(observation => observation.residual)),
    total:squares(input.map(observation => finite(observation.value - grandMean))),
  };
  const df = {between:groups.length - 1, within:input.length - groups.length, total:input.length - 1};
  const ms = {between:ss.between / df.between, within:ss.within / df.within};
  const omegaDenominator = finite(ss.total + ms.within);
  return {
    groups, grandMean, observations, ss, df, ms,
    inference:infer(ms.between, ms.within, df.between, df.within),
    etaSquared:ss.total === 0 ? null : ss.between / ss.total,
    omegaSquared:omegaDenominator === 0 ? null : (ss.between - df.between * ms.within) / omegaDenominator,
  };
}

/** Balanced, fully crossed, fixed-effects two-factor decomposition.
 * Each fitted value is its cell mean. No causal interpretation or diagnostic
 * conclusion follows automatically. Zero error variance disables all F/p
 * inference, without a tolerance that could erase small genuine variation.
 */
export function balancedTwoWayAnova(input:readonly TwoWayObservation[]):TwoWayResult {
  const ids = new Set<string>();
  const byA = new Map<string, number[]>();
  const byB = new Map<string, number[]>();
  const crossed = new Map<string, Map<string, number[]>>();
  for (const observation of input) {
    validateObservation(observation, ids);
    label(observation.factorA, 'Factor A level');
    label(observation.factorB, 'Factor B level');
    const a = byA.get(observation.factorA) ?? [];
    const b = byB.get(observation.factorB) ?? [];
    a.push(observation.value);
    b.push(observation.value);
    byA.set(observation.factorA, a);
    byB.set(observation.factorB, b);
    const row = crossed.get(observation.factorA) ?? new Map<string, number[]>();
    const cell = row.get(observation.factorB) ?? [];
    cell.push(observation.value);
    row.set(observation.factorB, cell);
    crossed.set(observation.factorA, row);
  }
  if (byA.size < 2 || byB.size < 2) throw new Error('Two-way ANOVA needs at least two levels per factor');
  const cells:{factorA:string; factorB:string; n:number; mean:number}[] = [];
  let replicates:number|undefined;
  const cellMeans = new Map<string, Map<string, number>>();
  for (const factorA of byA.keys()) {
    const means = new Map<string, number>();
    for (const factorB of byB.keys()) {
      const values = crossed.get(factorA)!.get(factorB);
      if (!values) throw new Error('Missing crossed cell');
      if (values.length < 2) throw new Error('Each cell needs at least two replicates');
      if (replicates !== undefined && values.length !== replicates) throw new Error('Unbalanced cell replicate counts');
      replicates = values.length;
      const mean = average(values);
      cells.push({factorA, factorB, n:values.length, mean});
      means.set(factorB, mean);
    }
    cellMeans.set(factorA, means);
  }
  const n = replicates!;
  const marginalA = [...byA].map(([level, values]) => ({level, n:values.length, mean:average(values)}));
  const marginalB = [...byB].map(([level, values]) => ({level, n:values.length, mean:average(values)}));
  const meansA = new Map(marginalA.map(margin => [margin.level, margin.mean]));
  const meansB = new Map(marginalB.map(margin => [margin.level, margin.mean]));
  const grandMean = average(input.map(observation => observation.value));
  const observations = input.map(observation => {
    const fitted = cellMeans.get(observation.factorA)!.get(observation.factorB)!;
    return {id:observation.id, fitted, residual:finite(observation.value - fitted)};
  });
  const ss = {
    a:finite(marginalA.reduce((sum, margin) => finite(sum + finite(margin.n * (margin.mean - grandMean) ** 2)), 0)),
    b:finite(marginalB.reduce((sum, margin) => finite(sum + finite(margin.n * (margin.mean - grandMean) ** 2)), 0)),
    interaction:finite(cells.reduce((sum, cell) => {
      const contrast = finite((cell.mean - meansA.get(cell.factorA)!) - (meansB.get(cell.factorB)! - grandMean));
      return finite(sum + finite(n * contrast ** 2));
    }, 0)),
    error:squares(observations.map(observation => observation.residual)),
    total:squares(input.map(observation => finite(observation.value - grandMean))),
  };
  const df = {
    a:byA.size - 1, b:byB.size - 1,
    interaction:(byA.size - 1) * (byB.size - 1),
    error:byA.size * byB.size * (n - 1), total:input.length - 1,
  };
  const ms = {a:ss.a / df.a, b:ss.b / df.b, interaction:ss.interaction / df.interaction, error:ss.error / df.error};
  return {
    cells, marginalA, marginalB, grandMean, replicates:n, observations, ss, df, ms,
    inference:{
      a:infer(ms.a, ms.error, df.a, df.error),
      b:infer(ms.b, ms.error, df.b, df.error),
      interaction:infer(ms.interaction, ms.error, df.interaction, df.error),
    },
  };
}
