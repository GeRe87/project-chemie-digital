const CODEMIRROR_VIEW_MODULE_URL = "https://cdn.jsdelivr.net/npm/@codemirror/view@6.43.6/+esm";
const WEBR_MODULE_URL = "https://webr.r-wasm.org/v0.6.0/webr.mjs";
const WEBR_BASE_URL = "https://webr.r-wasm.org/v0.6.0/";

interface EditorHandle {
  readonly state: { readonly doc: { toString(): string } };
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
  close(): void;
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
  return `paste(capture.output(print({\n${code}\n})), collapse="\\n")`;
}

async function importPinned<T>(url: string): Promise<T> {
  return await import(/* @vite-ignore */ url) as T;
}

async function loadCodeMirrorView(): Promise<EditorViewConstructor> {
  const module = await importPinned<CodeMirrorViewModule>(CODEMIRROR_VIEW_MODULE_URL);
  return module.EditorView;
}

function createWebRExecutor(): { execute(code: string): Promise<string>; close(): void } {
  let instancePromise: Promise<WebRInstance> | undefined;
  const instance = (): Promise<WebRInstance> => {
    if (!instancePromise) {
      instancePromise = importPinned<WebRModule>(WEBR_MODULE_URL).then(async ({ WebR, ChannelType }) => {
        const webR = new WebR({ baseUrl: WEBR_BASE_URL, channelType: ChannelType.PostMessage });
        await webR.init();
        return webR;
      });
    }
    return instancePromise;
  };
  return {
    async execute(code: string): Promise<string> {
      const webR = await instance();
      return await webR.evalRString(wrapRForCapturedOutput(code));
    },
    close(): void {
      void instancePromise?.then((webR) => webR.close()).catch(() => undefined);
      instancePromise = undefined;
    },
  };
}

export async function mountExecutableCodeBlocks(root: ParentNode): Promise<CodeRuntimeController> {
  const shells = [...root.querySelectorAll<HTMLElement>('.code-block[data-executable="true"]')];
  if (shells.length === 0) return { refresh: () => undefined, destroy: () => undefined };

  // The connected prototype intentionally loads only @codemirror/view. Importing the
  // aggregate `codemirror` package or independently bundled language/basic-setup
  // extensions through CDN ESM can create multiple @codemirror/state instances and
  // makes CodeMirror reject otherwise valid extensions via instanceof checks.
  const EditorView = await loadCodeMirrorView();
  const executor = createWebRExecutor();
  const editors: EditorHandle[] = [];
  const cleanup: Array<() => void> = [];

  try {
    for (const shell of shells) {
      const fallback = shell.querySelector<HTMLElement>(".code-static-fallback");
      const initialCode = fallback?.textContent ?? "";
      if (initialCode.length === 0) continue;

      const editable = shell.dataset.editable === "true";
      const stopDeckKeyboard = (event: KeyboardEvent): void => event.stopPropagation();
      shell.addEventListener("keydown", stopDeckKeyboard);

      const editorHost = document.createElement("div");
      editorHost.className = "code-editor-host";
      editorHost.setAttribute("aria-label", `Code-Editor (${shell.dataset.language ?? "code"})`);

      const controls = document.createElement("div");
      controls.className = "code-runtime-controls";
      const run = document.createElement("button");
      run.type = "button";
      run.className = "code-run-button";
      run.textContent = "Ausführen";
      const runtimeLabel = document.createElement("span");
      runtimeLabel.className = "code-runtime-label";
      runtimeLabel.textContent = "R im Browser (webR)";
      controls.append(run, runtimeLabel);

      const output = document.createElement("pre");
      output.className = "code-output";
      output.setAttribute("aria-live", "polite");
      output.setAttribute("aria-label", "R-Ausgabe");
      output.textContent = "Noch nicht ausgeführt.";

      fallback?.setAttribute("hidden", "");
      shell.append(editorHost, controls, output);

      let editor: EditorHandle | undefined;
      let disposed = false;
      const execute = async (): Promise<void> => {
        if (disposed || !editor) return;
        run.disabled = true;
        output.textContent = "R-Laufzeit wird geladen …";
        try {
          const result = await executor.execute(editor.state.doc.toString());
          if (!disposed) output.textContent = result.length > 0 ? result : "(keine Ausgabe)";
        } catch (error) {
          if (!disposed) output.textContent = `Fehler: ${error instanceof Error ? error.message : String(error)}`;
        } finally {
          if (!disposed) run.disabled = false;
        }
      };

      cleanup.push(() => {
        disposed = true;
        shell.removeEventListener("keydown", stopDeckKeyboard);
        run.removeEventListener("click", execute);
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
    }
  } catch (error) {
    for (const remove of cleanup.reverse()) remove();
    executor.close();
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
    },
  };
}

export const interactiveRuntimeVersions = Object.freeze({
  codeMirrorView: "6.43.6",
  webR: "0.6.0",
});
