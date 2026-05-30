import React from 'react';
import { ExternalLink } from 'lucide-react';

interface SectionHeaderProps {
  number: number;
  title: string;
  subtitle?: string;
  actionLabel?: string;
  onAction?: () => void;
}

// Design Philosophy: Institutional Dark Terminal
// - Section headers use numbered styling with accent color
// - Subtle gradient underline for visual interest
// - Action buttons have hover states with background tint

export default function SectionHeader({
  number,
  title,
  subtitle,
  actionLabel,
  onAction,
}: SectionHeaderProps) {
  return (
    <div className="flex items-center justify-between mb-6 pb-4 border-b border-border/50 relative">
      {/* Accent line */}
      <div className="absolute bottom-0 left-0 h-0.5 bg-gradient-to-r from-accent via-accent/50 to-transparent" style={{ width: '200px' }} />
      <div className="relative z-10">
        <h2 className="text-2xl font-bold text-foreground">
          <span className="text-accent font-black text-3xl">{number}.</span> {title}
        </h2>
        {subtitle && (
          <p className="text-sm text-muted-foreground mt-1">{subtitle}</p>
        )}
      </div>
      {actionLabel && onAction && (
        <button
          onClick={onAction}
          className="flex items-center gap-2 px-3 py-1 text-sm text-accent hover:text-accent/80 transition-colors hover:bg-accent/10 rounded"
        >
          {actionLabel}
          <ExternalLink size={14} />
        </button>
      )}
    </div>
  );
}

// Add type definitions
SectionHeader.defaultProps = {
  subtitle: undefined,
  actionLabel: undefined,
  onAction: undefined,
};
