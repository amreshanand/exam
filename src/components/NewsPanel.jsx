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
    <div className="card p-6 shadow-sm border-0" style={{ background: 'var(--card-bg)' }}>
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6">
        <div>
          <h2 className="text-xl font-bold" style={{ color: 'var(--text-primary)' }}>Breaking News</h2>
        </div>
        <button onClick={handleRefresh} className="btn-ghost text-xs px-3 py-1 flex items-center gap-2">
          <RefreshCcw size={14} className={isNewsLoading ? 'animate-spin' : ''} />
          Refresh
        </button>
      </div>

      <div className="flex flex-col md:flex-row gap-4 mb-6">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
          <input
            type="text"
            placeholder="Search title, source, author..."
            className="w-full pl-10 pr-4 py-2 rounded-lg border border-[var(--border)] bg-transparent text-sm"
            value={localSearch}
            onChange={(e) => setLocalSearch(e.target.value)}
          />
        </div>
        <select className="px-4 py-2 rounded-lg border border-[var(--border)] bg-transparent text-sm">
          <option>Sort by Date</option>
          <option>Sort by Source</option>
        </select>
      </div>

      <div className="space-y-3">
        {displayed.map((article, idx) => (
          <div key={idx} className="flex flex-col rounded-xl border border-[var(--border)] overflow-hidden transition-all">
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="flex items-center gap-4 p-4 hover:bg-gray-50/50 transition-colors group cursor-pointer"
              onClick={() => setExpandedId(expandedId === idx ? null : idx)}
            >
              <div className="w-8 h-8 rounded-full bg-red-50 text-red-500 flex items-center justify-center font-bold text-xs flex-shrink-0">
                {idx + 1}
              </div>

              <div className="w-16 h-16 rounded-lg bg-gray-200 overflow-hidden flex-shrink-0 border border-gray-100">
                {article.urlToImage ? (
                  <img src={article.urlToImage} className="w-full h-full object-cover" alt="" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center bg-gray-50 text-gray-400">
                    <Satellite size={20} />
                  </div>
                )}
              </div>

              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-[10px] font-bold text-blue-600 uppercase tracking-wider">
                    {article.source?.name || 'NEWS'}
                  </span>
                  <span className="text-[10px] text-gray-400">•</span>
                  <span className="text-[10px] text-gray-400">
                    {new Date(article.publishedAt).toLocaleString()}
                  </span>
                </div>
                <h3 className="text-sm font-bold truncate pr-4 text-gray-900">
                  {article.title}
                </h3>
                <div className="flex items-center gap-4 mt-1">
                   <button className="text-[11px] font-semibold text-red-500 hover:underline">
                     {expandedId === idx ? 'Show Less' : 'Learn More'}
                   </button>
                </div>
              </div>

              <a 
                href={article.url} target="_blank" rel="noreferrer" onClick={(e) => e.stopPropagation()}
                className="w-9 h-9 rounded-full border border-[var(--border)] flex items-center justify-center text-gray-400 hover:text-red-500 hover:border-red-500 transition-all bg-white shadow-sm"
              >
                <ExternalLink size={14} />
              </a>
            </motion.div>

            <AnimatePresence>
              {expandedId === idx && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: 'auto', opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  className="bg-gray-50/50 border-t border-[var(--border)] px-4 py-4 overflow-hidden"
                >
                  <p className="text-xs text-gray-700 leading-relaxed mb-4">
                    {article.description || article.content || 'No detailed description available for this article.'}
                  </p>
                  <div className="flex flex-wrap gap-4 text-[10px] text-gray-500 font-medium uppercase tracking-wider">
                    <div className="flex items-center gap-1.5"><User size={12}/> {article.author || 'Mission Intelligence'}</div>
                    <div className="flex items-center gap-1.5"><Calendar size={12}/> {new Date(article.publishedAt).toDateString()}</div>
                    <div className="flex items-center gap-1.5"><BarChart2 size={12}/> Source: {article.source?.name}</div>
                  </div>
                  <a 
                    href={article.url} target="_blank" rel="noreferrer"
                    className="mt-4 inline-flex items-center gap-2 text-xs font-bold text-blue-600 hover:text-blue-700"
                  >
                    Read Full Investigation <ExternalLink size={12} />
                  </a>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        ))}
      </div>

      <div ref={observerTarget} className="h-10 w-full" />
    </div>
  );
}
