import assert from 'node:assert/strict';
import { existsSync } from 'node:fs';
import { fileURLToPath, pathToFileURL } from 'node:url';
import path from 'node:path';
import test from 'node:test';

const testDir = path.dirname(fileURLToPath(import.meta.url));
const modulePath = path.resolve(testDir, '../static/js/result-tabs.mjs');
const moduleUrl = pathToFileURL(modulePath).href;

function createTab(target, selected) {
  const listeners = new Map();
  const attributes = new Map([['aria-selected', String(selected)]]);

  return {
    dataset: { resultTab: target },
    tabIndex: selected ? 0 : -1,
    focused: false,
    addEventListener(type, listener) {
      listeners.set(type, listener);
    },
    setAttribute(name, value) {
      attributes.set(name, value);
    },
    getAttribute(name) {
      return attributes.get(name);
    },
    focus() {
      this.focused = true;
    },
    dispatch(type, event = {}) {
      listeners.get(type)?.(event);
    },
  };
}

test('result tab interaction module exists', () => {
  assert.equal(existsSync(modulePath), true);
});

test('result tabs support click and standard horizontal keyboard navigation', async (t) => {
  if (!existsSync(modulePath)) {
    t.skip('result tab interaction module is not implemented yet');
    return;
  }

  const { initResultTabs } = await import(moduleUrl);
  const tabs = [createTab('villa', true), createTab('floor', false), createTab('room', false)];
  const panels = [
    { dataset: { resultPanel: 'villa' }, hidden: false },
    { dataset: { resultPanel: 'floor' }, hidden: true },
    { dataset: { resultPanel: 'room' }, hidden: true },
  ];
  const root = {
    querySelectorAll(selector) {
      return selector === '[data-result-tab]' ? tabs : panels;
    },
  };

  initResultTabs(root);

  let prevented = false;
  tabs[0].dispatch('keydown', {
    key: 'ArrowRight',
    preventDefault() { prevented = true; },
  });
  assert.equal(prevented, true);
  assert.equal(tabs[1].getAttribute('aria-selected'), 'true');
  assert.equal(tabs[1].tabIndex, 0);
  assert.equal(tabs[1].focused, true);
  assert.equal(panels[0].hidden, true);
  assert.equal(panels[1].hidden, false);
  assert.equal(panels[2].hidden, true);

  tabs[1].dispatch('keydown', { key: 'ArrowRight', preventDefault() {} });
  assert.equal(tabs[2].getAttribute('aria-selected'), 'true');

  tabs[2].dispatch('keydown', { key: 'ArrowRight', preventDefault() {} });
  assert.equal(tabs[0].getAttribute('aria-selected'), 'true');

  tabs[0].dispatch('keydown', { key: 'End', preventDefault() {} });
  assert.equal(tabs[2].getAttribute('aria-selected'), 'true');

  tabs[2].dispatch('keydown', { key: 'Home', preventDefault() {} });
  assert.equal(tabs[0].getAttribute('aria-selected'), 'true');

  tabs[2].dispatch('click');
  assert.equal(tabs[2].getAttribute('aria-selected'), 'true');
  assert.equal(panels[2].hidden, false);
});
