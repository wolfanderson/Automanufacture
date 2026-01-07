import React from 'react';
import { NodeStatus } from '../types';

interface StatusBadgeProps {
  status: NodeStatus;
  size?: 'sm' | 'md' | 'lg';
  pulsing?: boolean;
}

export const StatusBadge: React.FC<StatusBadgeProps> = ({ status, size = 'md', pulsing = false }) => {
  let colorClass = '';
  let dotClass = '';

  switch (status) {
    case NodeStatus.NORMAL:
      colorClass = 'text-neon-green border-neon-green/30 bg-neon-green/10';
      dotClass = 'bg-neon-green';
      break;
    case NodeStatus.WARNING:
      colorClass = 'text-neon-yellow border-neon-yellow/30 bg-neon-yellow/10';
      dotClass = 'bg-neon-yellow';
      break;
    case NodeStatus.CRITICAL:
      colorClass = 'text-neon-red border-neon-red/30 bg-neon-red/10';
      dotClass = 'bg-neon-red';
      break;
    case NodeStatus.INACTIVE:
    default:
      colorClass = 'text-gray-500 border-gray-700 bg-gray-800/50';
      dotClass = 'bg-gray-500';
      break;
  }

  const sizeClass = size === 'sm' ? 'px-2 py-0.5 text-xs' : 'px-3 py-1 text-sm';

  return (
    <div className={`inline-flex items-center gap-2 rounded-full border ${colorClass} ${sizeClass} font-mono tracking-wider`}>
      <span className={`relative flex h-2 w-2`}>
        {pulsing && status !== NodeStatus.INACTIVE && (
          <span className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 ${dotClass}`}></span>
        )}
        <span className={`relative inline-flex rounded-full h-2 w-2 ${dotClass}`}></span>
      </span>
      {status}
    </div>
  );
};