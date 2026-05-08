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
    <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
      {stats.map((stat, i) => (
        <motion.div
          key={i}
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: i * 0.05 }}
          className="p-4 rounded-xl border border-[var(--border)]"
          style={{ background: 'var(--bg)' }}
        >
          <div className="flex items-center gap-1.5 mb-2" style={{ color: 'var(--text-secondary)' }}>
            {stat.icon}
            <span className="text-[9px] font-bold uppercase tracking-widest">{stat.label}</span>
          </div>
          {stat.loading ? (
            <div className="h-5 w-24 rounded bg-gray-200 animate-pulse" />
          ) : (
            <div className="text-sm font-bold" style={{ color: 'var(--text-primary)' }}>
              {stat.value}
            </div>
          )}
        </motion.div>
      ))}
    </div>
  );
}
