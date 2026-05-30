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

const API_URL = '/api/dashboard/overview';

const nowIso = new Date('2026-05-30T07:45:00+08:00').toISOString();

const palette = ['#2f7cff', '#8a4cf6', '#25b8c7', '#f0b83f', '#d45f9b', '#9aa7b7'];

function makeSeries(base, points = 31, drift = 0.01, amp = 0.04) {
  return Array.from({ length: points }, (_, i) => {
    const date = new Date(Date.now() - (points - 1 - i) * 24 * 60 * 60 * 1000);
    const wave = Math.sin(i / 3) * amp + Math.cos(i / 7) * amp * 0.65;
    const value = base * (1 + drift * i + wave + ((i % 5) - 2) * 0.004);
    return { date: date.toISOString().slice(5, 10), value: Number(value.toFixed(3)) };
  });
}

function spark(base, points = 28, direction = 1) {
  return Array.from({ length: points }, (_, i) => ({
    x: i,
    value: Number((base * (1 + direction * i * 0.006 + Math.sin(i / 2.2) * 0.018)).toFixed(4)),
  }));
}

function card(input) {
  return {
    last_updated: nowIso,
    last_checked: nowIso,
    methodology: `${input.symbol} V1 demo public reference methodology. Historical mini-series can be simulated for display only.`,
    ...input,
  };
}

const h100 = makeSeries(2.42, 31, 0.005, 0.055);
const h200 = makeSeries(4.66, 31, 0.004, 0.04);
const a100 = makeSeries(1.28, 31, 0.003, 0.035);
const l40s = makeSeries(0.82, 31, 0.002, 0.03);
const mi300x = makeSeries(0.46, 31, 0.002, 0.025);

