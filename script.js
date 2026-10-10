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

  const base = 'https://www.savs.ilc.edu.tw/ischool/';
  const services = {
    students: [
      ['成績查詢', 'https://savs-ilc.k12ea.gov.tw/SCH_UI/'],
      ['學習歷程檔案', 'https://epf-mlife.k12ea.gov.tw/Portal.do'],
      ['校園行事曆', `${base}publish_page/27/?cid=692`],
      ['學生手冊', `${base}publish_page/4/?cid=62`],
      ['社團選填', 'https://kcsc.k12ea.gov.tw/#/login'],
      ['宿舍專區', `${base}publish_page/123/`]
    ],
    staff: [
      ['成績輸入', 'https://savs-ilc.k12ea.gov.tw/SCH_UI/'],
      ['差勤系統', 'https://pk12.cloudhr.tw/'],
      ['網路請購', 'https://eipnsh.k12ea.gov.tw/'],
      ['線上報修', `${base}public/repair/index.php?bid=8`],
      ['會議紀錄', `${base}publish_page/27/?cid=691`],
      ['教師在職進修', 'https://www3.inservice.edu.tw/index2-3.aspx']
    ],
    families: [
      ['招生專區', `${base}publish_page/117/`],
      ['新生專區', `${base}publish_page/115/`],
      ['完全免試入學', `${base}publish_page/49?cid=1493`],
      ['入學獎學金', `${base}publish_page/117?cid=2551`],
      ['交通路線', `${base}publish_page/0?cid=1232`],
      ['家長會', `${base}publish_page/22`]
    ]
  };
  const serviceTabs = $$('.service-tabs [role="tab"]');
  function activateService(tab) {
    if (!tab) return;
    setTabState(serviceTabs, tab, $('#service-panel'));
    const links = services[tab.dataset.service];
    const panel = $('#service-links');
    panel.replaceChildren();
    links.forEach(([label, url]) => {
      const a = document.createElement('a');
      a.href = url;
      a.append(textElement('span', '', label), icon());
      externalLink(a);
      panel.append(a);
    });
  }
  serviceTabs.forEach(tab => tab.addEventListener('click', () => activateService(tab)));
  keyboardTabs(serviceTabs, activateService);
  $$('[data-audience]').forEach(link => link.addEventListener('click', () => {
    activateService(serviceTabs.find(tab => tab.dataset.service === link.dataset.audience));
  }));
  activateService(serviceTabs[0]);

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
    if (!paused && !hoverPause && heroVisible && !document.hidden && !hero.contains(document.activeElement)) {
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

  // Native dialogs supply focus trapping, Escape handling and focus restoration.
  const searchDialog = $('#search-dialog');
  const imageDialog = $('#image-dialog');
  function openDialog(dialog) { dialog.showModal(); document.body.classList.add('modal-open'); }
  $$('dialog').forEach(dialog => {
    $('.dialog-close', dialog).addEventListener('click', () => dialog.close());
    dialog.addEventListener('close', () => document.body.classList.remove('modal-open'));
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

  // Search is intentionally local and never submits visitors' queries externally.
  const searchItems = [
    ...news.map(item => ({title:item.title, url:item.url, type:`校園公告 · ${item.date} · ${item.unit}`})),
    ...Object.entries(services).flatMap(([, entries]) => entries.map(([title, url]) => ({title, url, type:'常用服務'}))),
    ...$$('.dropdown a, .department-card, .more-departments a').map(link => ({title:$('h3', link)?.textContent || link.textContent.trim(), url:link.getAttribute('href'), type:'探索蘇海'}))
  ].filter((item, index, all) => all.findIndex(other => other.title === item.title && other.url === item.url) === index);
  function renderSearch(query = '') {
    const result = $('#search-results');
    result.replaceChildren();
    const terms = query.trim().toLocaleLowerCase().split(/\s+/).filter(Boolean);
    const items = terms.length ? searchItems.filter(item => terms.every(term => `${item.title} ${item.type}`.toLocaleLowerCase().includes(term))).slice(0, 20) : searchItems.filter(item => ['招生專區', '校園行事曆', '學習歷程檔案', '成績查詢'].includes(item.title));
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
