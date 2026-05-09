import { useState, useCallback, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, RefreshCcw, ExternalLink, User, Calendar, Satellite, BarChart2 } from 'lucide-react';
import { useStore } from '../store/useStore';
import { fetchNews } from '../services/api';

export default function NewsPanel() {
  const { 
    articles, setArticles, isNewsLoading, setNewsLoading, newsSearch, setNewsSearch 
  } = useStore();

  const [localSearch, setLocalSearch] = useState(newsSearch);
  const [expandedId, setExpandedId] = useState(null);
  const observerTarget = useRef(null);
  const [page, setPage] = useState(1);
  const PAGE_SIZE = 12;

  const handleRefresh = async () => {
    setNewsLoading(true);
    const apiKey = import.meta.env.VITE_NEWS_API_KEY;
    const data = await fetchNews('space nasa', apiKey);
    setArticles(data);
    setNewsLoading(false);
  };

  const filtered = articles.filter(a => 
    a.title?.toLowerCase().includes(localSearch.toLowerCase()) ||
    a.source?.name?.toLowerCase().includes(localSearch.toLowerCase()) ||
    a.description?.toLowerCase().includes(localSearch.toLowerCase())
  );

  const displayed = filtered.slice(0, page * PAGE_SIZE);

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && displayed.length < filtered.length) {
          setPage(p => p + 1);
        }
      },
      { threshold: 0.1 }
    );
    if (observerTarget.current) observer.observe(observerTarget.current);
    return () => observer.disconnect();
  }, [displayed.length, filtered.length]);

  return (
    <div className="card p-10">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-8 mb-10">
        <div>
          <div className="flex items-center gap-3 mb-1">
             <div className="w-1.5 h-1.5 rounded-full bg-blue-500 animate-pulse" />
             <h2 className="text-3xl font-black gradient-text tracking-tight">Intelligence Feed</h2>
          </div>
          <p className="text-[10px] font-black text-[var(--text-muted)] uppercase tracking-[0.4em] ml-5">Global Mission Briefings • Real-time Data</p>
        </div>
        <div className="flex items-center gap-4">
          <span className="text-[10px] font-bold text-[var(--text-muted)] uppercase tracking-widest hidden sm:block">
            {filtered.length} reports indexed
          </span>
          <button 
            onClick={handleRefresh} 
            className="group flex items-center gap-3 px-6 py-3 rounded-2xl border border-[var(--border)] hover:border-[var(--secondary)] transition-all bg-[var(--bg)] text-[11px] font-black uppercase tracking-widest text-[var(--text-secondary)] hover:shadow-[0_0_25px_rgba(56,139,253,0.15)]"
          >
            <RefreshCcw size={14} className={`${isNewsLoading ? 'animate-spin' : 'group-hover:rotate-180 transition-transform duration-500'}`} />
            Sync Intel
          </button>
        </div>
      </div>

      <div className="flex flex-col lg:flex-row gap-4 mb-10">
        <div className="relative flex-1 group">
          <Search className="absolute left-5 top-1/2 -translate-y-1/2 text-[var(--text-muted)] group-focus-within:text-[var(--secondary)] transition-colors" size={18} />
          <input
            type="text"
            placeholder="Search global intelligence reports..."
            className="w-full pl-14 pr-6 py-4 rounded-2xl border border-[var(--border)] bg-[var(--bg)] text-sm focus:border-[var(--secondary)] focus:ring-4 focus:ring-[var(--secondary-glow)] outline-none transition-all placeholder:text-[var(--text-muted)] font-semibold"
            value={localSearch}
            onChange={(e) => setLocalSearch(e.target.value)}
          />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-2 gap-5">
        {displayed.map((article, idx) => (
          <motion.div
            key={`${idx}-${article.title}`}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: (idx % PAGE_SIZE) * 0.05 }}
            className={`group relative flex flex-col rounded-3xl border border-[var(--border)] bg-[var(--bg)] hover:bg-[var(--card-hover)] hover:border-[var(--secondary)] transition-all duration-500 overflow-hidden ${expandedId === idx ? 'ring-2 ring-[var(--secondary)] shadow-2xl' : 'hover:shadow-xl'}`}
          >
            <div 
              className="flex items-start gap-5 p-6 cursor-pointer"
              onClick={() => setExpandedId(expandedId === idx ? null : idx)}
            >
              <div className="w-24 h-24 rounded-2xl bg-[var(--card-bg)] overflow-hidden flex-shrink-0 border border-[var(--border)] group-hover:border-[var(--secondary)] transition-all duration-500 shadow-inner">
                {article.urlToImage ? (
                  <img src={article.urlToImage} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700" alt="" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-[var(--text-muted)] bg-gradient-to-br from-[var(--bg)] to-[var(--card-bg)]">
                    <Satellite size={28} className="opacity-20" />
                  </div>
                )}
              </div>

              <div className="flex-1 min-w-0 pt-1">
                <div className="flex items-center gap-3 mb-3">
                  <span className="px-2.5 py-1 rounded-lg bg-[var(--secondary-glow)] text-[var(--secondary)] text-[9px] font-black uppercase tracking-widest border border-[var(--secondary)]/20">
                    {article.source?.name || 'INTEL'}
                  </span>
                  <span className="text-[10px] text-[var(--text-muted)] font-black mono opacity-60">
                    {new Date(article.publishedAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
                  </span>
                </div>
                <h3 className="text-sm md:text-base font-bold text-[var(--text-primary)] leading-tight line-clamp-2 group-hover:text-[var(--secondary)] transition-colors pr-6">
                  {article.title}
                </h3>
              </div>

              <div className="absolute right-6 top-7 opacity-0 group-hover:opacity-100 transition-all transform translate-x-2 group-hover:translate-x-0">
                <ExternalLink size={14} className="text-[var(--secondary)]" />
              </div>
            </div>

            <AnimatePresence>
              {expandedId === idx && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: 'auto', opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  className="px-6 pb-8 overflow-hidden"
                >
                  <div className="h-px w-full bg-gradient-to-r from-transparent via-[var(--border)] to-transparent mb-6" />
                  <p className="text-xs md:text-sm text-[var(--text-secondary)] leading-relaxed mb-8 max-w-3xl font-medium">
                    {article.description || 'Global mission brief restricted or currently being decoded.'}
                  </p>
                  
                  <div className="flex flex-wrap items-center justify-between gap-6">
                    <div className="flex items-center gap-4">
                      <div className="flex items-center gap-2 text-[10px] font-black text-[var(--text-muted)] uppercase tracking-widest">
                        <User size={14} className="text-[var(--secondary)]" />
                        {article.author || 'FIELD ANALYST'}
                      </div>
                      <div className="w-1 h-1 rounded-full bg-[var(--border)]" />
                      <div className="flex items-center gap-2 text-[10px] font-black text-[var(--text-muted)] uppercase tracking-widest">
                        <Calendar size={14} className="text-[var(--secondary)]" />
                        {new Date(article.publishedAt).toDateString()}
                      </div>
                    </div>

                    <a 
                      href={article.url} target="_blank" rel="noreferrer"
                      className="flex items-center gap-3 px-5 py-2.5 rounded-xl bg-[var(--secondary)] text-[10px] font-black text-white hover:bg-blue-600 transition-all uppercase tracking-[0.2em] shadow-lg shadow-blue-500/20"
                    >
                      OPEN REPORT <ExternalLink size={12} />
                    </a>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>
        ))}
      </div>

      <div ref={observerTarget} className="h-24 w-full flex flex-col items-center justify-center gap-4">
         {displayed.length < filtered.length ? (
           <>
             <div className="w-1.5 h-1.5 rounded-full bg-[var(--secondary)] animate-ping" />
             <span className="text-[10px] font-black text-[var(--text-muted)] uppercase tracking-widest">Scanning more reports</span>
           </>
         ) : (
           <span className="text-[10px] font-black text-[var(--text-muted)] uppercase tracking-widest opacity-30">End of intelligence stream</span>
         )}
      </div>
    </div>
  );
}
