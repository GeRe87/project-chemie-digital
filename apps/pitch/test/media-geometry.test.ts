import test from 'node:test';
import assert from 'node:assert/strict';
import {isPanoramicMedia,installMediaGeometryHints} from '../src/media-geometry.ts';

test('panoramic media classification uses geometry, never a filename or scene identity',()=>{
  assert.equal(isPanoramicMedia(900,285),true);
  assert.equal(isPanoramicMedia(900,360),true);
  assert.equal(isPanoramicMedia(900,600),false);
  for(const dimensions of [[0,0],[100,0],[-100,40],[Infinity,20],[200,NaN]])assert.equal(isPanoramicMedia(...dimensions as [number,number]),false);
});

test('geometry hints cover cached and later-loaded images and remove their listeners',()=>{
  const makeImage=(complete:boolean,width:number,height:number)=>{
    const attributes=new Map<string,string>(),listeners=new Set<()=>void>();
    const image={complete,naturalWidth:width,naturalHeight:height,closest:()=>({setAttribute:(k:string,v:string)=>attributes.set(k,v),removeAttribute:(k:string)=>attributes.delete(k)}),addEventListener:(_type:string,fn:()=>void)=>listeners.add(fn),removeEventListener:(_type:string,fn:()=>void)=>listeners.delete(fn)};
    return {image,attributes,listeners};
  };
  const cached=makeImage(true,900,285),pending=makeImage(false,900,600);
  const root={querySelectorAll:()=>[cached.image,pending.image]} as unknown as ParentNode;
  const remove=installMediaGeometryHints(root);
  assert.equal(cached.attributes.get('data-media-aspect'),'panoramic');
  assert.equal(pending.attributes.has('data-media-aspect'),false);
  for(const load of pending.listeners)load();
  assert.equal(pending.attributes.get('data-media-aspect'),'standard');
  remove();assert.equal(cached.listeners.size,0);assert.equal(pending.listeners.size,0);assert.equal(cached.attributes.size,0);
});
