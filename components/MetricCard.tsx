import React from 'react';
import { LucideIcon } from 'lucide-react';

interface MetricCardProps {
  title: string;
  value: string | number;
  icon: LucideIcon;
  trend?: string;
  color?: 'blue' | 'red' | 'green' | 'yellow' | 'slate';
}

const MetricCard: React.FC<MetricCardProps> = ({ title, value, icon: Icon, trend, color = 'slate' }) => {
  const colorClasses = {
    blue: 'bg-blue-50 text-blue-700 border-blue-200',
    red: 'bg-red-50 text-red-700 border-red-200',
    green: 'bg-green-50 text-green-700 border-green-200',
    yellow: 'bg-yellow-50 text-yellow-700 border-yellow-200',
    slate: 'bg-white text-slate-700 border-slate-200',
  };

  return (
    <div className={`p-6 rounded-xl border shadow-sm ${colorClasses[color]}`}>
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-medium opacity-80">{title}</p>
          <h3 className="text-3xl font-bold mt-2">{value}</h3>
          {trend && <p className="text-xs mt-1 font-medium">{trend}</p>}
        </div>
        <div className={`p-3 rounded-full bg-white/50`}>
          <Icon size={24} />
        </div>
      </div>
    </div>
  );
};

export default MetricCard;