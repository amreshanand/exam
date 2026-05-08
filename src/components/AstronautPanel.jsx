import { motion } from 'framer-motion';
import { Users, Rocket } from 'lucide-react';
import { useStore } from '../store/useStore';

export default function AstronautPanel() {
  const { astronauts, isAstronautsLoading } = useStore();

  if (isAstronautsLoading) {
    return (
      <div className="card p-6 h-[240px] flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="w-10 h-10 border-4 border-blue-500/20 border-t-blue-500 rounded-full animate-spin" />
          <span className="text-xs font-bold text-blue-500 tracking-widest">FETCHING CREW...</span>
        </div>
      </div>
    );
  }

  const people = astronauts?.people || [];
  const count = astronauts?.number || 0;

  return (
    <div className="card p-6 overflow-hidden flex flex-col" style={{ height: 320 }}>
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-blue-500/10 flex items-center justify-center text-blue-500">
            <Users size={18} />
          </div>
          <div>
            <h3 className="text-sm font-bold" style={{ color: 'var(--text-primary)' }}>Astronaut Manifest</h3>
            <p className="text-[10px] uppercase font-bold text-gray-400 tracking-wider">Live Census</p>
          </div>
        </div>
        <div className="text-2xl font-black text-blue-500">{count}</div>
      </div>

      <div className="flex-1 overflow-y-auto pr-2 custom-scrollbar space-y-2">
        {people.length > 0 ? (
          people.map((p, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: i * 0.05 }}
              className="p-3 rounded-xl border border-[var(--border)] bg-gray-50/50 flex items-center justify-between group hover:border-blue-500/30 transition-all"
            >
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-white border border-[var(--border)] flex items-center justify-center text-xs font-bold text-gray-400">
                  {p.name.charAt(0)}
                </div>
                <div>
                  <div className="text-xs font-bold" style={{ color: 'var(--text-primary)' }}>{p.name}</div>
                  <div className="text-[9px] text-gray-400 font-bold uppercase tracking-wider">{p.craft}</div>
                </div>
              </div>
              <div className="opacity-0 group-hover:opacity-100 transition-opacity">
                <Rocket size={12} className="text-blue-500" />
              </div>
            </motion.div>
          ))
        ) : (
          <div className="text-center py-10 text-xs text-gray-400 italic">
            Waiting for mission data...
          </div>
        )}
      </div>
    </div>
  );
}
