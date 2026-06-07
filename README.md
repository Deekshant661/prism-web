# prism-web

> React dashboard for [Prism](https://github.com/your-username/prism-backend) — a personal mutual fund analytics platform for Indian markets.

---

## Overview

Prism's web frontend is a data-dense analytics dashboard for researching and comparing Indian mutual funds. It connects to the Prism backend API to display real NAV history, composite rankings, portfolio holdings, sector allocations, and SIP projections across 53+ funds.

Built to feel like a research terminal rather than a marketing page — minimal chrome, maximum data.

---

## Tech Stack

| Layer | Technology |
|---|---|
| Framework | React 18 + TypeScript |
| Build Tool | Vite |
| Styling | TailwindCSS |
| Charts | Recharts |
| Data Fetching | TanStack Query (React Query v5) |
| HTTP | Axios |
| Routing | React Router DOM v6 |
| Notifications | react-hot-toast |
| File Upload | react-dropzone |

---

## Features

- **Rankings table** — funds ranked by composite score within category; sortable by 1Y return, 3Y CAGR, 5Y CAGR, or score; column visibility toggle; smart filters for expense ratio, AUM, drawdown, volatility
- **Fund detail page** — full research screen with NAV area chart (1M/6M/1Y/3Y/5Y/Max), performance metrics, score breakdown, rolling returns chart, top holdings table, sector pie chart, and embedded SIP calculator
- **Plan/option switcher** — switch between Direct/Regular and Growth/IDCW variants on the fund detail page; NAV chart updates to reflect the selected scheme
- **Fund comparison** — compare up to 4 funds side by side with metrics table (best value highlighted), overlaid normalised NAV chart, and holdings overlap analysis
- **SIP calculator** — monthly SIP projection with invested vs corpus area chart; compare outcomes across multiple funds
- **Global search** — instant client-side fund search from the navbar; keyboard navigable
- **Watchlist** — bookmark funds, persisted in localStorage
- **Data management page** — match scheme codes, trigger NAV imports, monitor per-fund data completeness and ranking eligibility

---

## Screenshots

> Dashboard, rankings, and fund detail screenshots here

---

## Pages

| Route | Page |
|---|---|
| `/` | Dashboard — category cards with fund counts and avg scores |
| `/rankings` | Full ranked fund table with filters and sorting |
| `/rankings/:category` | Category-specific rankings |
| `/fund/:id` | Fund detail — charts, metrics, holdings, calculator |
| `/compare` | Side-by-side fund comparison |
| `/calculator` | Standalone SIP calculator |
| `/watchlist` | Saved funds |
| `/upload` | Factsheet PDF and NAV CSV upload |
| `/data-management` | Admin — scheme matching, NAV import, status |

---

## Project Structure

```
src/
├── api/                 # Axios API functions — one file per resource
│   ├── client.ts        # Axios instance, base URL, error interceptor
│   ├── funds.ts
│   ├── rankings.ts
│   ├── nav.ts
│   ├── factsheets.ts
│   └── calculations.ts
│
├── hooks/               # TanStack Query hooks — data fetching + caching
│   ├── useRankings.ts
│   ├── useFund.ts
│   ├── useFundNav.ts
│   └── useCompare.ts
│
├── pages/               # One component per route
│   ├── Dashboard.tsx
│   ├── RankingsPage.tsx
│   ├── FundDetailPage.tsx
│   ├── ComparePage.tsx
│   ├── CalculatorPage.tsx
│   ├── WatchlistPage.tsx
│   ├── UploadPage.tsx
│   └── DataManagementPage.tsx
│
├── components/
│   ├── layout/          # Navbar, PageWrapper
│   ├── ui/              # Badge, StatCard, ReturnCell, Spinner, EmptyState, ErrorState
│   ├── charts/          # NavLineChart, SectorPieChart, ReturnBarChart, CompareLineChart
│   ├── tables/          # RankingsTable, HoldingsTable
│   └── upload/          # FileDropzone, UploadProgress
│
├── types/               # TypeScript interfaces for all API data
│   ├── fund.ts
│   ├── ranking.ts
│   ├── nav.ts
│   └── api.ts
│
└── utils/
    └── format.ts        # All number, currency, and date formatters
```

---

## Getting Started

### Prerequisites

- Node.js 18+
- [prism-backend](https://github.com/your-username/prism-backend) running on port 8000

### Setup

```bash
# Clone the repo
git clone https://github.com/your-username/prism-web
cd prism-web

# Install dependencies
npm install

# Configure environment
cp .env.example .env
# VITE_API_BASE_URL=http://localhost:8000

# Start development server
npm run dev
```

Open [http://localhost:5173](http://localhost:5173)

### Build

```bash
npm run build
npm run preview
```

---

## Environment Variables

```bash
VITE_API_BASE_URL=http://localhost:8000
```

---

## Design Decisions

**TanStack Query over raw useState** — all server state lives in the query cache. Components only handle UI state. The fund list is fetched once on app load and reused for search, comparison selectors, and watchlist — no redundant API calls.

**Recharts over D3** — Recharts is React-native and composable. For the chart types needed (line, area, bar, pie), it removes significant complexity without sacrificing flexibility.

**No component library** — TailwindCSS utility classes only. Consistent design token usage (gray neutrals, indigo accent, green/red for returns) without the overhead of a third-party component system.

**Category-relative scoring** — the composite score ranks funds within their category, not across all funds. A mid-cap fund's score is not comparable to a large-cap fund's score by design. The UI makes this clear with category badges and per-category rank columns.

---

## Related Repositories

- [prism-backend](https://github.com/your-username/prism-backend) — FastAPI backend and data engine
- [prism-app](https://github.com/your-username/prism-app) — Flutter mobile app