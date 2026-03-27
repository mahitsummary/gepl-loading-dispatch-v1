'use client';

import { TrendingUp, TrendingDown } from 'lucide-react';

const MetricCard = ({
  title,
  value,
  unit = '',
  trend = null,
  trendLabel = '',
  icon: Icon = null,
  color = 'primary',
  onClick = null,
}) => {
  const colorClasses = {
    primary: 'bg-primary-50 border-primary-200',
    blue: 'bg-blue-50 border-blue-200',
    green: 'bg-green-50 border-green-200',
    yellow: 'bg-yellow-50 border-yellow-200',
    red: 'bg-red-50 border-red-200',
    purple: 'bg-purple-50 border-purple-200',
  };

  const iconColorClasses = {
    primary: 'text-primary-600',
    blue: 'text-blue-600',
    green: 'text-green-600',
    yellow: 'text-yellow-600',
    red: 'text-red-600',
    purple: 'text-purple-600',
  };

  const trendColorClasses = {
    up: 'text-green-600',
    down: 'text-red-600',
  };

  return (
    <div
      onClick={onClick}
      className={`${colorClasses[color]} border rounded-lg p-6 cursor-pointer transition-all hover:shadow-md ${
        onClick ? 'hover:shadow-lg' : ''
      }`}
    >
      <div className="flex items-start justify-between mb-4">
        <h3 className="text-sm font-medium text-secondary-600">{title}</h3>
        {Icon && (
          <Icon size={20} className={iconColorClasses[color]} />
        )}
      </div>

      <div className="flex items-end justify-between">
        <div>
          <p className="text-3xl font-bold text-secondary-900">{value}</p>
          {unit && (
            <p className="text-xs text-secondary-600 mt-1">{unit}</p>
          )}
        </div>

        {trend && (
          <div className={`flex items-center gap-1 text-sm font-medium ${trendColorClasses[trend]}`}>
            {trend === 'up' ? (
              <TrendingUp size={16} />
            ) : (
              <TrendingDown size={16} />
            )}
            <span>{trendLabel}</span>
          </div>
        )}
      </div>
    </div>
  );
};

export default MetricCard;
