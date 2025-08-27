// app.js — static nav + JSON-driven content (no fallback), robust and refactored

(function () {
  'use strict';

  // Helpers
  const $ = (id) => document.getElementById(id);
  const setHTML = (el, html) => { if (el) el.innerHTML = html; };
  const setText = (el, txt) => { if (el) el.textContent = txt; };

  // Kick when DOM is ready
  document.addEventListener('DOMContentLoaded', () => {
    // Year
    const yearEl = $('year');
    if (yearEl) yearEl.textContent = new Date().getFullYear();

    /* ---------- Mobile dropdown (static links) ---------- */
    const btn = $('menuBtn');
    const overlay = $('mobileNav');
    const closeBtn = $('closeNav');

    function setMenu(open) {
      if (!overlay || !btn) return;
      overlay.classList.toggle('open', open);
      overlay.setAttribute('aria-hidden', String(!open));
      btn.setAttribute('aria-expanded', String(open));
    }

    btn && btn.addEventListener('click', () => setMenu(!overlay.classList.contains('open')));
    closeBtn && closeBtn.addEventListener('click', () => setMenu(false));
    overlay && overlay.addEventListener('click', (e) => {
      if (e.target.closest('a')) setMenu(false);
    });
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') setMenu(false);
    });

    /* ---------- Player ---------- */
    const playerFrame = $('playerFrame');
    const audioPlayer = $('audioPlayer');
    const nowPlaying  = $('nowPlaying');
    const applyEmbed  = $('applyEmbed');
    const embedInput  = $('embedUrl');

    const allowedHosts = [
      'spotify.com','podcasts.apple.com','anchor.fm',
      'youtube.com','youtube-nocookie.com','youtu.be'
    ];

    function playEmbed(url, title='') {
      if (!playerFrame || !audioPlayer || !nowPlaying) return;
      audioPlayer.style.display = 'none';
      try { audioPlayer.pause(); } catch {}
      playerFrame.src = url;
      playerFrame.style.display = 'block';
      nowPlaying.textContent = title ? `Now playing: ${title}` : '';
    }

    function playAudio(url, title='') {
      if (!playerFrame || !audioPlayer || !nowPlaying) return;
      playerFrame.src = 'about:blank';
      playerFrame.style.display = 'none';
      audioPlayer.src = url;
      audioPlayer.style.display = 'block';
      audioPlayer.play().catch(()=>{});
      nowPlaying.textContent = title ? `Now playing: ${title}` : '';
    }

    applyEmbed && applyEmbed.addEventListener('click', () => {
      const val = (embedInput?.value || '').trim();
      if (!val) return;
      try {
        const u = new URL(val);
        if (allowedHosts.some(h => u.host.includes(h))) playEmbed(val, 'Custom embed');
        else if (/\.(mp3|m4a|ogg|wav)$/i.test(u.pathname)) playAudio(val, 'Custom audio');
        else alert('Use a podcast embed (Spotify/Apple/YouTube) or a direct audio URL.');
      } catch {
        alert('That URL does not look valid.');
      }
    });

    /* ---------- Render helpers ---------- */
    const el = {
      siteTitle: $('siteTitle'), brandTitle: $('brandTitle'), footerBrand: $('footerBrand'),
      heroTitle: $('heroTitle'), heroSubtitle: $('heroSubtitle'),
      ctaPrimary: $('ctaPrimary'), ctaSecondary: $('ctaSecondary'),
      aboutHeading: $('aboutHeading'), aboutCopy: $('aboutCopy'), aboutBullets: $('aboutBullets'),
      listenHeading: $('listenHeading'), embedLabel: $('embedLabel'), embedHint: $('embedHint'),
      episodesHeading: $('episodesHeading'), retroHeading: $('retroHeading'),
      featuredHeading: $('featuredHeading'), contactHeading: $('contactHeading'), contactBody: $('contactBody'),
      episodesGrid: $('episodesGrid'), retroGrid: $('retroGrid'), featuredGrid: $('featuredGrid'),
      subscribeLink: $('subscribeLink')
    };

    function episodeCard(e) {
      return `
        <article class="card" data-episode-id="${e.id}">
          <div class="card-img"></div>
          <div class="card-body">
            <strong>${e.title || ''}</strong>
            ${e.description ? `<div class="mut sm" style="margin-top:6px">${e.description}</div>` : ''}
            ${e.duration ? `<div class="mut xs" style="margin-top:6px">${e.duration}</div>` : ''}
          </div>
        </article>`;
    }

    function retroCard(r) {
      const url = r.url || '#';
      const target = r.target || (String(url).startsWith('http') ? '_blank' : '_self');
      return `
        <a class="card" href="${url}" target="${target}" rel="noopener">
          <div class="card-img"></div>
          <div class="card-body">
            <strong>${r.title || ''}</strong>
            ${r.blurb ? `<div class="mut sm" style="margin-top:6px">${r.blurb}</div>` : ''}
          </div>
        </a>`;
    }

    function featuredCard(f) {
      const inner = `
        <div class="card-img"></div>
        <div class="card-body">
          <strong>${f.title || ''}</strong>
          ${f.subtitle ? `<div class="mut xs" style="margin-top:6px">${f.subtitle}</div>` : ''}
          ${f.description ? `<div class="mut sm" style="margin-top:6px">${f.description}</div>` : ''}
        </div>`;
      if (f.type === 'episode') return `<div class="card" data-episode-id="${f.episodeId}">${inner}</div>`;
      const url = f.url || '#';
      const target = f.target || (String(url).startsWith('http') ? '_blank' : '_self');
      return `<a class="card" href="${url}" target="${target}" rel="noopener">${inner}</a>`;
    }

    function installEpisodeClicks(data) {
      document.querySelectorAll('[data-episode-id]').forEach(card => {
        card.addEventListener('click', () => {
          const id = card.getAttribute('data-episode-id');
          const e = (data.episodes || []).find(x => String(x.id) === String(id));
          if (!e) return;

          try {
            if (e.embedUrl) {
              const host = new URL(e.embedUrl).host;
              if (allowedHosts.some(h => host.includes(h))) playEmbed(e.embedUrl, e.title);
              else if (/\.(mp3|m4a|ogg|wav)$/i.test(e.embedUrl)) playAudio(e.embedUrl, e.title);
              else { window.location.href = e.embedUrl; return; }
            } else if (e.audioUrl) {
              playAudio(e.audioUrl, e.title);
            } else if (e.link) {
              window.location.href = e.link; return;
            } else {
              alert('Add "embedUrl" or "audioUrl" for this episode.');
              return;
            }
          } catch {
            alert('Invalid URL for this episode.');
            return;
          }

          // Deep link + scroll to player
          const u = new URL(window.location);
          u.searchParams.set('episode', e.id);
          history.replaceState({}, '', u);
          $('podcast')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
        });
      });
    }

    /* ---------- Data (no fallback) ---------- */
    async function loadJSON() {
      const res = await fetch('content.json?v=' + Date.now(), { cache: 'no-store' });
      if (!res.ok) throw new Error('content.json not found (HTTP ' + res.status + ')');
      return await res.json();
    }

    (async () => {
      const data = await loadJSON();

      // Meta / brand
      setText(el.siteTitle,   data.meta?.title || 'Podcast');
      setText(el.brandTitle,  data.meta?.brand || data.meta?.title || 'Podcast');
      setText(el.footerBrand, data.meta?.brand || data.meta?.title || 'Podcast');

      // Hero (allow inline HTML in title for <span class="accent">)
      setHTML(el.heroTitle, data.hero?.title || '');
      setText(el.heroSubtitle, data.hero?.subtitle || '');
      setText(el.ctaPrimary, data.hero?.ctaPrimary?.label || 'Listen now');
      if (data.hero?.ctaPrimary?.href) el.ctaPrimary.href = data.hero.ctaPrimary.href;
      setText(el.ctaSecondary, data.hero?.ctaSecondary?.label || 'Browse episodes');
      if (data.hero?.ctaSecondary?.href) el.ctaSecondary.href = data.hero.ctaSecondary.href;

      // About
      setText(el.aboutHeading, data.about?.heading || 'About');
      setText(el.aboutCopy,    data.about?.copy || '');
      setHTML(el.aboutBullets, (data.about?.bullets || []).map(b => `<li>${b}</li>`).join(''));

      // Listen labels
      setText(el.listenHeading, data.listen?.heading || 'Listen');
      setText(el.embedLabel,    data.listen?.embedLabel || 'Paste embed/MP3');
      setText(el.embedHint,     data.listen?.embedHint || 'If an MP3 is provided, the audio player is used.');

      // Section headings & contact
      setText(el.episodesHeading, data.episodesHeading || 'Latest episodes');
      setText(el.retroHeading,    data.retroHeading    || 'Retro spotlights');
      setText(el.featuredHeading, data.featuredHeading || 'Featured');
      setText(el.contactHeading,  data.contact?.heading || 'Contact');
      setHTML(el.contactBody,     data.contact?.html || '');

      // Subscribe link
      if (data.meta?.subscribeUrl && el.subscribeLink) {
        el.subscribeLink.href = data.meta.subscribeUrl;
        el.subscribeLink.classList.remove('hide');
      }

      // Grids
      if (el.episodesGrid) el.episodesGrid.innerHTML = (data.episodes || []).map(episodeCard).join('');
      if (el.retroGrid)    el.retroGrid.innerHTML    = (data.retro || []).map(retroCard).join('');
      if (el.featuredGrid) el.featuredGrid.innerHTML = (data.featured || []).map(featuredCard).join('');

      // Wire episode clicks
      installEpisodeClicks(data);

      // Optional deep-link ?episode=ID
      const epId = new URL(location.href).searchParams.get('episode');
      if (epId) {
        const e = (data.episodes || []).find(x => String(x.id) === String(epId));
        if (e) {
          if (e.embedUrl) playEmbed(e.embedUrl, e.title);
          else if (e.audioUrl) playAudio(e.audioUrl, e.title);
          $('podcast')?.scrollIntoView({ behavior:'smooth', block:'start' });
        }
      }
    })().catch(err => {
      // No fallback by design
      console.error(err);
    });
  });
})();
