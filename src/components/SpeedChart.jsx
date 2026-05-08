import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ReferenceLine,
  Area,
  AreaChart,
} from 'recharts';
import { motion } from 'framer-motion';
import { Zap, TrendingUp, TrendingDown } from 'lucide-react';
import { useStore } from '../store/useStore';
import { ChartSkeleton } from './Skeletons';

const CustomTooltip = ({ active, payload, label }) => {
  if (active && payload && payload.length) {
    return (
      <div
        className="p-3 rounded-xl text-xs"
        style={{
          background: 'var(--card)',
          border: '1px solid var(--border-hover)',
          boxShadow: '0 8px 30px rgba(0,0,0,0.4)',
        }}
      >
        <div className="font-semibold mb-1" style={{ color: 'var(--text-secondary)' }}>
          {label}
        </div>
        <div className="font-bold mono" style={{ color: 'var(--accent)' }}>
          {payload[0]?.value?.toLocaleString()} km/h
        </div>
      </div>
    );
  }
  return null;
};

export default function SpeedChart() {
  const { speedHistory } = useStore();

  const data = speedHistory.map((entry, i) => ({
    time: new Date(entry.time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
    speed: Math.round(entry.speed),
    idx: i,
  }));

  const avg = data.length > 0 ? Math.round(data.reduce((a, b) => a + b.speed, 0) / data.length) : 27600;
  const latest = data[data.length - 1]?.speed || 0;
  const prev = data[data.length - 2]?.speed || latest;
  const trend = latest >= prev;

  if (speedHistory.length < 2) {
    return (
      <div className="card p-5">
        <div className="flex items-center gap-2 mb-4">
          <Zap size={16} style={{ color: 'var(--accent)' }} />
          <span className="font-bold text-sm" style={{ color: 'var(--text-primary)' }}>
            ISS Speed Trend
          </span>
        </div>
        <ChartSkeleton height={200} />
        <div className="text-center mt-4 text-xs" style={{ color: 'var(--text-muted)' }}>
          Collecting speed data… (need 2+ readings)
        </div>
      </div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="card p-5"
      id="speed-chart-card"
    >
      {/* Header */}
      <div className="flex items-center justify-between mb-5">
        <div className="flex items-center gap-2">
          <div
            className="w-8 h-8 rounded-lg flex items-center justify-center"
            style={{ background: 'rgba(255,107,74,0.15)', border: '1px solid rgba(255,107,74,0.3)' }}
          >
            <Zap size={16} style={{ color: 'var(--accent)' }} />
          </div>
          <div>
            <div className="font-bold text-sm" style={{ color: 'var(--text-primary)' }}>
              ISS Speed Trend
            </div>
            <div className="text-xs" style={{ color: 'var(--text-muted)' }}>
              Last {data.length} readings
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <div className="text-right">
            <div className="text-xs" style={{ color: 'var(--text-muted)' }}>AVG SPEED</div>
            <div className="font-bold mono text-sm" style={{ color: 'var(--secondary)' }}>
              {avg.toLocaleString()} km/h
            </div>
          </div>
          <div
            className="flex items-center gap-1 px-2 py-1 rounded-lg text-xs font-bold"
            style={{
              background: trend ? 'rgba(34,197,94,0.1)' : 'rgba(239,68,68,0.1)',
              color: trend ? 'var(--success)' : 'var(--danger)',
              border: `1px solid ${trend ? 'rgba(34,197,94,0.3)' : 'rgba(239,68,68,0.3)'}`,
            }}
          >
            {trend ? <TrendingUp size={12} /> : <TrendingDown size={12} />}
            {Math.abs(latest - prev).toLocaleString()}
          </div>
        </div>
      </div>

      {/* Chart */}
      <ResponsiveContainer width="100%" height={200}>
        <AreaChart data={data} margin={{ top: 5, right: 5, left: 0, bottom: 5 }}>
          <defs>
            <linearGradient id="speedGradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#FF6B4A" stopOpacity={0.3} />
              <stop offset="95%" stopColor="#FF6B4A" stopOpacity={0.02} />
            </linearGradient>
          </defs>
          <CartesianGrid
            strokeDasharray="3 3"
            stroke="rgba(255,255,255,0.05)"
            vertical={false}
          />
          <XAxis
            dataKey="time"
            tick={{ fontSize: 9, fill: 'var(--text-muted)', fontFamily: 'JetBrains Mono' }}
            tickLine={false}
            axisLine={false}
            interval="preserveStartEnd"
          />
          <YAxis
            tick={{ fontSize: 9, fill: 'var(--text-muted)', fontFamily: 'JetBrains Mono' }}
            tickLine={false}
            axisLine={false}
            tickFormatter={(v) => `${(v / 1000).toFixed(0)}k`}
            domain={['auto', 'auto']}
          />
          <Tooltip content={<CustomTooltip />} />
          <ReferenceLine
            y={avg}
            stroke="rgba(77,163,255,0.4)"
            strokeDasharray="4 4"
            label={{ value: 'AVG', position: 'right', fontSize: 9, fill: 'var(--secondary)' }}
          />
          <Area
            type="monotone"
            dataKey="speed"
            stroke="#FF6B4A"
            strokeWidth={2}
            fill="url(#speedGradient)"
            dot={false}
            activeDot={{ r: 4, fill: '#FF6B4A', strokeWidth: 0 }}
            animationDuration={800}
          />
        </AreaChart>
      </ResponsiveContainer>
    </motion.div>
  );
}
