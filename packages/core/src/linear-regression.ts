/** Small dense least-squares problems. QR avoids explicitly inverting XᵀX. */
export function leastSquares(design: readonly (readonly number[])[], response: readonly number[]) {
  const n = design.length, p = design[0]?.length ?? 0;
  if (!p || n < p || response.length !== n || response.some(x => !Number.isFinite(x)) ||
      design.some(row => row.length !== p || row.some(x => !Number.isFinite(x)))) {
    throw Error('Least squares requires finite rectangular data with n >= p');
  }
  const a = design.map(row => [...row]), b = [...response];
  const scale = Math.max(...a.flat().map(Math.abs));
  const tolerance = Number.EPSILON * Math.max(n, p) * scale * 16;
  for (let k = 0; k < p; k++) {
    const norm = Math.hypot(...a.slice(k).map(row => row[k]!));
    if (norm <= tolerance) throw Error('Design matrix must have independent columns');
    const alpha = a[k]![k]! >= 0 ? -norm : norm;
    const v = a.slice(k).map(row => row[k]!);
    v[0] = v[0]! - alpha;
    const length = Math.hypot(...v);
    const u = v.map(value => value / length);
    for (let j = k; j < p; j++) {
      const dot = u.reduce((sum, value, i) => sum + value * a[k + i]![j]!, 0);
      u.forEach((value, i) => { a[k + i]![j] = a[k + i]![j]! - 2 * value * dot; });
    }
    const dot = u.reduce((sum, value, i) => sum + value * b[k + i]!, 0);
    u.forEach((value, i) => { b[k + i] = b[k + i]! - 2 * value * dot; });
  }
  const coefficients = Array<number>(p).fill(0);
  for (let i = p - 1; i >= 0; i--) {
    let value = b[i]!;
    for (let j = i + 1; j < p; j++) value -= a[i]![j]! * coefficients[j]!;
    coefficients[i] = value / a[i]![i]!;
  }
  const fitted = design.map(row => row.reduce((sum, value, j) => sum + value * coefficients[j]!, 0));
  const residuals = response.map((value, i) => value - fitted[i]!);
  return { coefficients, fitted, residuals, sse: residuals.reduce((sum, value) => sum + value * value, 0) };
}

/** Basis 0: straight line; 1: quadratic; 2: reciprocal. All linear in coefficients. */
export function regressionRow(x: number, basis: number): number[] {
  if (!Number.isFinite(x) || ![0, 1, 2].includes(basis)) throw Error('Invalid regression basis or observation');
  if (basis === 2 && x <= 0) throw Error('The reciprocal basis requires positive x');
  return basis === 1 ? [1, x, x * x] : [1, basis === 2 ? 1 / x : x];
}
