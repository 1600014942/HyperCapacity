import React, { useEffect, useMemo, useState } from 'react';
import {
  Area,
  AreaChart,
  CartesianGrid,
  Cell,
  Line,
  LineChart,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import {
  Activity,
  BarChart3,
  Bell,
  ChevronDown,
  Cpu,
  Database,
  Grid3X3,
  Hexagon,
  Home,
  Info,
  Layers,
  RefreshCw,
  ShieldCheck,
  SlidersHorizontal,
  Terminal,
  Zap,
} from 'lucide-react';

// Configuration
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://127.0.0.1:8000';
const API_URL = `${API_BASE_URL}/api/dashboard/overview`;

// Fallback data structure
const fallbackOverview: any = {
  meta: {
    project: 'HyperCapacity',
    dashboard: 'AI Compute & ACU Dashboard',
    version: 'v1-demo',
    currency: 'USD',
    last_updated: new Date().toISOString(),
    last_checked: new Date().toISOString(),
    auto_update: true,
    default_range: '30D',
    disclaimer: 'External data uses public reference sources. Some historical series are simulated for demo purposes. Not for settlement.',
  },
  sections: [],
};

// Utility functions
function formatNumber(value: any, options: any = {}) {
  const { decimals, prefix = '', suffix = '' } = options;
  if (value === null || value === undefined || Number.isNaN(Number(value))) return '—';
  const num = Number(value);
  const d = decimals ?? (Math.abs(num) >= 100 ? 1 : Math.abs(num) >= 10 ? 2 : 3);
  return `${prefix}${num.toLocaleString(undefined, { minimumFractionDigits: d, maximumFractionDigits: d })}${suffix}`;
}

function formatPct(value: any) {
  if (value === null || value === undefined || Number.isNaN(Number(value))) return '—';
  const num = Number(value);
  return `${num >= 0 ? '+' : ''}${num.toFixed(2)}%`;
}

function formatDateTime(value: any) {
  if (!value) return '—';
  try {
    return new Intl.DateTimeFormat('en-US', {
      month: 'short',
      day: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      hour12: false,
    }).format(new Date(value));
  } catch {
    return value;
  }
}

// Shell component
function Shell({ children }: { children: React.ReactNode }) {
  return (
    <div className="relative min-h-screen overflow-hidden bg-[#020713] text-[#e7f0ff]">
      <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(180deg,#030918_0%,#020713_50%,#01040b_100%)]" />
      <div className="pointer-events-none absolute inset-0 opacity-[0.12]" style={{ backgroundImage: 'linear-gradient(rgba(255,255,255,.12) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,.12) 1px, transparent 1px)', backgroundSize: '32px 32px' }} />
      <aside className="fixed inset-y-0 left-0 z-20 w-[72px] border-r border-[#12304c]/80 bg-[#020713]/95 backdrop-blur-xl">
        <div className="flex h-full flex-col items-center py-4">
          <div className="mb-9 flex h-11 w-11 items-center justify-center rounded-none border border-[#1d4165] bg-[#081426] shadow-none">
            <Hexagon className="h-7 w-7 text-[#bcd7ff]" />
          </div>
          <nav className="flex flex-1 flex-col items-center gap-4">
            {[
              { icon: Home, label: 'Overview' },
              { icon: BarChart3, label: 'Indices', active: true },
              { icon: Grid3X3, label: 'Sectors' },
              { icon: Terminal, label: 'API' },
              { icon: Layers, label: 'Methodology' },
              { icon: Zap, label: 'Nowcast' },
              { icon: Database, label: 'Sources' },
            ].map(({ icon: Icon, label, active }) => (
              <button
                key={label}
                title={label}
                type="button"
                className={`flex h-10 w-10 items-center justify-center rounded-none border transition ${active ? 'border-[#3d8cff]/70 bg-[#2f7cff]/15 text-[#95c8ff] shadow-none' : 'border-transparent text-[#7f8fa5] hover:border-[#16304a] hover:bg-white/[0.025] hover:text-white'}`}
              >
                <Icon className="h-5 w-5" />
              </button>
            ))}
          </nav>
          <div className="mb-2 h-px w-10 bg-[#16304a]" />
          <div className="flex flex-col items-center gap-4">
            <button type="button" title="Alerts" className="flex h-10 w-10 items-center justify-center rounded-none text-[#7f8fa5] hover:bg-white/[0.025] hover:text-white">
              <Bell className="h-5 w-5" />
            </button>
            <button type="button" title="Controls" className="flex h-10 w-10 items-center justify-center rounded-none text-[#7f8fa5] hover:bg-white/[0.025] hover:text-white">
              <SlidersHorizontal className="h-5 w-5" />
            </button>
            <div className="relative mt-3 flex h-10 w-10 items-center justify-center rounded-none border border-[#16304a] bg-[#081426] text-xs font-semibold text-white">
              HC
              <span className="absolute bottom-0 right-0 h-2.5 w-2.5 rounded-none border border-[#020713] bg-[#29d17d]" />
            </div>
          </div>
        </div>
      </aside>
      <main className="relative z-10 ml-[72px] min-h-screen px-5 py-4">{children}</main>
    </div>
  );
}

// Header component
function Header({ overview, autoUpdate, setAutoUpdate, range, setRange, loading }: any) {
  return (
    <header className="mb-4 flex h-12 items-center justify-between border-b border-[#16304a]/80 pb-3">
      <div className="flex items-center gap-3">
        <h1 className="text-[22px] font-bold tracking-[-0.02em] text-[#e7f0ff]">{overview.meta?.dashboard || 'AI Compute & ACU Dashboard'}</h1>
        <span className="rounded-none border border-[#2f7cff]/40 bg-[#2f7cff]/10 px-2.5 py-1 text-xs font-semibold text-[#75b7ff]">
          {overview.meta?.version || 'V1 Demo'}
        </span>
        {overview.api_error ? (
          <span className="rounded-none border border-[#f0b83f]/30 bg-[#f0b83f]/10 px-2 py-1 text-[11px] text-[#f0b83f]" title={overview.api_error}>fallback data</span>
        ) : null}
      </div>
      <div className="flex items-center gap-4 text-xs text-[#7f8fa5]">
        <span>Last updated: <span className="text-[#e7f0ff]">{formatDateTime(overview.meta?.last_updated)}</span></span>
        <button type="button" onClick={() => setAutoUpdate((v: boolean) => !v)} className="flex items-center gap-2 rounded-none px-2 py-1 transition hover:text-white" title="Toggle auto-update">
          <RefreshCw className={`h-4 w-4 ${autoUpdate && loading ? 'animate-spin text-[#29d17d]' : autoUpdate ? 'text-[#29d17d]' : 'text-[#ff4d68]'}`} />
          Auto-update
        </button>
        <label className="flex items-center gap-2 rounded-none border border-[#16304a] bg-[#081426] px-3 py-2 font-semibold text-[#e7f0ff]">
          <select value={range} onChange={(event) => setRange(event.target.value)} className="bg-transparent pr-6 text-xs outline-none">
            <option>24H</option>
            <option>7D</option>
            <option>30D</option>
            <option>90D</option>
          </select>
          <ChevronDown className="-ml-6 h-4 w-4 pointer-events-none text-[#7f8fa5]" />
        </label>
      </div>
    </header>
  );
}

// Status badge component
function StatusBadge({ children, tone = 'blue' }: any) {
  const tones: any = {
    blue: 'border-[#2f7cff]/40 bg-[#2f7cff]/10 text-[#88c2ff]',
    green: 'border-[#29d17d]/30 bg-[#29d17d]/10 text-[#29d17d]',
    red: 'border-[#ff4d68]/30 bg-[#ff4d68]/10 text-[#ff4d68]',
    amber: 'border-[#f0b83f]/30 bg-[#f0b83f]/10 text-[#f0b83f]',
    gray: 'border-[#16304a] bg-white/[0.025] text-[#7f8fa5]',
  };
  return <span className={`rounded-none border px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide ${tones[tone] || tones.gray}`}>{children}</span>;
}

// Mini sparkline component
function MiniSparkline({ points = [], positive = true }: any) {
  if (!points.length) return null;
  const values = points.map((p: any) => Number(p.value || p || 0));
  const min = Math.min(...values);
  const max = Math.max(...values);
  const range = max - min || 1;
  const d = values.map((value: number, index: number) => {
    const x = (index / Math.max(values.length - 1, 1)) * 128;
    const y = 34 - ((value - min) / range) * 30;
    return `${index === 0 ? 'M' : 'L'}${x.toFixed(2)},${y.toFixed(2)}`;
  }).join(' ');
  return (
    <svg viewBox="0 0 128 38" className="h-12 w-40 overflow-visible" preserveAspectRatio="none" aria-hidden="true">
      <path d={d} fill="none" stroke={positive ? '#29d17d' : '#ff4d68'} strokeWidth="2.2" strokeLinecap="butt" />
      <path d={`${d} L128,38 L0,38 Z`} fill={positive ? 'rgba(41,209,125,0.10)' : 'rgba(255,77,104,0.10)'} />
    </svg>
  );
}

// Index card component
function IndexCard({ card }: any) {
  const change = Number(card.change_24h_pct || 0);
  const positive = change >= 0;
  const isPremium = card.symbol?.includes('PREMIUM') || card.unit === 'x';
  const tooltip = [
    `symbol: ${card.symbol}`,
    `status: ${card.status}`,
    `data_mode: ${card.data_mode}`,
    `confidence: ${card.confidence}`,
    `last_updated: ${card.last_updated || 'n/a'}`,
    `last_checked: ${card.last_checked || 'n/a'}`,
    `sources: ${card.source_count ?? 'n/a'}`,
  ].join('\n');

  return (
    <div className="group rounded-none border border-[#16304a]/80 bg-[#081426]/60 p-4 backdrop-blur transition hover:border-[#2f7cff]/40 hover:bg-[#081426]/80" title={tooltip}>
      <div className="mb-3 flex items-start justify-between">
        <div className="flex-1">
          <div className="text-xs font-semibold uppercase tracking-wide text-[#7f8fa5]">{card.symbol}</div>
          <div className="mt-1 text-sm text-[#e7f0ff]">{card.display_name}</div>
        </div>
        <StatusBadge tone={card.status === 'Checked' ? 'blue' : card.status === 'Updated' ? 'green' : 'amber'}>{card.status}</StatusBadge>
      </div>

      <div className="mb-3 flex items-baseline gap-2">
        <div className="text-2xl font-bold text-[#e7f0ff]">{formatNumber(card.latest, { decimals: isPremium ? 2 : undefined })}</div>
        <div className="text-xs text-[#7f8fa5]">{card.unit}</div>
      </div>

      {card.secondary_unit && <div className="mb-2 text-xs text-[#7f8fa5]">{card.secondary_unit}</div>}

      <div className="mb-3 flex gap-3">
        <div className="flex-1">
          <div className="text-[10px] text-[#7f8fa5]">24h</div>
          <div className={`text-sm font-semibold ${positive ? 'text-[#29d17d]' : 'text-[#ff4d68]'}`}>{formatPct(card.change_24h_pct)}</div>
        </div>
        <div className="flex-1">
          <div className="text-[10px] text-[#7f8fa5]">7d</div>
          <div className={`text-sm font-semibold ${Number(card.change_7d_pct || 0) >= 0 ? 'text-[#29d17d]' : 'text-[#ff4d68]'}`}>{formatPct(card.change_7d_pct)}</div>
        </div>
      </div>

      {card.sparkline && card.sparkline.length > 0 && (
        <div className="mb-2">
          <MiniSparkline points={card.sparkline} positive={positive} />
        </div>
      )}

      <div className="flex items-center gap-2 border-t border-[#16304a]/40 pt-2 text-[10px] text-[#7f8fa5]">
        <span>{card.data_mode}</span>
        <span>•</span>
        <span>{card.confidence}</span>
      </div>
    </div>
  );
}

// Panel component
function Panel({ title, action, children, className = '' }: any) {
  return (
    <div className={`rounded-none border border-[#16304a]/80 bg-[#081426]/40 p-4 backdrop-blur ${className}`}>
      <div className="mb-4 flex items-center justify-between">
        <h2 className="text-lg font-bold text-[#e7f0ff]">{title}</h2>
        {action}
      </div>
      {children}
    </div>
  );
}

// Chart components
function H100Trend({ data }: any) {
  return (
    <Panel title="H100 Spot Price Trend">
      <ResponsiveContainer width="100%" height={200}>
        <AreaChart data={data}>
          <defs>
            <linearGradient id="colorH100" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#2f7cff" stopOpacity={0.3} />
              <stop offset="95%" stopColor="#2f7cff" stopOpacity={0} />
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" stroke="#16304a/40" />
          <XAxis dataKey="date" stroke="#7f8fa5" style={{ fontSize: '12px' }} />
          <YAxis stroke="#7f8fa5" style={{ fontSize: '12px' }} />
          <Tooltip contentStyle={{ backgroundColor: '#081426', border: '1px solid #16304a', borderRadius: 0 }} />
          <Area type="monotone" dataKey="value" stroke="#2f7cff" fillOpacity={1} fill="url(#colorH100)" />
        </AreaChart>
      </ResponsiveContainer>
    </Panel>
  );
}

function GPUBasketTrend({ data }: any) {
  return (
    <Panel title="GPU Basket Multi-line Trend">
      <ResponsiveContainer width="100%" height={200}>
        <LineChart data={data}>
          <CartesianGrid strokeDasharray="3 3" stroke="#16304a/40" />
          <XAxis dataKey="date" stroke="#7f8fa5" style={{ fontSize: '12px' }} />
          <YAxis stroke="#7f8fa5" style={{ fontSize: '12px' }} />
          <Tooltip contentStyle={{ backgroundColor: '#081426', border: '1px solid #16304a', borderRadius: 0 }} />
          <Line type="monotone" dataKey="H100" stroke="#2f7cff" dot={false} strokeWidth={2} />
          <Line type="monotone" dataKey="H200" stroke="#8a4cf6" dot={false} strokeWidth={2} />
          <Line type="monotone" dataKey="A100" stroke="#25b8c7" dot={false} strokeWidth={2} />
          <Line type="monotone" dataKey="B200" stroke="#f0b83f" dot={false} strokeWidth={2} />
        </LineChart>
      </ResponsiveContainer>
    </Panel>
  );
}

function DonutChart({ title, data, centerTitle }: any) {
  const total = data.reduce((sum: number, item: any) => sum + item.value, 0);
  const colors = ['#2f7cff', '#8a4cf6', '#25b8c7', '#f0b83f', '#d45f9b', '#9aa7b7'];

  return (
    <Panel title={title} className="relative min-h-[285px]">
      <ResponsiveContainer width="100%" height={200}>
        <PieChart>
          <Pie data={data} cx="50%" cy="50%" innerRadius={50} outerRadius={80} paddingAngle={2} dataKey="value">
            {data.map((_: any, index: number) => (
              <Cell key={`cell-${index}`} fill={colors[index % colors.length]} />
            ))}
          </Pie>
          <Tooltip contentStyle={{ backgroundColor: '#081426', border: '1px solid #16304a', borderRadius: 0 }} />
        </PieChart>
      </ResponsiveContainer>
      <div className="pointer-events-none absolute left-[24%] top-[52%] hidden -translate-x-1/2 -translate-y-1/2 text-center text-[11px] text-[#7f8fa5] xl:block">
        {centerTitle?.split('\n').map((line: string) => <div key={line}>{line}</div>)}
        <div className="mt-1 text-lg font-bold text-white">{total.toFixed(0)}%</div>
      </div>
    </Panel>
  );
}

function ACUTrend({ title, data, color }: any) {
  return (
    <Panel title={title}>
      <ResponsiveContainer width="100%" height={200}>
        <AreaChart data={data}>
          <defs>
            <linearGradient id={`color${title}`} x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor={color} stopOpacity={0.3} />
              <stop offset="95%" stopColor={color} stopOpacity={0} />
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" stroke="#16304a/40" />
          <XAxis dataKey="date" stroke="#7f8fa5" style={{ fontSize: '12px' }} />
          <YAxis stroke="#7f8fa5" style={{ fontSize: '12px' }} />
          <Tooltip contentStyle={{ backgroundColor: '#081426', border: '1px solid #16304a', borderRadius: 0 }} />
          <Area type="monotone" dataKey="value" stroke={color} fillOpacity={1} fill={`url(#color${title})`} />
        </AreaChart>
      </ResponsiveContainer>
    </Panel>
  );
}

function TopModelsTable({ models }: any) {
  return (
    <Panel title="Top Models by ACU" action={<button type="button" className="text-xs font-semibold text-[#2f7cff] hover:text-white">View full leaderboard</button>} className="min-h-[285px]">
      <div className="overflow-hidden rounded-none border border-[#16304a]/80">
        <table className="w-full text-left text-xs">
          <thead className="bg-black/25 text-[#7f8fa5]">
            <tr><th className="px-3 py-2 font-medium">Rank</th><th className="px-3 py-2 font-medium">Model</th><th className="px-3 py-2 text-right font-medium">ACU Score</th><th className="px-3 py-2 text-right font-medium">24h Change</th></tr>
          </thead>
          <tbody>
            {models.map((model: any, index: number) => {
              const change = Number(model.change_24h_pct ?? model.change ?? 0);
              return (
                <tr key={`${model.model}-${index}`} className="border-t border-[#16304a]/60 hover:bg-white/[0.025]" title={`data_mode: ${model.data_mode || 'unknown'} | confidence: ${model.confidence || 'unknown'}`}>
                  <td className="px-3 py-2 font-mono text-[#7f8fa5]">{model.rank ?? index + 1}</td>
                  <td className="max-w-[190px] truncate px-3 py-2 text-[#e7f0ff]">{model.model || model.display_name || model.name}</td>
                  <td className="px-3 py-2 text-right font-mono text-[#e7f0ff]">{formatNumber(model.acu_score ?? model.score ?? model.latest, { decimals: 1 })}</td>
                  <td className={`px-3 py-2 text-right font-mono ${change >= 0 ? 'text-[#29d17d]' : 'text-[#ff4d68]'}`}>{change >= 0 ? '+' : ''}{change.toFixed(2)}%</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </Panel>
  );
}

// Section component
function Section({ section, action, children }: any) {
  return (
    <section className="mb-6">
      <div className="mb-4 flex items-center justify-between">
        <div>
          <h2 className="text-lg font-bold text-[#e7f0ff]">{section.title}</h2>
          <p className="text-xs text-[#7f8fa5]">{section.subtitle}</p>
        </div>
        {action}
      </div>
      {children}
    </section>
  );
}

// Main dashboard component
export default function Dashboard() {
  const [overview, setOverview] = useState(fallbackOverview);
  const [loading, setLoading] = useState(false);
  const [autoUpdate, setAutoUpdate] = useState(true);
  const [range, setRange] = useState('24H');

  useEffect(() => {
    let cancelled = false;
    async function load() {
      setLoading(true);
      try {
        const response = await fetch(API_URL, { headers: { Accept: 'application/json' } });
        if (!response.ok) throw new Error(`HTTP ${response.status}`);
        const payload = await response.json();
        if (!cancelled) {
          setOverview(payload);
        }
      } catch (error: any) {
        if (!cancelled) {
          setOverview({ ...fallbackOverview, api_error: error.message });
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    load();
    if (!autoUpdate) return () => { cancelled = true; };
    const timer = window.setInterval(load, 60000);
    return () => { cancelled = true; window.clearInterval(timer); };
  }, [autoUpdate]);

  const external = overview.sections?.find((s: any) => s.id === 'external_compute') || { title: 'External Compute Indices', subtitle: '', cards: [], charts: {} };
  const acu = overview.sections?.find((s: any) => s.id === 'acu_dashboard') || { title: 'ACU Dashboard', subtitle: '', cards: [], charts: {} };

  // Show error message if backend is not available
  if (overview.api_error && !overview.sections?.length) {
    return (
      <Shell>
        <Header overview={overview} autoUpdate={autoUpdate} setAutoUpdate={setAutoUpdate} range={range} setRange={setRange} loading={loading} />
        <div className="rounded-none border border-[#ff4d68]/30 bg-[#ff4d68]/10 p-6 text-center">
          <div className="mb-2 text-lg font-semibold text-[#ff4d68]">Backend Connection Error</div>
          <div className="mb-4 text-sm text-[#e7f0ff]">{overview.api_error}</div>
          <div className="text-xs text-[#7f8fa5]">
            <p className="mb-2">Please ensure the backend is running:</p>
            <code className="rounded-none border border-[#16304a] bg-[#081426] px-3 py-2 font-mono text-[#2f7cff]">cd backend && ./start_backend.sh</code>
          </div>
        </div>
      </Shell>
    );
  }

  return (
    <Shell>
      <Header overview={overview} autoUpdate={autoUpdate} setAutoUpdate={setAutoUpdate} range={range} setRange={setRange} loading={loading} />

      <Section section={external} action={<button type="button" className="rounded-none border border-[#16304a] bg-[#081426] px-3 py-2 text-xs font-semibold text-[#2f7cff] hover:text-white">View all external sources</button>}>
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
          {(external.cards || []).map((item: any) => <IndexCard key={item.symbol} card={item} />)}
        </div>
        <div className="mt-4 grid grid-cols-1 gap-4 xl:grid-cols-[1fr_1fr_1.05fr]">
          <H100Trend data={(external.charts as any)?.h100_spot_history || []} />
          <GPUBasketTrend data={(external.charts as any)?.gpu_basket_history || []} />
          <DonutChart title="External Compute Breakdown" data={(external.charts as any)?.external_breakdown || []} />
        </div>
      </Section>

      <Section section={acu} action={<button type="button" className="flex items-center gap-2 text-xs font-semibold text-[#2f7cff] hover:text-white"><ShieldCheck className="h-4 w-4" /> About ACU</button>}>
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
          {(acu.cards || []).map((item: any) => <IndexCard key={item.symbol} card={item} />)}
        </div>
        <div className="mt-4 grid grid-cols-1 gap-4 xl:grid-cols-2">
          <ACUTrend title="ACU CodeFix Trend" data={(acu.charts as any)?.acu_codefix_history || []} color="#2f7cff" />
          <ACUTrend title="ACU Coding/USD Trend" data={(acu.charts as any)?.acu_coding_usd_history || []} color="#8a4cf6" />
          <ACUTrend title="ACU Reasoning Trend" data={(acu.charts as any)?.acu_reasoning_history || []} color="#25b8c7" />
          <ACUTrend title="ACU CPI Trend" data={(acu.charts as any)?.acu_cpi_history || []} color="#f0b83f" />
        </div>
        <div className="mt-4 grid grid-cols-1 gap-4 xl:grid-cols-2">
          <DonutChart title="Model Capability Breakdown" data={(acu.charts as any)?.capability_breakdown || []} centerTitle="Total ACU\nComposition" />
          <TopModelsTable models={(acu.charts as any)?.top_models || []} />
        </div>
      </Section>

      <footer className="flex flex-wrap items-center justify-between gap-3 px-1 pb-2 text-xs text-[#7f8fa5]">
        <span>All prices in USD. GPU-hr = per GPU hour.</span>
        <span>{overview.meta?.disclaimer}</span>
        <span>© 2026 HyperCapacity. All rights reserved.</span>
      </footer>
    </Shell>
  );
}
