import { orderedObservations, type EmpiricalObservation } from "./empirical-distribution.ts";

/** Closed interval; count observations, not distinct values. */
export function intervalCount(data: readonly EmpiricalObservation[], lower: number, upper: number) {
  const ordered=orderedObservations(data);
  if (!Number.isFinite(lower) || !Number.isFinite(upper) || lower>upper) throw new Error("Invalid interval");
  const ids=ordered.filter(d=>d.value>=lower && d.value<=upper).map(d=>d.id);
  return {ids,count:ids.length,total:data.length,fraction:ids.length/data.length};
}

export function observationAtRank(data: readonly EmpiricalObservation[], rank: number) {
  const ordered=orderedObservations(data);
  if (!Number.isInteger(rank) || rank<1 || rank>ordered.length) throw new Error("Rank must be a valid one-based position");
  return ordered[rank-1];
}

/** Reflection is a geometric probe of the observed sample, not a population test. */
export function reflectedObservations(data: readonly EmpiricalObservation[], center: number) {
  orderedObservations(data);
  if (!Number.isFinite(center)) throw new Error("Center must be finite");
  return data.map(d=>{
    const value=2*center-d.value;
    if (!Number.isFinite(value)) throw new Error("Reflection exceeds finite numeric range");
    return {id:d.id,value};
  });
}
