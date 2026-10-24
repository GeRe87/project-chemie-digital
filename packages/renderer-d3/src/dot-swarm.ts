/** Deterministic dot packing: preserve every x coordinate; y only avoids overlap. */
export function dotSwarm(xs: readonly number[], separation: number): number[] {
  if (!Number.isFinite(separation) || separation <= 0 || xs.some(x=>!Number.isFinite(x))) throw new Error("Invalid dot geometry");
  const ys:number[]=[];
  for(let i=0;i<xs.length;i++) {
    const nearby=xs.slice(0,i).map((x,j)=>({x,y:ys[j]})).filter(p=>Math.abs(p.x-xs[i])<separation);
    let y=0;
    for(let attempt=0;attempt<=2*i;attempt++) {
      y=attempt===0?0:Math.ceil(attempt/2)*separation*(attempt%2?1:-1);
      if(nearby.every(p=>(p.x-xs[i])**2+(p.y-y)**2>=separation**2-1e-9))break;
    }
    ys.push(y);
  }
  return ys;
}
