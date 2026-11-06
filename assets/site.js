(() => {
  'use strict';
  const root = document.documentElement;
  const themeButton = document.querySelector('.theme-toggle');
  const syncTheme = () => {
    const dark = root.dataset.theme === 'dark';
    themeButton.textContent = dark ? '☾' : '☼';
    themeButton.setAttribute('aria-label', dark ? '切换到浅色主题' : '切换到深色主题');
  };
  syncTheme();
  themeButton.addEventListener('click', () => {
    root.dataset.theme = root.dataset.theme === 'dark' ? 'light' : 'dark';
    try { localStorage.setItem('sp-theme', root.dataset.theme); } catch (_) {}
    syncTheme();
  });
  const menu = document.querySelector('.menu-toggle');
  const navigation = document.querySelector('.main-nav');
  const closeMenu = () => {
    menu.setAttribute('aria-expanded', 'false');
    menu.setAttribute('aria-label', '打开导航');
    navigation.classList.remove('nav-open');
  };
  menu.addEventListener('click', () => {
    const open = menu.getAttribute('aria-expanded') !== 'true';
    menu.setAttribute('aria-expanded', String(open));
    menu.setAttribute('aria-label', open ? '关闭导航' : '打开导航');
    navigation.classList.toggle('nav-open', open);
  });
  document.addEventListener('keydown', event => {
    if (event.key === 'Escape' && menu.getAttribute('aria-expanded') === 'true') { closeMenu(); menu.focus(); }
  });
  document.addEventListener('click', event => { if (!event.target.closest('.topbar')) closeMenu(); });

  const cards = [...document.querySelectorAll('#garden-grid .entry-card')];
  if (document.querySelector('#garden-grid')) {
    const queryKeys = ['type', 'category', 'tag', 'topic', 'stage'];
    const readState = () => {
      const params = new URLSearchParams(location.search);
      const state = Object.fromEntries(queryKeys.map(key => [key, params.get(key) || '']));
      if (!['article', 'note', 'essay', 'journal'].includes(state.type)) state.type = '';
      if (!['seedling', 'growing', 'evergreen'].includes(state.stage)) state.stage = '';
      return state;
    };
    let state = readState();
    const apply = () => {
      let shown = 0;
      for (const card of cards) {
        const tags = JSON.parse(card.dataset.entryTags);
        const visible = (!state.type || card.dataset.entryType === state.type)
          && (!state.category || card.dataset.entryCategory === state.category)
          && (!state.tag || tags.includes(state.tag))
          && (!state.topic || card.dataset.entryTopic === state.topic)
          && (!state.stage || card.dataset.entryStage === state.stage);
        card.hidden = !visible;
        if (visible) shown++;
      }
      document.querySelectorAll('.filter-group button[data-type]').forEach(button => {
        const selected = button.dataset.type === (state.type || 'all');
        button.classList.toggle('is-selected', selected);
        button.setAttribute('aria-pressed', String(selected));
      });
      document.querySelectorAll('.category-filters button[data-category]').forEach(button => {
        const selected = button.dataset.category === state.category;
        button.classList.toggle('is-selected', selected);
        button.setAttribute('aria-pressed', String(selected));
      });
      const topics = {tech: '技术实践', thinking: '阅读与思考', life: '日常生活'};
      const context = [state.tag && `标签「${state.tag}」`, state.topic && topics[state.topic], state.category].filter(Boolean).join(' · ');
      document.querySelector('#filter-summary').textContent = `${context ? context + ' · ' : ''}显示 ${shown} / ${cards.length} 则记录`;
      document.querySelector('#stage-filter').value = state.stage || 'all';
      document.querySelector('.empty-filter').hidden = shown > 0;
      document.querySelector('.reset-filters').hidden = !queryKeys.some(key => state[key]);
    };
    const update = () => {
      const params = new URLSearchParams();
      queryKeys.forEach(key => { if (state[key]) params.set(key, state[key]); });
      history.pushState(null, '', location.pathname + (params.size ? '?' + params : ''));
      apply();
    };
    document.querySelectorAll('.filter-group button[data-type]').forEach(button => button.addEventListener('click', () => {
      state.type = button.dataset.type === 'all' ? '' : button.dataset.type;
      update();
    }));
    const toggle = document.querySelector('.filter-toggle');
    toggle.addEventListener('click', () => {
      const panel = document.querySelector('.category-filters');
      panel.hidden = !panel.hidden;
      toggle.setAttribute('aria-expanded', String(!panel.hidden));
    });
    document.querySelectorAll('.category-filters button[data-category]').forEach(button => button.addEventListener('click', () => {
      state.category = state.category === button.dataset.category ? '' : button.dataset.category;
      update();
    }));
    document.querySelector('#stage-filter').addEventListener('change', event => {
      state.stage = event.target.value === 'all' ? '' : event.target.value;
      update();
    });
    document.querySelector('.reset-filters').addEventListener('click', () => {
      state = Object.fromEntries(queryKeys.map(key => [key, '']));
      update();
    });
    window.addEventListener('popstate', () => { state = readState(); apply(); });
    apply();
  }

  const searchForm = document.querySelector('#search-form');
  if (searchForm) {
    const input = document.querySelector('#search-input');
    const hint = document.querySelector('#search-hint');
    const results = document.querySelector('#search-results');
    const normalize = value => value.normalize('NFKC').toLocaleLowerCase();
    let indexPromise;
    let revision = 0;
    const runSearch = async () => {
      const current = ++revision;
      const query = input.value.trim();
      const params = new URLSearchParams();
      if (query) params.set('q', query);
      history.replaceState(null, '', location.pathname + (params.size ? '?' + params : ''));
      results.replaceChildren();
      if (!query) { hint.textContent = '输入关键词开始搜索。'; return; }
      hint.textContent = '正在搜索公开笔记…';
      try {
        indexPromise ||= fetch('/search-index.json').then(response => {
          if (!response.ok) throw new Error('Search index unavailable');
          return response.json();
        }).catch(error => { indexPromise = undefined; throw error; });
        const index = await indexPromise;
        if (current !== revision) return;
        const terms = normalize(query).split(/\s+/).filter(Boolean);
        const found = index.map(item => {
          const text = normalize([item.title, item.summary, item.category, ...item.tags, item.text].join(' '));
          const score = terms.reduce((sum, term) => sum + (normalize(item.title).includes(term) ? 3 : 0) + (normalize(item.tags.join(' ')).includes(term) ? 1 : 0), 0);
          return {item, score, match: terms.every(term => text.includes(term))};
        }).filter(result => result.match).sort((a,b) => b.score - a.score);
        for (const {item} of found) {
          const link = document.createElement('a');
          link.className = 'search-result';
          link.href = item.href;
          const meta = document.createElement('span'); meta.textContent = `${item.category} · ${item.date}`;
          const title = document.createElement('strong'); title.textContent = item.title;
          const summary = document.createElement('p'); summary.textContent = item.summary;
          link.append(meta, title, summary); results.append(link);
        }
        hint.textContent = found.length ? `找到 ${found.length} 则记录。` : '还没有找到相关记录，试试其他关键词。';
      } catch (_) {
        if (current === revision) hint.textContent = '搜索暂时不可用，请稍后重试。';
      }
    };
    let timer;
    input.addEventListener('input', () => { clearTimeout(timer); timer = setTimeout(runSearch, 150); });
    searchForm.addEventListener('submit', event => { event.preventDefault(); clearTimeout(timer); runSearch(); });
    input.value = new URLSearchParams(location.search).get('q') || '';
    if (input.value) runSearch();
  }

  const copyText = async text => {
    if (!navigator.clipboard) return false;
    try { await navigator.clipboard.writeText(text); return true; } catch (_) { return false; }
  };
  document.querySelectorAll('.prose pre').forEach(pre => {
    const code = pre.querySelector('code') || pre;
    const button = document.createElement('button');
    button.type = 'button'; button.className = 'copy-code'; button.textContent = '复制';
    button.setAttribute('aria-label', '复制代码');
    button.addEventListener('click', async () => {
      const ok = await copyText(code.textContent);
      button.textContent = ok ? '已复制' : '请选中复制';
      setTimeout(() => { button.textContent = '复制'; }, 1800);
    });
    const wrapper = pre.closest('.codehilite') || pre.parentElement.insertBefore(document.createElement('div'), pre);
    wrapper.classList.add('code-block');
    if (!wrapper.contains(pre)) wrapper.append(pre);
    wrapper.append(button);
  });
  document.querySelector('.copy-page-link')?.addEventListener('click', async event => {
    event.currentTarget.textContent = await copyText(location.href.split('#')[0]) ? '链接已复制' : '请从地址栏复制';
  });
})();
