import assert from "node:assert/strict";
import test from "node:test";
import { createWebRExecutor, RExecutionCancelledError, type WebRInstance, type WebRModule } from "../src/code-runtime.ts";

function deferred<T>() {
  let resolve!: (value: T) => void;
  const promise = new Promise<T>(done => { resolve = done; });
  return { promise, resolve };
}
const flush = () => new Promise<void>(resolve => setImmediate(resolve));
type Capture = Awaited<ReturnType<Awaited<InstanceType<WebRInstance["Shelter"]>>["captureR"]>>;
function capture(text: string, images: ImageBitmap[] = []): Capture {
  return { result: { toArray: async () => [text] }, output: [], images };
}
function fixture(waitForInit = false) {
  const instances: FakeWebR[] = [];
  class FakeWebR implements WebRInstance {
    readonly initialized = deferred<unknown>();
    readonly captures: Array<{ code: string; pending: ReturnType<typeof deferred<Capture>> }> = [];
    closed = 0; configured = 0; purged = 0;
    constructor() { instances.push(this); if (!waitForInit) this.initialized.resolve(undefined); }
    init = () => this.initialized.promise;
    evalRString = async () => { this.configured++; return "ready"; };
    close = () => { this.closed++; };
    Shelter = (() => {
      const instance = this;
      return class {
        async captureR(code: string) {
          const pending = deferred<Capture>(); instance.captures.push({ code, pending }); return pending.promise;
        }
        async purge() { instance.purged++; }
      };
    })();
  }
  const module: WebRModule = { WebR: FakeWebR, ChannelType: { PostMessage: 1 } };
  const executor = createWebRExecutor({ loadModule: async () => module, baseUrl: "/vendor/test/" });
  return { instances, executor };
}

test("Stop terminates a hung R worker, cancels queued jobs, and allows a clean new session", async () => {
  const { instances, executor } = fixture();
  const first = executor.execute("repeat {}");
  const second = executor.execute("queued()");
  const rejected = [assert.rejects(first, RExecutionCancelledError), assert.rejects(second, RExecutionCancelledError)];
  await flush();
  assert.equal(instances.length, 1); assert.equal(instances[0]!.captures.length, 1);
  executor.restart();
  await Promise.all(rejected);
  assert.equal(instances[0]!.closed, 1);
  const next = executor.execute("clean()");
  await flush();
  assert.equal(instances.length, 2); assert.equal(instances[1]!.captures.length, 1);
  instances[1]!.captures[0]!.pending.resolve(capture("clean session"));
  assert.equal((await next).text, "clean session");
  let released = 0;
  instances[0]!.captures[0]!.pending.resolve(capture("stale result", [{ close() { released++; } } as ImageBitmap]));
  await flush();
  assert.equal(released, 1, "late graphics from a terminated worker must be released");
  assert.equal(instances[0]!.captures.length, 1, "queued work from the old session must never execute");
  executor.close(); executor.close();
  assert.equal(instances[1]!.closed, 1);
  await assert.rejects(executor.execute("after disposal"), /disposed/);
});

test("Stop also cancels initialization without configuring or publishing the retired session", async () => {
  const { instances, executor } = fixture(true);
  const first = executor.execute("before init");
  const rejected = assert.rejects(first, RExecutionCancelledError);
  await flush();
  executor.restart(); await rejected;
  assert.equal(instances[0]!.closed, 1);
  instances[0]!.initialized.resolve(undefined); await flush();
  assert.equal(instances[0]!.configured, 0); assert.equal(instances[0]!.captures.length, 0);
  const next = executor.execute("after init"); await flush();
  instances[1]!.initialized.resolve(undefined); await flush();
  instances[1]!.captures[0]!.pending.resolve(capture("ok"));
  assert.equal((await next).text, "ok"); executor.close();
});

test("jobs sharing a live R session remain serialized until explicitly restarted", async () => {
  const { instances, executor } = fixture();
  const first = executor.execute("a <- 2"); const second = executor.execute("a + 1");
  await flush(); assert.equal(instances[0]!.captures.length, 1);
  instances[0]!.captures[0]!.pending.resolve(capture("2")); await first; await flush();
  assert.equal(instances.length, 1); assert.equal(instances[0]!.captures.length, 2);
  instances[0]!.captures[1]!.pending.resolve(capture("3"));
  assert.equal((await second).text, "3"); assert.equal(instances[0]!.purged, 2); executor.close();
});
