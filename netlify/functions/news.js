exports.handler = async function() {
  const API_KEY = process.env.NEWSDATA_API_KEY;
  if (!API_KEY) {
    return {
      statusCode: 500,
      body: JSON.stringify({ error: 'NEWSDATA_API_KEY env var not set' }),
    };
  }

  const BASE = 'https://newsdata.io/api/1/latest';

  const CATEGORIES = {
    us:          { category: 'top',        country: 'us', q: null },
    global:      { category: 'world',      country: null, q: null },
    finance:     { category: 'business',   country: null, q: 'stock market OR economy OR Fed OR earnings' },
    sports:      { category: 'sports',     country: null, q: null },
    technology:  { category: 'technology', country: null, q: null },
    disruption:  { category: 'technology', country: null, q: 'AI OR startup OR disruption OR breakthrough OR innovation' },
    risks:       { category: 'politics',   country: null, q: 'risk OR crisis OR conflict OR threat OR war OR recession' },
  };

  function summarize(article, maxLen) {
    maxLen = maxLen || 240;
    var text = article.description || article.content || '';
    if (!text) return '';
    var clean = text.replace(/\s+/g, ' ').trim();
    if (clean.length <= maxLen) return clean;
    return clean.slice(0, maxLen).replace(/\s+\S*$/, '') + '...';
  }

  async function fetchCategory(name, cfg, limit) {
    limit = limit || 5;
    var params = new URLSearchParams({ apikey: API_KEY, language: 'en', size: '10' });
    if (cfg.category) params.set('category', cfg.category);
    if (cfg.country)  params.set('country',  cfg.country);
    if (cfg.q)        params.set('q',        cfg.q);
    var url = BASE + '?' + params.toString();
    try {
      var res  = await fetch(url);
      var data = await res.json();
      if (data.status !== 'success') {
        return { name: name, articles: [], error: data.message || 'API error' };
      }
      var articles = (data.results || [])
        .filter(function(a) { return a.title && a.link; })
        .slice(0, limit)
        .map(function(a) {
          return {
            title:       a.title,
            url:         a.link,
            source:      a.source_name || a.source_id || '',
            publishedAt: a.pubDate || '',
            summary:     summarize(a),
          };
        });
      return { name: name, articles: articles };
    } catch(err) {
      return { name: name, articles: [], error: err.message };
    }
  }

  var entries = Object.keys(CATEGORIES).map(function(k) { return [k, CATEGORIES[k]]; });
  var results = await Promise.all(
    entries.map(function(e) { return fetchCategory(e[0], e[1], 5); })
  );

  var categories = {};
  results.forEach(function(r) {
    categories[r.name] = { articles: r.articles, error: r.error || null };
  });

  return {
    statusCode: 200,
    headers: {
      'Content-Type': 'application/json',
      'Access-Control-Allow-Origin': '*',
    },
    body: JSON.stringify({
      generatedAt: new Date().toISOString(),
      categories: categories,
    }),
  };
};
