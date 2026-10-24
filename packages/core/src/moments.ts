export type MomentMetric="mean"|"variance"|"kurtosis"|"skewness";
/** Descriptive empirical moments: central moments use n, sample variance n−1. */
export function empiricalMoments(values:readonly number[]){
  if(values.length<2||values.some(v=>!Number.isFinite(v)))throw new Error("Moments require at least two finite observations");
  const n=values.length,origin=values[0],mean=origin+values.reduce((s,v)=>s+(v-origin)/n,0);
  const central=(r:number)=>values.reduce((s,v)=>s+(v-mean)**r/n,0);
  const m2=central(2),m3=central(3),m4=central(4);
  if(![mean,m2,m3,m4].every(Number.isFinite))throw new Error("Moments exceed finite numeric range");
  return {n,mean,m2,m3,m4,sampleVariance:m2*n/(n-1),skewness:m2>0?m3/m2**1.5:null,kurtosis:m2>0?m4/m2**2:null};
}
