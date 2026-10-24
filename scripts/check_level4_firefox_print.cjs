/** Native Firefox BiDi print-engine check; isolated headless Firefox only.
 * Start Firefox with --headless --no-remote --profile <temporary-profile>
 * --remote-debugging-port 9227. No WebDriver/product dependency required.
 */
const fs=require('node:fs');
const path=require('node:path');
const assert=require('node:assert/strict');
const {execFileSync}=require('node:child_process');
const output=process.env.REVIEW_DIR;
assert(output,'Set REVIEW_DIR');fs.mkdirSync(output,{recursive:true});
const socket=new WebSocket(process.env.FIREFOX_BIDI_URL||'ws://127.0.0.1:9227/session');
let next=0;const waiting=new Map();
function call(method,params={}){return new Promise((resolve,reject)=>{
  const id=++next;waiting.set(id,{resolve,reject});socket.send(JSON.stringify({id,method,params}));
});}
socket.onmessage=event=>{const message=JSON.parse(event.data);const pending=waiting.get(message.id);if(pending){waiting.delete(message.id);message.type==='error'?pending.reject(new Error(JSON.stringify(message))):pending.resolve(message.result);}};
socket.onopen=async()=>{
  let context,session=false;
  try{
    await call('session.new',{capabilities:{}});
    session=true;
    ({context}=await call('browsingContext.create',{type:'tab'}));
    await call('browsingContext.navigate',{context,url:(process.env.PREVIEW_URL||'http://127.0.0.1:5173')+'/?level=ex%3Apath-chemometrics-level4-distribution-shape-lecture&mode=script&theme=light',wait:'complete'});
    const ready=await call('script.evaluate',{target:{context},expression:`(async()=>{await document.fonts.ready;const deadline=Date.now()+30000;while(document.querySelectorAll('.pcd-script-view .moment-matrix-svg').length!==4){if(Date.now()>deadline)throw Error('Script charts not ready');await new Promise(r=>setTimeout(r,100));}return document.querySelectorAll('.pcd-script-view .self-study-section').length;})()`,awaitPromise:true});
    assert.equal(ready.result.value,65);
    const pdf=await call('browsingContext.print',{context,background:true,orientation:'portrait',page:{width:21,height:29.7},margin:{top:1.6,bottom:1.8,left:1.4,right:1.4},shrinkToFit:true});
    const file=path.join(output,process.env.FIREFOX_PDF_NAME||'chemometrics-level4-firefox.pdf');
    fs.writeFileSync(file,Buffer.from(pdf.data,'base64'));
    const inspection=JSON.parse(execFileSync('python',['-X','utf8','-c',`
import hashlib,json,pathlib,re,subprocess,sys
from pypdf import PdfReader,PdfWriter
pdf=pathlib.Path(sys.argv[1]);reader=PdfReader(pdf);texts=[p.extract_text() or '' for p in reader.pages]
assert pdf.stat().st_size<5_000_000
assert all(p.mediabox.width<p.mediabox.height for p in reader.pages)
assert all(len(t.strip())>20 for t in texts)
plates=[i for i,t in enumerate(texts) if 'Empirical descriptors; variances use squared measurement units' in t]
assert len(plates)==4,plates
for i in plates:
    t=texts[i]
    assert 'Histogram' in t and 'Boxplot' in t and 'Points' in t and 'Horizontal axes' in t
    assert t.count('Uniform ·')==3 and t.count('Normal-like ·')==3 and t.count('Right-skewed ·')==3,t
# This output has vector charts and real text, not one high-resolution image per page.
assert not any(list(p.images) for p in reader.pages)
folder=pdf.parent/'raster-firefox';folder.mkdir(exist_ok=True)
subprocess.run(['pdftoppm','-r','40',str(pdf),str(folder/'page')],check=True,capture_output=True)
images=sorted(folder.glob('page-*.ppm'),key=lambda p:int(re.search(r'-(\\d+)\\.ppm$',p.name)[1]))
assert len(images)==len(texts)
fractions=[]
for image in images:
    raw=image.read_bytes();header,pixels=raw.split(b'\\n255\\n',1);w,h=map(int,header.splitlines()[-1].split());assert len(pixels)==w*h*3
    dark=total=0
    for y in range(int(h*.10),int(h*.90)):
        for x in range(int(w*.08),int(w*.92)):
            k=(y*w+x)*3;dark+=min(pixels[k:k+3])<235;total+=1
    fractions.append(dark/total)
assert all(.002<f<.55 for f in fractions),fractions
proof=PdfWriter()
for i in plates:proof.add_page(reader.pages[i])
proof.write(pdf.parent/'firefox-matrix-proof.pdf')
print(json.dumps({'pages':len(texts),'bytes':pdf.stat().st_size,'rotatedMatrixPages':[i+1 for i in plates],'embeddedImages':0,'rasterInkFractions':fractions,'sha256':hashlib.sha256(pdf.read_bytes()).hexdigest()}))
`,file],{encoding:'utf8',timeout:120000,maxBuffer:1024*1024}));
    fs.writeFileSync(path.join(output,'firefox-print-manifest.json'),JSON.stringify(inspection,null,2));
    console.log('Firefox PDF:',file,fs.statSync(file).size,'bytes');
    console.log(`PASS: ${inspection.pages} portrait pages raster-checked, four complete nine-panel plates, no embedded images, <5 MB.`);
  }catch(error){console.error(error);process.exitCode=1;}finally{
    try{if(context)await call('browsingContext.close',{context});if(session)await call('session.end');}
    catch(error){console.error(error);process.exitCode=1;}
    socket.close();
  }
};
socket.onerror=error=>{console.error(error);process.exitCode=1;};
