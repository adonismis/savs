/* Buildless homepage: works over file:// as well as a static web server. */
(() => {
  'use strict';
  const $ = (selector, scope = document) => scope.querySelector(selector);
  const $$ = (selector, scope = document) => [...scope.querySelectorAll(selector)];
  const news = window.SAVS_NEWS || [];
  const icon = () => {
    const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    svg.classList.add('icon');
    svg.setAttribute('aria-hidden', 'true');
    const use = document.createElementNS(svg.namespaceURI, 'use');
    use.setAttribute('href', '#i-arrow');
    svg.append(use);
    return svg;
  };
  function externalLink(link) {
    if (!/^https?:/.test(link.getAttribute('href') || '')) return;
    link.target = '_blank';
    link.rel = 'noopener noreferrer';
    link.title = `${link.textContent.trim()}（另開新視窗）`;
  }
  function textElement(tag, className, text) {
    const el = document.createElement(tag);
    el.className = className;
    el.textContent = text;
    return el;
  }

  // Progressive navigation: native details works even without JavaScript.
  const menuButton = $('.menu-toggle');
  const navigation = $('#main-nav');
  const navGroups = $$('.nav-group');
  function closeMenu() {
    navigation.classList.remove('is-open');
    menuButton.setAttribute('aria-expanded', 'false');
    menuButton.setAttribute('aria-label', '開啟主選單');
    navGroups.forEach(group => { group.open = false; });
  }
  menuButton.addEventListener('click', () => {
    const open = menuButton.getAttribute('aria-expanded') !== 'true';
    navigation.classList.toggle('is-open', open);
    menuButton.setAttribute('aria-expanded', String(open));
    menuButton.setAttribute('aria-label', open ? '關閉主選單' : '開啟主選單');
  });
  navGroups.forEach(group => {
    group.addEventListener('toggle', () => {
      if (group.open) navGroups.forEach(other => { if (other !== group) other.open = false; });
    });
  });
  document.addEventListener('click', event => {
    if (!event.target.closest('.site-header')) closeMenu();
    if (event.target.closest('#main-nav a')) closeMenu();
  });
  document.addEventListener('keydown', event => {
    if (event.key !== 'Escape') return;
    const openDialog = $('dialog[open]');
    if (openDialog) { event.preventDefault(); openDialog.close(); return; }
    const focusedGroup = event.target.closest('.nav-group[open]');
    if (focusedGroup) { focusedGroup.open = false; $('summary', focusedGroup).focus(); }
    else if (navigation.classList.contains('is-open')) { closeMenu(); menuButton.focus(); }
  });

  // Shared, keyboard-accessible tab behaviour.
  function setTabState(tabs, selected, panel) {
    tabs.forEach(tab => {
      const active = tab === selected;
      tab.setAttribute('aria-selected', String(active));
      tab.tabIndex = active ? 0 : -1;
    });
    panel.setAttribute('aria-labelledby', selected.id);
  }
  function keyboardTabs(tabs, activate) {
    tabs.forEach((tab, index) => tab.addEventListener('keydown', event => {
      let next;
      if (event.key === 'ArrowRight') next = (index + 1) % tabs.length;
      else if (event.key === 'ArrowLeft') next = (index + tabs.length - 1) % tabs.length;
      else if (event.key === 'Home') next = 0;
      else if (event.key === 'End') next = tabs.length - 1;
      else return;
      event.preventDefault();
      tabs[next].focus();
      activate(tabs[next]);
    }));
  }

  const newsTabs = $$('.news-tabs [role="tab"]');
  const categoryNames = { admission: '升學資訊', activities: '活動公告', important: '校園公告', honors: '榮譽榜' };
  function renderNews(category = 'all') {
    const list = $('#news-list');
    let items;
    if (category === 'all') {
      const selectedIds = ['12473', '12452', '12486', '12485', '12482', '12481'];
      items = selectedIds.map(id => news.find(item => item.id === id)).filter(Boolean);
    } else {
      items = news.filter(item => item.category === category).slice(0, 6);
    }
    list.replaceChildren();
    if (!items.length) {
      list.append(textElement('p', 'search-empty', '目前沒有此分類公告，請至「所有公告」查看。'));
      return;
    }
    items.forEach(item => {
      const link = document.createElement('a');
      link.className = 'news-item';
      link.href = item.url;
      const date = document.createElement('time');
      date.className = 'news-date';
      date.dateTime = item.date;
      const [year, month, day] = item.date.split('-');
      date.append(textElement('span', 'date-day', `${month}.${day}`), textElement('span', 'date-year', year));
      const body = textElement('span', 'news-body', '');
      const meta = textElement('span', 'news-meta', '');
      meta.append(textElement('span', `news-tag${item.pinned ? ' is-pinned' : ''}`, item.pinned ? '置頂' : categoryNames[item.category]), textElement('span', '', item.unit));
      // Only presentation punctuation is simplified; the official title stays in the link tooltip.
      const title = item.title.replace(/^\[大學招生訊息\]\s*|^☄️活動訊息☄️/g, '');
      body.append(meta, textElement('span', 'news-title', title));
      link.append(date, body, icon());
      externalLink(link);
      link.title = `${item.title}（另開原站公告）`;
      list.append(link);
    });
  }
  function activateNews(tab) {
    setTabState(newsTabs, tab, $('#news-panel'));
    renderNews(tab.dataset.category);
  }
  newsTabs.forEach(tab => tab.addEventListener('click', () => activateNews(tab)));
  keyboardTabs(newsTabs, activateNews);
  renderNews();

  // Complete service directory: source links stay local; searching never sends a query.
  const serviceGroups = window.SAVS_SERVICE_GROUPS || [];
  const serviceInput = $('#service-search');
  const serviceExpanded = new Set();
  let serviceCategory = 'all';
  let serviceQuery = '';
  const serviceTotal = serviceGroups.reduce((sum, group) => sum + group.links.length, 0);
  function syncServiceExpand() {
    const details = $$('#service-directory details');
    const allOpen = details.length > 0 && details.every(detail => detail.open);
    const button = $('#service-expand-all');
    button.hidden = !details.length;
    button.setAttribute('aria-expanded', String(allOpen));
    button.replaceChildren(document.createTextNode(allOpen ? '全部收合 ' : '全部展開 '), textElement('span', '', allOpen ? '－' : '＋'));
  }
  function renderServiceDirectory() {
    const terms = serviceQuery.trim().toLocaleLowerCase().split(/\s+/).filter(Boolean);
    const searching = terms.length > 0;
    $('#service-search-clear').hidden = !serviceQuery;
    $$('#service-categories button').forEach(button => button.setAttribute('aria-pressed', String(button.dataset.category === serviceCategory)));
    const directory = $('#service-directory');
    directory.classList.toggle('is-filtered', serviceCategory !== 'all' || searching);
    let matches = 0;
    const cards = [];
    serviceGroups.forEach(group => {
      if (serviceCategory !== 'all' && group.id !== serviceCategory) return;
      const entries = group.links.filter(entry => terms.every(term => `${entry.label} ${entry.aliases || ''} ${group.title}`.toLocaleLowerCase().includes(term)));
      if (!entries.length) return;
      matches += entries.length;
      const card = document.createElement('article');
      card.className = 'service-group';
      card.setAttribute('aria-labelledby', `service-heading-${group.id}`);
      const heading = textElement('div', 'service-group-heading', '');
      const glyph = icon(); $('use', glyph).setAttribute('href', `#i-${group.icon}`);
      const copy = textElement('div', '', '');
      const title = textElement('h3', '', group.title); title.id = `service-heading-${group.id}`;
      copy.append(title, textElement('p', '', group.description));
      heading.append(glyph, copy, textElement('span', 'service-group-count', String(entries.length).padStart(2, '0')));
      card.append(heading);
      function makeLinks(links) {
        const list = textElement('div', 'directory-links', '');
        links.forEach(entry => {
          const a = document.createElement('a'); a.href = entry.url;
          a.append(textElement('span', '', entry.label), icon()); externalLink(a); list.append(a);
        });
        return list;
      }
      const showAll = searching || serviceCategory !== 'all';
      card.append(makeLinks(showAll ? entries : entries.slice(0, 3)));
      if (!showAll && entries.length > 3) {
        const details = document.createElement('details');
        details.open = serviceExpanded.has(group.id);
        const summary = textElement('summary', '', '');
        summary.append(textElement('span', '', `查看全部 ${entries.length} 項`), textElement('span', 'service-disclosure', '＋'));
        details.append(summary, makeLinks(entries.slice(3)));
        details.addEventListener('toggle', () => {
          if (details.open) serviceExpanded.add(group.id); else serviceExpanded.delete(group.id);
          summary.firstElementChild.textContent = details.open ? '收合清單' : `查看全部 ${entries.length} 項`;
          summary.lastElementChild.textContent = details.open ? '－' : '＋';
          syncServiceExpand();
        });
        card.append(details);
      }
      cards.push(card);
    });
    directory.replaceChildren(...cards);
    if (!cards.length) {
      const empty = textElement('div', 'service-empty', '');
      empty.append(textElement('h3', '', '找不到相符的服務'), textElement('p', '', '試試「成績」、「獎學金」或「教學」，也可以查看全部分類。'));
      const reset = textElement('button', '', '清除條件，查看全部');
      reset.addEventListener('click', () => { serviceCategory = 'all'; serviceQuery = ''; serviceInput.value = ''; renderServiceDirectory(); serviceInput.focus(); });
      empty.append(reset); directory.append(empty);
    }
    $('#service-status').textContent = searching ? `找到 ${matches} 項服務 · 全部 ${serviceTotal} 項` : (serviceCategory === 'all' ? `共 ${serviceTotal} 項服務，依用途分為 ${serviceGroups.length} 類` : `${serviceGroups.find(group => group.id === serviceCategory).title} · ${matches} 項服務`);
    syncServiceExpand();
  }
  [{id:'all',title:'全部服務'}, ...serviceGroups].forEach(group => {
    const button = textElement('button', '', group.title);
    button.dataset.category = group.id;
    button.setAttribute('aria-controls', 'service-directory');
    button.addEventListener('click', () => { serviceCategory = group.id; renderServiceDirectory(); });
    $('#service-categories').append(button);
  });
  serviceInput.addEventListener('input', () => { serviceCategory = 'all'; serviceQuery = serviceInput.value; renderServiceDirectory(); });
  $('#service-search-clear').addEventListener('click', () => { serviceQuery = ''; serviceInput.value = ''; renderServiceDirectory(); serviceInput.focus(); });
  $('#service-expand-all').addEventListener('click', () => {
    const details = $$('#service-directory details');
    const open = !details.every(detail => detail.open);
    details.forEach(detail => { detail.open = open; });
    syncServiceExpand();
  });
  $$('[data-audience]').forEach(link => link.addEventListener('click', () => {
    serviceCategory = link.dataset.audience; serviceQuery = ''; serviceInput.value = ''; renderServiceDirectory();
  }));
  renderServiceDirectory();

  // Persistent shortcuts stay compact on phones and use ordinary navigation links.
  const floatingQuick = $('.floating-quick');
  const floatingToggle = $('#floating-toggle');
  function closeFloatingQuick(returnFocus = false) {
    floatingQuick.classList.remove('is-open');
    floatingToggle.setAttribute('aria-expanded', 'false');
    if (returnFocus) floatingToggle.focus();
  }
  floatingToggle.addEventListener('click', () => {
    const open = !floatingQuick.classList.contains('is-open');
    floatingQuick.classList.toggle('is-open', open);
    floatingToggle.setAttribute('aria-expanded', String(open));
  });
  $$('.floating-links a').forEach(link => link.addEventListener('click', () => {
    closeFloatingQuick();
    if (link.hasAttribute('data-services-all')) {
      serviceCategory = 'all'; serviceQuery = ''; serviceInput.value = ''; renderServiceDirectory();
      // Move keyboard focus out of the collapsed mobile menu to its destination.
      $('#services-title').setAttribute('tabindex', '-1');
      requestAnimationFrame(() => $('#services-title').focus({preventScroll:true}));
    } else if (matchMedia('(max-width:767px)').matches) floatingToggle.focus();
  }));
  document.addEventListener('click', event => {
    if (!floatingQuick.contains(event.target)) closeFloatingQuick();
  });
  document.addEventListener('keydown', event => {
    if (event.key === 'Escape' && !event.defaultPrevented && floatingQuick.classList.contains('is-open')) closeFloatingQuick(true);
  });

  const hero = $('.hero');
  const photos = $$('.hero-photo');
  const dots = $$('.slide-dots button');
  const captions = ['椰林大道・敬業樓', '夕照椰林・蘇海時光', '青山環抱・綠茵操場'];
  const pauseButton = $('.slide-pause');
  const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
  let currentSlide = 0;
  let paused = reducedMotion.matches;
  let timer;
  let heroVisible = true;
  let hoverPause = false;
  function showSlide(index) {
    currentSlide = (index + photos.length) % photos.length;
    photos.forEach((photo, i) => {
      photo.classList.toggle('is-active', i === currentSlide);
      photo.setAttribute('aria-hidden', String(i !== currentSlide));
      dots[i].classList.toggle('is-active', i === currentSlide);
      dots[i].setAttribute('aria-current', String(i === currentSlide));
    });
    $('#slide-caption').textContent = captions[currentSlide];
    $('#slide-number').textContent = String(currentSlide + 1).padStart(2, '0');
  }
  function updateTimer() {
    clearInterval(timer);
    if (!paused && !hoverPause && heroVisible && !document.hidden && !hero.contains(document.activeElement) && !$('dialog[open]')) {
      timer = setInterval(() => showSlide(currentSlide + 1), 7000);
    }
  }
  function manualSlide(index) { showSlide(index); updateTimer(); }
  dots.forEach((dot, i) => dot.addEventListener('click', () => manualSlide(i)));
  $('#prev-slide').addEventListener('click', () => manualSlide(currentSlide - 1));
  $('#next-slide').addEventListener('click', () => manualSlide(currentSlide + 1));
  function syncPauseButton() {
    pauseButton.setAttribute('aria-pressed', String(paused));
    pauseButton.setAttribute('aria-label', paused ? '播放輪播' : '暫停輪播');
  }
  pauseButton.addEventListener('click', () => { paused = !paused; syncPauseButton(); updateTimer(); });
  hero.addEventListener('pointerenter', event => { if (event.pointerType === 'mouse') { hoverPause = true; updateTimer(); } });
  hero.addEventListener('pointerleave', () => { hoverPause = false; updateTimer(); });
  hero.addEventListener('focusin', updateTimer);
  hero.addEventListener('focusout', () => setTimeout(updateTimer, 0));
  hero.addEventListener('keydown', event => {
    if (event.key === 'ArrowLeft' || event.key === 'ArrowRight') {
      event.preventDefault();
      manualSlide(currentSlide + (event.key === 'ArrowRight' ? 1 : -1));
    }
  });
  document.addEventListener('visibilitychange', updateTimer);
  reducedMotion.addEventListener('change', () => { paused = reducedMotion.matches; syncPauseButton(); updateTimer(); });
  if ('IntersectionObserver' in window) {
    new IntersectionObserver(([entry]) => { heroVisible = entry.isIntersecting; updateTimer(); }, {threshold: .1}).observe(hero);
  }
  syncPauseButton();
  updateTimer();

  // Keep achievement posters intact, with independent and pausable rotation.
  const awards = $('.awards-carousel');
  const awardSlides = $$('.award-slide');
  const awardPicks = $$('[data-award]');
  const awardPause = $('#award-pause');
  let currentAward = 0;
  let awardsPaused = reducedMotion.matches;
  let awardsHovered = false;
  let awardsVisible = true;
  let awardTimer;
  function showAward(index, announce = false) {
    currentAward = (index + awardSlides.length) % awardSlides.length;
    awardSlides.forEach((slide, i) => { slide.hidden = i !== currentAward; });
    awardPicks.forEach((pick, i) => pick.setAttribute('aria-current', String(i === currentAward)));
    $('#award-number').textContent = String(currentAward + 1).padStart(2, '0');
    $('#award-select').value = String(currentAward);
    const thumbnails = $('.award-thumbnails');
    const activePick = awardPicks[currentAward];
    thumbnails.scrollTo({left:activePick.offsetLeft - (thumbnails.clientWidth - activePick.clientWidth) / 2, behavior:reducedMotion.matches ? 'instant' : 'smooth'});
    if (announce) $('#award-status').textContent = `${awardSlides[currentAward].getAttribute('aria-label')}，${$('[data-poster]', awardSlides[currentAward]).dataset.posterTitle}`;
  }
  function updateAwardTimer() {
    clearInterval(awardTimer);
    if (!awardsPaused && !awardsHovered && awardsVisible && !document.hidden && !awards.contains(document.activeElement) && !$('dialog[open]')) {
      awardTimer = setInterval(() => showAward(currentAward + 1), 8000);
    }
  }
  function manualAward(index) { showAward(index, true); updateAwardTimer(); }
  function syncAwardPause() {
    awardPause.setAttribute('aria-pressed', String(awardsPaused));
    awardPause.setAttribute('aria-label', awardsPaused ? '播放榮耀輪播' : '暫停榮耀輪播');
  }
  awardPicks.forEach(pick => pick.addEventListener('click', () => manualAward(Number(pick.dataset.award))));
  $('#award-select').addEventListener('change', event => manualAward(Number(event.target.value)));
  $('#award-prev').addEventListener('click', () => manualAward(currentAward - 1));
  $('#award-next').addEventListener('click', () => manualAward(currentAward + 1));
  awardPause.addEventListener('click', () => { awardsPaused = !awardsPaused; syncAwardPause(); updateAwardTimer(); });
  awards.addEventListener('pointerenter', event => { if (event.pointerType === 'mouse') { awardsHovered = true; updateAwardTimer(); } });
  awards.addEventListener('pointerleave', () => { awardsHovered = false; updateAwardTimer(); });
  awards.addEventListener('focusin', updateAwardTimer);
  awards.addEventListener('focusout', () => setTimeout(updateAwardTimer, 0));
  awards.addEventListener('keydown', event => {
    if (event.key !== 'ArrowLeft' && event.key !== 'ArrowRight') return;
    event.preventDefault();
    // Keep focus on a persistent control before hiding a focused poster.
    if (event.target.closest('.award-slide')) awards.focus();
    manualAward(currentAward + (event.key === 'ArrowRight' ? 1 : -1));
  });
  document.addEventListener('visibilitychange', updateAwardTimer);
  reducedMotion.addEventListener('change', () => { awardsPaused = reducedMotion.matches; syncAwardPause(); updateAwardTimer(); });
  if ('IntersectionObserver' in window) {
    new IntersectionObserver(([entry]) => { awardsVisible = entry.isIntersecting; updateAwardTimer(); }, {threshold: .1}).observe(awards);
  }
  syncAwardPause();
  updateAwardTimer();

  // Teaching-unit carousel: no automatic movement; native touch/trackpad scrolling.
  const departmentTrack = $('#department-track');
  const departmentCards = $$('.department-card', departmentTrack);
  let departmentVisible = 4;
  let departmentFirst = 0;
  let departmentScrollTimer;
  function departmentStep() {
    return departmentCards[0].getBoundingClientRect().width + parseFloat(getComputedStyle(departmentTrack).gap);
  }
  function syncDepartments() {
    departmentVisible = Number(getComputedStyle(departmentTrack).getPropertyValue('--department-visible')) || 1;
    departmentFirst = Math.max(0, Math.min(departmentCards.length - departmentVisible, Math.round(departmentTrack.scrollLeft / departmentStep())));
    const firstLabel = String(departmentFirst + 1).padStart(2, '0');
    const lastLabel = String(Math.min(departmentFirst + departmentVisible, departmentCards.length)).padStart(2, '0');
    $('#department-range').textContent = `${departmentVisible === 1 ? firstLabel : `${firstLabel}–${lastLabel}`} / ${departmentCards.length}`;
    $('#department-page').textContent = `${Math.floor(departmentFirst / departmentVisible) + 1} / ${Math.ceil(departmentCards.length / departmentVisible)}`;
  }
  function moveDepartments(direction) {
    syncDepartments();
    const last = Math.max(0, departmentCards.length - departmentVisible);
    const next = direction > 0
      ? (departmentFirst >= last ? 0 : Math.min(last, departmentFirst + departmentVisible))
      : (departmentFirst <= 0 ? last : Math.max(0, departmentFirst - departmentVisible));
    departmentTrack.scrollTo({left: next * departmentStep(), behavior: reducedMotion.matches ? 'instant' : 'smooth'});
  }
  $('#department-prev').addEventListener('click', () => moveDepartments(-1));
  $('#department-next').addEventListener('click', () => moveDepartments(1));
  departmentTrack.addEventListener('keydown', event => {
    if (event.key !== 'ArrowLeft' && event.key !== 'ArrowRight') return;
    event.preventDefault();
    departmentTrack.focus({preventScroll:true});
    moveDepartments(event.key === 'ArrowRight' ? 1 : -1);
  });
  departmentTrack.addEventListener('scroll', () => {
    clearTimeout(departmentScrollTimer);
    departmentScrollTimer = setTimeout(syncDepartments, 100);
  }, {passive:true});
  new ResizeObserver(syncDepartments).observe(departmentTrack);
  $('#department-toolbar').hidden = false;
  syncDepartments();

  // Native dialogs supply focus trapping, Escape handling and focus restoration.
  const searchDialog = $('#search-dialog');
  const imageDialog = $('#image-dialog');
  const videoDialog = $('#video-dialog');
  function openDialog(dialog) {
    dialog.showModal();
    document.body.classList.add('modal-open');
    updateTimer();
    updateAwardTimer();
  }
  $$('dialog').forEach(dialog => {
    $('.dialog-close', dialog).addEventListener('click', () => dialog.close());
    dialog.addEventListener('close', () => {
      document.body.classList.remove('modal-open');
      if (dialog === videoDialog) $('#video-player').replaceChildren();
      updateTimer();
      updateAwardTimer();
    });
    dialog.addEventListener('click', event => {
      const bounds = dialog.getBoundingClientRect();
      if (event.target === dialog && (event.clientX < bounds.left || event.clientX > bounds.right || event.clientY < bounds.top || event.clientY > bounds.bottom)) dialog.close();
    });
  });
  $$('[data-poster]').forEach(button => button.addEventListener('click', () => {
    $('#dialog-image').src = button.dataset.poster;
    $('#dialog-image').alt = button.dataset.posterTitle;
    $('#image-caption').textContent = button.dataset.posterTitle;
    openDialog(imageDialog);
  }));
  $$('[data-video]').forEach(button => button.addEventListener('click', () => {
    const videoId = button.dataset.video;
    if (!/^[\w-]{11}$/.test(videoId)) return;
    $('#video-caption').textContent = button.dataset.videoTitle;
    $('#video-fallback').href = `https://www.youtube.com/watch?v=${videoId}`;
    const player = document.createElement('iframe');
    player.src = `https://www.youtube-nocookie.com/embed/${videoId}?autoplay=1&rel=0`;
    player.title = button.dataset.videoTitle;
    player.allow = 'accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share';
    player.allowFullscreen = true;
    player.referrerPolicy = 'strict-origin-when-cross-origin';
    $('#video-player').replaceChildren(player);
    openDialog(videoDialog);
  }));

  // Activity albums: compact cover-and-title grid with a keyboard photo viewer.
  const albums = (window.SAVS_ALBUMS || []).filter(album => album.photos?.length);
  const albumDialog = $('#album-dialog');
  const albumImage = $('#album-image');
  let activeAlbum;
  let activePhoto = 0;
  function showAlbumPhoto(index) {
    activePhoto = (index + activeAlbum.photos.length) % activeAlbum.photos.length;
    const photo = activeAlbum.photos[activePhoto];
    $('#album-image-error').hidden = true;
    albumImage.hidden = false;
    albumImage.src = photo.src;
    albumImage.alt = photo.caption;
    $('#album-caption').textContent = photo.caption;
    $('#album-counter').textContent = `${activePhoto + 1} / ${activeAlbum.photos.length}`;
    $$('#album-thumbnails button').forEach((button, i) => button.setAttribute('aria-pressed', String(i === activePhoto)));
  }
  albumImage.addEventListener('error', () => { albumImage.hidden = true; $('#album-image-error').hidden = false; });
  function openAlbum(album) {
    activeAlbum = album;
    $('#album-category').textContent = `${album.category} · ${album.demo ? '示意相簿' : (album.date || '活動紀錄')}`;
    $('#album-title').textContent = album.title;
    $('#album-description').textContent = album.description;
    $('#album-thumbnails').replaceChildren(...album.photos.map((photo, index) => {
      const button = document.createElement('button');
      button.setAttribute('aria-label', `第 ${index + 1} 張：${photo.caption}`);
      const img = document.createElement('img');
      img.src = photo.src; img.alt = ''; img.loading = 'lazy';
      button.append(img);
      button.addEventListener('click', () => showAlbumPhoto(index));
      return button;
    }));
    $('#album-prev').disabled = $('#album-next').disabled = album.photos.length < 2;
    showAlbumPhoto(0);
    openDialog(albumDialog);
  }
  $('#album-prev').addEventListener('click', () => showAlbumPhoto(activePhoto - 1));
  $('#album-next').addEventListener('click', () => showAlbumPhoto(activePhoto + 1));
  albumDialog.addEventListener('keydown', event => {
    if (event.key !== 'ArrowLeft' && event.key !== 'ArrowRight') return;
    event.preventDefault();
    showAlbumPhoto(activePhoto + (event.key === 'ArrowRight' ? 1 : -1));
  });
  $('#activity-grid').replaceChildren(...albums.map(album => {
    const card = document.createElement('button');
    card.className = 'activity-card';
    card.setAttribute('aria-haspopup', 'dialog');
    card.setAttribute('aria-label', `開啟相簿：${album.title}${album.demo ? '，示意相簿' : ''}`);
    const img = document.createElement('img');
    img.src = album.photos[0].src;
    img.alt = album.photos[0].caption;
    img.loading = 'lazy'; img.width = 1000; img.height = 667;
    card.append(img, textElement('span', 'activity-title', album.title));
    card.addEventListener('click', () => openAlbum(album));
    return card;
  }));
  if (!albums.length) $('#activity-grid').append(textElement('p', 'search-empty', '精彩活動陸續整理中，敬請期待。'));

  // Search is intentionally local and never submits visitors' queries externally.
  const searchItems = [
    ...news.map(item => ({title:item.title, url:item.url, type:`校園公告 · ${item.date} · ${item.unit}`})),
    ...serviceGroups.flatMap(group => group.links.map(entry => ({title:entry.label, url:entry.url, type:`校園服務 · ${group.title}`, keywords:entry.aliases || ''}))),
    ...$$('.dropdown a, .department-card, .more-departments a').map(link => ({title:$('h3', link)?.textContent || link.textContent.trim(), url:link.getAttribute('href'), type:'探索蘇海'}))
  ].filter((item, index, all) => all.findIndex(other => other.title === item.title && other.url === item.url) === index);
  function renderSearch(query = '') {
    const result = $('#search-results');
    result.replaceChildren();
    const terms = query.trim().toLocaleLowerCase().split(/\s+/).filter(Boolean);
    const items = terms.length ? searchItems.filter(item => terms.every(term => `${item.title} ${item.type} ${item.keywords || ''}`.toLocaleLowerCase().includes(term))).slice(0, 20) : searchItems.filter(item => ['招生專區', '行事曆', '學習歷程', '成績查詢'].includes(item.title));
    if (!items.length) { result.append(textElement('p', 'search-empty', '找不到相符項目。試試「招生」、「行事曆」或「漁業科」。')); return; }
    items.forEach(item => {
      const a = document.createElement('a');
      a.href = item.url;
      const text = document.createElement('span');
      text.append(textElement('small', '', item.type), document.createTextNode(item.title));
      a.append(text, icon());
      externalLink(a);
      a.addEventListener('click', () => searchDialog.close());
      result.append(a);
    });
  }
  $$('.search-toggle').forEach(button => button.addEventListener('click', () => {
    $('#site-search').value = '';
    renderSearch();
    openDialog(searchDialog);
    $('#site-search').focus();
  }));
  $('#site-search').addEventListener('input', event => renderSearch(event.target.value));
  $$('a').forEach(externalLink);
})();
