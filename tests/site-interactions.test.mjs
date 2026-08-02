import assert from 'node:assert/strict';
import { fileURLToPath, pathToFileURL } from 'node:url';
import path from 'node:path';
import test from 'node:test';

const testDir = path.dirname(fileURLToPath(import.meta.url));
const moduleUrl = pathToFileURL(path.resolve(testDir, '../static/js/site.mjs')).href;

function createClassList() {
  const values = new Set();
  return {
    toggle(name, active) {
      if (active) values.add(name);
      else values.delete(name);
    },
  };
}

function createButton(id, pressed = false) {
  const listeners = new Map();
  const attributes = new Map([['aria-pressed', String(pressed)]]);
  return {
    dataset: { floorId: id },
    classList: createClassList(),
    addEventListener(type, listener) { listeners.set(type, listener); },
    setAttribute(name, value) { attributes.set(name, value); },
    getAttribute(name) { return attributes.get(name); },
    click() { listeners.get('click')?.(); },
  };
}

test('floor controls hide both videos until the selected floor first frames are ready', async () => {
  const originalWindow = globalThis.window;
  const originalDocument = globalThis.document;
  globalThis.window = { matchMedia: () => ({ matches: true }) };
  globalThis.document = { addEventListener() {} };

  try {
    const { initFloorExplorer } = await import(`${moduleUrl}?optional-metadata`);
    const buttons = [createButton('3'), createButton('2'), createButton('1', true)];
    const title = { textContent: '' };
    const createVideo = () => {
      const listeners = new Map();
      return {
        hidden: false,
        src: '',
        loadCalls: 0,
        pauseCalls: 0,
        playCalls: 0,
        addEventListener(type, listener, options = {}) {
          listeners.set(type, { listener, once: Boolean(options.once) });
        },
        dispatch(type) {
          const entry = listeners.get(type);
          if (!entry) return;
          entry.listener();
          if (entry.once) listeners.delete(type);
        },
        load() { this.loadCalls += 1; },
        pause() { this.pauseCalls += 1; },
        play() {
          this.playCalls += 1;
          return Promise.resolve();
        },
      };
    };
    const video = createVideo();
    const tourVideo = createVideo();
    const maps = buttons.map((button) => ({
      dataset: { floorMap: button.dataset.floorId },
      classList: createClassList(),
    }));
    const nodes = new Map([
      ['[data-floor-title]', title],
      ['#floor-video', video],
      ['#tour-video', tourVideo],
    ]);
    const root = {
      querySelectorAll(selector) {
        if (selector === '[data-floor-id]') return buttons;
        if (selector === '[data-floor-map]') return maps;
        return [];
      },
      querySelector(selector) { return nodes.get(selector) ?? null; },
    };

    assert.doesNotThrow(() => initFloorExplorer(root));
    assert.equal(title.textContent, 'Floor 1 Preview');
    assert.match(video.src, /\/1\.mp4$/);
    assert.match(tourVideo.src, /\/m1\.mp4$/);
    assert.equal(video.hidden, true);
    assert.equal(tourVideo.hidden, true);
    video.dispatch('loadeddata');
    tourVideo.dispatch('loadeddata');
    assert.equal(video.hidden, false);
    assert.equal(tourVideo.hidden, false);

    buttons[1].click();
    assert.equal(title.textContent, 'Floor 2 Preview');
    assert.match(video.src, /\/2\.mp4$/);
    assert.match(tourVideo.src, /\/m2\.mp4$/);
    assert.equal(video.hidden, true);
    assert.equal(tourVideo.hidden, true);
    assert.equal(video.loadCalls, 2);
    assert.equal(tourVideo.loadCalls, 2);
    assert.equal(video.pauseCalls, 2);
    assert.equal(tourVideo.pauseCalls, 2);
    assert.equal(video.playCalls, 1);
    assert.equal(tourVideo.playCalls, 1);
    video.dispatch('loadeddata');
    tourVideo.dispatch('loadeddata');
    assert.equal(video.hidden, false);
    assert.equal(tourVideo.hidden, false);
    assert.equal(video.playCalls, 1);
    assert.equal(tourVideo.playCalls, 1);
  } finally {
    globalThis.window = originalWindow;
    globalThis.document = originalDocument;
  }
});
