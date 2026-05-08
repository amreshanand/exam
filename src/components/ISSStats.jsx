import { motion } from 'framer-motion';
import { Compass, Zap, MapPin, Hash } from 'lucide-react';
import { useStore } from '../store/useStore';

export default function ISSStats() {
  const { issPosition, speedHistory, isISSLoading } = useStore();

  const lat = issPosition?.iss_position?.latitude
    ? parseFloat(issPosition.iss_position.latitude).toFixed(4)
    : '0.0000';
  const lon = issPosition?.iss_position?.longitude
    ? parseFloat(issPosition.iss_position.longitude).toFixed(4)
    : '0.0000';

  const lastSpeed = speedHistory.length > 0 ? speedHistory[speedHistory.length - 1].speed : null;
  const displaySpeed = lastSpeed ? Math.round(lastSpeed).toLocaleString() : '27,600';

  const stats = [
    {
      label: 'Latitude / Longitude',
      value: `${lat}, ${lon}`,
      icon: <Compass size={14} />,
      loading: isISSLoading && lat === '0.0000',
    },
    {
      label: 'Speed',
      value: `${displaySpeed} km/h`,
      icon: <Zap size={14} />,
    },
    {
      label: 'Nearest Place',
      value: parseFloat(lat) > 0 ? 'Northern Hemisphere' : 'Southern Hemisphere',
      icon: <MapPin size={14} />,
    },
    {
      label: 'Tracked Positions',
      value: speedHistory.length,
      icon: <Hash size={14} />,
    },
  ];

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
      {stats.map((stat, i) => (
        <motion.div
          key={i}
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: i * 0.1, type: 'spring', stiffness: 200 }}
          className="stat-card group"
        >
          <div className="flex items-center justify-between mb-2">
            <div className="p-1.5 rounded-lg bg-[var(--secondary-glow)] text-[var(--secondary)] group-hover:scale-110 transition-transform">
              {stat.icon}
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" />
              <span className="text-[8px] font-bold text-green-500 uppercase tracking-tighter">Live</span>
            </div>
          </div>
          
          <div className="text-[10px] font-bold text-[var(--text-muted)] uppercase tracking-wider mb-1">
            {stat.label}
          </div>

          {stat.loading ? (
            <div className="h-6 w-full skeleton" />
          ) : (
            <div className="text-lg font-black mono text-[var(--text-primary)]">
              {stat.value}
            </div>
          )}
        </motion.div>
      ))}
    </div>
  );
}
