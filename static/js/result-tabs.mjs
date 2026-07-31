export function initResultTabs(root) {
  if (!root) return;

  const tabs = Array.from(root.querySelectorAll('[data-result-tab]'));
  const panels = Array.from(root.querySelectorAll('[data-result-panel]'));
  if (tabs.length === 0) return;

  const activate = (tab, moveFocus = false) => {
    const target = tab.dataset.resultTab;

    tabs.forEach((item) => {
      const active = item === tab;
      item.setAttribute('aria-selected', String(active));
      item.tabIndex = active ? 0 : -1;
    });
    panels.forEach((panel) => {
      panel.hidden = panel.dataset.resultPanel !== target;
    });

    if (moveFocus) tab.focus();
  };

  tabs.forEach((tab, index) => {
    tab.addEventListener('click', () => activate(tab));
    tab.addEventListener('keydown', (event) => {
      let targetIndex;

      switch (event.key) {
        case 'ArrowRight':
          targetIndex = (index + 1) % tabs.length;
          break;
        case 'ArrowLeft':
          targetIndex = (index - 1 + tabs.length) % tabs.length;
          break;
        case 'Home':
          targetIndex = 0;
          break;
        case 'End':
          targetIndex = tabs.length - 1;
          break;
        default:
          return;
      }

      event.preventDefault();
      activate(tabs[targetIndex], true);
    });
  });
}
