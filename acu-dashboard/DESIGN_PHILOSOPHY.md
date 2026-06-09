# HyperCapacity Dashboard - Design Philosophy

## Design Approach: **Dark Terminal / Institutional Finance**

This dashboard adopts a **professional, dark-themed institutional finance terminal** aesthetic. The design prioritizes clarity, data hierarchy, and precision over decorative elements.

### Core Principles

1. **Deep Dark Foundation**: Pure black (#020713) and deep navy backgrounds create a sophisticated, focused environment that reduces eye strain and emphasizes data.

2. **Precision Typography**: Clean, monospaced elements for numerical data; structured sans-serif for labels and headings to ensure readability in a data-dense interface.

3. **Subtle Depth**: Minimal use of borders (thin, semi-transparent), soft shadows, and layered backgrounds create visual hierarchy without clutter.

4. **Semantic Color Coding**: Green for positive changes, red for negative changes. Blue for primary actions and highlights. Amber for warnings or secondary information.

### Color Palette

- **Background**: `#020713` (primary), `#030918` (gradient), `#01040b` (deep)
- **Text**: `#e7f0ff` (primary), `#7f8fa5` (secondary), `#bcd7ff` (accent)
- **Borders**: `#16304a` (base), `#12304c` (subtle)
- **Accent Blue**: `#2f7cff` (primary), `#3d8cff` (hover)
- **Status Green**: `#29d17d` (positive)
- **Status Red**: `#ff4d68` (negative)
- **Amber**: `#f0b83f` (warning)

### Layout Paradigm

- **Fixed Left Sidebar**: Icon-based navigation (72px width) for quick access to major sections
- **Main Content Area**: Responsive grid layout with sections for External Compute and ACU Dashboard
- **Cards**: Thin-bordered, semi-transparent backgrounds with subtle glow on hover
- **Charts**: Integrated within section grids, responsive to viewport changes

### Signature Elements

1. **Hexagon Icon Badge**: Branding element in the top-left of the sidebar
2. **Status Indicators**: Color-coded badges for data status (Checked, Updated, Nowcast)
3. **Sparkline Charts**: Micro-trend visualizations within each index card
4. **Grid Background**: Subtle 32px grid overlay for technical aesthetic

### Interaction Philosophy

- **Minimal Motion**: Transitions under 200ms for UI state changes
- **Hover Effects**: Subtle background shifts and border highlights
- **Tooltips**: On-hover metadata display (data_mode, confidence, last_updated, etc.)
- **Auto-Update Toggle**: Real-time refresh capability with visual feedback

### Animation Guidelines

- **Button Press**: `scale(0.97)` on active with ~160ms ease-out
- **Hover States**: Border color shift and background opacity change (~120ms)
- **Refresh Spinner**: Animated when auto-update is active
- **No Page Transitions**: Keep routing instant for data dashboard context

### Typography System

- **Display**: Bold, 22px for main title
- **Section Headers**: 16px, semi-bold for section titles
- **Card Labels**: 12px, uppercase for metadata
- **Data Values**: Monospaced for numerical precision
- **Body Text**: 14px for descriptions and tooltips

### Data Visualization

- **Line Charts**: Smooth curves with gradient fills, multiple series support
- **Donut Charts**: Centered percentage display with legend
- **Tables**: Minimal borders, alternating row hover effects
- **Sparklines**: Embedded trend indicators within cards

## Visual References

- **Nexum Backend**: https://nexum-backend-fnlz.onrender.com (overall aesthetic)
- **Nexumtrd Trading System**: https://nexumtrd-3ph6iftp.manus.space (dark interface quality)
- **Target Style**: Professional, institutional-grade data terminal (not generic SaaS)

## Implementation Notes

- All colors use hex notation for consistency
- Borders use 1px width with opacity for subtlety
- Shadows are minimal and directional
- Grid background is overlay-based, not tiled
- No rounded corners on major elements (square/sharp aesthetic)
