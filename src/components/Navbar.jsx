import { motion } from 'framer-motion';
import { Moon, Sun, Satellite, Wifi, WifiOff, RefreshCw } from 'lucide-react';
import { useStore } from '../store/useStore';
import { useState, useEffect } from 'react';

export default function Navbar({ onRefreshAll, isRefreshing }) {
  const { isDark, toggleTheme, issPosition, lastFetchTime } = useStore();
  const [time, setTime] = useState(new Date());

  useEffect(() => {
    const t = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(t);
  }, []);

  const isLive = lastFetchTime && Date.now() - lastFetchTime < 30000;

  return (
    <motion.nav
      initial={{ y: -80, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.6, ease: 'easeOut' }}
      className="fixed top-0 left-0 right-0 z-50"
      style={{
        background: isDark
          ? 'rgba(11, 15, 25, 0.85)'
          : 'rgba(245, 248, 255, 0.85)',
        backdropFilter: 'blur(20px)',
        WebkitBackdropFilter: 'blur(20px)',
        borderBottom: '1px solid var(--glass-border)',
        boxShadow: '0 4px 30px rgba(0,0,0,0.3)',
      }}
    >
      <div className="max-w-[1600px] mx-auto px-4 sm:px-6">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <motion.div
            className="flex items-center gap-3"
            whileHover={{ scale: 1.02 }}
          >
            <div className="relative w-10 h-10 flex items-center justify-center">
              <div
                className="absolute inset-0 rounded-full"
                style={{
                  background: 'linear-gradient(135deg, #FF6B4A22, #4DA3FF22)',
                  border: '1px solid rgba(77,163,255,0.3)',
                }}
              />
              <Satellite size={20} className="gradient-text-secondary relative z-10" style={{ color: 'var(--secondary)' }} />
            </div>
            <div>
              <div className="orbitron font-bold text-sm sm:text-base" style={{ color: 'var(--text-primary)' }}>
                ISS INTELLIGENCE
              </div>
              <div className="text-xs" style={{ color: 'var(--text-muted)' }}>
                MISSION CONTROL
              </div>
            </div>
          </motion.div>

          {/* Center — live status */}
          <div className="hidden md:flex items-center gap-6">
            <div className="flex items-center gap-2">
              <div className={`pulse-dot ${isLive ? '' : 'bg-red-400'}`} style={!isLive ? { background: 'var(--danger)' } : {}} />
              <span className="text-xs font-semibold mono" style={{ color: isLive ? 'var(--success)' : 'var(--danger)' }}>
                {isLive ? 'LIVE' : 'OFFLINE'}
              </span>
            </div>

            {issPosition && (
              <motion.div
                key={issPosition.timestamp}
                initial={{ opacity: 0, y: -5 }}
                animate={{ opacity: 1, y: 0 }}
                className="flex items-center gap-4 text-xs mono"
                style={{ color: 'var(--text-secondary)' }}
              >
                <span>LAT <span className="font-bold" style={{ color: 'var(--secondary)' }}>{parseFloat(issPosition.iss_position.latitude).toFixed(2)}°</span></span>
                <span>LON <span className="font-bold" style={{ color: 'var(--secondary)' }}>{parseFloat(issPosition.iss_position.longitude).toFixed(2)}°</span></span>
              </motion.div>
            )}

            <div className="text-xs mono" style={{ color: 'var(--text-muted)' }}>
              {time.toUTCString().slice(0, 25)}
            </div>
          </div>

          {/* Right actions */}
          <div className="flex items-center gap-2 sm:gap-3">
            <motion.button
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.95 }}
              onClick={onRefreshAll}
              id="refresh-all-btn"
              className="p-2 rounded-lg transition-all"
              style={{
                background: 'var(--secondary-glow)',
                border: '1px solid var(--border)',
                color: 'var(--secondary)',
              }}
            >
              <RefreshCw size={16} className={isRefreshing ? 'animate-spin' : ''} />
            </motion.button>

            <motion.button
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.95 }}
              onClick={toggleTheme}
              id="theme-toggle-btn"
              className="p-2 rounded-lg transition-all"
              style={{
                background: isDark ? 'rgba(255,107,74,0.1)' : 'rgba(255,107,74,0.15)',
                border: '1px solid rgba(255,107,74,0.3)',
                color: 'var(--accent)',
              }}
            >
              {isDark ? <Sun size={16} /> : <Moon size={16} />}
            </motion.button>

            <div
              className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-semibold"
              style={{
                background: isLive ? 'rgba(34,197,94,0.1)' : 'rgba(239,68,68,0.1)',
                border: `1px solid ${isLive ? 'rgba(34,197,94,0.3)' : 'rgba(239,68,68,0.3)'}`,
                color: isLive ? 'var(--success)' : 'var(--danger)',
              }}
            >
              {isLive ? <Wifi size={12} /> : <WifiOff size={12} />}
              {isLive ? 'TRACKING' : 'STANDBY'}
            </div>
          </div>
        </div>
      </div>
    </motion.nav>
  );
}
