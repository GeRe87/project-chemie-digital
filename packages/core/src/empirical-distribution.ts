/** Equal-weight empirical distributions. No DOM, renderer or course identities. */
export interface EmpiricalObservation { readonly id: string; readonly value: number; }

export function orderedObservations<T extends EmpiricalObservation>(observations: readonly T[]): T[] {
  if (!observations.length) throw new Error("An empirical distribution needs at least one observation");
  const ids = new Set<string>();
  for (const observation of observations) {
    if (!observation.id || ids.has(observation.id) || !Number.isFinite(observation.value)) {
      throw new Error("Observations need unique identities and finite values");
    }
    ids.add(observation.id);
  }
  // Stable ties preserve individual observation identity and presentation order.
  return observations.map((observation, index) => ({ observation, index }))
    .sort((a, b) => a.observation.value - b.observation.value || a.index - b.index)
    .map(({ observation }) => observation);
}

export function cumulativeCount(observations: readonly EmpiricalObservation[], threshold: number) {
  const ordered = orderedObservations(observations);
  if (!Number.isFinite(threshold)) throw new Error("Threshold must be finite");
  const includedIds = ordered.filter(observation => observation.value <= threshold).map(observation => observation.id);
  return { count: includedIds.length, total: ordered.length, fraction: includedIds.length / ordered.length, includedIds };
}

export function empiricalSteps(observations: readonly EmpiricalObservation[]) {
  const ordered = orderedObservations(observations);
  const steps: { value: number; count: number; multiplicity: number; left: number; right: number }[] = [];
  for (const observation of ordered) {
    const last = steps.at(-1);
    if (last?.value === observation.value) {
      last.count++; last.multiplicity++; last.right = last.count / ordered.length;
    } else {
      const count = (last?.count ?? 0) + 1;
      steps.push({ value: observation.value, count, multiplicity: 1, left: (count - 1) / ordered.length, right: count / ordered.length });
    }
  }
  return steps;
}