const fallbackOverview = {
  dashboard_title: 'AI Compute & ACU Dashboard',
  version: 'V1 Demo',
  last_updated: nowIso,
  last_checked: nowIso,
  data_mode: 'mixed',
  sections: [
    {
      id: 'external_compute',
      title: 'External Compute Indices',
      subtitle: 'Demo-stage market data from third-party compute index sources',
      cards: [
        card({ symbol: 'H100-SPOT', display_name: 'H100 Spot Compute', latest: 2.842, unit: 'USD / GPU-hour', change_24h_pct: 4.73, change_7d_pct: 6.28, data_mode: 'manual_public', confidence: 'Medium', status: 'Checked', source_count: 3, sparkline: spark(2.65, 30, 1) }),
        card({ symbol: 'H200-SPOT', display_name: 'H200 Spot Compute', latest: 4.918, unit: 'USD / GPU-hour', change_24h_pct: 3.21, change_7d_pct: 4.92, data_mode: 'manual_public', confidence: 'Medium', status: 'Checked', source_count: 3, sparkline: spark(4.68, 30, 1) }),
        card({ symbol: 'GPU-BASKET', display_name: 'AI GPU Basket', latest: 2.161, unit: 'USD / weighted GPU-hour', change_24h_pct: 2.08, change_7d_pct: 5.1, data_mode: 'derived', confidence: 'Medium', status: 'Updated', source_count: 4, sparkline: spark(2.02, 30, 1) }),
        card({ symbol: 'H200/H100-PREMIUM', display_name: 'H200/H100 Premium', latest: 1.73, unit: 'x', change_24h_pct: -0.64, change_7d_pct: -1.18, data_mode: 'derived', confidence: 'Medium', status: 'Updated', source_count: 2, sparkline: spark(1.76, 30, -1) }),
      ],
    },
    {
      id: 'acu_dashboard',
      title: 'ACU Dashboard',
      subtitle: 'Self-built ACU indices measuring real-world model capability and efficiency',
      cards: [
        card({ symbol: 'ACU-CodeFix', display_name: 'ACU CodeFix', latest: 1246.8, unit: 'Index Points', change_24h_pct: 2.87, change_7d_pct: 5.42, data_mode: 'manual_public', confidence: 'Medium', status: 'Checked', source_count: 2, sparkline: spark(1120, 30, 1) }),
        card({ symbol: 'ACU-Coding/USD', display_name: 'ACU Coding per USD', latest: 3.162, unit: 'ACU / USD', change_24h_pct: 4.11, change_7d_pct: 8.3, data_mode: 'mixed', confidence: 'Medium', status: 'Updated', source_count: 3, sparkline: spark(2.84, 30, 1) }),
        card({ symbol: 'ACU-Reasoning', display_name: 'ACU Reasoning', latest: 1789.3, unit: 'Index Points', change_24h_pct: 3.42, change_7d_pct: 7.2, data_mode: 'manual_public', confidence: 'Medium', status: 'Checked', source_count: 3, sparkline: spark(1580, 30, 1) }),
        card({ symbol: 'ACU-CPI', display_name: 'ACU Capability Productivity Index', latest: 1137.6, official_value: 1137.6, nowcast_value: 1158.4, unit: 'Index Points', change_24h_pct: 1.95, change_7d_pct: 4.16, data_mode: 'official_plus_nowcast', confidence: 'Medium', status: 'Nowcast', source_count: 3, sparkline: spark(1038, 30, 1) }),
      ],
    },
  ],
  charts: {
    h100_spot_price: h100,
    gpu_basket_multi: h100.map((row, i) => ({
      date: row.date,
      H100: row.value,
      H200: h200[i].value,
      A100: a100[i].value,
      L40S: l40s[i].value,
      MI300X: mi300x[i].value,
    })),
    external_breakdown: [
      { name: 'H100 Spot', value: 38.7 },
      { name: 'H200 Spot', value: 28.6 },
      { name: 'A100 Spot', value: 14.2 },
      { name: 'L40S Spot', value: 9.8 },
      { name: 'MI300X Spot', value: 5.1 },
      { name: 'Other', value: 3.6 },
    ],
    acu_coding_trend: makeSeries(760, 31, 0.017, 0.055).map((d) => ({ ...d, value: Math.round(d.value * 1.38) })),
    acu_reasoning_trend: makeSeries(1080, 31, 0.014, 0.045).map((d) => ({ ...d, value: Math.round(d.value * 1.38) })),
    model_capability_breakdown: [
      { name: 'Coding', value: 40.7 },
      { name: 'Reasoning', value: 28.0 },
      { name: 'Tool Use', value: 13.6 },
      { name: 'Math', value: 9.4 },
      { name: 'Long Context', value: 6.0 },
      { name: 'Other', value: 2.3 },
    ],
  },
  top_models_by_acu: [
    { rank: 1, model: 'GPT-5 high', acu_score: 1942.6, change_24h_pct: 4.23, data_mode: 'manual_public', confidence: 'Medium' },
    { rank: 2, model: 'Claude Opus 4.5 high reasoning', acu_score: 1821.3, change_24h_pct: 3.11, data_mode: 'manual_public', confidence: 'Medium' },
    { rank: 3, model: 'Gemini 3 Flash high reasoning', acu_score: 1654.8, change_24h_pct: 2.74, data_mode: 'manual_public', confidence: 'Medium' },
    { rank: 4, model: 'Qwen3-Coder-Next', acu_score: 1512.9, change_24h_pct: 1.92, data_mode: 'manual_public', confidence: 'Medium' },
    { rank: 5, model: 'DeepSeek V3.2 Exp Reasoner', acu_score: 1387.4, change_24h_pct: 1.35, data_mode: 'manual_public', confidence: 'Medium' },
  ],
  disclaimer: 'This is a V1 demo. External data uses public reference sources. Some historical series are simulated for demo purposes. Not for settlement.',
};

const navItems = [
  { icon: Home, label: 'Overview' },
  { icon: BarChart3, label: 'Indices', active: true },
  { icon: Grid3X3, label: 'Sectors' },
  { icon: Terminal, label: 'API' },
  { icon: Layers, label: 'Methodology' },
  { icon: Zap, label: 'Nowcast' },
  { icon: Database, label: 'Sources' },
];

function formatNumber(value, options = {}) {
  const { decimals, prefix = '', suffix = '' } = options;
  if (value === null || value === undefined || Number.isNaN(Number(value))) return '—';
  const num = Number(value);
  const d = decimals ?? (Math.abs(num) >= 100 ? 1 : Math.abs(num) >= 10 ? 2 : 3);
  return `${prefix}${num.toLocaleString(undefined, { minimumFractionDigits: d, maximumFractionDigits: d })}${suffix}`;
}

function formatPct(value) {
  if (value === null || value === undefined || Number.isNaN(Number(value))) return '—';
  const num = Number(value);
  return `${num >= 0 ? '+' : ''}${num.toFixed(2)}%`;
}

