import React, { useState, useEffect } from 'react';
import { Menu, X, RefreshCw } from 'lucide-react';
import { cn } from '@/lib/utils';

interface DashboardLayoutProps {
  children: React.ReactNode;
  lastUpdated?: Date;
  onRefresh?: () => void;
}

export default function DashboardLayout({ children, lastUpdated, onRefresh }: DashboardLayoutProps) {
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [currentTime, setCurrentTime] = useState(new Date());
  const [autoUpdate, setAutoUpdate] = useState(true);
  const [timeRange, setTimeRange] = useState('24H');
  const [isRefreshing, setIsRefreshing] = useState(false);

  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  const handleRefresh = async () => {
    setIsRefreshing(true);
    if (onRefresh) {
      await onRefresh();
    }
    setTimeout(() => setIsRefreshing(false), 500);
  };

  const formatTime = (date: Date) => {
    return date.toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      timeZone: 'UTC',
      timeZoneName: 'short',
    });
  };

  const navItems = [
    { icon: '📊', label: 'Dashboard', active: true },
    { icon: '📈', label: 'Indices', active: false },
    { icon: '🎯', label: 'ACU', active: false },
    { icon: '⚙️', label: 'Settings', active: false },
  ];

  return (
    <div className="flex h-screen bg-background text-foreground overflow-hidden">
      {/* Sidebar */}
      <div
        className={cn(
          'fixed left-0 top-0 h-full bg-sidebar border-r border-border transition-all duration-300 z-40',
          sidebarOpen ? 'w-16' : 'w-0'
        )}
      >
        <div className="flex flex-col items-center py-4 space-y-4">
          {navItems.map((item, idx) => (
            <button
              key={idx}
              className={cn(
                'w-12 h-12 rounded-lg flex items-center justify-center text-lg transition-all duration-200 hover:scale-110',
                item.active
                  ? 'bg-accent text-accent-foreground shadow-lg shadow-accent/50'
                  : 'text-sidebar-foreground hover:bg-sidebar-accent/50'
              )}
              title={item.label}
            >
              {item.icon}
            </button>
          ))}
        </div>
      </div>

      {/* Main Content */}
      <div className={cn('flex-1 flex flex-col transition-all duration-300', sidebarOpen ? 'ml-16' : 'ml-0')}>
        {/* Top Bar */}
        <div className="h-16 bg-card border-b border-border px-6 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <button
              onClick={() => setSidebarOpen(!sidebarOpen)}
              className="p-2 hover:bg-secondary rounded-lg transition-colors"
            >
              {sidebarOpen ? <X size={20} /> : <Menu size={20} />}
            </button>
            <div>
              <h1 className="text-xl font-bold text-foreground">AI Compute & ACU Dashboard</h1>
              <p className="text-xs text-muted-foreground">V1 Demo</p>
            </div>
          </div>

          <div className="flex items-center gap-4 text-sm">
            <span className="text-muted-foreground">
              Last updated: <span className="text-foreground">{lastUpdated ? formatTime(lastUpdated) : 'N/A'}</span>
            </span>
            <button
              onClick={handleRefresh}
              disabled={isRefreshing}
              className="px-3 py-1 rounded border border-border hover:bg-secondary transition-colors text-muted-foreground hover:text-foreground disabled:opacity-50"
            >
              <RefreshCw size={14} className={cn('inline mr-1', isRefreshing && 'animate-spin')} />
              Refresh
            </button>
            <button
              onClick={() => setAutoUpdate(!autoUpdate)}
              className={cn(
                'px-3 py-1 rounded border transition-colors',
                autoUpdate
                  ? 'border-accent bg-accent/10 text-accent'
                  : 'border-border text-muted-foreground hover:bg-secondary'
              )}
            >
              ⚡ Auto-update
            </button>
            <select
              value={timeRange}
              onChange={(e) => setTimeRange(e.target.value)}
              className="px-3 py-1 rounded border border-border bg-secondary text-foreground cursor-pointer hover:border-accent transition-colors"
            >
              <option>24H</option>
              <option>7D</option>
              <option>30D</option>
              <option>90D</option>
            </select>
          </div>
        </div>

        {/* Content Area */}
        <div className="flex-1 overflow-auto bg-gradient-to-b from-background to-background/95">
          <div className="p-6">
            {children}
          </div>
        </div>
      </div>
    </div>
  );
}
