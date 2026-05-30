import { useState, useEffect } from 'react';
import DashboardLayout from '@/components/DashboardLayout';
import SectionHeader from '@/components/SectionHeader';
import IndexCard from '@/components/IndexCard';
import { useDashboardData } from '@/hooks/useDashboardData';
import { Spinner } from '@/components/ui/spinner';
import {
  LineChart,
  Line,
  AreaChart,
  Area,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  ComposedChart,
  Bar,
} from 'recharts';

/**
 * Design Philosophy: Institutional Dark Terminal
 * - Deep navy background (#0a0e27) with electric cyan accents (#00d4ff)
 * - IBM Plex Mono for numbers, IBM Plex Sans for labels
 * - Information density with strategic whitespace
 * - Thin borders, minimal ornamentation
 * - Emerald for gains (#10b981), crimson for losses (#ef4444)
 */

export default function Home() {
  const { data, loading, error, lastUpdated } = useDashboardData();
  const [timeRange, setTimeRange] = useState('30D');

  if (loading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center h-96">
          <Spinner className="w-8 h-8" />
          <span className="ml-3 text-muted-foreground">Loading dashboard data...</span>
        </div>
      </DashboardLayout>
    );
  }

  if (error || !data) {
    return (
      <DashboardLayout>
        <div className="bg-red-500/10 border border-red-500/30 rounded-lg p-4 text-red-400">
          <p className="font-semibold">Error loading dashboard</p>
          <p className="text-sm mt-1">{error || 'Unknown error'}</p>
        </div>
      </DashboardLayout>
    );
  }

  const externalComputeSection = data.sections.find((s) => s.id === 'external_compute');
  const acuSection = data.sections.find((s) => s.id === 'acu_dashboard');

  const formatTime = (isoString: string) => {
    const date = new Date(isoString);
    return date.toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      timeZone: 'UTC',
      timeZoneName: 'short',
    });
  };

  // Chart colors
  const chartColors = ['#00d4ff', '#0099ff', '#0066ff', '#6366f1', '#8b5cf6', '#10b981', '#ef4444'];
  const positiveColor = '#10b981';
  const negativeColor = '#ef4444';

  return (
    <DashboardLayout lastUpdated={lastUpdated || undefined} onRefresh={() => {}}>
      {/* External Compute Indices Section */}
      {externalComputeSection && (
        <section className="mb-12">
          <SectionHeader
            number={1}
            title={externalComputeSection.title}
            subtitle={externalComputeSection.subtitle}
            actionLabel="View all external sources"
          />

          {/* Index Cards Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
            {externalComputeSection.cards.map((card) => (
              <IndexCard
                key={card.symbol}
                symbol={card.symbol}
                displayName={card.display_name}
                latest={card.latest}
                unit={card.unit}
                change24h={card.change_24h_pct}
                sparkline={card.sparkline}
                confidence={card.confidence}
                dataMode={card.data_mode}
                status={card.status}
                lastUpdated={formatTime(card.last_updated)}
              />
            ))}
          </div>

          {/* Charts Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* H100 Spot Price Chart */}
            {externalComputeSection.charts.h100_spot_history && (
              <div className="lg:col-span-1 bg-card border border-border rounded-lg p-4 hover:border-accent/50 transition-colors">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-sm font-semibold text-foreground">H100 Spot Price</h3>
                  <div className="flex gap-1">
                    {['7D', '30D', '90D'].map((range) => (
                      <button
                        key={range}
                        className="px-2 py-1 text-xs rounded border border-border hover:bg-secondary transition-colors"
                        onClick={() => setTimeRange(range)}
                      >
                        {range}
                      </button>
                    ))}
                  </div>
                </div>
                <ResponsiveContainer width="100%" height={250}>
                  <AreaChart data={externalComputeSection.charts.h100_spot_history}>
                    <defs>
                      <linearGradient id="colorH100" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#00d4ff" stopOpacity={0.3} />
                        <stop offset="95%" stopColor="#00d4ff" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="#1e3a5f" />
                    <XAxis dataKey="date" stroke="#94a3b8" style={{ fontSize: '12px' }} />
                    <YAxis stroke="#94a3b8" style={{ fontSize: '12px' }} />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: '#111b3d',
                        border: '1px solid #1e3a5f',
                        borderRadius: '4px',
                      }}
                      labelStyle={{ color: '#e5e7eb' }}
                    />
                    <Area
                      type="monotone"
                      dataKey="value"
                      stroke="#00d4ff"
                      fillOpacity={1}
                      fill="url(#colorH100)"
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            )}

            {/* GPU Basket Multi-line Chart */}
            {externalComputeSection.charts.gpu_basket_history && (
              <div className="lg:col-span-1 bg-card border border-border rounded-lg p-4 hover:border-accent/50 transition-colors">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-sm font-semibold text-foreground">GPU Basket</h3>
                  <div className="flex gap-1">
                    {['7D', '30D', '90D'].map((range) => (
                      <button
                        key={range}
                        className="px-2 py-1 text-xs rounded border border-border hover:bg-secondary transition-colors"
                        onClick={() => setTimeRange(range)}
                      >
                        {range}
                      </button>
                    ))}
                  </div>
                </div>
                <ResponsiveContainer width="100%" height={250}>
                  <LineChart data={externalComputeSection.charts.gpu_basket_history}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#1e3a5f" />
                    <XAxis dataKey="date" stroke="#94a3b8" style={{ fontSize: '12px' }} />
                    <YAxis stroke="#94a3b8" style={{ fontSize: '12px' }} />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: '#111b3d',
                        border: '1px solid #1e3a5f',
                        borderRadius: '4px',
                      }}
                      labelStyle={{ color: '#e5e7eb' }}
                    />
                    <Line
                      type="monotone"
                      dataKey="value"
                      stroke="#00d4ff"
                      dot={false}
                      strokeWidth={2}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            )}

            {/* External Compute Breakdown Pie Chart */}
            {externalComputeSection.charts.external_breakdown && (
              <div className="lg:col-span-1 bg-card border border-border rounded-lg p-4 hover:border-accent/50 transition-colors">
                <h3 className="text-sm font-semibold text-foreground mb-4">External Compute Breakdown</h3>
                <ResponsiveContainer width="100%" height={250}>
                  <PieChart>
                    <Pie
                      data={externalComputeSection.charts.external_breakdown}
                      cx="50%"
                      cy="50%"
                      innerRadius={50}
                      outerRadius={80}
                      paddingAngle={2}
                      dataKey="value"
                    >
                      {externalComputeSection.charts.external_breakdown.map((_: any, index: number) => (
                        <Cell key={`cell-${index}`} fill={chartColors[index % chartColors.length]} />
                      ))}
                    </Pie>
                    <Tooltip
                      contentStyle={{
                        backgroundColor: '#111b3d',
                        border: '1px solid #1e3a5f',
                        borderRadius: '4px',
                      }}
                      labelStyle={{ color: '#e5e7eb' }}
                    />
                  </PieChart>
                </ResponsiveContainer>
                <div className="mt-4 space-y-2 text-xs">
                  {externalComputeSection.charts.external_breakdown.map((item: any, idx: number) => (
                    <div key={idx} className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div
                          className="w-2 h-2 rounded-full"
                          style={{ backgroundColor: chartColors[idx % chartColors.length] }}
                        />
                        <span className="text-muted-foreground">{item.name}</span>
                      </div>
                      <span className="text-foreground font-semibold">{item.value.toFixed(1)}%</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </section>
      )}

      {/* ACU Dashboard Section */}
      {acuSection && (
        <section className="mb-12">
          <SectionHeader
            number={2}
            title={acuSection.title}
            subtitle={acuSection.subtitle}
            actionLabel="About ACU"
          />

          {/* ACU Index Cards Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
            {acuSection.cards.map((card) => (
              <IndexCard
                key={card.symbol}
                symbol={card.symbol}
                displayName={card.display_name}
                latest={card.latest}
                unit={card.unit}
                change24h={card.change_24h_pct}
                sparkline={card.sparkline}
                confidence={card.confidence}
                dataMode={card.data_mode}
                status={card.status}
                lastUpdated={formatTime(card.last_updated)}
              />
            ))}
          </div>

          {/* ACU Charts Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
            {/* ACU Coding Trend */}
            {acuSection.charts.acu_coding_usd_history && (
              <div className="lg:col-span-1 bg-card border border-border rounded-lg p-4 hover:border-accent/50 transition-colors">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-sm font-semibold text-foreground">ACU Coding Trend</h3>
                  <div className="flex gap-1">
                    {['7D', '30D', '90D'].map((range) => (
                      <button
                        key={range}
                        className="px-2 py-1 text-xs rounded border border-border hover:bg-secondary transition-colors"
                        onClick={() => setTimeRange(range)}
                      >
                        {range}
                      </button>
                    ))}
                  </div>
                </div>
                <ResponsiveContainer width="100%" height={250}>
                  <AreaChart data={acuSection.charts.acu_coding_usd_history}>
                    <defs>
                      <linearGradient id="colorCoding" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#0099ff" stopOpacity={0.3} />
                        <stop offset="95%" stopColor="#0099ff" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="#1e3a5f" />
                    <XAxis dataKey="date" stroke="#94a3b8" style={{ fontSize: '12px' }} />
                    <YAxis stroke="#94a3b8" style={{ fontSize: '12px' }} />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: '#111b3d',
                        border: '1px solid #1e3a5f',
                        borderRadius: '4px',
                      }}
                      labelStyle={{ color: '#e5e7eb' }}
                    />
                    <Area
                      type="monotone"
                      dataKey="value"
                      stroke="#0099ff"
                      fillOpacity={1}
                      fill="url(#colorCoding)"
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            )}

            {/* ACU Reasoning Trend */}
            {acuSection.charts.acu_reasoning_history && (
              <div className="lg:col-span-1 bg-card border border-border rounded-lg p-4 hover:border-accent/50 transition-colors">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-sm font-semibold text-foreground">ACU Reasoning Trend</h3>
                  <div className="flex gap-1">
                    {['7D', '30D', '90D'].map((range) => (
                      <button
                        key={range}
                        className="px-2 py-1 text-xs rounded border border-border hover:bg-secondary transition-colors"
                        onClick={() => setTimeRange(range)}
                      >
                        {range}
                      </button>
                    ))}
                  </div>
                </div>
                <ResponsiveContainer width="100%" height={250}>
                  <AreaChart data={acuSection.charts.acu_reasoning_history}>
                    <defs>
                      <linearGradient id="colorReasoning" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#8b5cf6" stopOpacity={0.3} />
                        <stop offset="95%" stopColor="#8b5cf6" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="#1e3a5f" />
                    <XAxis dataKey="date" stroke="#94a3b8" style={{ fontSize: '12px' }} />
                    <YAxis stroke="#94a3b8" style={{ fontSize: '12px' }} />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: '#111b3d',
                        border: '1px solid #1e3a5f',
                        borderRadius: '4px',
                      }}
                      labelStyle={{ color: '#e5e7eb' }}
                    />
                    <Area
                      type="monotone"
                      dataKey="value"
                      stroke="#8b5cf6"
                      fillOpacity={1}
                      fill="url(#colorReasoning)"
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            )}

            {/* Model Capability Breakdown */}
            {acuSection.charts.capability_breakdown && (
              <div className="lg:col-span-1 bg-card border border-border rounded-lg p-4 hover:border-accent/50 transition-colors">
                <h3 className="text-sm font-semibold text-foreground mb-4">Model Capability Breakdown</h3>
                <ResponsiveContainer width="100%" height={250}>
                  <PieChart>
                    <Pie
                      data={acuSection.charts.capability_breakdown}
                      cx="50%"
                      cy="50%"
                      innerRadius={50}
                      outerRadius={80}
                      paddingAngle={2}
                      dataKey="value"
                    >
                      {acuSection.charts.capability_breakdown.map((_: any, index: number) => (
                        <Cell key={`cell-${index}`} fill={chartColors[index % chartColors.length]} />
                      ))}
                    </Pie>
                    <Tooltip
                      contentStyle={{
                        backgroundColor: '#111b3d',
                        border: '1px solid #1e3a5f',
                        borderRadius: '4px',
                      }}
                      labelStyle={{ color: '#e5e7eb' }}
                    />
                  </PieChart>
                </ResponsiveContainer>
                <div className="mt-4 space-y-2 text-xs">
                  {acuSection.charts.capability_breakdown.map((item: any, idx: number) => (
                    <div key={idx} className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div
                          className="w-2 h-2 rounded-full"
                          style={{ backgroundColor: chartColors[idx % chartColors.length] }}
                        />
                        <span className="text-muted-foreground">{item.name}</span>
                      </div>
                      <span className="text-foreground font-semibold">{item.value.toFixed(1)}%</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Top Models Table */}
          {acuSection.charts.top_models && (
            <div className="bg-card border border-border rounded-lg p-4 mb-8 hover:border-accent/50 transition-colors">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-sm font-semibold text-foreground">Top Models by ACU</h3>
                <button className="text-xs text-accent hover:text-accent/80 transition-colors">
                  View full leaderboard →
                </button>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-border/50 bg-secondary/20">
                      <th className="text-left py-3 px-4 text-muted-foreground font-semibold">Rank</th>
                      <th className="text-left py-3 px-4 text-muted-foreground font-semibold">Model</th>
                      <th className="text-right py-3 px-4 text-muted-foreground font-semibold">ACU Score</th>
                      <th className="text-right py-3 px-4 text-muted-foreground font-semibold">24h Change</th>
                    </tr>
                  </thead>
                  <tbody>
                    {acuSection.charts.top_models.slice(0, 5).map((model: any) => (
                      <tr key={model.rank} className="border-b border-border/30 hover:bg-secondary/50 transition-colors group">
                        <td className="py-3 px-4 text-accent font-bold group-hover:text-accent/80">{model.rank}</td>
                        <td className="py-3 px-4">
                          <div>
                            <p className="text-foreground font-semibold group-hover:text-accent transition-colors">{model.model}</p>
                            <p className="text-xs text-muted-foreground">{model.provider}</p>
                          </div>
                        </td>
                        <td className="py-3 px-4 text-right text-display text-accent font-bold">
                          {model.acu_score.toLocaleString('en-US', { maximumFractionDigits: 1 })}
                        </td>
                        <td className={`py-3 px-4 text-right font-bold ${
                          model.change_24h_pct >= 0 ? 'text-green-400' : 'text-red-400'
                        }`}>
                          {model.change_24h_pct >= 0 ? '▲' : '▼'} {Math.abs(model.change_24h_pct).toFixed(2)}%
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </section>
      )}

      {/* Footer Disclaimer */}
      <footer className="border-t border-border/50 pt-6 mt-12 pb-6">
        <div className="bg-secondary/30 border border-border/30 rounded-lg p-4 mb-4">
          <p className="text-xs text-muted-foreground text-center leading-relaxed">
            <span className="font-semibold text-accent">Disclaimer:</span> This is a V1 demo. External data uses public reference sources. Some historical series are simulated for demo purposes. <span className="font-semibold">Not for settlement.</span>
          </p>
        </div>
        <p className="text-xs text-muted-foreground text-center">
          © 2025 HyperCapacity. All rights reserved.
        </p>
      </footer>
    </DashboardLayout>
  );
}

// Design Philosophy Notes:
// - Institutional Dark Terminal aesthetic with deep navy background
// - Electric cyan (#00d4ff) for primary accents and interactive elements
// - Emerald green (#10b981) for positive changes, crimson red (#ef4444) for negative
// - IBM Plex Mono for numbers (ensures perfect alignment), IBM Plex Sans for labels
// - Thin borders, minimal ornamentation, strategic whitespace
// - Charts use Recharts with custom color palette matching the theme
// - Responsive grid layout: 4 columns on desktop, 2 on tablet, 1 on mobile
// - Hover states provide subtle visual feedback without distraction
