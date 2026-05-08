import { motion } from 'framer-motion';

export function StatCardSkeleton() {
  return (
    <div className="card p-5">
      <div className="skeleton h-3 w-20 mb-3" />
      <div className="skeleton h-8 w-32 mb-2" />
      <div className="skeleton h-3 w-24" />
    </div>
  );
}

export function NewsCardSkeleton() {
  return (
    <div className="card overflow-hidden">
      <div className="skeleton h-44 w-full rounded-none" />
      <div className="p-4 space-y-2">
        <div className="skeleton h-3 w-24" />
        <div className="skeleton h-4 w-full" />
        <div className="skeleton h-4 w-3/4" />
        <div className="skeleton h-3 w-full" />
        <div className="skeleton h-3 w-2/3" />
        <div className="flex gap-2 mt-3">
          <div className="skeleton h-8 w-24 rounded-lg" />
          <div className="skeleton h-8 w-16 rounded-lg" />
        </div>
      </div>
    </div>
  );
}

export function AstronautCardSkeleton() {
  return (
    <div className="card p-3 flex items-center gap-3">
      <div className="skeleton w-10 h-10 rounded-full flex-shrink-0" />
      <div className="flex-1 space-y-2">
        <div className="skeleton h-3 w-28" />
        <div className="skeleton h-2 w-20" />
      </div>
    </div>
  );
}

export function ChartSkeleton({ height = 200 }) {
  return (
    <div className="w-full rounded-xl overflow-hidden" style={{ height }}>
      <div className="skeleton w-full h-full" />
    </div>
  );
}

export function MapSkeleton() {
  return (
    <motion.div
      className="w-full rounded-xl overflow-hidden flex items-center justify-center"
      style={{ height: 360, background: 'var(--card)' }}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
    >
      <div className="flex flex-col items-center gap-3">
        <div className="relative w-16 h-16">
          <div
            className="absolute inset-0 rounded-full border-2 border-t-transparent animate-spin"
            style={{ borderColor: 'var(--secondary)', borderTopColor: 'transparent' }}
          />
          <div className="absolute inset-3 rounded-full animate-pulse" style={{ background: 'var(--secondary-glow)' }} />
        </div>
        <span className="text-xs mono" style={{ color: 'var(--text-muted)' }}>INITIALIZING MAP...</span>
      </div>
    </motion.div>
  );
}
