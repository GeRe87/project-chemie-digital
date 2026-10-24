import { resolvePublicAssetUrl } from "./public-asset-url.ts";
import { createExplanationDialog } from "./explanation-dialog.ts";

const CODEMIRROR_VIEW_MODULE_PATH = "/vendor/codemirror/view-6.43.6.mjs";
const WEBR_MODULE_PATH = "/vendor/webr/v0.6.0/webr.js";
const WEBR_BASE_PATH = "/vendor/webr/v0.6.0/";

interface EditorHandle {
  readonly state: { readonly doc: { readonly length: number; toString(): string } };
  dispatch(spec: { readonly changes: { readonly from: number; readonly to: number; readonly insert: string } }): void;
  destroy(): void;
  requestMeasure(): void;
}

interface EditorViewConstructor {
  new (config: { parent: HTMLElement; doc: string; extensions?: readonly unknown[] }): EditorHandle;
  readonly editable: { of(value: boolean): unknown };
  readonly lineWrapping: unknown;
}

interface CodeMirrorViewModule {
  readonly EditorView: EditorViewConstructor;
}

interface WebRInstance {
  init(): Promise<unknown>;
  evalRString(code: string): Promise<string>;
  Shelter: new () => WebRShelter | Promise<WebRShelter>;
  close(): void;
}

interface WebRShelter {
  captureR(code:string,options:{captureGraphics:{width:number;height:number;bg:string}}):Promise<{
    result:{toArray():Promise<(string|null)[]>};
    output:readonly {type:string;data:unknown}[];
    images:ImageBitmap[];
  }>;
  purge():Promise<void>;
}
export interface RExecutionResult { readonly text:string; readonly images:readonly ImageBitmap[]; }

/** Keep existing source/print semantics while also capturing ordinary R graphics. */
export async function captureRCode(webR:Pick<WebRInstance,"Shelter">,code:string):Promise<RExecutionResult>{
  const shelter=await new webR.Shelter();let images:ImageBitmap[]=[];
  try {
    const capture=await shelter.captureR(wrapRForCapturedOutput(code),{captureGraphics:{width:720,height:420,bg:"white"}});
    images=capture.images;
    const messages:string[]=[];
    for(const item of capture.output){
      if(typeof item.data==="string")messages.push(item.data);
      else if(["warning","message","error"].includes(item.type)){
        try{
          const condition=item.data as {get(key:string):Promise<{toString():Promise<string>}>};
          messages.push(`${item.type}: ${await (await condition.get("message")).toString()}`);
        }catch{messages.push(`R ${item.type}`);}
      }
    }
    const values=await capture.result.toArray();
    return {text:[...messages,...values.filter((v):v is string=>v!==null)].join("\n"),images};
  }catch(error){for(const image of images)image.close();throw error;}
  finally{await shelter.purge();}
}

interface WebRModule {
  readonly WebR: new (options: { baseUrl: string; channelType: number }) => WebRInstance;
  readonly ChannelType: { readonly PostMessage: number };
}

export interface CodeRuntimeController {
  refresh(): void;
  destroy(): void;
}

export function isConnectedInteractiveMode(search: string): boolean {
  return new URLSearchParams(search).get("interactive") === "1";
}

export function wrapRForCapturedOutput(code: string): string {
  return `paste(capture.output(local({ .pcd_connection <- textConnection(${JSON.stringify(code)}); tryCatch(source(.pcd_connection, local=.GlobalEnv, echo=FALSE, print.eval=TRUE), finally=close(.pcd_connection)) })), collapse="\\n")`;
}

function localBrowserUrl(path: string): string {
  return new URL(resolvePublicAssetUrl(path), document.baseURI).href;
}

export function vendorImportMap(baseHref: string): { imports: Record<string, string> } {
  // Preserve the reviewed vendor bytes and their absolute internal specifiers.
  // A native prefix map resolves those same modules below a deployment subpath.
  return { imports: { "/vendor/": resolvePublicAssetUrl("/vendor/", baseHref) } };
}

function installVendorImportMap(): void {
  if (document.querySelector("script[data-pcd-vendor-import-map]")) return;
  const map = document.createElement("script");
  map.type = "importmap"; map.dataset.pcdVendorImportMap = "true";
  map.textContent = JSON.stringify(vendorImportMap(document.baseURI));
  document.head.append(map);
}

