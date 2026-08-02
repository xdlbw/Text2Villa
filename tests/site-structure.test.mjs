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
const floorDataPath = path.join(rootDir, 'static/js/floor-explorer.mjs');
const floorImagesPath = path.join(rootDir, 'static/images/floors');

const read = (filePath) => readFileSync(filePath, 'utf8');

test('project page exposes the expected academic sections', () => {
  assert.equal(existsSync(indexPath), true);
  const html = read(indexPath);

  assert.match(html, /<h1[^>]*>\s*Text2Villa\s*<\/h1>/i);
  for (const id of ['abstract', 'method', 'results', 'comparison', 'applications', 'citation']) {
    assert.match(html, new RegExp(`id=["']${id}["']`));
  }
  assert.match(html, /<main[\s>]/i);
  assert.match(html, /<footer[\s>]/i);
});

test('navigation keeps links to prior research', () => {
  const html = read(indexPath);

  assert.match(html, /href=["']https:\/\/arxiv\.org\/abs\/2504\.11734["'][^>]*>[\s\S]*?Recent Advances in 3D Object and Scene Generation: A Survey[\s\S]*?<\/a>/i);
  assert.match(html, /href=["']https:\/\/arxiv\.org\/abs\/2507\.14841["'][^>]*>[\s\S]*?2026\s*\/\s*CVMJ[\s\S]*?Towards geometric and textural consistency 3D scene generation via single image-guided model generation and layout optimization[\s\S]*?<\/a>/i);
  assert.match(html, /href=["']https:\/\/arxiv\.org\/abs\/2509\.23607["'][^>]*>[\s\S]*?2026\s*\/\s*EG[\s\S]*?ZeroScene: A Zero-Shot Framework for 3D Scene Generation from a Single Image and Controllable Texture Editing[\s\S]*?<\/a>/i);
  assert.match(html, /class=["'][^"']*research-title--single[^"']*["'][^>]*>\s*Recent Advances in 3D Object and Scene Generation: A Survey\s*<\/span>/i);
});

test('previous work popover keeps hover continuity across its visual gap', () => {
  const css = read(cssPath);
  const bridgeRule = css.match(/\.research-menu::after\s*\{([^}]*)\}/i)?.[1] ?? '';

  assert.match(bridgeRule, /content:\s*["']["']/i);
  assert.match(bridgeRule, /top:\s*100%/i);
  assert.match(bridgeRule, /height:\s*12px/i);
  assert.match(css, /\.research-menu:hover\s+\.research-popover/);
});

test('floor explorer uses one villa image and two looping videos controlled by the floor selectors', () => {
  const html = read(indexPath);
  const resultsSection = html.match(/<section[^>]+class=["'][^"']*floor-section[^"']*["'][^>]+id=["']results["'][\s\S]*?<\/section>/i)?.[0] ?? '';

  assert.match(html, /data-floor-explorer/);
  assert.match(html, /role=["']group["'][^>]+aria-label=["']Floor selector["']/i);
  assert.match(resultsSection, /src=["']\.\/static\/images\/figures\/villa\.png["']/i);
  assert.equal((resultsSection.match(/villa\.png/gi) ?? []).length, 1);
  assert.doesNotMatch(resultsSection, /map-floor-[123]\.svg/i);
  assert.match(resultsSection, /aria-controls=["']floor-video tour-video["']/i);
  assert.match(resultsSection, /<video[^>]+id=["']floor-video["'][^>]*\bloop\b[^>]*>/i);
  assert.match(resultsSection, /<video[^>]+id=["']tour-video["'][^>]*\bloop\b[^>]*>/i);
  assert.doesNotMatch(resultsSection, /id=["']floor-poster["']/i);
  assert.doesNotMatch(resultsSection, /\bposter\s*=/i);
  assert.doesNotMatch(resultsSection, /Video preview|data-media-status/i);
  assert.equal(existsSync(floorImagesPath), false);
  assert.match(html, /aria-live=["']polite["']/i);

  const floorData = read(floorDataPath);
  for (const name of ['1.mp4', '2.mp4', '3.mp4', 'm1.mp4', 'm2.mp4', 'm3.mp4']) {
    assert.equal(existsSync(path.join(rootDir, 'static/videos', name)), true);
    assert.equal(floorData.includes(`./static/videos/${name}`), true);
  }
});

test('navigation and section labels distinguish results from comparison', () => {
  const html = read(indexPath);

  assert.match(html, /href=["']#results["'][^>]*>\s*Results\s*<\/a>/i);
  assert.match(html, /href=["']#comparison["'][^>]*>\s*Comparison\s*<\/a>/i);
  assert.match(html, /<section[^>]+id=["']results["'][^>]+aria-labelledby=["']results-title["'][\s\S]*?<p class=["']eyebrow["']>\s*Results\s*<\/p>/i);
  assert.match(html, /<section[^>]+id=["']comparison["'][^>]+aria-labelledby=["']comparison-title["'][\s\S]*?<p class=["']eyebrow dark["']>\s*Comparison\s*<\/p>/i);
  assert.match(html, /role=["']tablist["'][^>]+aria-label=["']Comparison scale["']/i);
});

test('results summary stays on one desktop line without overflowing smaller screens', () => {
  const html = read(indexPath);
  const css = read(cssPath);

  assert.match(html, /<p class=["']results-summary-line["']>\s*A single prompt becomes a connected hierarchy of floor layouts and room-scale scenes\.\s*The media slots are ready for final rotating floor videos\.\s*<\/p>/i);
  assert.match(css, /\.floor-section \.section-heading > \.results-summary-line\s*\{[^}]*max-width:\s*none[^}]*white-space:\s*nowrap/i);
  assert.match(css, /@media\s*\(max-width:\s*1200px\)[\s\S]*?\.floor-section \.section-heading > \.results-summary-line\s*\{[^}]*white-space:\s*normal/i);
});

test('applications include the stylized prompt example', () => {
  const html = read(indexPath);
  const applicationsSection = html.match(/<section[^>]+class=["'][^"']*applications-section[^"']*["'][\s\S]*?<\/section>/i)?.[0] ?? '';

  assert.match(html, /class=["']application-media["']/i);
  assert.match(html, /src=["']\.\/static\/images\/figures\/stylize\.png["']/i);
  assert.match(
    applicationsSection,
    /Generated buildings and furniture remain explicit meshes[\s\S]*?embodied-agent training\.\s*<\/p>\s*<p>\s*Text2Villa also supports stylized text prompts, translating artistic descriptions into explicit, coherent 3D scenes whose architecture, furniture, and materials preserve the requested visual style without sacrificing spatial consistency\.\s*<\/p>/i,
  );
  assert.doesNotMatch(applicationsSection, /<figcaption>/i);
});

test('responsive stylesheet handles mobile and reduced motion', () => {
  assert.equal(existsSync(cssPath), true);
  const css = read(cssPath);

  assert.match(css, /@media\s*\(max-width:\s*996px\)/);
  assert.match(css, /@media\s*\(max-width:\s*640px\)/);
  assert.match(css, /prefers-reduced-motion:\s*reduce/);
});

test('hero preserves the full representative image without cropping', () => {
  const css = read(cssPath);
  const heroRule = css.match(/\.hero\s*\{([^}]*)\}/i)?.[1] ?? '';
  const imageRule = css.match(/\.hero-image\s*\{([^}]*)\}/i)?.[1] ?? '';

  assert.match(heroRule, /min-height:\s*clamp\(600px,\s*42\.3vw,\s*82svh\)/i);
  assert.match(imageRule, /object-fit:\s*contain/i);
  assert.match(imageRule, /object-position:\s*center/i);
});

test('typography sizes are centralized in a compact reusable scale', () => {
  const css = read(cssPath);
  const controls = ['font-size-xs', 'font-size-sm', 'font-size-base', 'font-size-lg', 'font-size-xl', 'font-hero-title-desktop', 'font-section-title-desktop'];

  controls.forEach((name) => {
    assert.match(css, new RegExp(`--${name}:\\s*\\d+px`));
  });
  assert.doesNotMatch(css, /font-size:\s*\d+(?:\.\d+)?px/i);
});

test('hero clears the fixed navigation and visible text groups expose local type controls', () => {
  const html = read(indexPath);
  const css = read(cssPath);
  const heroRule = css.match(/\.hero\s*\{([^}]*)\}/i)?.[1] ?? '';

  assert.match(heroRule, /margin-top:\s*var\(--nav-height\)/i);
  assert.match(html, /<header[^>]*class=["'][^"']*site-header[^"']*["'][^>]*style=["'][^"']*--header-brand-size:[^"']*--header-nav-size:/i);
  assert.match(css, /\.site-brand\s*\{[^}]*font-size:\s*var\(--header-brand-size,/i);
  assert.match(css, /\.nav-link\s*\{[^}]*font-size:\s*var\(--header-nav-size,/i);
  assert.match(css, /\.hero h1\s*\{[^}]*font-size:\s*var\(--hero-title-size,/i);
  assert.match(css, /\.hero-summary\s*\{[^}]*font-size:\s*var\(--hero-summary-size,/i);
  assert.match(css, /\.section-heading h2\s*\{[^}]*font-size:\s*var\(--section-title-size,/i);
  assert.match(css, /\.abstract-copy\s*\{[^}]*font-size:\s*var\(--section-copy-size,/i);
  assert.match(css, /\.method-steps h3\s*\{[^}]*font-size:\s*var\(--step-title-size,/i);
  assert.match(css, /\.panel-header h3\s*\{[^}]*font-size:\s*var\(--panel-title-size,/i);
  assert.match(css, /\.segmented-control button\s*\{[^}]*font-size:\s*var\(--results-tab-size,/i);
  assert.match(css, /\.site-footer span\s*\{[^}]*font-size:\s*var\(--footer-brand-size,/i);

  assert.match(html, /<section[^>]*class=["'][^"']*hero[^"']*["'][^>]*id=["']top["'][^>]*style=["'][^"']*--hero-title-size:/i);
  assert.match(html, /<section[^>]*class=["'][^"']*paper-intro[^"']*["'][^>]*id=["']abstract["'][^>]*style=["'][^"']*--section-title-size:/i);
  assert.match(html, /<section[^>]*class=["'][^"']*method-section[^"']*["'][^>]*id=["']method["'][^>]*style=["'][^"']*--section-title-size:/i);
  assert.match(html, /<section[^>]*class=["'][^"']*floor-section[^"']*["'][^>]*id=["']results["'][^>]*style=["'][^"']*--section-title-size:/i);
  assert.match(html, /<section[^>]*class=["'][^"']*results-section[^"']*["'][^>]*id=["']comparison["'][^>]*style=["'][^"']*--section-title-size:/i);
  assert.match(html, /<section[^>]*class=["'][^"']*applications-section[^"']*["'][^>]*id=["']applications["'][^>]*style=["'][^"']*--section-title-size:/i);
  assert.match(html, /<section[^>]*class=["'][^"']*citation-section[^"']*["'][^>]*id=["']citation["'][^>]*style=["'][^"']*--section-title-size:/i);
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
  assert.match(html, /rel=["']icon["'][^>]+href=["']\.\/static\/images\/figures\/logo\.png["']/);
});

test('result tabs are wired to panels and the keyboard interaction module', () => {
  const html = read(indexPath);
  const script = read(siteScriptPath);

  assert.match(html, /id=["']villa-results-tab["'][^>]+aria-controls=["']villa-results["']/);
  assert.match(html, /id=["']floor-results-tab["'][^>]+aria-controls=["']floor-results["']/);
  assert.match(html, /id=["']room-results-tab["'][^>]+aria-controls=["']room-results["']/);
  assert.match(html, /id=["']villa-results["'][^>]+aria-labelledby=["']villa-results-tab["']/);
  assert.match(html, /id=["']floor-results["'][^>]+aria-labelledby=["']floor-results-tab["']/);
  assert.match(html, /id=["']room-results["'][^>]+aria-labelledby=["']room-results-tab["']/);
  assert.doesNotMatch(html, />\s*Building scale\s*</i);
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
