import React from 'react';
import { Circle, Clock, CheckCircle, XCircle, AlertCircle } from 'lucide-react';

const StatusBadge = ({ status, size = 'sm' }) => {
  const statusConfig = {
    open: {
      icon: Circle,
      className: 'status-open',
      label: 'Open'
    },
    in_progress: {
      icon: Clock,
      className: 'status-in_progress',
      label: 'In Progress'
    },
    resolved: {
      icon: CheckCircle,
      className: 'status-resolved',
      label: 'Resolved'
    },
    closed: {
      icon: XCircle,
      className: 'status-closed',
      label: 'Closed'
    },
    cancelled: {
      icon: AlertCircle,
      className: 'status-cancelled',
      label: 'Cancelled'
    }
  };

  const config = statusConfig[status] || statusConfig.open;
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

export default StatusBadge;
