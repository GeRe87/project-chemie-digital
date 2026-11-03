/** A finite, padded domain that includes the zero baseline and both signs. */
export function zeroInclusiveDomain(values: readonly number[], padding = 0.15): readonly [number, number] {
  if (!values.length || values.some(value => !Number.isFinite(value))) {
    throw new Error("Chart values must be nonempty and finite");
  }
  const minimum = Math.min(0, ...values);
  const maximum = Math.max(0, ...values);
  if (minimum === maximum) return [0, 1];
  return [minimum * (1 + padding), maximum * (1 + padding)];
}

export function validNumericDomain(domain: readonly [number, number] | undefined): domain is readonly [number, number] {
  return !!domain && Number.isFinite(domain[0]) && Number.isFinite(domain[1]) && domain[0] < domain[1];
}
