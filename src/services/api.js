import axios from 'axios';

const OPEN_NOTIFY_ISS_URL = 'http://api.open-notify.org/iss-now.json';
const OPEN_NOTIFY_ASTRONAUTS_URL = 'http://api.open-notify.org/astros.json';

const PROXY_ENDPOINTS = [
  (targetUrl) => `https://api.allorigins.win/get?url=${encodeURIComponent(targetUrl)}`,
  (targetUrl) => `https://api.codetabs.com/v1/proxy?quest=${encodeURIComponent(targetUrl)}`,
  (targetUrl) => `https://r.jina.ai/http://${targetUrl.replace(/^https?:\/\//, '')}`,
];

const parseProxyPayload = (responseData) => {
  if (responseData == null) return null;

  if (typeof responseData === 'string') {
    const trimmed = responseData.trim();
    const firstBrace = trimmed.indexOf('{');
    const lastBrace = trimmed.lastIndexOf('}');
    if (firstBrace !== -1 && lastBrace !== -1) {
      const maybeJson = trimmed.slice(firstBrace, lastBrace + 1);
      try {
        return JSON.parse(maybeJson);
      } catch {
        return null;
      }
    }

    try {
      return JSON.parse(trimmed);
    } catch {
      return null;
    }
  }

  return responseData;
};

const proxyFetch = async (targetUrl) => {
  let lastError = null;

  for (const buildProxyUrl of PROXY_ENDPOINTS) {
    try {
      const proxyUrl = buildProxyUrl(targetUrl);
      const res = await axios.get(proxyUrl, { timeout: 15000 });

      if (typeof res.data?.contents === 'string') {
        const parsed = parseProxyPayload(res.data.contents);
        if (parsed) return parsed;
      }

      const parsed = parseProxyPayload(res.data);
      if (parsed) {
        if (parsed.contents) {
          const nested = parseProxyPayload(parsed.contents);
          if (nested) return nested;
        }
        return parsed;
      }
    } catch (err) {
      lastError = err;
    }
  }

  throw lastError || new Error(`Unable to fetch ${targetUrl}`);
};

