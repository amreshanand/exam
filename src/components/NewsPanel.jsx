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
  const PAGE_SIZE = 10;

  const handleRefresh = async () => {
    setNewsLoading(true);
    const apiKey = import.meta.env.VITE_NEWS_API_KEY;
    const data = await fetchNews('space nasa', apiKey);
    setArticles(data);
    setNewsLoading(false);
  };

  const filtered = articles.filter(a => 
    a.title?.toLowerCase().includes(localSearch.toLowerCase()) ||
    a.source?.name?.toLowerCase().includes(localSearch.toLowerCase())
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
    <div className="card p-8">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 mb-8">
        <div>
          <h2 className="text-2xl font-black gradient-text pr-2">Space Intelligence</h2>
          <p className="text-xs font-bold text-[var(--text-muted)] uppercase tracking-widest mt-1">Global Mission Briefings</p>
        </div>
        <button 
          onClick={handleRefresh} 
          className="flex items-center gap-2 px-5 py-2.5 rounded-xl border border-[var(--border)] hover:border-[var(--secondary)] transition-all bg-[var(--bg)] text-xs font-bold uppercase tracking-widest text-[var(--text-secondary)]"
        >
          <RefreshCcw size={14} className={isNewsLoading ? 'animate-spin' : ''} />
          Sync Intelligence
        </button>
      </div>

      <div className="flex flex-col lg:flex-row gap-4 mb-8">
        <div className="relative flex-1 group">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-[var(--text-muted)] group-focus-within:text-[var(--secondary)] transition-colors" size={18} />
          <input
            type="text"
            placeholder="Search keywords, agencies, or missions..."
            className="w-full pl-12 pr-4 py-3 rounded-xl border border-[var(--border)] bg-[var(--bg)] text-sm focus:border-[var(--secondary)] focus:ring-2 focus:ring-[var(--secondary-glow)] outline-none transition-all placeholder:text-[var(--text-muted)]"
            value={localSearch}
            onChange={(e) => setLocalSearch(e.target.value)}
          />
        </div>
        <div className="flex gap-2">
          <select className="px-4 py-3 rounded-xl border border-[var(--border)] bg-[var(--bg)] text-[10px] font-bold uppercase tracking-widest text-[var(--text-secondary)] outline-none focus:border-[var(--secondary)]">
            <option>Latest Intelligence</option>
            <option>Relevance</option>
          </select>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-1 gap-4">
        {displayed.map((article, idx) => (
          <div key={idx} className="group relative flex flex-col rounded-2xl border border-[var(--border)] bg-[var(--bg)] hover:bg-[var(--card-hover)] hover:border-[var(--secondary)] transition-all duration-300 overflow-hidden">
            <motion.div
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: idx * 0.05 }}
              className="flex items-center gap-6 p-5 cursor-pointer"
              onClick={() => setExpandedId(expandedId === idx ? null : idx)}
            >
              <div className="hidden sm:flex items-center justify-center w-10 h-10 rounded-xl bg-[var(--card-bg)] border border-[var(--border)] text-[var(--secondary)] font-black text-xs">
                {String(idx + 1).padStart(2, '0')}
              </div>

              <div className="w-20 h-20 rounded-xl bg-[var(--card-bg)] overflow-hidden flex-shrink-0 border border-[var(--border)] group-hover:border-[var(--secondary)] transition-colors">
                {article.urlToImage ? (
                  <img src={article.urlToImage} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" alt="" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-[var(--text-muted)]">
                    <Satellite size={24} />
                  </div>
                )}
              </div>

              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-3 mb-2">
                  <span className="px-2 py-0.5 rounded bg-[var(--secondary-glow)] text-[var(--secondary)] text-[9px] font-black uppercase tracking-widest">
                    {article.source?.name || 'GENERIC'}
                  </span>
                  <span className="text-[10px] text-[var(--text-muted)] font-bold mono">
                    {new Date(article.publishedAt).toLocaleDateString()}
                  </span>
                </div>
                <h3 className="text-sm md:text-base font-bold text-[var(--text-primary)] leading-snug truncate pr-8">
                  {article.title}
                </h3>
              </div>

              <div className="absolute right-6 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-opacity">
                <ExternalLink size={16} className="text-[var(--secondary)]" />
              </div>
            </motion.div>

            <AnimatePresence>
              {expandedId === idx && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: 'auto', opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  className="px-5 pb-6 overflow-hidden"
                >
                  <div className="h-px w-full bg-[var(--border)] mb-5" />
                  <p className="text-xs md:text-sm text-[var(--text-secondary)] leading-relaxed mb-6 max-w-4xl">
                    {article.description || article.content || 'Detailed mission brief restricted or unavailable.'}
                  </p>
                  
                  <div className="flex flex-wrap items-center gap-6 mb-6">
                    <div className="flex items-center gap-2 text-[10px] font-bold text-[var(--text-muted)] uppercase tracking-widest">
                      <User size={14} className="text-[var(--secondary)]" />
                      {article.author || 'Mission Intelligence'}
                    </div>
                    <div className="flex items-center gap-2 text-[10px] font-bold text-[var(--text-muted)] uppercase tracking-widest">
                      <Calendar size={14} className="text-[var(--secondary)]" />
                      {new Date(article.publishedAt).toDateString()}
                    </div>
                  </div>

                  <a 
                    href={article.url} target="_blank" rel="noreferrer"
                    className="inline-flex items-center gap-2 text-xs font-black text-[var(--secondary)] hover:text-[var(--accent)] transition-colors uppercase tracking-[0.2em]"
                  >
                    ACCESS FULL REPORT <ExternalLink size={12} />
                  </a>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        ))}
      </div>

      <div ref={observerTarget} className="h-20 w-full flex items-center justify-center">
         {displayed.length < filtered.length && (
           <div className="w-1.5 h-1.5 rounded-full bg-[var(--secondary)] animate-ping" />
         )}
      </div>
    </div>
  );
}