function formatDateTime(value) {
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

function normalizeOverview(payload) {
  if (!payload || typeof payload !== 'object') return fallbackOverview;
  const next = { ...fallbackOverview, ...payload };
  const rawSections = Array.isArray(payload.sections) ? payload.sections : fallbackOverview.sections;
  next.sections = rawSections.map((section, sectionIndex) => ({
    ...fallbackOverview.sections[sectionIndex],
    ...section,
    cards: Array.isArray(section.cards) ? section.cards.map((c) => ({ ...c, sparkline: c.sparkline || [] })) : [],
  }));
  next.charts = { ...fallbackOverview.charts, ...(payload.charts || {}) };
  next.top_models_by_acu = payload.top_models_by_acu || payload.top_models || fallbackOverview.top_models_by_acu;
  next.disclaimer = payload.disclaimer || fallbackOverview.disclaimer;
  return next;
}

function Shell({ children }) {
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
            {navItems.map(({ icon: Icon, label, active }) => (
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

function Header({ overview, autoUpdate, setAutoUpdate, range, setRange, loading }) {
  return (
    <header className="mb-4 flex h-12 items-center justify-between border-b border-[#16304a]/80 pb-3">
      <div className="flex items-center gap-3">
        <h1 className="text-[22px] font-bold tracking-[-0.02em] text-[#e7f0ff]">{overview.dashboard_title}</h1>
        <span className="rounded-none border border-[#2f7cff]/40 bg-[#2f7cff]/10 px-2.5 py-1 text-xs font-semibold text-[#75b7ff]">
          {overview.version || 'V1 Demo'}
        </span>
        {overview.api_error ? (
          <span className="rounded-none border border-[#f0b83f]/30 bg-[#f0b83f]/10 px-2 py-1 text-[11px] text-[#f0b83f]" title={overview.api_error}>fallback data</span>
        ) : null}
      </div>
      <div className="flex items-center gap-4 text-xs text-[#7f8fa5]">
        <span>Last updated: <span className="text-[#e7f0ff]">{formatDateTime(overview.last_updated)}</span></span>
        <button type="button" onClick={() => setAutoUpdate((v) => !v)} className="flex items-center gap-2 rounded-none px-2 py-1 transition hover:text-white" title="Toggle auto-update">
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

function StatusBadge({ children, tone = 'blue' }) {
  const tones = {
    blue: 'border-[#2f7cff]/40 bg-[#2f7cff]/10 text-[#88c2ff]',
    green: 'border-[#29d17d]/30 bg-[#29d17d]/10 text-[#29d17d]',
    red: 'border-[#ff4d68]/30 bg-[#ff4d68]/10 text-[#ff4d68]',
    amber: 'border-[#f0b83f]/30 bg-[#f0b83f]/10 text-[#f0b83f]',
    gray: 'border-[#16304a] bg-white/[0.025] text-[#7f8fa5]',
  };
  return <span className={`rounded-none border px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide ${tones[tone] || tones.gray}`}>{children}</span>;
}

function MiniSparkline({ points = [], positive = true }) {
  if (!points.length) return null;
  const values = points.map((p) => Number(p.value || 0));
  const min = Math.min(...values);
  const max = Math.max(...values);
  const range = max - min || 1;
  const d = values.map((value, index) => {
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

function IndexCard({ card }) {
  const change = Number(card.change_24h_pct || 0);
  const positive = change >= 0;
  const isPremium = card.symbol.includes('PREMIUM') || card.unit === 'x';
  const tooltip = [
    `symbol: ${card.symbol}`,
    `status: ${card.status}`,
    `data_mode: ${card.data_mode}`,
    `confidence: ${card.confidence}`,
    `last_updated: ${card.last_updated || 'n/a'}`,
    `last_checked: ${card.last_checked || 'n/a'}`,
    `sources: ${card.source_count ?? 'n/a'}`,
    card.methodology ? `methodology: ${card.methodology}` : null,
  ].filter(Boolean).join('\n');

  return (
    <article title={tooltip} className="relative overflow-hidden rounded-none border border-[#16304a] bg-[#081426]/88 p-4 shadow-none transition hover:border-[#1d4165] hover:bg-[#0a1424]/95">
      <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(180deg,rgba(255,255,255,0.035),transparent_70%)]" />
      <div className="relative z-10 flex min-h-[128px] flex-col justify-between">
        <div className="flex items-start justify-between gap-3">
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-sm font-bold text-white">{card.symbol}</h3>
              <Info className="h-3.5 w-3.5 text-[#7f8fa5]" />
            </div>
            <div className="mt-1 max-w-52 truncate text-[11px] text-[#7f8fa5]">{card.display_name}</div>
          </div>
          <MiniSparkline points={card.sparkline} positive={positive} />
        </div>
        <div className="mt-2">
          <div className="flex items-baseline gap-2">
            <span className="text-[28px] font-bold leading-none tracking-[-0.03em] text-white">
              {isPremium ? formatNumber(card.latest, { suffix: 'x' }) : formatNumber(card.latest)}
            </span>
            {!isPremium && card.unit ? <span className="text-xs text-[#7f8fa5]">/ {card.unit.replace('USD / ', '')}</span> : null}
          </div>
          <div className="mt-3 flex items-center justify-between gap-2">
            <div className="flex items-center gap-2 text-xs text-[#7f8fa5]">
              <span>24h Change</span>
              <span className={`font-mono font-semibold ${positive ? 'text-[#29d17d]' : 'text-[#ff4d68]'}`}>{positive ? '↑' : '↓'} {formatPct(card.change_24h_pct)}</span>
            </div>
            <StatusBadge tone={card.status === 'Updated' || card.status === 'Live' ? 'green' : card.status === 'Nowcast' ? 'amber' : 'gray'}>{card.status}</StatusBadge>
          </div>
        </div>
        <div className="mt-3 grid grid-cols-4 gap-2 border-t border-[#16304a]/70 pt-3 text-[10px] text-[#7f8fa5]">
          <Meta label="Mode" value={card.data_mode} />
          <Meta label="Conf." value={card.confidence} />
          <Meta label="Updated" value={formatDateTime(card.last_updated).replace(',', '')} />
          <Meta label="Checked" value={formatDateTime(card.last_checked).replace(',', '')} />
        </div>
      </div>
    </article>
  );
}

function Meta({ label, value }) {
  return (
    <div className="min-w-0">
      <div className="uppercase tracking-wide">{label}</div>
      <div className="truncate font-mono text-[#b6c7dc]">{value || '—'}</div>
    </div>
  );
}

function Section({ section, children, action }) {
  return (
    <section className="mb-4 rounded-none border border-[#16304a] bg-black/15 p-4 shadow-none">
      <div className="mb-4 flex items-center justify-between gap-3">
        <div className="flex items-baseline gap-3">
          <h2 className="text-xl font-bold tracking-[-0.02em] text-[#bcd7ff]">{section.title}</h2>
          <p className="text-xs text-[#7f8fa5]">{section.subtitle}</p>
        </div>
        {action}
      </div>
      {children}
    </section>
  );
}

function Panel({ title, action, children, className = '' }) {
  return (
    <div className={`relative overflow-hidden rounded-none border border-[#16304a] bg-[#081426]/88 p-4 shadow-none ${className}`}>
      <div className="mb-3 flex items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <h3 className="text-sm font-bold text-white">{title}</h3>
          <Info className="h-3.5 w-3.5 text-[#7f8fa5]" />
        </div>
        {action}
      </div>
      {children}
    </div>
  );
}

function TerminalTooltip({ active, payload, label }) {
  if (!active || !payload?.length) return null;
  return (
    <div className="rounded-none border border-[#1d4165] bg-[#030918]/95 p-3 text-xs shadow-none">
      <div className="mb-1 font-mono text-[#b6c7dc]">{label}</div>
      {payload.map((item) => (
        <div key={item.dataKey || item.name} className="flex items-center justify-between gap-6">
          <span style={{ color: item.color }}>{item.name || item.dataKey}</span>
          <span className="font-mono text-white">{formatNumber(item.value, { decimals: 3 })}</span>
        </div>
      ))}
    </div>
  );
}

function RangeTabs() {
  return (
    <div className="flex gap-1 rounded-none border border-[#16304a] bg-black/20 p-1">
      {['7D', '30D', '90D'].map((item) => (
        <button key={item} type="button" className={`rounded-none px-2 py-1 text-xs font-semibold ${item === '30D' ? 'bg-[#2f7cff]/18 text-white ring-1 ring-[#2f7cff]/60' : 'text-[#7f8fa5] hover:text-white'}`}>{item}</button>
      ))}
    </div>
  );
}

function H100Trend({ data }) {
  return (
    <Panel title="H100 Spot Price" action={<RangeTabs />} className="min-h-[285px]">
      <ResponsiveContainer width="100%" height={220}>
        <AreaChart data={data} margin={{ top: 8, right: 8, bottom: 0, left: 0 }}>
          <defs>
            <linearGradient id="h100Area" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#2f7cff" stopOpacity={0.42} />
              <stop offset="95%" stopColor="#2f7cff" stopOpacity={0.02} />
            </linearGradient>
          </defs>
          <CartesianGrid stroke="#16304a" strokeOpacity={0.65} vertical={false} />
          <XAxis dataKey="date" stroke="#7f8fa5" fontSize={11} tickLine={false} axisLine={false} />
          <YAxis stroke="#7f8fa5" fontSize={11} tickLine={false} axisLine={false} tickFormatter={(v) => `$${Number(v).toFixed(2)}`} />
          <Tooltip content={<TerminalTooltip />} />
          <Area type="monotone" dataKey="value" name="H100 Spot USD/GPU-hr" stroke="#2f7cff" strokeWidth={2.2} fill="url(#h100Area)" dot={false} activeDot={{ r: 4 }} />
        </AreaChart>
      </ResponsiveContainer>
    </Panel>
  );
}

function GPUBasketTrend({ data }) {
  const keys = ['H100', 'H200', 'A100', 'L40S', 'MI300X'];
  return (
    <Panel title="GPU Basket" action={<RangeTabs />} className="min-h-[285px]">
      <ResponsiveContainer width="100%" height={220}>
        <LineChart data={data} margin={{ top: 8, right: 8, bottom: 0, left: 0 }}>
          <CartesianGrid stroke="#16304a" strokeOpacity={0.65} vertical={false} />
          <XAxis dataKey="date" stroke="#7f8fa5" fontSize={11} tickLine={false} axisLine={false} />
          <YAxis stroke="#7f8fa5" fontSize={11} tickLine={false} axisLine={false} tickFormatter={(v) => `$${Number(v).toFixed(2)}`} />
          <Tooltip content={<TerminalTooltip />} />
          {keys.map((key, index) => <Line key={key} type="monotone" dataKey={key} stroke={palette[index]} strokeWidth={2} dot={false} activeDot={{ r: 4 }} />)}
        </LineChart>
      </ResponsiveContainer>
      <div className="mt-1 flex justify-center gap-4 text-[11px] text-[#7f8fa5]">
        {keys.map((key, index) => <span key={key} className="flex items-center gap-1"><span className="h-2 w-2 rounded-none" style={{ background: palette[index] }} />{key}</span>)}
      </div>
    </Panel>
  );
}

function ACUTrend({ title, data, color = '#2f7cff' }) {
  return (
    <Panel title={title} action={<RangeTabs />} className="min-h-[285px]">
      <ResponsiveContainer width="100%" height={220}>
        <AreaChart data={data} margin={{ top: 8, right: 8, bottom: 0, left: 0 }}>
          <defs>
            <linearGradient id={`${title.replace(/\s/g, '')}Area`} x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor={color} stopOpacity={0.38} />
              <stop offset="95%" stopColor={color} stopOpacity={0.03} />
            </linearGradient>
          </defs>
          <CartesianGrid stroke="#16304a" strokeOpacity={0.65} vertical={false} />
          <XAxis dataKey="date" stroke="#7f8fa5" fontSize={11} tickLine={false} axisLine={false} />
          <YAxis stroke="#7f8fa5" fontSize={11} tickLine={false} axisLine={false} />
          <Tooltip content={<TerminalTooltip />} />
          <Area type="monotone" dataKey="value" name={title} stroke={color} strokeWidth={2.2} fill={`url(#${title.replace(/\s/g, '')}Area)`} dot={false} activeDot={{ r: 4 }} />
        </AreaChart>
      </ResponsiveContainer>
    </Panel>
  );
}

function DonutChartBlock({ title, data, centerTitle = 'Total Index\nComposition', className = '' }) {
  const total = data.reduce((sum, item) => sum + Number(item.value || 0), 0);
  return (
    <Panel title={title} className={`min-h-[285px] ${className}`}>
      <div className="grid h-56 grid-cols-[1fr_190px] items-center gap-3">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie data={data} dataKey="value" nameKey="name" innerRadius="54%" outerRadius="88%" paddingAngle={1.5} stroke="#07111f" strokeWidth={2}>
              {data.map((entry, index) => <Cell key={entry.name} fill={palette[index % palette.length]} />)}
            </Pie>
            <Tooltip content={<TerminalTooltip />} />
          </PieChart>
        </ResponsiveContainer>
        <div className="space-y-2 text-xs">
          <div className="mb-2 flex justify-between text-[#7f8fa5]"><span>Component</span><span>Share</span></div>
          {data.map((entry, index) => (
            <div key={entry.name} className="flex items-center justify-between gap-2">
              <div className="flex min-w-0 items-center gap-2"><span className="h-2.5 w-2.5 rounded-none" style={{ background: palette[index % palette.length] }} /><span className="truncate text-[#e7f0ff]">{entry.name}</span></div>
              <span className="font-mono text-[#e7f0ff]">{Number(entry.value || 0).toFixed(1)}%</span>
            </div>
          ))}
        </div>
      </div>
      <div className="pointer-events-none absolute left-[24%] top-[52%] hidden -translate-x-1/2 -translate-y-1/2 text-center text-[11px] text-[#7f8fa5] xl:block">
        {centerTitle.split('\n').map((line) => <div key={line}>{line}</div>)}
        <div className="mt-1 text-lg font-bold text-white">{total.toFixed(0)}%</div>
      </div>
    </Panel>
  );
}

function TopModelsTable({ models }) {
  return (
    <Panel title="Top Models by ACU" action={<button type="button" className="text-xs font-semibold text-[#2f7cff] hover:text-white">View full leaderboard</button>} className="min-h-[285px]">
      <div className="overflow-hidden rounded-none border border-[#16304a]/80">
        <table className="w-full text-left text-xs">
          <thead className="bg-black/25 text-[#7f8fa5]">
            <tr><th className="px-3 py-2 font-medium">Rank</th><th className="px-3 py-2 font-medium">Model</th><th className="px-3 py-2 text-right font-medium">ACU Score</th><th className="px-3 py-2 text-right font-medium">24h Change</th></tr>
          </thead>
          <tbody>
            {models.map((model, index) => {
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

function Dashboard() {
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
        if (!cancelled) setOverview(normalizeOverview(payload));
      } catch (error) {
        if (!cancelled) setOverview({ ...fallbackOverview, api_error: error.message });
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    load();
    if (!autoUpdate) return () => { cancelled = true; };
    const timer = window.setInterval(load, 60000);
    return () => { cancelled = true; window.clearInterval(timer); };
  }, [autoUpdate]);

  const external = overview.sections?.find((s) => s.id === 'external_compute') || overview.sections?.[0] || fallbackOverview.sections[0];
  const acu = overview.sections?.find((s) => s.id === 'acu_dashboard') || overview.sections?.[1] || fallbackOverview.sections[1];
  const charts = useMemo(() => ({ ...fallbackOverview.charts, ...(overview.charts || {}) }), [overview]);

  return (
    <Shell>
      <Header overview={overview} autoUpdate={autoUpdate} setAutoUpdate={setAutoUpdate} range={range} setRange={setRange} loading={loading} />

      <Section section={external} action={<button type="button" className="rounded-none border border-[#16304a] bg-[#081426] px-3 py-2 text-xs font-semibold text-[#2f7cff] hover:text-white">View all external sources</button>}>
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
          {(external.cards || []).map((item) => <IndexCard key={item.symbol} card={item} />)}
        </div>
        <div className="mt-4 grid grid-cols-1 gap-4 xl:grid-cols-[1fr_1fr_1.05fr]">
          <H100Trend data={charts.h100_spot_price || []} />
          <GPUBasketTrend data={charts.gpu_basket_multi || []} />
          <DonutChartBlock title="External Compute Breakdown" data={charts.external_breakdown || []} />
        </div>
      </Section>

      <Section section={acu} action={<button type="button" className="flex items-center gap-2 text-xs font-semibold text-[#2f7cff] hover:text-white"><ShieldCheck className="h-4 w-4" /> About ACU</button>}>
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
          {(acu.cards || []).map((item) => <IndexCard key={item.symbol} card={item} />)}
        </div>
        <div className="mt-4 grid grid-cols-1 gap-4 xl:grid-cols-4">
          <ACUTrend title="ACU Coding Trend" data={charts.acu_coding_trend || []} color="#2f7cff" />
          <ACUTrend title="ACU Reasoning Trend" data={charts.acu_reasoning_trend || []} color="#8a4cf6" />
          <DonutChartBlock title="Model Capability Breakdown" data={charts.model_capability_breakdown || []} centerTitle="Total ACU\nComposition" />
          <TopModelsTable models={overview.top_models_by_acu || []} />
        </div>
      </Section>

      <footer className="flex flex-wrap items-center justify-between gap-3 px-1 pb-2 text-xs text-[#7f8fa5]">
        <span>All prices in USD. GPU-hr = per GPU hour.</span>
        <span>{overview.disclaimer}</span>
        <span>© 2026 HyperCapacity. All rights reserved.</span>
      </footer>
    </Shell>
  );
}

export default Dashboard;
