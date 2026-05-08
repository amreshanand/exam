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

  // Core data fetcher - optimized for parallel non-blocking execution
  const fetchAllData = useCallback(async (isFirstLoad = false) => {
    // Only show loading if we have NO cached data
    if (isFirstLoad && !issPosition) setISSLoading(true);

    const fetchISS = async () => {
      try {
        const issData = await fetchISSPosition();
        if (issData?.message === 'success') {
          const dataWithTime = { ...issData, timestamp: Date.now() };
          if (prevPosRef.current) {
            const speed = calculateSpeed(prevPosRef.current, dataWithTime);
            addSpeedEntry({ speed, time: Date.now() });
          }
          prevPosRef.current = dataWithTime;
          setISSPosition(dataWithTime);
        }
      } catch (err) {
        if (isFirstLoad) console.warn('ISS connection failed — retrying…');
      } finally {
        setISSLoading(false);
      }
    };

    const fetchAstros = async () => {
      if (!isFirstLoad) return;
      setAstronautsLoading(true);
      try {
        const astroData = await fetchPeopleInSpace();
        setAstronauts(astroData);
      } catch {
        // Fallback to existing or mock
      } finally {
        setAstronautsLoading(false);
      }
    };

    const fetchNewsData = async () => {
      const cacheExpired = !newsLastFetched || (Date.now() - newsLastFetched > NEWS_CACHE_MS);
      if (isFirstLoad || cacheExpired) {
        setNewsLoading(true);
        try {
          const apiKey = import.meta.env.VITE_NEWS_API_KEY;
          const newsData = await fetchNews('space nasa iss spacex', apiKey);
          setArticles(newsData);
          if (isFirstLoad && newsData.length > 0) {
            toast.success(`Intelligence Sync: ${newsData.length} reports`, { icon: '🚀' });
          }
        } catch {
          // silent fail
        } finally {
          setNewsLoading(false);
        }
      }
    };

    // Execute all in parallel without blocking each other
    await Promise.allSettled([
      fetchISS(),
      fetchAstros(),
      fetchNewsData()
    ]);
  }, [newsLastFetched, issPosition]);

  // Start polling
  useEffect(() => {
    fetchAllData(true);
    pollRef.current = setInterval(() => fetchAllData(false), ISS_POLL_MS);
    return () => clearInterval(pollRef.current);
  }, []);

  return (
    <div className="min-h-screen pb-24 selection:bg-blue-500/30">
      <Toaster position="top-right" toastOptions={{ style: { background: '#121826', color: '#F0F6FC', border: '1px solid rgba(56, 139, 253, 0.2)', borderRadius: '12px', fontSize: '13px' } }} />

      {/* Header */}
      <header className="max-w-[1600px] mx-auto px-8 pt-10 mb-10 flex flex-col md:flex-row justify-between items-center md:items-end gap-6">
        <motion.div 
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          className="text-center md:text-left"
        >
          <div className="flex items-center gap-2 justify-center md:justify-start mb-2">
            <div className="w-2 h-2 rounded-full bg-blue-500 animate-pulse" />
            <span className="text-[10px] font-black orbitron tracking-[0.3em] text-blue-500/80">
              EST. 1998 • LOW EARTH ORBIT
            </span>
          </div>
          <h1 className="text-4xl md:text-5xl font-black tracking-tight leading-tight mb-2">
            Mission <span className="gradient-text">Control</span> Center
          </h1>
          <p className="text-sm font-semibold text-[var(--text-secondary)] max-w-lg">
            Real-time orbital telemetry and space intelligence processing for the International Space Station.
          </p>
        </motion.div>

        <motion.div 
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          className="flex items-center gap-4"
        >
          <div className="hidden lg:flex flex-col items-end mr-4">
            <span className="text-[10px] font-bold text-[var(--text-muted)] uppercase tracking-widest">System Status</span>
            <span className="text-xs font-black text-green-500 flex items-center gap-2">
              ALL SYSTEMS NOMINAL <span className="w-1.5 h-1.5 rounded-full bg-green-500" />
            </span>
          </div>
          
          <button
            onClick={toggleTheme}
            className="group flex items-center gap-3 px-6 py-3 rounded-2xl border border-[var(--border)] hover:border-[var(--secondary)] transition-all bg-[var(--card-bg)] hover:shadow-[0_0_20px_rgba(56,139,253,0.1)]"
          >
            <div className="p-2 rounded-lg bg-[var(--bg)] group-hover:bg-[var(--secondary-glow)] transition-colors">
              {isDark ? <Sun size={16} className="text-yellow-500" /> : <Moon size={16} className="text-blue-500" />}
            </div>
            <span className="text-xs font-bold uppercase tracking-widest text-[var(--text-secondary)]">
              {isDark ? 'Light' : 'Dark'} Mode
            </span>
          </button>
        </motion.div>
      </header>

      <main className="max-w-[1600px] mx-auto px-8 space-y-8">
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
