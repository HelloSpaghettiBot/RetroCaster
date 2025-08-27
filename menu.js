document.addEventListener('DOMContentLoaded', () => {
  const btn      = document.getElementById('menuBtn');
  const drawer   = document.getElementById('mobileDrawer');
  const closeBtn = document.getElementById('drawerClose');
  const backdrop = document.getElementById('drawerBackdrop');

  const firstLink = () => drawer?.querySelector('.drawer-links a');

  function openDrawer() {
    drawer.classList.add('open');
    drawer.setAttribute('aria-hidden', 'false');
    btn.setAttribute('aria-expanded', 'true');
    backdrop.hidden = false;
    backdrop.classList.add('open');
    document.body.style.overflow = 'hidden';  // lock scroll
    setTimeout(() => firstLink()?.focus(), 0);
  }

  function closeDrawer() {
    drawer.classList.remove('open');
    drawer.setAttribute('aria-hidden', 'true');
    btn.setAttribute('aria-expanded', 'false');
    backdrop.classList.remove('open');
    setTimeout(() => { backdrop.hidden = true; }, 250);
    document.body.style.overflow = '';
    btn.focus({preventScroll:true});
  }

  btn?.addEventListener('click', () => {
    drawer.classList.contains('open') ? closeDrawer() : openDrawer();
  });
  closeBtn?.addEventListener('click', closeDrawer);
  backdrop?.addEventListener('click', closeDrawer);
  drawer?.addEventListener('click', (e) => {
    if (e.target.matches('.drawer-links a')) closeDrawer();
  });
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') closeDrawer();
  });
  window.addEventListener('hashchange', closeDrawer);
});
