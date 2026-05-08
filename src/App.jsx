import { useEffect, useCallback, useRef } from 'react';
import { Toaster, toast } from 'react-hot-toast';
import { Sun, Moon, ChevronUp } from 'lucide-react';
import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

import { useStore } from './store/useStore';
import { fetchISSPosition, fetchPeopleInSpace, fetchNews, calculateSpeed } from './services/api';

import ISSMap from './components/ISSMap';
import ISSStats from './components/ISSStats';
import SpeedChart from './components/SpeedChart';
import NewsChart from './components/NewsChart';
import NewsPanel from './components/NewsPanel';
import AIChat from './components/AIChat';
import AstronautPanel from './components/AstronautPanel';

const ISS_POLL_MS = 10000;
const NEWS_CACHE_MS = 15 * 60 * 1000; // 15 minutes

export default function App() {
  const {
    isDark, toggleTheme,
    issPosition, setISSPosition, addSpeedEntry, setISSLoading,
    setAstronauts, setAstronautsLoading,
    articles, setArticles, setNewsLoading, newsLastFetched,
  } = useStore();

  const [showScrollTop, setShowScrollTop] = useState(false);
  const prevPosRef = useRef(null);
  const pollRef = useRef(null);

  // Apply theme
  useEffect(() => {
    document.documentElement.classList.toggle('light', !isDark);
  }, [isDark]);

  // Scroll-to-top button
  useEffect(() => {
    const handler = () => setShowScrollTop(window.scrollY > 400);
    window.addEventListener('scroll', handler);
    return () => window.removeEventListener('scroll', handler);
  }, []);

  // Core data fetcher
  const fetchAllData = useCallback(async (isFirstLoad = false) => {
    if (isFirstLoad) setISSLoading(true);

    try {
      // 1. Fetch ISS Position
      const issData = await fetchISSPosition();
      if (issData?.message === 'success') {
        // Add current timestamp to the data for speed calculation
        const dataWithTime = { ...issData, timestamp: Date.now() };

        if (prevPosRef.current) {
          const speed = calculateSpeed(prevPosRef.current, dataWithTime);
          addSpeedEntry({ speed, time: Date.now() });
        }
        prevPosRef.current = dataWithTime;
        setISSPosition(dataWithTime);
      }
    } catch (err) {
      if (isFirstLoad) toast.error('ISS connection failed — retrying…');
    } finally {
      if (isFirstLoad) setISSLoading(false);
    }

    // 2. Fetch Astronauts (only on first load)
    if (isFirstLoad) {
      setAstronautsLoading(true);
      try {
        const astroData = await fetchPeopleInSpace();
        setAstronauts(astroData);
      } catch {
        setAstronauts({ number: 0, people: [] });
      } finally {
        setAstronautsLoading(false);
      }
    }

    // 3. Fetch News (only if cache expired or first load)
    const cacheExpired = !newsLastFetched || (Date.now() - newsLastFetched > NEWS_CACHE_MS);
    if (isFirstLoad || cacheExpired) {
      setNewsLoading(true);
      try {
        const apiKey = import.meta.env.VITE_NEWS_API_KEY;
        const newsData = await fetchNews('space nasa iss spacex', apiKey);
        if (newsData?.length > 0) {
          setArticles(newsData);
          if (isFirstLoad) toast.success(`Loaded ${newsData.length} articles`);
        }
      } catch {
        // silent fail — keep existing articles
      } finally {
        setNewsLoading(false);
      }
    }
  }, [newsLastFetched]);

  // Start polling
  useEffect(() => {
    fetchAllData(true);
    pollRef.current = setInterval(() => fetchAllData(false), ISS_POLL_MS);
    return () => clearInterval(pollRef.current);
  }, []);

  return (
    <div className="min-h-screen pb-24" style={{ background: 'var(--bg)' }}>
      <Toaster position="top-right" toastOptions={{ style: { borderRadius: '12px', fontSize: '13px' } }} />

      {/* Header */}
      <header className="max-w-[1600px] mx-auto px-6 pt-8 mb-6 flex justify-between items-start">
        <div>
          <div className="text-[10px] font-bold orbitron tracking-[0.2em] mb-1 text-blue-500">
            MISSION CONTROL DASHBOARD
          </div>
          <h1 className="text-3xl font-black" style={{ color: 'var(--text-primary)' }}>
            Real-Time ISS and News Intelligence
          </h1>
        </div>
        <button
          onClick={toggleTheme}
          className="flex items-center gap-2 text-xs px-4 py-2 rounded-xl border border-[var(--border)] hover:border-blue-400 transition-all"
          style={{ color: 'var(--text-secondary)', background: 'var(--card-bg)' }}
        >
          {isDark ? <Sun size={14} /> : <Moon size={14} />}
          Switch to {isDark ? 'Light' : 'Dark'}
        </button>
      </header>

      <main className="max-w-[1600px] mx-auto px-6 space-y-6">
        {/* Row 1: ISS Live Tracking + Right Panel */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* ISS Tracking Column */}
          <div className="lg:col-span-8">
            <div className="card p-6">
              <div className="flex items-center justify-between mb-5">
                <h2 className="text-lg font-bold" style={{ color: 'var(--text-primary)' }}>ISS Live Tracking</h2>
                <div className="flex items-center gap-3">
                  <button
                    onClick={() => fetchAllData(true)}
                    className="text-[11px] px-4 py-1.5 rounded-lg border border-[var(--border)] hover:border-blue-400 transition-all"
                    style={{ color: 'var(--text-secondary)' }}
                  >
                    Refresh Now
                  </button>
                  <span className="text-[11px] font-bold text-green-500 flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse inline-block" />
                    Auto-Refresh: ON
                  </span>
                </div>
              </div>
              <ISSStats />
              <div className="mt-5 rounded-xl overflow-hidden border border-[var(--border)]" style={{ height: 340 }}>
                <ISSMap />
              </div>
            </div>
          </div>

          {/* Right Column: Charts + Astronauts */}
          <div className="lg:col-span-4 space-y-6">
            <SpeedChart />
            <AstronautPanel />
            <NewsChart />
          </div>
        </div>

        {/* Row 2: Breaking News */}
        <NewsPanel />
      </main>

      {/* AI Chat */}
      <AIChat />

      {/* Scroll to top */}
      <AnimatePresence>
        {showScrollTop && (
          <motion.button
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
            className="fixed bottom-24 left-6 z-40 w-10 h-10 rounded-xl border border-[var(--border)] flex items-center justify-center"
            style={{ background: 'var(--card-bg)', color: 'var(--text-secondary)' }}
          >
            <ChevronUp size={18} />
          </motion.button>
        )}
      </AnimatePresence>
    </div>
  );
}
