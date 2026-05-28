import React from 'react';

interface OnlineStatusProps {
  status?: 'ONLINE' | 'AWAY' | 'BUSY' | 'OFFLINE';
  size?: 'sm' | 'md' | 'lg';
}

const colorMap = {
  ONLINE: 'bg-emerald-500 ring-emerald-500/20',
  AWAY: 'bg-amber-500 ring-amber-500/20',
  BUSY: 'bg-rose-500 ring-rose-500/20',
  OFFLINE: 'bg-zinc-500 ring-zinc-500/20',
};

const sizeMap = {
  sm: 'w-2 h-2 ring-1',
  md: 'w-3 h-3 ring-2',
  lg: 'w-4 h-4 ring-4',
};

export const OnlineStatus: React.FC<OnlineStatusProps> = ({ status = 'OFFLINE', size = 'md' }) => {
  return (
    <span
      className={`block rounded-full ring-offset-background ${colorMap[status]} ${sizeMap[size]}`}
      title={status.toLowerCase()}
    />
  );
};
