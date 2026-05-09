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
    title: 'Global Quantum Communication Network Reaches Critical Milestone',
    description: 'Researchers have successfully demonstrated long-range quantum entanglement across satellite links, paving the way for an unhackable global internet.',
    url: '#',
    urlToImage: 'https://images.unsplash.com/photo-1635070041078-e363dbe005cb?q=80&w=800&auto=format&fit=crop',
    source: { name: 'Tech Intel' },
    publishedAt: new Date().toISOString(),
    author: 'Dr. Sarah Chen'
  },
  {
    title: 'New Lunar Habitat Modules Arrive at Gateway Station',
    description: 'The latest shipment of pressurized habitats has docked with the Lunar Gateway, expanding living space for upcoming Artemis surface missions.',
    url: '#',
    urlToImage: 'https://images.unsplash.com/photo-1446776811953-b23d57bd21aa?q=80&w=800&auto=format&fit=crop',
    source: { name: 'NASA Space Operations' },
    publishedAt: new Date().toISOString(),
    author: 'Commander James Holden'
  },
  {
    title: 'Breakthrough in Fusion Energy Stability Reported',
    description: 'A record-breaking 300-second plasma sustainment has been achieved at the international fusion reactor, bringing clean energy closer to reality.',
    url: '#',
    urlToImage: 'https://images.unsplash.com/photo-1518152006812-edab29b069ac?q=80&w=800&auto=format&fit=crop',
    source: { name: 'Energy News' },
    publishedAt: new Date().toISOString(),
    author: 'Elena Vance'
  }
];

// High-reliability news fetching engine with multi-stage fallback
export const fetchNews = async (query = 'space', apiKey) => {
  const normalize = (item) => ({
    title: item.title || 'Mission Briefing Secure',
    description: item.description || item.content || item.summary || 'Detailed data stream encrypted or unavailable.',
    url: item.url || item.link || '#',
    urlToImage: item.urlToImage || item.image_url || item.og || item.enclosure?.link || '',
    source: { name: item.source?.name || item.source_id || 'Global Intel' },
    publishedAt: item.publishedAt || item.published_at || item.pubDate || new Date().toISOString(),
    author: item.author || item.creator?.[0] || 'Mission Control'
  });

  const safeFetch = async (url) => {
    try {
      const res = await fetch(url);
      if (!res.ok) return null;
      return await res.json();
    } catch (e) { return null; }
  };

  try {
    // 1. If API Key is provided
    if (apiKey && !apiKey.startsWith('your')) {
      const url = apiKey.startsWith('pub_') 
        ? `https://newsdata.io/api/1/news?apikey=${apiKey}&q=${encodeURIComponent(query)}&language=en`
        : `https://newsapi.org/v2/everything?q=${encodeURIComponent(query)}&apiKey=${apiKey}`;
      const data = await safeFetch(url);
      if (data) return (data.articles || data.results || []).map(normalize);
    }

    // 2. Primary: Diverse Multi-Source (Parallel)
    const sources = [
      'https://saurav.tech/NewsAPI/top-headlines/category/general/us.json',
      'https://saurav.tech/NewsAPI/everything/bbc-news.json',
      'https://saurav.tech/NewsAPI/everything/cnn.json'
    ];

    const results = await Promise.all(sources.map(s => safeFetch(s)));
    const all = results.filter(r => r && r.articles).flatMap(r => r.articles);
    
    if (all.length > 0) {
      return all.map(normalize).sort(() => Math.random() - 0.5);
    }

    // 3. Fallback: SNAPI (Space Specific)
    const snapi = await safeFetch('https://api.spaceflightnewsapi.net/v4/articles/?limit=20');
    if (snapi && snapi.results) {
      return snapi.results.map(item => ({
        ...normalize(item),
        source: { name: item.news_site || 'Space Intel' },
        urlToImage: item.image_url
      }));
    }

    // 4. Emergency: Global News via Proxy
    const rss = await safeFetch('https://api.rss2json.com/v1/api.json?rss_url=https%3A%2F%2Fnews.google.com%2Frss%3Fhl%3Den-US%26gl%3DUS%26ceid%3DUS%3Aen');
    if (rss && rss.items) return rss.items.map(normalize);

    return MOCK_NEWS;
  } catch (err) {
    console.error('Unified News Fetch Error:', err);
    return MOCK_NEWS;
  }
};
