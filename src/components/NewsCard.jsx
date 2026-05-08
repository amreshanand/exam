import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ExternalLink, Clock, User, ChevronDown, ChevronUp, BookOpen } from 'lucide-react';

function timeAgo(dateStr) {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  return `${Math.floor(hrs / 24)}d ago`;
}

export default function NewsCard({ article, index }) {
  const [expanded, setExpanded] = useState(false);

  const {
    title,
    description,
    urlToImage,
    author,
    source,
    publishedAt,
    url,
    content,
  } = article;

  return (
    <motion.article
      initial={{ opacity: 0, y: 24 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay: Math.min(index * 0.05, 0.5) }}
      className="card overflow-hidden flex flex-col group"
      id={`news-card-${index}`}
    >
      {/* Image */}
      <div className="relative h-44 overflow-hidden bg-gray-900 flex-shrink-0">
        {urlToImage ? (
          <img
            src={urlToImage}
            alt={title}
            className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
            onError={(e) => {
              e.target.style.display = 'none';
            }}
          />
        ) : (
          <div
            className="w-full h-full flex items-center justify-center text-5xl"
            style={{ background: 'linear-gradient(135deg, #121826, #1a2236)' }}
          >
            📰
          </div>
        )}
        {/* Overlay gradient */}
        <div
          className="absolute inset-0"
          style={{
            background: 'linear-gradient(to top, rgba(11,15,25,0.8) 0%, transparent 60%)',
          }}
        />
        {/* Source badge */}
        <div className="absolute bottom-2 left-3">
          <span
            className="text-xs font-bold px-2 py-0.5 rounded-md"
            style={{
              background: 'rgba(77,163,255,0.2)',
              border: '1px solid rgba(77,163,255,0.4)',
              color: 'var(--secondary)',
              backdropFilter: 'blur(4px)',
            }}
          >
            {source?.name || 'Unknown'}
          </span>
        </div>
      </div>

      {/* Body */}
      <div className="p-4 flex flex-col flex-1">
        {/* Meta */}
        <div className="flex items-center gap-3 mb-2 text-xs" style={{ color: 'var(--text-muted)' }}>
          <span className="flex items-center gap-1">
            <Clock size={10} />
            {timeAgo(publishedAt)}
          </span>
          {author && (
            <span className="flex items-center gap-1 truncate max-w-[120px]">
              <User size={10} />
              {author.split(',')[0]}
            </span>
          )}
        </div>

        {/* Title */}
        <h3
          className="font-bold text-sm leading-snug mb-2 line-clamp-2 group-hover:text-blue-400 transition-colors"
          style={{ color: 'var(--text-primary)' }}
        >
          {title}
        </h3>

        {/* Description */}
        <AnimatePresence>
          <motion.p
            className="text-xs leading-relaxed mb-3"
            style={{
              color: 'var(--text-secondary)',
              display: '-webkit-box',
              WebkitLineClamp: expanded ? 'unset' : 3,
              WebkitBoxOrient: 'vertical',
              overflow: 'hidden',
            }}
          >
            {description || 'No description available.'}
          </motion.p>
        </AnimatePresence>

        {/* Expanded content */}
        <AnimatePresence>
          {expanded && content && (
            <motion.p
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="text-xs leading-relaxed mb-3"
              style={{ color: 'var(--text-muted)' }}
            >
              {content.replace(/\[\+\d+ chars?\]/, '').trim()}
            </motion.p>
          )}
        </AnimatePresence>

        {/* Spacer */}
        <div className="flex-1" />

        {/* Actions */}
        <div className="flex items-center gap-2 mt-2">
          <a
            href={url !== '#' ? url : undefined}
            target="_blank"
            rel="noopener noreferrer"
            id={`read-more-${index}`}
            className="btn-secondary flex items-center gap-1.5 text-xs py-2 px-3 flex-1 justify-center no-underline"
            style={{ textDecoration: 'none' }}
          >
            <BookOpen size={12} />
            Read More
            <ExternalLink size={10} />
          </a>
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => setExpanded(!expanded)}
            id={`expand-btn-${index}`}
            className="btn-ghost flex items-center gap-1 text-xs py-2 px-3"
          >
            {expanded ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
            {expanded ? 'Less' : 'More'}
          </motion.button>
        </div>
      </div>
    </motion.article>
  );
}
