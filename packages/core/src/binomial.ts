/** Exact finite-model probabilities (up to floating-point rounding), not simulations. */
export function validateBinomial(n:number,p:number):void {
  if(!Number.isInteger(n)||n<1||n>100||!Number.isFinite(p)||p<0||p>1)throw new Error("Binomial model requires integer n in [1,100] and p in [0,1]");
}
export function binomialMass(n:number,p:number):readonly number[]{
  validateBinomial(n,p);
  const mass=Array<number>(n+1).fill(0);
  if(p===0||p===1){mass[p===0?0:n]=1;return mass;}
  const mode=Math.min(n,Math.floor((n+1)*p));mass[mode]=1;
  for(let k=mode;k>0;k--)mass[k-1]=mass[k]!*k/(n-k+1)*(1-p)/p;
  for(let k=mode;k<n;k++)mass[k+1]=mass[k]!*(n-k)/(k+1)*p/(1-p);
  const total=mass.reduce((a,b)=>a+b,0);
  return mass.map(v=>v/total);
}
export function specifiedSequenceProbability(n:number,p:number,k:number):number{
  validateBinomial(n,p);
  if(!Number.isInteger(k)||k<0||k>n)throw new Error("Invalid success count");
  return p**k*(1-p)**(n-k);
}
export function binomialMoments(n:number,p:number){
  validateBinomial(n,p);return {mean:n*p,variance:n*p*(1-p),sd:Math.sqrt(n*p*(1-p))};
}
/** Small, exact arrangement counts for the pedagogical positioning view only. */
export function arrangementCount(n:number,k:number):number{
  if(!Number.isInteger(n)||n<1||n>20||!Number.isInteger(k)||k<0||k>n)throw new Error("Arrangement view requires n in [1,20] and k in [0,n]");
  let count=1;for(let i=1;i<=Math.min(k,n-k);i++)count=count*(n-i+1)/i;
  return Math.round(count);
}
export function arrangementAt(n:number,k:number,index:number):readonly boolean[]{
  const count=arrangementCount(n,k);
  if(!Number.isInteger(index)||index<0||index>=count)throw new Error("Arrangement index outside range");
  const result:boolean[]=[];let remaining=k;
  for(let i=0;i<n;i++){
    if(!remaining){result.push(false);continue;}
    if(remaining===n-i){result.push(true);remaining--;continue;}
    const withPositive=arrangementCount(n-i-1,remaining-1);
    if(index<withPositive){result.push(true);remaining--;}else{result.push(false);index-=withPositive;}
  }
  return result;
}
