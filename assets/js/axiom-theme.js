(function () {
  var STORAGE_KEY = 'axiom-theme';

  function preferred() {
    var stored = localStorage.getItem(STORAGE_KEY);
    if (stored === 'dark' || stored === 'light') return stored;
    return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
  }

  function apply(theme) {
    document.documentElement.classList.toggle('dark', theme === 'dark');
    localStorage.setItem(STORAGE_KEY, theme);
    syncToggles(theme);
  }

  function syncToggles(theme) {
    var isDark = theme === 'dark';
    document.querySelectorAll('button.ThemeToggle-module__gv9_OW__toggle').forEach(function (btn) {
      btn.style.opacity = '1';
      btn.style.cursor = 'pointer';
      btn.setAttribute('aria-pressed', isDark ? 'true' : 'false');
      btn.setAttribute('title', isDark ? 'Switch to light mode' : 'Switch to dark mode');
      if (!btn.dataset.axiomThemeBound) {
        btn.dataset.axiomThemeBound = '1';
        btn.addEventListener('click', function (e) {
          e.preventDefault();
          e.stopPropagation();
          apply(document.documentElement.classList.contains('dark') ? 'light' : 'dark');
        });
      }
    });
  }

  apply(preferred());

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', function () {
      syncToggles(preferred());
    });
  } else {
    syncToggles(preferred());
  }
})();
