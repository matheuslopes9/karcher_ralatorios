'use client';

import { User, roleLabels, roleColors } from '@/lib/types';

interface RoleBadgeProps {
  role: User['role'];
  size?: 'sm' | 'md' | 'lg';
}

export default function RoleBadge({ role, size = 'md' }: RoleBadgeProps) {
  const sizeClasses = {
    sm: 'px-2 py-0.5 text-xs',
    md: 'px-3 py-1 text-sm',
    lg: 'px-4 py-2 text-base',
  };

  return (
    <span className={`inline-flex items-center font-semibold rounded-full ${roleColors[role]} ${sizeClasses[size]}`}>
      {roleLabels[role]}
    </span>
  );
}
