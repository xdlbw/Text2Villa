import assert from 'node:assert/strict';
import { existsSync } from 'node:fs';
import { fileURLToPath, pathToFileURL } from 'node:url';
import path from 'node:path';
import test from 'node:test';

const testDir = path.dirname(fileURLToPath(import.meta.url));
const modulePath = path.resolve(testDir, '../static/js/floor-explorer.mjs');
const moduleUrl = pathToFileURL(modulePath).href;

test('floor explorer module exists', () => {
  assert.equal(existsSync(modulePath), true);
});

test('floor catalog maps three stories to the supplied floor, trajectory, and tour videos', async () => {
  const { FLOORS } = await import(moduleUrl);

  assert.deepEqual(FLOORS.map((floor) => floor.id), ['1', '2', '3']);
  for (const floor of FLOORS) {
    assert.match(floor.label, /^Floor [123]$/);
    assert.equal('poster' in floor, false);
    assert.equal(floor.video, `./static/videos/${floor.id}.mp4`);
    assert.equal(floor.trajectoryVideo, `./static/videos/c${floor.id}.mp4`);
    assert.equal(floor.tourVideo, `./static/videos/m${floor.id}.mp4`);
    assert.ok(floor.summary.length > 20);
  }
});

test('floor selection resolves valid ids and falls back to the first floor', async () => {
  const { getFloorById } = await import(moduleUrl);

  assert.equal(getFloorById('2').id, '2');
  assert.equal(getFloorById('missing').id, '1');
});

test('floor state marks exactly one selector as pressed', async () => {
  const { createFloorState } = await import(moduleUrl);
  const state = createFloorState('3');

  assert.equal(state.floor.id, '3');
  assert.equal(state.title, 'Floor 3 Preview');
  assert.equal(state.trajectoryTitle, 'Floor 3 Camera Trajectory');
  assert.equal(state.buttons.filter((button) => button.pressed).length, 1);
  assert.equal(state.buttons.find((button) => button.pressed).id, '3');
});
