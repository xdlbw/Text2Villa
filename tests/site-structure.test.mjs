import assert from 'node:assert/strict';
import { existsSync, readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import path from 'node:path';
import test from 'node:test';

const testDir = path.dirname(fileURLToPath(import.meta.url));
const rootDir = path.resolve(testDir, '..');
const indexPath = path.join(rootDir, 'index.html');
const cssPath = path.join(rootDir, 'static/css/site.css');
const siteScriptPath = path.join(rootDir, 'static/js/site.mjs');

const read = (filePath) => readFileSync(filePath, 'utf8');

test('project page exposes the expected academic sections', () => {
  assert.equal(existsSync(indexPath), true);
  const html = read(indexPath);

  assert.match(html, /<h1[^>]*>\s*Text2Villa\s*<\/h1>/i);
  for (const id of ['abstract', 'method', 'floor-demo', 'results', 'applications', 'citation']) {
    assert.match(html, new RegExp(`id=["']${id}["']`));
  }
  assert.match(html, /<main[\s>]/i);
  assert.match(html, /<footer[\s>]/i);
});

test('navigation keeps links to prior research', () => {
  const html = read(indexPath);

  assert.match(html, /Recent Advances in 3D Object and Scene Generation/i);
  assert.match(html, /xdlbw\.github\.io\/sing3d/i);
  assert.match(html, /xdlbw\.github\.io\/ZeroScene/i);
});

test('floor explorer provides accessible selectors and media fallback', () => {
  const html = read(indexPath);

  assert.match(html, /data-floor-explorer/);
  assert.match(html, /role=["']group["'][^>]+aria-label=["']Floor selector["']/i);
  assert.match(html, /id=["']floor-video["']/i);
  assert.match(html, /id=["']floor-poster["']/i);
  assert.match(html, /aria-live=["']polite["']/i);
});

test('responsive stylesheet handles mobile and reduced motion', () => {
  assert.equal(existsSync(cssPath), true);
  const css = read(cssPath);

  assert.match(css, /@media\s*\(max-width:\s*996px\)/);
  assert.match(css, /@media\s*\(max-width:\s*640px\)/);
  assert.match(css, /prefers-reduced-motion:\s*reduce/);
});

test('site initializer connects the floor explorer module', () => {
  assert.equal(existsSync(siteScriptPath), true);
  const script = read(siteScriptPath);

  assert.match(read(indexPath), /src=["']\.\/static\/js\/site\.mjs["']/);
  assert.match(script, /from\s+["']\.\/floor-explorer\.mjs["']/);
  assert.match(script, /initFloorExplorer/);
  assert.match(script, /video\.load\(\)/);
});

test('paper actions include the official arXiv link', () => {
  const html = read(indexPath);
  assert.match(html, /href=["']https:\/\/arxiv\.org\/abs\/2607\.17145["']/);
});

test('project page omits the failure case section', () => {
  const html = read(indexPath);
  assert.doesNotMatch(html, /failure-section|Failure case|failure\.webp/i);
});

test('project page declares a local favicon', () => {
  const html = read(indexPath);
  assert.match(html, /rel=["']icon["'][^>]+href=["']\.\/static\/images\/hero\/representative\.webp["']/);
});

test('result tabs are wired to panels and the keyboard interaction module', () => {
  const html = read(indexPath);
  const script = read(siteScriptPath);

  assert.match(html, /id=["']building-results-tab["'][^>]+aria-controls=["']building-results["']/);
  assert.match(html, /id=["']room-results-tab["'][^>]+aria-controls=["']room-results["']/);
  assert.match(html, /id=["']building-results["'][^>]+aria-labelledby=["']building-results-tab["']/);
  assert.match(html, /id=["']room-results["'][^>]+aria-labelledby=["']room-results-tab["']/);
  assert.match(script, /from\s+["']\.\/result-tabs\.mjs["']/);
  assert.match(script, /initResultTabs\(document\)/);
});

test('icon controls use a local Lucide bundle', () => {
  const html = read(indexPath);
  const lucidePath = path.join(rootDir, 'static/vendor/lucide.min.js');

  assert.equal(existsSync(lucidePath), true);
  assert.match(html, /src=["']\.\/static\/vendor\/lucide\.min\.js["']/);
  assert.doesNotMatch(html, /unpkg\.com\/lucide/i);
});

test('focus indicators use a contrasting two-color ring', () => {
  const css = read(cssPath);
  const focusRule = css.match(/:focus-visible\s*\{([^}]*)\}/i)?.[1] ?? '';

  assert.match(focusRule, /outline:\s*3px\s+solid\s+#fff(?:fff)?/i);
  assert.match(focusRule, /box-shadow:\s*0\s+0\s+0\s+5px\s+#16181d/i);
});

test('navigation labels and dialog markup have robust fallbacks', () => {
  const html = read(indexPath);
  const script = read(siteScriptPath);

  assert.match(script, /Close navigation/);
  assert.doesNotMatch(html, /<img\s+src=["']["']\s+alt=["']["']\s*\/>/i);
});
