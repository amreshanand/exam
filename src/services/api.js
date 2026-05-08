import axios from 'axios';

// More reliable proxy format
const PROXY_URL = 'https://api.allorigins.win/get?url=';

const proxyFetch = async (targetUrl) => {
  const res = await axios.get(`${PROXY_URL}${encodeURIComponent(targetUrl)}`);
  // AllOrigins returns data in a 'contents' field as a string
  if (typeof res.data.contents === 'string') {
    return JSON.parse(res.data.contents);
  }
  return res.data.contents;
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
    return await proxyFetch('http://api.open-notify.org/iss-now.json');
  } catch (err) {
    console.error('ISS Fetch Error:', err);
    throw err;
  }
};

// Fetch People in Space
export const fetchPeopleInSpace = async () => {
  try {
    return await proxyFetch('http://api.open-notify.org/astros.json');
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
      const proxyRes = await axios.get(`${PROXY_URL}${encodeURIComponent(url)}`);
      res = { data: JSON.parse(proxyRes.data.contents) };
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
