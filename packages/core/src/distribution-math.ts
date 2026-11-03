/** Numerical reference functions, independent of renderer and teaching content. */
export function logGamma(z:number):number {
  const c=[676.5203681218851,-1259.1392167224028,771.3234287776531,-176.6150291621406,12.507343278686905,-.13857109526572012,9.984369578019572e-6,1.5056327351493116e-7];
  if(z<.5)return Math.log(Math.PI)-Math.log(Math.sin(Math.PI*z))-logGamma(1-z);
  z--;let x=.9999999999998099;for(let i=0;i<c.length;i++)x+=c[i]/(z+i+1);
  const t=z+7.5;return .5*Math.log(2*Math.PI)+(z+.5)*Math.log(t)-t+Math.log(x);
}
export function gammaQ(a:number,x:number):number {
  if(!(a>0)||x<0)throw Error('Invalid gamma arguments');if(!x)return 1;
  const factor=Math.exp(a*Math.log(x)-x-logGamma(a));
  if(x<a+1){let term=1/a,sum=term;for(let n=1;n<1000;n++){term*=x/(a+n);sum+=term;if(Math.abs(term)<Math.abs(sum)*2e-15)break;}return Math.max(0,1-factor*sum);}
  let b=x+1-a,c=1e300,d=1/b,h=d;
  for(let i=1;i<1000;i++){const an=-i*(i-a);b+=2;d=an*d+b;if(Math.abs(d)<1e-300)d=1e-300;c=b+an/c;if(Math.abs(c)<1e-300)c=1e-300;d=1/d;const delta=d*c;h*=delta;if(Math.abs(delta-1)<2e-15)break;}
  return Math.min(1,Math.max(0,factor*h));
}
function betaFraction(a:number,b:number,x:number):number {
  const qab=a+b,qap=a+1,qam=a-1;let c=1,d=1-qab*x/qap;if(Math.abs(d)<1e-300)d=1e-300;d=1/d;let h=d;
  for(let m=1;m<1000;m++){
    let aa=m*(b-m)*x/((qam+2*m)*(a+2*m));d=1+aa*d;if(Math.abs(d)<1e-300)d=1e-300;c=1+aa/c;if(Math.abs(c)<1e-300)c=1e-300;d=1/d;h*=d*c;
    aa=-(a+m)*(qab+m)*x/((a+2*m)*(qap+2*m));d=1+aa*d;if(Math.abs(d)<1e-300)d=1e-300;c=1+aa/c;if(Math.abs(c)<1e-300)c=1e-300;d=1/d;const delta=d*c;h*=delta;if(Math.abs(delta-1)<2e-15)break;
  }return h;
}
export function betaI(x:number,a:number,b:number):number {
  if(!(a>0&&b>0)||x<0||x>1)throw Error('Invalid beta arguments');if(x===0||x===1)return x;
  const bt=Math.exp(logGamma(a+b)-logGamma(a)-logGamma(b)+a*Math.log(x)+b*Math.log1p(-x));
  return Math.min(1,Math.max(0,x<(a+1)/(a+b+2)?bt*betaFraction(a,b,x)/a:1-bt*betaFraction(b,a,1-x)/b));
}
export const normalPdf=(z:number)=>Math.exp(-z*z/2)/Math.sqrt(2*Math.PI);
export function normalCdf(z:number):number {const tail=.5*gammaQ(.5,z*z/2);return z<0?tail:1-tail;}
/** Acklam initial approximation followed by Newton correction against gammaQ. */
export function normalQuantile(p:number):number {
  if(!(p>0&&p<1))throw Error('Normal quantile requires probability strictly inside (0,1)');
  const a=[-39.69683028665376,220.9460984245205,-275.9285104469687,138.357751867269,-30.66479806614716,2.506628277459239],b=[-54.47609879822406,161.5858368580409,-155.6989798598866,66.80131188771972,-13.28068155288572],c=[-.007784894002430293,-.3223964580411365,-2.400758277161838,-2.549732539343734,4.374664141464968,2.938163982698783],d=[.007784695709041462,.3224671290700398,2.445134137142996,3.754408661907416];
  const polynomial=(coeff:number[],x:number)=>coeff.reduce((v,k)=>v*x+k,0);
  let x:number;if(p<.02425||p>1-.02425){const q=Math.sqrt(-2*Math.log(p<.5?p:1-p));x=polynomial(c,q)/(polynomial([...d,1],q));if(p>.5)x=-x;}else{const q=p-.5,r=q*q;x=polynomial(a,r)*q/polynomial([...b,1],r);}
  for(let i=0;i<2;i++)x-=(normalCdf(x)-p)/normalPdf(x);return x;
}
export const studentPdf=(x:number,df:number)=>Math.exp(logGamma((df+1)/2)-logGamma(df/2)-.5*Math.log(df*Math.PI)-(df+1)/2*Math.log1p(x*x/df));
export function studentCdf(x:number,df:number):number {const tail=.5*betaI(df/(df+x*x),df/2,.5);return x<0?tail:1-tail;}
export function fCdf(x:number,d1:number,d2:number):number {return x<=0?0:betaI(d1*x/(d1*x+d2),d1/2,d2/2);}
export function fPdf(x:number,d1:number,d2:number):number {if(x<=0)return 0;const a=d1/2,b=d2/2;return Math.exp(a*Math.log(d1/d2)+(a-1)*Math.log(x)-(a+b)*Math.log1p(d1*x/d2)-logGamma(a)-logGamma(b)+logGamma(a+b));}
export const chiPdf=(x:number,df:number)=>x<=0?0:Math.exp((df/2-1)*Math.log(x)-x/2-df/2*Math.log(2)-logGamma(df/2));
export function quantile(cdf:(x:number)=>number,p:number,lower=0,upper=1):number {
  if(!(p>0&&p<1))throw Error('Invalid quantile probability');let expansions=0;while(cdf(upper)<p&&expansions++<80)upper=upper*2+1;
  if(cdf(lower)>p||cdf(upper)<p)throw Error('Quantile not bracketed');for(let i=0;i<75;i++){const mid=(lower+upper)/2;if(cdf(mid)<p)lower=mid;else upper=mid;}return(lower+upper)/2;
}
export const mean=(v:readonly number[])=>v.reduce((a,b)=>a+b,0)/v.length;
export function variance(v:readonly number[]):number {if(v.length<2)throw Error('Sample variance needs two values');const m=mean(v);return v.reduce((s,x)=>s+(x-m)**2,0)/(v.length-1);}
export function seededUniform(seed:number):()=>number {let state=seed;return()=>{state=16807*state%2147483647;return state/2147483647;};}
export function empiricalQuantile(v:readonly number[],p:number):number {const a=[...v].sort((x,y)=>x-y),i=(a.length-1)*p,k=Math.floor(i);return a[k]+(a[Math.min(k+1,a.length-1)]-a[k])*(i-k);}
