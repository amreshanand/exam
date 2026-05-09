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

// News API with saurav.tech (Free, No Key, Very Reliable)
export const fetchNews = async (query = 'space', apiKey) => {
  try {
    let url;
    
    // 1. Determine Source
    if (apiKey && !apiKey.startsWith('your')) {
      url = apiKey.startsWith('pub_') 
        ? `https://newsdata.io/api/1/news?apikey=${apiKey}&q=${encodeURIComponent(query)}&language=en`
        : `https://newsapi.org/v2/everything?q=${encodeURIComponent(query)}&apiKey=${apiKey}`;
    } else {
      // Use saurav.tech News API (Free, No Key, Reliable GitHub Pages host)
      // For space queries, we use a specific category or search everything
      const isSpace = query.toLowerCase().includes('space') || query.toLowerCase().includes('nasa');
      url = isSpace 
        ? `https://saurav.tech/NewsAPI/everything/cnn.json` // We can't query directly, so we pick a high-quality source
        : `https://saurav.tech/NewsAPI/top-headlines/category/general/us.json`;
    }
    
    // 2. Fetch Data
    // Saurav.tech is a static JSON host, so direct fetch is best
    let data;
    try {
      const res = await axios.get(url, { timeout: 8000 });
      data = res.data;
    } catch (err) {
      data = await proxyFetch(url);
    }
    
    // 3. Normalize different API response formats
    const raw = data.articles || data.results || data.contents?.articles || data.contents?.results || [];
    
    let results = raw.map(item => ({
      title: item.title || 'No Title',
      description: item.description || item.content || item.summary || 'No description available',
      url: item.url || item.link,
      urlToImage: item.urlToImage || item.image_url || item.og || '',
      source: { name: item.source?.name || item.source_id || 'Global News' },
      publishedAt: item.publishedAt || item.published_at || item.pubDate || new Date().toISOString(),
      author: item.author || item.creator?.[0] || 'Mission Control'
    }));

    // If it's a space query but we fetched CNN, filter for space keywords
    if (query.toLowerCase().includes('space') || query.toLowerCase().includes('nasa')) {
      const q = query.toLowerCase();
      const filtered = results.filter(a => 
        a.title.toLowerCase().includes('space') || 
        a.description.toLowerCase().includes('space') ||
        a.title.toLowerCase().includes('nasa') ||
        a.title.toLowerCase().includes('iss')
      );
      if (filtered.length > 0) results = filtered;
    }
    
    if (!results || results.length === 0) {
      console.warn('API returned no results, using fallback briefings.');
      return MOCK_NEWS;
    }

    return results;
  } catch (err) {
    console.error('News Fetch Error:', err);
    return MOCK_NEWS;
  }
};
