import type {ExperimentBlock} from './distribution-experiment.ts';

/** Ordered cross-group comparisons. Original identities and ties stay intact. */
export function pairwiseScores(block:ExperimentBlock){
 const data=block.data??[];
 if(data.length<2||data.length>16||data.some(d=>!Number.isFinite(d.x)||![0,1].includes(d.y)||!d.label?.trim()||!d.source?.length))throw Error('Pairwise scoring needs finite, labelled, source-linked observations in group 0 or 1');
 const a=data.filter(d=>d.y===0),b=data.filter(d=>d.y===1);
 if(!a.length||!b.length||a.length>8||b.length>8)throw Error('Pairwise scoring needs 1 to 8 observations in each group');
 let total=0;
 return a.flatMap(x=>b.map(y=>{const score=x.x>y.x?1:x.x===y.x?.5:0;total+=score;return {x,y,score,total,relation:x.x>y.x?'>':x.x===y.x?'=':'<'};}));
}
