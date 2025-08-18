// /assets/js/toggleTheme.js
(function () {
  const root = document.documentElement;
  const btn = document.getElementById('theme-toggle');

  const getPreferred = () => {
    const saved = localStorage.getItem('theme');
    if (saved === 'dark' || saved === 'light') return saved;
    return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
  };

  const apply = (mode) => {
    root.classList.toggle('dark-mode', mode === 'dark');
    if (btn) {
      btn.setAttribute('aria-label', mode === 'dark' ? 'Switch to light mode' : 'Switch to dark mode');
      btn.setAttribute('aria-pressed', mode === 'dark' ? 'true' : 'false');
    }
    localStorage.setItem('theme', mode);
  };

  // init on load
  apply(getPreferred());

  // update on OS theme change unless user has toggled manually
  let manual = false;
  const mq = window.matchMedia('(prefers-color-scheme: dark)');
  mq.addEventListener('change', (e) => {
    if (!manual) apply(e.matches ? 'dark' : 'light');
  });

  // toggle on click
  btn && btn.addEventListener('click', () => {
    manual = true;
    const next = root.classList.contains('dark-mode') ? 'light' : 'dark';
    apply(next);
  });
})();
