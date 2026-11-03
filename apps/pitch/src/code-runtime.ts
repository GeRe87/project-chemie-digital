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

export interface WebRInstance {
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
  const shelter=await new webR.Shelter();let images:ImageBitmap[]=[];let failed=false;
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
  }catch(error){failed=true;for(const image of images)image.close();throw error;}
  finally{
    try{await shelter.purge();}
    catch(error){if(!failed){for(const image of images)image.close();throw error;}}
  }
}

export interface WebRModule {
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

export class RExecutionCancelledError extends Error {
  constructor() { super("Execution stopped. The R session has been cleared."); this.name = "RExecutionCancelledError"; }
}

/** Termination resets the worker and queue together, even if an R call never settles. */
export function createWebRExecutor(dependencies: {
  readonly loadModule?: () => Promise<WebRModule>;
  readonly baseUrl?: string;
} = {}): { execute(code: string): Promise<RExecutionResult>; restart(): void; close(): void } {
  interface Generation {
    cancelled: boolean;
    session?: WebRInstance;
    promise?: Promise<WebRInstance>;
    queue: Promise<unknown>;
    cancellations: Set<() => void>;
  }
  const generation = (): Generation => ({ cancelled: false, queue: Promise.resolve(), cancellations: new Set() });
  let current = generation();
  let closed = false;
  const disposeSession = (state: Generation) => {
    const session = state.session;
    state.session = undefined;
    session?.close();
  };
  const cancel = (state: Generation) => {
    if (state.cancelled) return;
    state.cancelled = true;
    for (const reject of state.cancellations) reject();
    state.cancellations.clear();
    disposeSession(state);
  };
  const instance = (state: Generation): Promise<WebRInstance> => {
    if (state.cancelled) return Promise.reject(new RExecutionCancelledError());
    if (!state.promise) {
      const pending: Promise<WebRInstance> = (dependencies.loadModule?.() ?? importPinned<WebRModule>(WEBR_MODULE_PATH)).then(async ({ WebR, ChannelType }) => {
        if (state.cancelled) throw new RExecutionCancelledError();
        const webR = new WebR({ baseUrl: dependencies.baseUrl ?? localBrowserUrl(WEBR_BASE_PATH), channelType: ChannelType.PostMessage });
        state.session = webR;
        try {
          await webR.init();
          if (state.cancelled) throw new RExecutionCancelledError();
          await webR.evalRString('options(device=webr::canvas); "ready"');
          if (state.cancelled) throw new RExecutionCancelledError();
          return webR;
        } catch (error) { disposeSession(state); throw error; }
      }).catch((error: unknown) => {
        if (state.promise === pending) state.promise = undefined;
        throw error;
      });
      state.promise = pending;
    }
    return state.promise;
  };
  return {
    execute(code: string): Promise<RExecutionResult> {
      if (closed) return Promise.reject(new Error("R executor has been disposed"));
      const state = current;
      const task = state.queue.then(async () => {
        if (state.cancelled) throw new RExecutionCancelledError();
        const session = await instance(state);
        if (state.cancelled) throw new RExecutionCancelledError();
        return captureRCode(session, code);
      });
      state.queue = task.catch(() => undefined);
      return new Promise((resolve, reject) => {
        let settled = false;
        const cancelled = () => { if (!settled) { settled = true; reject(new RExecutionCancelledError()); } };
        state.cancellations.add(cancelled);
        void task.then(result => {
          state.cancellations.delete(cancelled);
          if (settled || state.cancelled) { for (const image of result.images) image.close(); return; }
          settled = true; resolve(result);
        }, error => {
          state.cancellations.delete(cancelled);
          if (!settled) { settled = true; reject(error); }
        });
      });
    },
    restart() {
      if (closed) return;
      cancel(current);
      current = generation();
    },
    close() { if (closed) return; closed = true; cancel(current); },
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
      const split = shell.dataset.codeLayout === "split";
      const resultPane = split ? shell.querySelector<HTMLElement>(".code-result-pane") : null;
      const placeholder = shell.querySelector<HTMLElement>(".code-runtime-placeholder");
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
      editorHost.setAttribute("aria-label", `Code editor (${shell.dataset.language ?? "code"})`);

      const controls = document.createElement("div");
      controls.className = "code-runtime-controls";
      controls.setAttribute("role", "group");
      controls.setAttribute("aria-label", "R execution and output controls");
      if (split) {
        const outputLabel = document.createElement("strong");
        outputLabel.className = "code-output-label";
        outputLabel.textContent = "Output";
        controls.append(outputLabel);
      }
      const run = document.createElement("button");
      run.type = "button";
      run.className = "code-run-button";
      run.textContent = "Run";
      const reset = document.createElement("button");
      reset.type = "button";
      reset.className = "code-reset-button";
      reset.textContent = "Reset";
      const stop = document.createElement("button");
      stop.type = "button"; stop.className = "code-stop-button"; stop.textContent = "Stop"; stop.disabled = true;
      stop.title = "Stop all running or queued R code and clear the shared R session";
      const restart = document.createElement("button");
      restart.type = "button"; restart.className = "code-restart-button"; restart.textContent = "Restart R";
      restart.title = "Clear R variables and restart the shared session on the next Run";
      const showPlots=document.createElement("button");showPlots.type="button";showPlots.className="code-plot-button";
      showPlots.hidden=true;showPlots.textContent="Show plots";showPlots.setAttribute("aria-haspopup","dialog");
      const plots=document.createElement("div");plots.className="code-plot-gallery";
      const openPlots=()=>{
        if(!split){plotModal.open("R graphics",plots,showPlots);return;}
        const enlarged=document.createElement("div");enlarged.className="code-plot-gallery";
        for(const source of plots.querySelectorAll("canvas")){
          const canvas=document.createElement("canvas");canvas.width=source.width;canvas.height=source.height;
          canvas.setAttribute("role","img");canvas.setAttribute("aria-label",source.getAttribute("aria-label")??"R plot");
          canvas.getContext("2d")?.drawImage(source,0,0);enlarged.append(canvas);
        }
        plotModal.open("R graphics",enlarged,showPlots);
      };showPlots.addEventListener("click",openPlots);
      const runtimeLabel = document.createElement("span");
      runtimeLabel.className = "code-runtime-label";
      runtimeLabel.textContent = "R · webR";
      controls.append(run, stop, reset, restart, showPlots, runtimeLabel);

      const existingOutput = resultPane?.querySelector<HTMLPreElement>(".code-output");
      const output = existingOutput ?? document.createElement("pre");
      output.className = "code-output";
      output.tabIndex = split ? -1 : 0;
      output.setAttribute("aria-live", "polite");
      output.setAttribute("aria-label", "R output");
      output.textContent = "Output will appear here.";

      fallback?.setAttribute("hidden", "");
      placeholder?.setAttribute("hidden", "");
      if(split && resultPane){
        shell.insertBefore(editorHost,fallback??null);
        shell.insertBefore(controls,resultPane);
        resultPane.append(plots);
      }else shell.append(editorHost, controls, output);

      let editor: EditorHandle | undefined;
      let disposed = false;
      let outputRevision = 0;
      let activeRun: number | undefined;
      const resetEditor = (): void => {
        if (disposed || !editor) return;
        outputRevision += 1;
        editor.dispatch({
          changes: { from: 0, to: editor.state.doc.length, insert: initialCode },
        });
        output.textContent = "Output will appear here.";
        if(plotModal.dialog.open)plotModal.dialog.close();
        plots.replaceChildren();showPlots.hidden=true;
        editor.requestMeasure();
      };
      const restartSession = (message: string) => {
        if (disposed) return;
        outputRevision += 1; activeRun = undefined;
        executor.restart();
        run.disabled = false; stop.disabled = true;
        output.textContent = message;
        if (plotModal.dialog.open) plotModal.dialog.close();
        plots.replaceChildren(); showPlots.hidden = true;
      };
      const stopExecution = () => restartSession("Execution stopped. The R session has been cleared.");
      const restartExecution = () => restartSession("R session cleared. Run code to start a fresh session.");
      const execute = async (): Promise<void> => {
        if (disposed || !editor || activeRun !== undefined) return;
        const revision = ++outputRevision; activeRun = revision;
        run.disabled = true; stop.disabled = false;
        output.textContent = "Loading R runtime …";
        if(plotModal.dialog.open)plotModal.dialog.close();
        plots.replaceChildren();showPlots.hidden=true;
        try {
          const result = await executor.execute(editor.state.doc.toString());
          if (!disposed && outputRevision === revision) {
            output.textContent = result.text.length > 0 ? result.text : "(no text output)";
            try {
              for(const [index,image] of result.images.entries()){
                const canvas=document.createElement("canvas");canvas.width=image.width;canvas.height=image.height;
                canvas.setAttribute("role","img");canvas.setAttribute("aria-label",`R plot ${index+1}. Refer to the code and numeric output for the plotted values.`);
                canvas.getContext("2d")?.drawImage(image,0,0);plots.append(canvas);
              }
            } finally { for (const image of result.images) image.close(); }
            showPlots.hidden=result.images.length===0;showPlots.textContent=`${split?'Enlarge plots':'Show plots'} (${result.images.length})`;
          } else for(const image of result.images)image.close();
        } catch (error) {
          if (!disposed && outputRevision === revision) output.textContent = error instanceof RExecutionCancelledError
            ? error.message : `Error: ${error instanceof Error ? error.message : String(error)}`;
        } finally {
          if (!disposed && activeRun === revision) { activeRun = undefined; run.disabled = false; stop.disabled = true; }
        }
      };

      cleanup.push(() => {
        disposed = true; outputRevision += 1;
        shell.removeEventListener("keydown", stopDeckKeyboard);
        glossary?.removeEventListener("keydown",scrollGlossary);
        run.removeEventListener("click", execute);
        reset.removeEventListener("click", resetEditor);
        stop.removeEventListener("click", stopExecution);
        restart.removeEventListener("click", restartExecution);
        showPlots.removeEventListener("click",openPlots);plots.replaceChildren();plots.remove();
        editor?.destroy();
        editorHost.remove();
        controls.remove();
        if(existingOutput){output.textContent="Output will appear here. Local R editor unavailable; the complete source remains readable on the left.";}else output.remove();
        placeholder?.removeAttribute("hidden");
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
      stop.addEventListener("click", stopExecution);
      restart.addEventListener("click", restartExecution);
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