async function importPinned<T>(path: string): Promise<T> {
  return await import(/* @vite-ignore */ localBrowserUrl(path)) as T;
}

async function loadCodeMirrorView(): Promise<EditorViewConstructor> {
  installVendorImportMap();
  const module = await importPinned<CodeMirrorViewModule>(CODEMIRROR_VIEW_MODULE_PATH);
  return module.EditorView;
}

function createWebRExecutor(): { execute(code: string): Promise<RExecutionResult>; close(): void } {
  let instancePromise: Promise<WebRInstance> | undefined;
  let closed=false;
  let queue:Promise<unknown>=Promise.resolve();
  const instance = (): Promise<WebRInstance> => {
    if(closed)return Promise.reject(new Error("R executor has been disposed"));
    if (!instancePromise) {
      instancePromise = importPinned<WebRModule>(WEBR_MODULE_PATH).then(async ({ WebR, ChannelType }) => {
        const webR = new WebR({ baseUrl: localBrowserUrl(WEBR_BASE_PATH), channelType: ChannelType.PostMessage });
        try{
          await webR.init();
          // captureR restores the previous device after capture. Keep that fallback
          // on the supported browser device rather than R's default PDF device.
          await webR.evalRString('options(device=webr::canvas); "ready"');
        }catch(error){webR.close();throw error;}
        return webR;
      }).catch((error: unknown) => { instancePromise = undefined; throw error; });
    }
    return instancePromise;
  };
  return {
    execute(code: string): Promise<RExecutionResult> {
      const task=queue.then(async()=>captureRCode(await instance(),code));
      queue=task.catch(()=>undefined);return task;
    },
    close(): void {
      closed=true;
      void instancePromise?.then((webR) => webR.close()).catch(() => undefined);
      instancePromise = undefined;
    },
  };
}