// Haversine Formula for Distance Calculation (km)
export const calculateDistance = (pos1, pos2) => {
  const R = 6371; // Earth's radius
  const dLat = (pos2.lat - pos1.lat) * Math.PI / 180;
  const dLon = (pos2.lon - pos1.lon) * Math.PI / 180;
  const a = 
    Math.sin(dLat/2) * Math.sin(dLat/2) +
    Math.cos(pos1.lat * Math.PI / 180) * Math.cos(pos2.lat * Math.PI / 180) * 
    Math.sin(dLon/2) * Math.sin(dLon/2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
  return R * c;
};

// Speed Calculation (km/h)
export const calculateSpeed = (prev, curr) => {
  if (!prev || !curr) return 27600;
  const dist = calculateDistance(
    { lat: parseFloat(prev.iss_position.latitude), lon: parseFloat(prev.iss_position.longitude) },
    { lat: parseFloat(curr.iss_position.latitude), lon: parseFloat(curr.iss_position.longitude) }
  );
  const timeHours = (curr.timestamp - prev.timestamp) / 3600;
  if (timeHours <= 0) return 27600;
  return dist / timeHours;
};

// Fetch ISS Position
export const fetchISSPosition = async () => {
  try {
    return await proxyFetch(OPEN_NOTIFY_ISS_URL);
  } catch (err) {
    console.error('ISS Fetch Error:', err);
    throw err;
  }
};

// Fetch People in Space
export const fetchPeopleInSpace = async () => {
  try {
    return await proxyFetch(OPEN_NOTIFY_ASTRONAUTS_URL);
  } catch (err) {
    console.error('Astronaut Fetch Error:', err);
    return { number: 0, people: [] };
  }
};

const MOCK_NEWS = [
  { 
    title: 'Breakthrough in US-Iran Peace Negotiations', 
    description: 'Qatar reports a "high probability" of a peace deal aimed at ending long-standing conflict. Sources indicate a shift in regional strategy.', 
    url: 'https://www.cnn.com', 
    urlToImage: '', 
    source: { name: 'CNN Intelligence' }, 
    publishedAt: new Date().toISOString(), 
    author: 'Mission Control' 
  },
  { 
    title: '3-Day Russia-Ukraine Ceasefire Brokered', 
    description: 'A rare pause in conflict and prisoner exchange agreed upon for 72 hours. International observers are monitoring the frontlines.', 
    url: 'https://www.bbc.com', 
    urlToImage: '', 
    source: { name: 'BBC World' }, 
    publishedAt: new Date().toISOString(), 
    author: 'Global Desk' 
  },
  { 
    title: 'Victory Day Parade Scaled Back in Moscow', 
    description: 'President Putin addresses a downsized military parade in Red Square, reaffirming objectives while noting regional tensions.', 
    url: 'https://www.aljazeera.com', 
    urlToImage: '', 
    source: { name: 'Al Jazeera' }, 
    publishedAt: new Date().toISOString(), 
    author: 'News Analyst' 
  }
];

// News API with multiple source merging (Highly reliable & Diverse)
export const fetchNews = async (query = 'space', apiKey) => {
  try {
    // 1. If API Key is provided, use dedicated providers
    if (apiKey && !apiKey.startsWith('your')) {
      const url = apiKey.startsWith('pub_') 
        ? `https://newsdata.io/api/1/news?apikey=${apiKey}&q=${encodeURIComponent(query)}&language=en`
        : `https://newsapi.org/v2/everything?q=${encodeURIComponent(query)}&apiKey=${apiKey}`;
      const data = await proxyFetch(url);
      return (data.articles || data.results || []).map(normalizeArticle);
    }

    // 2. Default Multi-Source Engine (Merging for diversity and volume)
    const endpoints = [
      'https://saurav.tech/NewsAPI/everything/cnn.json',
      'https://saurav.tech/NewsAPI/everything/bbc-news.json',
      'https://saurav.tech/NewsAPI/top-headlines/category/technology/us.json',
      'https://saurav.tech/NewsAPI/top-headlines/category/general/us.json'
    ];

    const results = await Promise.allSettled(
      endpoints.map(url => axios.get(url, { timeout: 10000 }))
    );

    let allArticles = results
      .filter(r => r.status === 'fulfilled')
      .flatMap(r => r.value.data.articles || []);

    if (allArticles.length === 0) {
      console.warn('All sources failed, using fallback.');
      return MOCK_NEWS;
    }

    // Shuffling for freshness
    let normalized = allArticles.map(normalizeArticle).sort(() => Math.random() - 0.5);

    // Deep filtering for Space queries if requested
    if (query.toLowerCase().includes('space') || query.toLowerCase().includes('nasa')) {
      const q = query.toLowerCase();
      const filtered = normalized.filter(a => 
        a.title.toLowerCase().includes('space') || 
        a.description.toLowerCase().includes('space') ||
        a.title.toLowerCase().includes('nasa') ||
        a.title.toLowerCase().includes('starship') ||
        a.title.toLowerCase().includes('moon') ||
        a.title.toLowerCase().includes('iss')
      );
      if (filtered.length > 5) return filtered;
    }

    return normalized;
  } catch (err) {
    console.error('Unified News Fetch Error:', err);
    return MOCK_NEWS;
  }
};

const normalizeArticle = (item) => ({
  title: item.title || 'Mission Briefing Secure',
  description: item.description || item.content || 'Detailed data stream encrypted or unavailable for this report.',
  url: item.url || '#',
  urlToImage: item.urlToImage || item.image_url || item.og || '',
  source: { name: item.source?.name || item.source_id || 'Global Intel' },
  publishedAt: item.publishedAt || item.published_at || new Date().toISOString(),
  author: item.author || item.creator?.[0] || 'Mission Control'
});
