const CATEGORY_META = {
  us:         { label: 'US News',           cls: 'cat-us' },
  global:     { label: 'Global News',       cls: 'cat-global' },
  finance:    { label: 'Finance / Markets', cls: 'cat-finance' },
  sports:     { label: 'Sports',            cls: 'cat-sports' },
  technology: { label: 'Technology',        cls: 'cat-technology' },
  disruption: { label: 'Disruption',        cls: 'cat-disruption' },
  risks:      { label: 'Risks',             cls: 'cat-risks' },
};

const ORDER = ['us','global','finance','sports','technology','disruption','risks'];

function fmtTime(iso) {
  if (!iso) return '';
  try {
    return new Date(iso).toLocaleString(undefined, {
      month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit',
    });
  } catch { return iso; }
}

function renderSkeletons() {
  const grid = document.getElementById('grid');
  grid.innerHTML = '';
  for (let i = 0; i < 7; i++) {
    const card = document.createElement('div');
    card.className = 'skeleton-card';
    card.innerHTML = `
      <div class="skeleton-line wide" style="margin-bottom:16px"></div>
      <div class="skeleton-line"></div>
      <div class="skeleton-line medium"></div>
      <div class="skeleton-line"></div>
      <div class="skeleton-line short"></div>
      <div class="skeleton-line"></div>
      <div class="skeleton-line medium"></div>
    `;
    grid.appendChild(card);
  }
}

function renderCategories(data) {
  const grid = document.getElementById('grid');
  grid.innerHTML = '';
  for (const key of ORDER) {
    const meta     = CATEGORY_META[key];
    const catData  = (data.categories || {})[key] || {};
    const articles = catData.articles || [];
    const err      = catData.error;
    const card = document.createElement('div');
    card.className = `card ${meta.cls}`;
    const hdr = document.createElement('div');
    hdr.className = 'card-header';
    hdr.innerHTML = `<div class="dot"></div><h2>${meta.label}</h2>`;
    card.appendChild(hdr);
    if (err && !articles.length) {
      const e = document.createElement('div');
      e.className = 'error-msg';
      e.textContent = 'Could not load: ' + err;
      card.appendChild(e);
    } else if (!articles.length) {
      const e = document.createElement('div');
      e.className = 'error-msg';
      e.textContent = 'No articles found.';
      card.appendChild(e);
    } else {
      articles.forEach((a, i) => {
        const div = document.createElement('div');
        div.className = 'article';
        const num = document.createElement('div');
        num.className = 'article-num';
        num.textContent = `#${i + 1}`;
        const title = document.createElement('div');
        title.className = 'article-title';
        const link = document.createElement('a');
        link.href = a.url;
        link.target = '_blank';
        link.rel = 'noopener noreferrer';
        link.textContent = a.title || 'Untitled';
        title.appendChild(link);
        const metaEl = document.createElement('div');
        metaEl.className = 'article-meta';
        const parts = [];
        if (a.source) parts.push(a.source);
        if (a.publishedAt) parts.push(fmtTime(a.publishedAt));
        metaEl.textContent = parts.join(' • ');
        div.appendChild(num);
        div.appendChild(title);
        div.appendChild(metaEl);
        if (a.summary) {
          const sum = document.createElement('div');
          sum.className = 'article-summary';
          sum.textContent = a.summary;
          div.appendChild(sum);
        }
        card.appendChild(div);
      });
    }
    grid.appendChild(card);
  }
}

async function loadNews() {
  const metaEl = document.getElementById('meta');
  const errEl  = document.getElementById('top-error');
  const btn    = document.getElementById('refresh-btn');
  metaEl.textContent = 'Fetching latest headlines...';
  errEl.style.display = 'none';
  btn.disabled = true;
  renderSkeletons();
  try {
    const res = await fetch('/api/news', { cache: 'no-store' });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const data = await res.json();
    if (data.error) throw new Error(data.error);
    metaEl.textContent = 'Last updated: ' + fmtTime(data.generatedAt);
    renderCategories(data);
  } catch (err) {
    console.error(err);
    metaEl.textContent = '';
    errEl.style.display = 'block';
    errEl.textContent = 'Failed to load news: ' + err.message;
  } finally {
    btn.disabled = false;
  }
}

document.addEventListener('DOMContentLoaded', loadNews);
