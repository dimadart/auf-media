(() => {
  const header = document.querySelector('#uaf-header');
  const readable = node => node.textContent.trim().replace(/\u00a0/g, ' ').replace(/\u2011/g, '-');
  const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
  let framePending = false;
  const updateHeader = () => {
    header.classList.toggle('is-compact', window.scrollY > 24);
    framePending = false;
  };
  const scheduleUpdate = () => {
    if (!framePending) {
      framePending = true;
      requestAnimationFrame(updateHeader);
    }
  };
  window.addEventListener('scroll', scheduleUpdate, { passive: true });
  window.addEventListener('resize', scheduleUpdate);
  window.addEventListener('pageshow', scheduleUpdate);
  reducedMotion.addEventListener('change', scheduleUpdate);
  updateHeader();
  document.querySelectorAll('[data-dialog]').forEach(button => {
    button.addEventListener('click', () => {
      const dialog = document.getElementById(button.dataset.dialog);
      document.querySelectorAll('.uaf-dialog[open]').forEach(openDialog => openDialog.close());
      dialog.showModal();
      if (dialog.id === 'uaf-search') dialog.querySelector('input').focus();
    });
  });
  document.querySelectorAll('.uaf-dialog').forEach(dialog => {
    dialog.querySelector('[data-close]').addEventListener('click', () => dialog.close());
    dialog.addEventListener('click', event => {
      const bounds = dialog.getBoundingClientRect();
      if (event.target === dialog && (event.clientX < bounds.left || event.clientX > bounds.right || event.clientY < bounds.top || event.clientY > bounds.bottom)) dialog.close();
    });
  });
  const scrollToSlot = slot => {
    stopSpotlight();
    document.querySelectorAll('.uaf-dialog[open]').forEach(dialog => dialog.close());
    if (reels?.show(slot)) return;
    const card = document.querySelector(`[data-editorial-slot="${slot}"]`);
    card.scrollIntoView({ behavior: reducedMotion.matches ? 'instant' : 'smooth', block: 'start' });
    card.tabIndex = -1;
    card.focus({ preventScroll: true });
  };
  document.querySelectorAll('[data-scroll-slot]').forEach(button => button.addEventListener('click', () => scrollToSlot(button.dataset.scrollSlot)));
  const cards = [...document.querySelectorAll('section[data-editorial-slot]')].map(card => ({
    slot: card.dataset.editorialSlot,
    title: readable(card.querySelector('.yg2f0_0, ._2bLkN_0, .Wpu2b_0, ._1TiTf_0, .srhe5_0')),
    category: card.querySelector('._2b0aj_0')?.textContent.trim() || ''
  }));
  const input = document.querySelector('#uaf-search-input');
  const results = document.querySelector('#uaf-search-results');
  input.addEventListener('input', () => {
    const query = input.value.trim().toLocaleLowerCase('ru');
    const matches = query ? cards.filter(card => `${card.title} ${card.category}`.toLocaleLowerCase('ru').includes(query)) : [];
    results.replaceChildren();
    document.querySelector('#uaf-search-status').textContent = query ? (matches.length ? `Найдено: ${matches.length}` : 'Ничего не найдено. Попробуйте другое слово.') : '';
    matches.forEach(card => {
      const button = document.createElement('button');
      button.type = 'button';
      button.textContent = card.title;
      button.addEventListener('click', () => scrollToSlot(card.slot));
      results.append(button);
    });
  });
  const reels = (() => {
    const section = document.querySelector('._2BZW3_0');
    const sources = section ? [...section.querySelectorAll('section[data-editorial-slot]')] : [];
    if (sources.length < 2) return null;
    const items = sources.map(card => ({
      slot: card.dataset.editorialSlot,
      title: readable(card.querySelector('.srhe5_0, ._1TiTf_0, .Wpu2b_0, ._2bLkN_0, .yg2f0_0')),
      video: card.dataset.video || '',
      duration: card.dataset.duration || '',
      category: card.querySelector('._2b0aj_0')?.textContent.trim() || '',
      href: card.querySelector('a[href]').getAttribute('href'),
      cover: card.dataset.reelCover || card.querySelector('img').getAttribute('src')
    }));
    // The fan shows five cards; with fewer videos the list repeats to fill it.
    const deckItems = [];
    while (deckItems.length < Math.max(5, items.length)) deckItems.push(...items);
    const count = deckItems.length;
    const root = document.createElement('div');
    root.className = 'uaf-reels';
    root.setAttribute('role', 'group');
    root.setAttribute('aria-roledescription', 'карусель');
    root.setAttribute('aria-label', 'Видео');
    const deck = document.createElement('div');
    deck.className = 'uaf-reels-deck';
    const cards = deckItems.map((item, index) => {
      const link = document.createElement('a');
      link.className = 'uaf-reel';
      link.href = item.video || item.href;
      link.draggable = false;
      if (item.video) link.classList.add('has-video');
      const image = document.createElement('img');
      image.src = item.cover;
      image.alt = '';
      image.draggable = false;
      image.loading = 'lazy';
      image.decoding = 'async';
      link.append(image);
      link.addEventListener('click', event => {
        if (suppress) { event.preventDefault(); suppress = false; return; }
        if (index !== current) { event.preventDefault(); go(index - current); }
      });
      deck.append(link);
      return link;
    });
    const arrow = (label, path, step) => {
      const button = document.createElement('button');
      button.type = 'button';
      button.className = 'uaf-reels-arrow';
      button.setAttribute('aria-label', label);
      button.innerHTML = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="${path}"/></svg>`;
      button.addEventListener('click', () => go(step));
      return button;
    };
    const caption = document.createElement('div');
    caption.className = 'uaf-reels-caption';
    caption.setAttribute('aria-live', 'polite');
    const counter = document.createElement('p');
    counter.className = 'uaf-reels-counter';
    const title = document.createElement('p');
    title.className = 'uaf-reels-title';
    caption.append(counter, title);
    const bar = document.createElement('div');
    bar.className = 'uaf-reels-bar';
    bar.append(arrow('Предыдущее видео', 'M19 12H5M11 6l-6 6 6 6', -1), caption, arrow('Следующее видео', 'M5 12h14M13 6l6 6-6 6', 1));
    const watch = document.createElement('a');
    watch.className = 'uaf-reels-watch';
    root.append(deck, bar, watch);
    section.querySelector('._16nbd_0').before(root);
    section.classList.add('uaf-has-reels');
    let current = 0;
    let position = 0;
    let target = 0;
    let frame = 0;
    let dragging = null;
    let suppress = false;
    let wheelLock = 0;
    const wrap = value => ((value % count) + count) % count;
    const offsetOf = index => {
      let offset = index - position;
      offset -= Math.round(offset / count) * count;
      return offset;
    };
    const render = () => {
      const width = cards[0].offsetWidth;
      const near = deck.clientWidth >= width * 4.1 ? width * .93 : Math.max(width * .68, deck.clientWidth / 4.4);
      const far = near * .75;
      cards.forEach((card, index) => {
        const offset = offsetOf(index);
        const distance = Math.abs(offset);
        const x = Math.sign(offset) * (distance <= 1 ? distance * near : near + (distance - 1) * far);
        const depth = Math.min(distance, 2.5);
        const scale = depth <= 1 ? 1 - depth * .14 : .86 - (depth - 1) * .1;
        const lift = depth <= 1 ? depth * 1 : 1 + (depth - 1) * 8.5;
        const angle = Math.sign(offset) * (depth <= 1 ? depth * 4.5 : 4.5 + (depth - 1) * 6.5);
        card.style.transform = `translate(-50%, -50%) translate(${x.toFixed(1)}px, ${lift.toFixed(2)}%) rotate(${angle.toFixed(2)}deg) scale(${scale.toFixed(3)})`;
        card.style.zIndex = String(100 - Math.round(distance * 10));
        card.style.opacity = String(Math.max(0, Math.min(1, (Math.min(count / 2, 2.5) - distance) * 4)));
        card.classList.toggle('is-current', distance < .5);
      });
    };
    const sync = () => {
      current = wrap(Math.round(target));
      const item = deckItems[current];
      const place = items.indexOf(item) + 1;
      counter.textContent = [item.category, `${place} / ${items.length}`, item.duration].filter(Boolean).join(' · ');
      title.textContent = item.title;
      watch.href = item.video || item.href;
      watch.textContent = item.video ? 'Смотреть' : 'Читать';
      cards.forEach((card, index) => {
        const active = index === current;
        card.tabIndex = active ? 0 : -1;
        card.setAttribute('aria-hidden', active ? 'false' : 'true');
        card.setAttribute('aria-label', active ? deckItems[index].title : `Показать: ${deckItems[index].title}`);
      });
    };
    const animate = () => {
      cancelAnimationFrame(frame);
      if (reducedMotion.matches) { position = target; render(); return; }
      const step = () => {
        const delta = target - position;
        if (Math.abs(delta) < .002) { position = target; render(); return; }
        position += delta * .18;
        render();
        frame = requestAnimationFrame(step);
      };
      frame = requestAnimationFrame(step);
    };
    const go = step => { target = Math.round(target) + step; sync(); animate(); };
    deck.addEventListener('pointerdown', event => {
      if (!event.isPrimary || event.button !== 0) return;
      cancelAnimationFrame(frame);
      suppress = false;
      dragging = { id: event.pointerId, x: event.clientX, start: position, time: performance.now(), captured: false };
    });
    deck.addEventListener('pointermove', event => {
      if (!dragging || event.pointerId !== dragging.id) return;
      const delta = event.clientX - dragging.x;
      if (!dragging.captured) {
        if (Math.abs(delta) < 8) return;
        dragging.captured = true;
        suppress = true;
        deck.setPointerCapture(event.pointerId);
        deck.classList.add('is-dragging');
      }
      position = dragging.start - delta / (cards[0].offsetWidth * .8);
      render();
    });
    const release = event => {
      if (!dragging || (event.pointerId !== undefined && event.pointerId !== dragging.id)) return;
      const moved = position - dragging.start;
      const velocity = moved / Math.max(1, performance.now() - dragging.time) * 1000;
      const captured = dragging.captured;
      dragging = null;
      deck.classList.remove('is-dragging');
      if (!captured) return;
      let next = Math.round(position);
      if (next === Math.round(position - moved) && Math.abs(moved) > .12 && Math.abs(velocity) > .6) next += Math.sign(moved);
      target = next;
      sync();
      animate();
      setTimeout(() => { suppress = false; }, 0);
    };
    deck.addEventListener('pointerup', release);
    deck.addEventListener('pointercancel', release);
    deck.addEventListener('lostpointercapture', release);
    deck.addEventListener('dragstart', event => event.preventDefault());
    deck.addEventListener('wheel', event => {
      if (Math.abs(event.deltaX) <= Math.abs(event.deltaY)) return;
      event.preventDefault();
      const now = performance.now();
      if (Math.abs(event.deltaX) < 12 || now < wheelLock) return;
      wheelLock = now + 450;
      go(Math.sign(event.deltaX));
    }, { passive: false });
    root.addEventListener('keydown', event => {
      if (event.key !== 'ArrowLeft' && event.key !== 'ArrowRight') return;
      event.preventDefault();
      go(event.key === 'ArrowRight' ? 1 : -1);
      cards[current].focus({ preventScroll: true });
    });
    new ResizeObserver(render).observe(deck);
    sync();
    render();
    return {
      show(slot) {
        const index = deckItems.findIndex(item => item.slot === String(slot));
        if (index < 0) return false;
        target = Math.round(position) + Math.round(offsetOf(index));
        sync();
        animate();
        root.scrollIntoView({ behavior: reducedMotion.matches ? 'instant' : 'smooth', block: 'center' });
        cards[index].focus({ preventScroll: true });
        return true;
      }
    };
  })();
  const subscribe = document.querySelector('.uaf-subscribe');
  if (subscribe) {
    const email = subscribe.querySelector('input');
    const status = subscribe.querySelector('.uaf-subscribe-status');
    const button = subscribe.querySelector('button');
    const say = (state, message) => { subscribe.dataset.state = state; status.textContent = message; email.setAttribute('aria-invalid', state === 'error' ? 'true' : 'false'); };
    email.addEventListener('input', () => { if (subscribe.dataset.state) say('', ''); });
    subscribe.addEventListener('submit', async event => {
      event.preventDefault();
      const value = email.value.trim();
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(value)) { say('error', value ? 'Похоже, в адресе опечатка. Проверь и попробуй ещё раз.' : 'Напиши адрес почты.'); email.focus(); return; }
      const endpoint = subscribe.dataset.endpoint;
      if (!endpoint) { say('idle', 'Рассылка ещё не запущена — адрес пока никуда не отправлен. Загляни чуть позже.'); return; }
      button.disabled = true;
      say('sending', 'Отправляем…');
      try {
        const response = await fetch(endpoint, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ email: value }) });
        if (!response.ok) throw new Error(String(response.status));
        subscribe.reset();
        say('success', 'Готово. Ты в списке.');
      } catch {
        say('error', 'Не получилось отправить. Попробуй ещё раз чуть позже.');
      } finally {
        button.disabled = false;
      }
    });
  }
  const spotlight = document.querySelector('._2sU3z_0');
  const track = spotlight.querySelector('._2p8cZ_0');
  const originalCards = [...track.children];
  const mobile = window.matchMedia('(max-width: 600px)');
  const viewport = document.createElement('div');
  const spotlightSpeed = 24;
  let animation;
  let touching = false;
  let drag;
  let suppressClick = false;
  let cycleDuration = 0;
  let visible = false;
  const syncPlayback = () => {
    if (!animation) return;
    if (visible && !document.hidden && !touching && !track.contains(document.activeElement)) animation.play();
    else animation.pause();
  };
  const stopSpotlight = () => {
    if (!animation) return;
    const offset = Math.abs(new DOMMatrixReadOnly(getComputedStyle(track).transform).m41);
    animation.cancel();
    animation = null;
    track.querySelectorAll('[data-marquee-clone]').forEach(clone => clone.remove());
    viewport.replaceWith(track);
    track.scrollLeft = offset;
  };
  const setupSpotlight = () => {
    stopSpotlight();
    drag = null;
    touching = false;
    viewport.classList.remove('is-dragging');
    if (!mobile.matches || reducedMotion.matches) return;
    track.before(viewport);
    viewport.className = 'uaf-spotlight-viewport';
    viewport.append(track);
    track.scrollLeft = 0;
    originalCards.forEach(card => {
      const clone = card.cloneNode(true);
      clone.removeAttribute('data-editorial-slot');
      clone.dataset.marqueeClone = '';
      clone.setAttribute('aria-hidden', 'true');
      clone.inert = true;
      clone.querySelectorAll('[id]').forEach(node => node.removeAttribute('id'));
      track.append(clone);
    });
    const distance = track.children[originalCards.length].offsetLeft - originalCards[0].offsetLeft;
    cycleDuration = distance / spotlightSpeed * 1000;
    animation = track.animate([{ transform: 'translateX(0)' }, { transform: `translateX(-${distance}px)` }], { duration: cycleDuration, iterations: Infinity, easing: 'linear' });
    syncPlayback();
  };
  viewport.addEventListener('pointerdown', event => {
    if (!animation || !event.isPrimary || event.button !== 0) return;
    suppressClick = false;
    touching = true;
    syncPlayback();
    drag = { pointerId: event.pointerId, startX: event.clientX, startTime: Number(animation.currentTime) || 0 };
    viewport.setPointerCapture(event.pointerId);
    viewport.classList.add('is-dragging');
  });
  viewport.addEventListener('pointermove', event => {
    if (!drag || event.pointerId !== drag.pointerId || !animation) return;
    const delta = event.clientX - drag.startX;
    if (Math.abs(delta) > 6) suppressClick = true;
    const time = drag.startTime - delta / spotlightSpeed * 1000;
    animation.currentTime = ((time % cycleDuration) + cycleDuration) % cycleDuration;
  });
  const releaseTouch = event => {
    if (drag && event.pointerId !== undefined && event.pointerId !== drag.pointerId) return;
    const pointerId = drag?.pointerId;
    drag = null;
    touching = false;
    viewport.classList.remove('is-dragging');
    if (pointerId !== undefined && viewport.hasPointerCapture(pointerId)) viewport.releasePointerCapture(pointerId);
    syncPlayback();
  };
  viewport.addEventListener('lostpointercapture', releaseTouch);
  viewport.addEventListener('dragstart', event => event.preventDefault());
  viewport.addEventListener('click', event => {
    if (!suppressClick) return;
    event.preventDefault();
    event.stopPropagation();
    suppressClick = false;
  }, true);
  viewport.addEventListener('wheel', event => {
    if (!animation || Math.abs(event.deltaX) <= Math.abs(event.deltaY)) return;
    event.preventDefault();
    const unit = event.deltaMode === 1 ? 16 : event.deltaMode === 2 ? viewport.clientWidth : 1;
    const time = Number(animation.currentTime) + event.deltaX * unit / spotlightSpeed * 1000;
    animation.currentTime = ((time % cycleDuration) + cycleDuration) % cycleDuration;
  }, { passive: false });
  window.addEventListener('pointerup', releaseTouch, { passive: true });
  window.addEventListener('pointercancel', releaseTouch, { passive: true });
  window.addEventListener('blur', releaseTouch);
  track.addEventListener('focusin', syncPlayback);
  track.addEventListener('focusout', () => queueMicrotask(syncPlayback));
  const observer = new IntersectionObserver(entries => { visible = entries[0].isIntersecting; syncPlayback(); });
  observer.observe(spotlight);
  document.addEventListener('visibilitychange', syncPlayback);
  mobile.addEventListener('change', setupSpotlight);
  reducedMotion.addEventListener('change', setupSpotlight);
  let resizeTimer;
  let trackViewportWidth = window.innerWidth;
  window.addEventListener('resize', () => {
    if (window.innerWidth === trackViewportWidth) return;
    trackViewportWidth = window.innerWidth;
    clearTimeout(resizeTimer);
    resizeTimer = setTimeout(setupSpotlight, 150);
  });
  setupSpotlight();
})();
