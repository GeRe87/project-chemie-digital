import assert from "node:assert/strict";
import test, { type TestContext } from "node:test";
import type { BarChartBlock, LineChartBlock } from "../../core/src/scene-document.ts";
import { mountD3BarChart } from "../src/bar-chart.ts";
import { mountD3LineChart } from "../src/line-chart.ts";

class Element {
  children: Element[] = [];
  attributes = new Map<string, string>();
  dataset: Record<string, string> = {};
  style: Record<string, string> = {};
  classes = new Set<string>();
  textContent = "";
  clientWidth = 960;
  clientHeight = 480;
  classList = {
    add: (...names: string[]) => names.forEach(name => this.classes.add(name)),
    toggle: (name: string, enabled: boolean) => enabled ? this.classes.add(name) : this.classes.delete(name),
  };
  set className(value: string) { this.classes = new Set(value.split(/\s+/u)); }
  set innerHTML(_value: string) { this.children = []; }
  setAttribute(name: string, value: string) {
    this.attributes.set(name, value);
    if (name.startsWith("data-")) this.dataset[name.slice(5).replace(/-([a-z])/gu, (_, c: string) => c.toUpperCase())] = value;
  }
  getAttribute(name: string) { return this.attributes.get(name) ?? null; }
  removeAttribute(name: string) { this.attributes.delete(name); }
  append(...children: Element[]) { this.children.push(...children); }
  replaceChildren(...children: Element[]) { this.children = children; }
  querySelectorAll(selector: string): Element[] {
    return this.children.flatMap(child => [
      ...(selector.startsWith(".") && child.classes.has(selector.slice(1))
        || selector.startsWith("[") && child.attributes.has(selector.slice(1, -1)) ? [child] : []),
      ...child.querySelectorAll(selector),
    ]);
  }
  getBoundingClientRect() { return { width: 960 }; }
  addEventListener() {}
  removeEventListener() {}
}

function installDom(t: TestContext) {
  for (const [key, value] of Object.entries({
    HTMLElement: Element,
    document: { createElement: () => new Element(), createElementNS: () => new Element() },
  })) {
    const previous = Object.getOwnPropertyDescriptor(globalThis, key);
    Object.defineProperty(globalThis, key, { configurable: true, value });
    t.after(() => { if (previous) Object.defineProperty(globalThis, key, previous); else Reflect.deleteProperty(globalThis, key); });
  }
}
const source = [{ resourceId: "resource:probe" }];
function bar(values: readonly number[]): BarChartBlock {
  return { id: "chart:bar", kind: "chart", chartType: "bar", presentation: "complete", source,
    label: "Signed values", description: "Signed data", xAxis: { label: "Sample" }, yAxis: { label: "Value" },
    data: values.map((value, index) => ({ id: `datum:${index}`, category: String(index), value, source })) };
}
function line(values: readonly number[]): LineChartBlock {
  return { id: "chart:line", kind: "chart", chartType: "line", presentation: "complete", source,
    label: "Signed values", description: "Signed data", xAxis: { label: "Sample" }, yAxis: { label: "Value" },
    series: [{ id: "series:a", label: "A", source, data: values.map((y, index) => ({ id: `datum:${index}`, x: index, y, source })) }] };
}

for (const values of [[-1, 1], [-3, -1], [0, 0], [1, 3]]) {
  test(`bar and line geometry retains finite in-bounds signed values ${values}`, t => {
    installDom(t);
    const barHost = new Element();
    const bars = mountD3BarChart(barHost, bar(values), { reducedMotion: true });
    assert.ok(!("diagnostics" in bars));
    const rects = barHost.querySelectorAll(".d3-chart-bar");
    assert.equal(rects.length, values.length);
    rects.forEach((rect, index) => {
      const y = Number(rect.getAttribute("y"));
      const height = Number(rect.getAttribute("height"));
      assert.ok(Number.isFinite(y) && y >= 58 && y + height <= 388);
      assert.equal(height > 0, values[index] !== 0);
      assert.equal(rect.style.transformOrigin, values[index]! < 0 ? "center top" : "center bottom");
    });
    const lineHost = new Element();
    const lines = mountD3LineChart(lineHost, line(values), { reducedMotion: true });
    assert.ok(!("diagnostics" in lines));
    for (const point of lineHost.querySelectorAll(".d3-chart-line-point")) {
      const y = Number(point.getAttribute("cy"));
      assert.ok(Number.isFinite(y) && y >= 54 && y <= 418);
    }
    bars.destroy(); lines.destroy();
  });
}

test("live updates retain SVG nodes and current disclosure while updating fallback values", t => {
  installDom(t);
  const barHost = new Element();
  const bars = mountD3BarChart(barHost, { ...bar([-1, 1]), presentation: "progressive" }, { reducedMotion: true, yDomain: [-3, 3] });
  assert.ok(!("diagnostics" in bars));
  bars.setStep(2);
  const rect = barHost.querySelectorAll(".d3-chart-bar")[0]!;
  const oldY = rect.getAttribute("y");
  bars.updateValues([2, -2]);
  assert.equal(barHost.querySelectorAll(".d3-chart-bar")[0], rect);
  assert.notEqual(rect.getAttribute("y"), oldY);
  assert.equal(rect.style.transform, "scaleY(1)");
  assert.match(bars.staticFallback, /0: 2/);
  assert.throws(() => bars.updateValues([NaN, 1]), /finite/);

  const lineHost = new Element();
  const lines = mountD3LineChart(lineHost, { ...line([-1, 1]), yDomain: [-5, 5] }, { reducedMotion: true, yDomain: [0, 1] });
  assert.ok(!("diagnostics" in lines));
  const path = lineHost.querySelectorAll(".d3-chart-line")[0]!;
  const oldPath = path.getAttribute("d");
  const point = lineHost.querySelectorAll(".d3-chart-line-point")[0]!;
  const oldPointY = Number(point.getAttribute("cy"));
  lines.updateValues([1, -1]);
  assert.equal(lineHost.querySelectorAll(".d3-chart-line")[0], path);
  assert.equal(lineHost.querySelectorAll(".d3-chart-line-point")[0], point);
  assert.notEqual(path.getAttribute("d"), oldPath);
  assert.ok(Number(point.getAttribute("cy")) < oldPointY);
  assert.match(lines.staticFallback, /x=0, y=1/);
  bars.destroy(); lines.destroy();
});
