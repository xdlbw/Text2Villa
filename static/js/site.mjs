import { createFloorState } from './floor-explorer.mjs';
import { initResultTabs } from './result-tabs.mjs';

const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');

function setExpanded(button, expanded) {
  button.setAttribute('aria-expanded', String(expanded));
}

function setNavigationToggleState(button, expanded) {
  setExpanded(button, expanded);
  const label = expanded ? 'Close navigation' : 'Open navigation';
  button.setAttribute('aria-label', label);
  button.title = label;
}

function initNavigation() {
  const toggle = document.querySelector('[data-nav-toggle]');
  const menu = document.querySelector('[data-nav-menu]');
  const researchToggle = document.querySelector('[data-research-toggle]');
  const researchMenu = document.querySelector('[data-research-menu]');

  if (toggle && menu) {
    toggle.addEventListener('click', () => {
      const isOpen = menu.classList.toggle('is-open');
      setNavigationToggleState(toggle, isOpen);
    });

    menu.querySelectorAll('a[href^="#"]').forEach((link) => {
      link.addEventListener('click', () => {
        menu.classList.remove('is-open');
        setNavigationToggleState(toggle, false);
      });
    });
  }

  if (researchToggle && researchMenu) {
    researchToggle.addEventListener('click', () => {
      const isOpen = researchMenu.classList.toggle('is-open');
      setExpanded(researchToggle, isOpen);
    });

    document.addEventListener('click', (event) => {
      if (!researchMenu.contains(event.target) && event.target !== researchToggle) {
        researchMenu.classList.remove('is-open');
        setExpanded(researchToggle, false);
      }
    });
  }
}

function showPoster(video, poster, status) {
  video.hidden = true;
  video.removeAttribute('src');
  poster.hidden = false;
  status.textContent = 'Poster preview';
  status.dataset.mode = 'poster';
}

async function loadFloorVideo(floor, video, poster, status, requestId, latestRequest) {
  showPoster(video, poster, status);
  if (!floor.videoReady) return;

  try {
    const response = await fetch(floor.video, { method: 'HEAD', cache: 'no-store' });
    if (!response.ok || requestId !== latestRequest()) return;

    video.src = floor.video;
    video.poster = floor.poster;
    video.hidden = false;
    poster.hidden = true;
    status.textContent = 'Video preview';
    status.dataset.mode = 'video';
    video.load();

    if (!reducedMotion.matches) {
      await video.play().catch(() => undefined);
    }
  } catch {
    if (requestId === latestRequest()) showPoster(video, poster, status);
  }
}

export function initFloorExplorer(root) {
  if (!root) return;

  const buttons = Array.from(root.querySelectorAll('[data-floor-id]'));
  const title = root.querySelector('[data-floor-title]');
  const rooms = root.querySelector('[data-floor-rooms]');
  const summary = root.querySelector('[data-floor-summary]');
  const video = root.querySelector('#floor-video');
  const poster = root.querySelector('#floor-poster');
  const status = root.querySelector('[data-media-status]');
  const mapItems = Array.from(root.querySelectorAll('[data-floor-map]'));
  let requestId = 0;

  const render = (id) => {
    const state = createFloorState(id);
    requestId += 1;

    title.textContent = state.title;
    rooms.textContent = state.floor.rooms;
    summary.textContent = state.floor.summary;
    poster.src = state.floor.poster;
    poster.alt = `${state.floor.label} generated interior preview`;

    buttons.forEach((button) => {
      const active = button.dataset.floorId === state.floor.id;
      button.setAttribute('aria-pressed', String(active));
      button.classList.toggle('is-active', active);
    });

    mapItems.forEach((item) => {
      item.classList.toggle('is-active', item.dataset.floorMap === state.floor.id);
    });

    loadFloorVideo(
      state.floor,
      video,
      poster,
      status,
      requestId,
      () => requestId,
    );
  };

  buttons.forEach((button) => {
    button.addEventListener('click', () => render(button.dataset.floorId));
  });

  render(buttons.find((button) => button.getAttribute('aria-pressed') === 'true')?.dataset.floorId ?? '1');
}


function initLightbox() {
  const dialog = document.querySelector('#figure-dialog');
  const image = dialog?.querySelector('img');
  const caption = dialog?.querySelector('[data-dialog-caption]');

  if (!dialog || !image || !caption) return;

  document.querySelectorAll('[data-lightbox]').forEach((trigger) => {
    trigger.addEventListener('click', () => {
      const source = trigger.querySelector('img');
      image.src = source.currentSrc || source.src;
      image.alt = source.alt;
      caption.textContent = trigger.dataset.caption ?? source.alt;
      dialog.showModal();
    });
  });

  dialog.querySelector('[data-dialog-close]').addEventListener('click', () => dialog.close());
  dialog.addEventListener('click', (event) => {
    if (event.target === dialog) dialog.close();
  });
}

document.addEventListener('DOMContentLoaded', () => {
  initNavigation();
  initFloorExplorer(document.querySelector('[data-floor-explorer]'));
  initResultTabs(document);
  initLightbox();
  window.lucide?.createIcons();
});
