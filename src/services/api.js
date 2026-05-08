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

// News API
export const fetchNews = async (query = 'space', apiKey) => {
  if (!apiKey || apiKey.startsWith('your')) return [];
  try {
    const url = apiKey.startsWith('pub_') 
      ? `https://newsdata.io/api/1/news?apikey=${apiKey}&q=${encodeURIComponent(query)}&language=en`
      : `https://newsapi.org/v2/everything?q=${encodeURIComponent(query)}&apiKey=${apiKey}`;
    
    // News APIs usually handle CORS themselves or need a different proxy approach
    // We'll try direct first, then proxy
    let res;
    try {
      res = await axios.get(url);
    } catch {
      const data = await proxyFetch(url);
      res = { data };
    }

    const results = res.data.articles || res.data.results || [];
    
    return results.map(item => ({
      title: item.title || 'No Title',
      description: item.description || item.content || 'No description available',
      url: item.url || item.link,
      urlToImage: item.urlToImage || item.image_url,
      source: { name: item.source?.name || item.source_id || 'Space News' },
      publishedAt: item.publishedAt || item.pubDate,
      author: item.author || item.creator?.[0] || 'Mission Control'
    }));
  } catch (err) {
    console.error('News Fetch Error:', err);
    return [];
  }
};
