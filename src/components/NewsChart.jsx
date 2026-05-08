import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from 'recharts';
import { motion } from 'framer-motion';
import { BarChart3, Newspaper } from 'lucide-react';
import { useStore } from '../store/useStore';

export default function NewsChart() {
  const { articles } = useStore();

  // Process data to get source distribution
  const sourceMap = articles.reduce((acc, article) => {
    const source = article.source?.name || 'Unknown';
    acc[source] = (acc[source] || 0) + 1;
    return acc;
  }, {});

  const data = Object.entries(sourceMap)
    .map(([name, value]) => ({ name, value }))
    .sort((a, b) => b.value - a.value)
    .slice(0, 5); // Top 5 sources

  const COLORS = ['#3b82f6', '#ef4444', '#10b981', '#f59e0b', '#6366f1'];

  if (articles.length === 0) {
    return (
      <div className="card p-6 h-[320px] flex flex-col items-center justify-center text-center">
        <Newspaper size={32} className="text-gray-200 mb-3" />
        <p className="text-xs text-gray-400">Load news to see distribution</p>
      </div>
    );
  }

  return (
    <div className="card p-6 h-[320px] flex flex-col">
      <div className="flex items-center gap-2 mb-4">
        <div className="w-8 h-8 rounded-lg bg-red-500/10 flex items-center justify-center text-red-500">
          <BarChart3 size={18} />
        </div>
        <div>
          <h3 className="text-sm font-bold" style={{ color: 'var(--text-primary)' }}>News Distribution</h3>
          <p className="text-[10px] uppercase font-bold text-gray-400 tracking-wider">Source Analysis</p>
        </div>
      </div>

      <div className="flex-1 min-h-0">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={data}
              cx="50%"
              cy="50%"
              innerRadius={60}
              outerRadius={80}
              paddingAngle={5}
              dataKey="value"
            >
              {data.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} stroke="none" />
              ))}
            </Pie>
            <Tooltip 
              contentStyle={{ 
                borderRadius: '12px', 
                border: 'none', 
                boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
                fontSize: '11px',
                fontWeight: 'bold'
              }}
            />
            <Legend 
              verticalAlign="bottom" 
              height={36} 
              iconType="circle"
              formatter={(value) => <span className="text-[10px] font-bold text-gray-500">{value}</span>}
            />
          </PieChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
