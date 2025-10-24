import React from 'react';
import { AlertTriangle, AlertCircle, Info, CheckCircle } from 'lucide-react';

const PriorityBadge = ({ priority, size = 'sm' }) => {
  const priorityConfig = {
    urgent: {
      icon: AlertTriangle,
      className: 'priority-urgent',
      label: 'Urgent'
    },
    high: {
      icon: AlertCircle,
      className: 'priority-high',
      label: 'High'
    },
    medium: {
      icon: Info,
      className: 'priority-medium',
      label: 'Medium'
    },
    low: {
      icon: CheckCircle,
      className: 'priority-low',
      label: 'Low'
    }
  };

  const config = priorityConfig[priority] || priorityConfig.medium;
  const Icon = config.icon;

  const sizeClasses = {
    sm: 'px-2 py-1 text-xs',
    md: 'px-3 py-1 text-sm',
    lg: 'px-4 py-2 text-base'
  };

  return (
    <span
      className={`inline-flex items-center space-x-1 rounded-full font-medium border ${config.className} ${sizeClasses[size]}`}
    >
      <Icon className="w-3 h-3" />
      <span>{config.label}</span>
    </span>
  );
};

export default PriorityBadge;
