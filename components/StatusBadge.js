'use client';

const StatusBadge = ({ status, label = null }) => {
  const statusConfig = {
    open: {
      bg: 'bg-blue-100',
      text: 'text-blue-800',
      label: 'Open',
    },
    closed: {
      bg: 'bg-green-100',
      text: 'text-green-800',
      label: 'Closed',
    },
    pending: {
      bg: 'bg-yellow-100',
      text: 'text-yellow-800',
      label: 'Pending',
    },
    in_transit: {
      bg: 'bg-purple-100',
      text: 'text-purple-800',
      label: 'In Transit',
    },
    received: {
      bg: 'bg-green-100',
      text: 'text-green-800',
      label: 'Received',
    },
    rejected: {
      bg: 'bg-red-100',
      text: 'text-red-800',
      label: 'Rejected',
    },
    completed: {
      bg: 'bg-green-100',
      text: 'text-green-800',
      label: 'Completed',
    },
    draft: {
      bg: 'bg-secondary-100',
      text: 'text-secondary-800',
      label: 'Draft',
    },
    cancelled: {
      bg: 'bg-red-100',
      text: 'text-red-800',
      label: 'Cancelled',
    },
    approved: {
      bg: 'bg-green-100',
      text: 'text-green-800',
      label: 'Approved',
    },
    processing: {
      bg: 'bg-blue-100',
      text: 'text-blue-800',
      label: 'Processing',
    },
    delayed: {
      bg: 'bg-orange-100',
      text: 'text-orange-800',
      label: 'Delayed',
    },
  };

  const config = statusConfig[status] || {
    bg: 'bg-secondary-100',
    text: 'text-secondary-800',
    label: status,
  };

  return (
    <span
      className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium ${config.bg} ${config.text}`}
    >
      {label || config.label}
    </span>
  );
};

export default StatusBadge;