export async function mountExecutableCodeBlocks(root: ParentNode): Promise<CodeRuntimeController> {
  const shells = [...root.querySelectorAll<HTMLElement>('.code-block[data-executable="true"]')];
  if (shells.length === 0) return { refresh: () => undefined, destroy: () => undefined };

  // The connected runtime intentionally loads only the pinned @codemirror/view entry.
  // Its mirrored ESM dependency graph is prepared as one local tree so independently
  // bundled @codemirror/state instances cannot re-enter through presentation-time CDNs.
  const EditorView = await loadCodeMirrorView();
  const executor = createWebRExecutor();
  const editors: EditorHandle[] = [];
  const cleanup: Array<() => void> = [];
  const plotModal=createExplanationDialog("pcd-r-plot-dialog","pcd-r-plot-title");

  try {
    for (const shell of shells) {
      const fallback = shell.querySelector<HTMLElement>(".code-static-fallback");
      const initialCode = fallback?.textContent ?? "";
      if (initialCode.length === 0) continue;

      const editable = shell.dataset.editable === "true";
      const stopDeckKeyboard = (event: KeyboardEvent): void => event.stopPropagation();
      shell.addEventListener("keydown", stopDeckKeyboard);

      const glossary=shell.closest(".code-function-workbench")?.querySelector<HTMLElement>(".definition-list");
      const scrollGlossary=(event:KeyboardEvent):void=>{
        if(event.altKey||event.ctrlKey||event.metaKey)return;
        if(!["Home","End","ArrowDown","ArrowUp","PageDown","PageUp"," "].includes(event.key))return;
        event.preventDefault();event.stopPropagation();
        if(event.key==="Home")glossary!.scrollTop=0;
        else if(event.key==="End")glossary!.scrollTop=glossary!.scrollHeight;
        else glossary!.scrollBy({top:(event.key==="ArrowUp"||event.key==="PageUp"||event.key===" "&&event.shiftKey?-1:1)*(event.key.startsWith("Arrow")?40:glossary!.clientHeight*.8),behavior:"instant"});
      };
      glossary?.addEventListener("keydown",scrollGlossary);

      const editorHost = document.createElement("div");
      editorHost.className = "code-editor-host";
      editorHost.setAttribute("aria-label", `Code-Editor (${shell.dataset.language ?? "code"})`);

      const controls = document.createElement("div");
      controls.className = "code-runtime-controls";
      const run = document.createElement("button");
      run.type = "button";
      run.className = "code-run-button";
      run.textContent = "Run";
      const reset = document.createElement("button");
      reset.type = "button";
      reset.className = "code-reset-button";
      reset.textContent = "Reset";
      const showPlots=document.createElement("button");showPlots.type="button";showPlots.className="code-plot-button";
      showPlots.hidden=true;showPlots.textContent="Show plots";showPlots.setAttribute("aria-haspopup","dialog");
      const plots=document.createElement("div");plots.className="code-plot-gallery";
      const openPlots=()=>plotModal.open("R graphics",plots,showPlots);showPlots.addEventListener("click",openPlots);
      const runtimeLabel = document.createElement("span");
      runtimeLabel.className = "code-runtime-label";
      runtimeLabel.textContent = "R · webR";
      controls.append(run, reset, showPlots, runtimeLabel);

      const output = document.createElement("pre");
      output.className = "code-output";
      output.tabIndex = 0;
      output.setAttribute("aria-live", "polite");
      output.setAttribute("aria-label", "R output");
      output.textContent = "Output will appear here.";

      fallback?.setAttribute("hidden", "");
      shell.append(editorHost, controls, output);

      let editor: EditorHandle | undefined;
      let disposed = false;
      const resetEditor = (): void => {
        if (disposed || !editor) return;
        editor.dispatch({
          changes: { from: 0, to: editor.state.doc.length, insert: initialCode },
        });
        output.textContent = "Output will appear here.";
        if(plotModal.body.contains(plots))plotModal.dialog.close();
        plots.replaceChildren();showPlots.hidden=true;
        editor.requestMeasure();
      };
      const execute = async (): Promise<void> => {
        if (disposed || !editor) return;
        run.disabled = true;
        output.textContent = "Loading R runtime …";
        if(plotModal.body.contains(plots))plotModal.dialog.close();
        plots.replaceChildren();showPlots.hidden=true;
        try {
          const result = await executor.execute(editor.state.doc.toString());
          if (!disposed) {
            output.textContent = result.text.length > 0 ? result.text : "(no text output)";
            for(const [index,image] of result.images.entries()){
              try{
                const canvas=document.createElement("canvas");canvas.width=image.width;canvas.height=image.height;
                canvas.setAttribute("role","img");canvas.setAttribute("aria-label",`R plot ${index+1}. Refer to the code and numeric output for the plotted values.`);
                canvas.getContext("2d")?.drawImage(image,0,0);plots.append(canvas);
              }finally{image.close();}
            }
            showPlots.hidden=result.images.length===0;showPlots.textContent=`Show plots (${result.images.length})`;
          } else for(const image of result.images)image.close();
        } catch (error) {
          if (!disposed) output.textContent = `Error: ${error instanceof Error ? error.message : String(error)}`;
        } finally {
          if (!disposed) run.disabled = false;
        }
      };

      cleanup.push(() => {
        disposed = true;
        shell.removeEventListener("keydown", stopDeckKeyboard);
        glossary?.removeEventListener("keydown",scrollGlossary);
        run.removeEventListener("click", execute);
        reset.removeEventListener("click", resetEditor);
        showPlots.removeEventListener("click",openPlots);plots.replaceChildren();
        editor?.destroy();
        editorHost.remove();
        controls.remove();
        output.remove();
        fallback?.removeAttribute("hidden");
      });

      editor = new EditorView({
        parent: editorHost,
        doc: initialCode,
        extensions: [EditorView.lineWrapping, EditorView.editable.of(editable)],
      });
      editors.push(editor);
      run.addEventListener("click", execute);
      reset.addEventListener("click", resetEditor);
    }
  } catch (error) {
    for (const remove of cleanup.reverse()) remove();
    executor.close();
    plotModal.destroy();
    throw error;
  }

  let destroyed = false;
  return {
    refresh(): void {
      if (!destroyed) for (const editor of editors) editor.requestMeasure();
    },
    destroy(): void {
      if (destroyed) return;
      destroyed = true;
      for (const remove of cleanup.reverse()) remove();
      executor.close();
      plotModal.destroy();
    },
  };
}

export const interactiveRuntimeVersions = Object.freeze({
  codeMirrorView: "6.43.6",
  webR: "0.6.0",
});

export const interactiveRuntimeDestinations = Object.freeze({
  codeMirrorView: CODEMIRROR_VIEW_MODULE_PATH,
  webRModule: WEBR_MODULE_PATH,
  webRBase: WEBR_BASE_PATH,
});
