/** Presentation-only views of existing semantic regions. Never duplicate or
 * replace the formula/legend renderer, experiment state or authored scenes. */
export function mountSceneViewTabs(root: HTMLElement, layout: () => void = () => {}): () => void {
  const cleanups: Array<() => void> = [];
  for (const slide of root.querySelectorAll<HTMLElement>('section[data-composition]')) {
    if (slide.dataset.sceneViewTabs === 'true') continue;
    const originalMarker = slide.getAttribute('data-scene-view-tabs');
    const primary = slide.querySelector<HTMLElement>(':scope > [data-composition-region-container="primary"]');
    const secondary = slide.querySelector<HTMLElement>(':scope > [data-composition-region-container="secondary"]');
    const tables = Array.from(slide.querySelectorAll<HTMLTableElement>(':scope > table.data-table'));
    const captions = tables.map(table => table.caption?.textContent?.trim() ?? '');
    const tableHeaders = (table: HTMLTableElement) =>
      Array.from(table.querySelectorAll('thead th')).map(cell => cell.textContent?.trim()).join('\u001f');
    const authoringLecture = document.body.dataset.authoringFrame === 'lecture';
    const compatibleTables = authoringLecture
      && tables.length > 1 && captions.every(Boolean) && new Set(captions).size === captions.length
      && tableHeaders(tables[0]!) && tables.every(table => tableHeaders(table) === tableHeaders(tables[0]!));
    const profile = slide.dataset.compositionProfile;
    const hasFormula = (profile === 'visual-formula' || authoringLecture && profile === 'worked-calculation')
      && primary?.querySelector(authoringLecture
        ? '[data-chart-block-id],[data-diagram-type="flow"],.media-reference,.data-table'
        : '[data-chart-block-id],[data-diagram-type="flow"],.media-reference[data-media-type^="image/"]')
      && secondary?.querySelector('.formula-with-legend');
    if (!hasFormula && !compatibleTables) continue;
    // Keep each native table's semantics inside the accessible tab panel.
    const panels: HTMLElement[] = compatibleTables ? tables.map(table => {
      const panel = document.createElement('div');
      panel.className = 'pcd-comparable-table-panel';
      table.before(panel);
      panel.append(table);
      return panel;
    }) : [primary!, secondary!];
    const labels = compatibleTables ? captions.map(caption => caption.split(' · ')[0]!)
      : [primary!.querySelector('.data-table') ? 'Table' : 'Diagram', 'Formula & symbols'];
    const attributes = ['id', 'role', 'aria-labelledby', 'tabindex', 'data-scene-view-active'];
    const originalAttributes = panels.map(panel => attributes.map(name => panel.getAttribute(name)));
    const ribbon = document.createElement('div');
    ribbon.className = 'pcd-scene-view-tabs';
    ribbon.setAttribute('role', 'tablist');
    ribbon.setAttribute('aria-label', 'Slide views');
    ribbon.dataset.presentationInteractive = 'true';
    const tabs = labels.map((label, index) => {
      const tab = document.createElement('button');
      tab.type = 'button';
      tab.textContent = label;
      tab.id = `${slide.id}-view-tab-${index}`;
      tab.setAttribute('role', 'tab');
      tab.setAttribute('aria-keyshortcuts', 'Alt+ArrowDown Alt+ArrowUp');
      tab.title = `${label} (Alt+↑ / Alt+↓)`;
      const panel = panels[index]!;
      panel.id ||= `${slide.id}-view-panel-${index}`;
      tab.setAttribute('aria-controls', panel.id);
      panel.setAttribute('role', 'tabpanel');
      panel.setAttribute('aria-labelledby', tab.id);
      panel.tabIndex = 0;
      ribbon.append(tab);
      return tab;
    });
    const hint = document.createElement('span');
    hint.className = 'pcd-scene-view-tabs-hint';
    hint.textContent = 'Alt+↑ / Alt+↓';
    hint.setAttribute('aria-hidden', 'true');
    ribbon.append(hint);
    let selected = 0;
    const select = (index: number, focus = false, notify = true) => {
      selected = (index + tabs.length) % tabs.length;
      if (tabs[selected]!.disabled) selected = 0;
      tabs.forEach((tab, i) => {
        tab.setAttribute('aria-selected', String(i === selected));
        tab.tabIndex = i === selected ? 0 : -1;
        panels[i]!.dataset.sceneViewActive = String(i === selected);
      });
      if (focus) tabs[selected]!.focus();
      if (notify) layout();
    };
    const click = (event: MouseEvent) => {
      const index = tabs.indexOf(event.target as HTMLButtonElement);
      if (index >= 0) select(index, true);
    };
    const keyboard = (event: KeyboardEvent) => {
      if (document.body.dataset.presentationMode === 'script') return;
      const owner = event.target instanceof Element ? event.target.closest('section') : null;
      const bounds = owner?.getBoundingClientRect();
      const ownerVisible = bounds && bounds.bottom > 0 && bounds.top < window.innerHeight;
      if (ownerVisible ? owner !== slide : !slide.classList.contains('present')) return;
      if (event.ctrlKey || event.metaKey || event.shiftKey || event.target instanceof Element && event.target.closest('input,textarea,select,[contenteditable="true"],.cm-editor')) return;
      const onRibbon = event.target instanceof Element && !!event.target.closest('.pcd-scene-view-tabs');
      const next = event.altKey && event.key === 'ArrowDown' || !event.altKey && onRibbon && event.key === 'ArrowRight';
      const previous = event.altKey && event.key === 'ArrowUp' || !event.altKey && onRibbon && event.key === 'ArrowLeft';
      if (!next && !previous && !(onRibbon && ['Home', 'End'].includes(event.key))) return;
      event.preventDefault();
      event.stopImmediatePropagation();
      select(event.key === 'Home' ? 0 : event.key === 'End' ? tabs.length - 1 : selected + (previous ? -1 : 1), true);
    };
    ribbon.addEventListener('click', click);
    window.addEventListener('keydown', keyboard, true);
    slide.dataset.sceneViewTabs = 'true';
    slide.insertBefore(ribbon, panels[0]!);
    select(0, false, false);
    const formulaAvailability = !compatibleTables && secondary?.querySelector('[data-presentation-disclosure-mode="progressive"]')
      ? new MutationObserver(updateFormulaAvailability)
      : undefined;
    function updateFormulaAvailability() {
      const formulaReady = [...secondary!.querySelectorAll('.math-display,.mathematical-derivation')]
        .some(formula => !formula.closest('[data-presentation-disclosure-visible="false"]'));
      tabs[1]!.disabled = !formulaReady;
      if (!formulaReady && selected === 1) select(0, true);
    }
    if (formulaAvailability && secondary) {
      formulaAvailability.observe(secondary, { subtree: true, attributes: true, attributeFilter: ['data-presentation-disclosure-visible'] });
      updateFormulaAvailability();
    }
    cleanups.push(() => {
      formulaAvailability?.disconnect();
      ribbon.removeEventListener('click', click);
      window.removeEventListener('keydown', keyboard, true);
      ribbon.remove();
      if (originalMarker === null) delete slide.dataset.sceneViewTabs;
      else slide.setAttribute('data-scene-view-tabs', originalMarker);
      panels.forEach((panel, index) => {
        attributes.forEach((name, attributeIndex) => {
          const value = originalAttributes[index]![attributeIndex];
          if (value === null) panel.removeAttribute(name);
          else panel.setAttribute(name, value!);
        });
        if (compatibleTables) panel.replaceWith(tables[index]!);
      });
    });
  }
  // Prefer the slide containing focus; otherwise the current Reveal slide.
  let destroyed = false;
  return () => { if (!destroyed) { destroyed = true; cleanups.reverse().forEach(cleanup => cleanup()); } };
}
