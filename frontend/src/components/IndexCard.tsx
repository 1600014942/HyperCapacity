import React from 'react';
import { Info } from 'lucide-react';
import { cn } from '@/lib/utils';
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip';

interface IndexCardProps {
  symbol: string;
  displayName: string;
  latest: number;
  unit: string;
  change24h: number;
  sparkline?: number[];
  confidence?: string;
  dataMode?: string;
  status?: string;
  lastUpdated?: string;
}

export default function IndexCard({
  symbol,
  displayName,
  latest,
  unit,
  change24h,
  sparkline = [],
  confidence,
  dataMode,
  status,
  lastUpdated,
}: IndexCardProps) {
  const isPositive = change24h >= 0;
  const changeColor = isPositive ? 'text-green-400' : 'text-red-400';

  // Simple sparkline rendering
  const maxVal = Math.max(...sparkline, latest);
  const minVal = Math.min(...sparkline, latest);
  const range = maxVal - minVal || 1;

  const tooltipContent = `
Confidence: ${confidence || 'N/A'}
Data Mode: ${dataMode || 'N/A'}
Status: ${status || 'N/A'}
Last Updated: ${lastUpdated || 'N/A'}
  `.trim();

  return (
    <div className="bg-card border border-border rounded-lg p-4 hover:border-accent transition-colors group relative overflow-hidden">
      {/* Top accent border */}
      <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-accent/0 via-accent to-accent/0" />
      {/* Header */}
      <div className="flex items-start justify-between mb-3 mt-2">
        <div className="flex-1">
          <div className="flex items-center gap-2">
            <h3 className="text-sm font-semibold text-foreground">{symbol}</h3>
            <Tooltip>
              <TooltipTrigger asChild>
                <button className="text-muted-foreground hover:text-accent transition-colors">
                  <Info size={14} />
                </button>
              </TooltipTrigger>
              <TooltipContent side="right" className="max-w-xs">
                <p className="text-xs whitespace-pre-wrap">{tooltipContent}</p>
              </TooltipContent>
            </Tooltip>
          </div>
          <p className="text-xs text-muted-foreground mt-1">{displayName}</p>
        </div>
      </div>

      {/* Value */}
      <div className="mb-3">
        <div className="text-display text-3xl font-bold text-accent mb-1">
          {latest.toLocaleString('en-US', {
            minimumFractionDigits: latest > 100 ? 0 : 2,
            maximumFractionDigits: latest > 100 ? 0 : 2,
          })}
        </div>
        <p className="text-xs text-muted-foreground">{unit}</p>
      </div>

      {/* Change */}
      <div className="mb-3">
        <span className={cn('text-sm font-bold', changeColor)}>
          {isPositive ? '▲' : '▼'} {Math.abs(change24h).toFixed(2)}%
        </span>
        <span className="text-xs text-muted-foreground ml-2">24h Change</span>
      </div>

      {/* Sparkline */}
      {sparkline.length > 0 && (
        <div className="h-10 flex items-end gap-0.5 bg-secondary/50 rounded p-1 border border-border/50">
          {sparkline.map((val, idx) => {
            const height = ((val - minVal) / range) * 100;
            return (
              <div
                key={idx}
                className="flex-1 bg-gradient-to-t from-accent via-accent/80 to-accent/40 rounded-t opacity-80 hover:opacity-100 transition-opacity shadow-lg shadow-accent/30"
                style={{ height: `${Math.max(height, 10)}%` }}
                title={`${val.toFixed(2)}`}
              />
            );
          }          )}
        </div>
      )}
    </div>
  );
}

// Utility function to format large numbers
function formatNumber(num: number): string {
  if (num >= 1000000) return (num / 1000000).toFixed(1) + 'M';
  if (num >= 1000) return (num / 1000).toFixed(1) + 'K';
  return num.toFixed(2);
}
