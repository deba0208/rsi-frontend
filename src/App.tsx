import { useCallback, useEffect, useMemo, useState } from "react";
import {
  Activity,
  ArrowDown,
  ArrowDownUp,
  ArrowUp,
  BarChart3,
  Bookmark,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  Info,
  LayoutDashboard,
  Menu,
  RefreshCw,
  Search,
  SlidersHorizontal,
  Star,
  X,
} from "lucide-react";
import { demoData, statusFor, valueFor } from "./data";
import { fetchRsiData, readCachedData } from "./api";
import type { RsiResponse, RsiStatus, StockRsi, Timeframe } from "./types";

const timeframes: Timeframe[] = ["daily", "weekly", "monthly"];
const timeframeLabels: Record<Timeframe, string> = {
  daily: "Daily",
  weekly: "Weekly",
  monthly: "Monthly",
};
const statusOptions: Array<"All Status" | RsiStatus> = [
  "All Status",
  "Overbought",
  "Neutral",
  "Oversold",
];
const rsiRangeOptions = ["Any RSI", "Below 30", "30–50", "50–70", "Above 70"];

function formatUpdated(value: string) {
  const date = new Date(value);
  return Number.isNaN(date.getTime())
    ? "Update time unavailable"
    : date.toLocaleString("en-IN", {
        day: "numeric",
        month: "short",
        year: "numeric",
        hour: "numeric",
        minute: "2-digit",
      });
}
function StatusBadge({ value }: { value: number }) {
  const status = statusFor(value);
  return (
    <span className={`status-badge ${status.toLowerCase()}`}>{status}</span>
  );
}
function RsiBar({ value }: { value: number }) {
  const status = statusFor(value);
  return (
    <div className="rsi-bar-wrap">
      <div
        className={`rsi-bar ${status.toLowerCase()}`}
        style={{ width: `${Math.max(0, Math.min(value, 100))}%` }}
      />
    </div>
  );
}
function TrendChart({
  value,
  timeframe,
}: {
  value: number;
  timeframe: Timeframe;
}) {
  const points = useMemo(() => {
    const offsets = [
      0, 5, -2, 4, -5, 2, -1, 7, 1, 5, -4, 2, 8, -3, 4, 1, 6, -2, 3, -5, 5, 1,
      7, -1, 4, -3, 3, 6, -2, 2, 5, 0,
    ];
    return offsets.map((offset, i) => {
      const progress = i / (offsets.length - 1);
      const v = Math.max(
        5,
        Math.min(
          95,
          42 +
            (value - 42) * progress +
            offset *
              (timeframe === "daily"
                ? 1
                : timeframe === "weekly"
                  ? 0.75
                  : 0.55),
        ),
      );
      return { x: 8 + progress * 284, y: 166 - v * 1.48 };
    });
  }, [value, timeframe]);
  const path = points
    .map((p, i) => `${i === 0 ? "M" : "L"} ${p.x.toFixed(1)} ${p.y.toFixed(1)}`)
    .join(" ");
  const last = points[points.length - 1];
  return (
    <div className="chart-area">
      <div className="chart-y-labels">
        <span>100</span>
        <span>70</span>
        <span>50</span>
        <span>30</span>
        <span>0</span>
      </div>
      <svg
        viewBox="0 0 300 180"
        preserveAspectRatio="none"
        role="img"
        aria-label={`${timeframeLabels[timeframe]} RSI trend illustration`}
      >
        <rect x="0" y="0" width="300" height="44" fill="#fff1f2" />
        <rect x="0" y="133" width="300" height="47" fill="#ecfdf5" />
        {[0, 44, 88, 133, 180].map((y) => (
          <line
            key={y}
            x1="0"
            x2="300"
            y1={y}
            y2={y}
            stroke="#e5eaf1"
            strokeWidth="1"
          />
        ))}
        {[0, 75, 150, 225, 300].map((x) => (
          <line
            key={x}
            x1={x}
            x2={x}
            y1="0"
            y2="180"
            stroke="#edf0f5"
            strokeWidth="1"
          />
        ))}
        <path
          d={path}
          fill="none"
          stroke="#2563eb"
          strokeWidth="2.4"
          strokeLinejoin="round"
          strokeLinecap="round"
          vectorEffect="non-scaling-stroke"
        />
        <circle
          cx={last.x}
          cy={last.y}
          r="4.2"
          fill="#2563eb"
          stroke="#fff"
          strokeWidth="2"
          vectorEffect="non-scaling-stroke"
        />
        <rect
          x={Math.min(last.x - 22, 250)}
          y={Math.max(2, last.y - 27)}
          width="48"
          height="20"
          rx="5"
          fill="#2563eb"
        />
        <text
          x={Math.min(last.x + 2, 274)}
          y={Math.max(16, last.y - 13)}
          fill="white"
          textAnchor="middle"
          fontSize="11"
          fontWeight="600"
        >
          {value.toFixed(1)}
        </text>
      </svg>
      <div className="chart-x-labels">
        <span>Jul</span>
        <span>Aug</span>
        <span>Sep</span>
        <span>Oct</span>
      </div>
    </div>
  );
}
function SummaryCard({
  label,
  value,
  note,
  kind,
  icon: Icon,
}: {
  label: string;
  value: number;
  note: string;
  kind: string;
  icon: typeof Activity;
}) {
  return (
    <div className={`summary-card ${kind}`}>
      <div className="summary-icon">
        <Icon size={21} strokeWidth={2.2} />
      </div>
      <div className="summary-copy">
        <span>{label}</span>
        <strong>{value.toString().padStart(2, "0")}</strong>
        <small>{note}</small>
      </div>
    </div>
  );
}

export default function App() {
  const [data, setData] = useState<RsiResponse | null>(() => readCachedData());
  const [timeframe, setTimeframe] = useState<Timeframe>("daily");
  const [selectedSymbol, setSelectedSymbol] = useState("RELIANCE");
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("All Status");
  const [rangeFilter, setRangeFilter] = useState("Any RSI");
  const [sortAsc, setSortAsc] = useState(false);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [activeNav, setActiveNav] = useState("Dashboard");
  const [watchlist, setWatchlist] = useState<string[]>([]);
  const [mobileMenu, setMobileMenu] = useState(false);
  const pageSize = 10;

  const refresh = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const next = await fetchRsiData();
      console.log(next);

      setData(next);
      if (!next.stocks.some((s) => s.symbol === selectedSymbol))
        setSelectedSymbol(next.stocks[0]?.symbol ?? "");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Unable to load RSI data");
    } finally {
      setLoading(false);
    }
  }, [selectedSymbol]);

  useEffect(() => {
    void refresh();
  }, []); // Fetch on every app load; cache is only for display/timeframe switching.

  const stocks =
    data?.stocks ?? (import.meta.env.VITE_API_URL ? [] : demoData.stocks);
  const selected = stocks.find((s) => s.symbol === selectedSymbol) ?? stocks[0];
  const currentValue = (stock: StockRsi) => valueFor(stock, timeframe);

  const counts = useMemo(
    () =>
      stocks.reduce(
        (acc, stock) => {
          const status = statusFor(currentValue(stock));
          acc[status] += 1;
          return acc;
        },
        { Overbought: 0, Neutral: 0, Oversold: 0 },
      ),
    [stocks, timeframe],
  );

  const filtered = useMemo(() => {
    let result = stocks.filter((stock) => {
      const q = search.trim().toLowerCase();
      const matchesSearch =
        !q ||
        stock.symbol.toLowerCase().includes(q) ||
        stock.companyName.toLowerCase().includes(q);
      const value = currentValue(stock);
      const matchesStatus =
        statusFilter === "All Status" || statusFor(value) === statusFilter;
      const matchesRange =
        rangeFilter === "Any RSI" ||
        (rangeFilter === "Below 30" && value < 30) ||
        (rangeFilter === "30–50" && value >= 30 && value < 50) ||
        (rangeFilter === "50–70" && value >= 50 && value <= 70) ||
        (rangeFilter === "Above 70" && value > 70);
      const matchesWatchlist =
        activeNav !== "Watchlist" || watchlist.includes(stock.symbol);
      return matchesSearch && matchesStatus && matchesRange && matchesWatchlist;
    });
    result = [...result].sort((a, b) =>
      sortAsc
        ? currentValue(a) - currentValue(b)
        : currentValue(b) - currentValue(a),
    );
    return result;
  }, [
    stocks,
    timeframe,
    search,
    statusFilter,
    rangeFilter,
    activeNav,
    watchlist,
    sortAsc,
  ]);
  const pages = Math.max(1, Math.ceil(filtered.length / pageSize));
  const visible = filtered.slice((page - 1) * pageSize, page * pageSize);

  useEffect(() => {
    setPage(1);
  }, [search, statusFilter, rangeFilter, timeframe, activeNav]);
  const toggleWatch = (symbol: string) =>
    setWatchlist((prev) =>
      prev.includes(symbol)
        ? prev.filter((s) => s !== symbol)
        : [...prev, symbol],
    );

  const navItems = [
    { label: "Dashboard", icon: LayoutDashboard },
    { label: "Watchlist", icon: Bookmark },
    { label: "About", icon: Info },
  ];

  return (
    <div className="app-shell">
      <aside className={`sidebar ${mobileMenu ? "sidebar-open" : ""}`}>
        <div className="brand">
          <div className="brand-mark">
            <BarChart3 size={22} fill="currentColor" />
          </div>
          <div>
            <strong>StockPulse</strong>
            <span>NSE RSI ANALYTICS</span>
          </div>
          <button
            className="mobile-close icon-button"
            aria-label="Close menu"
            onClick={() => setMobileMenu(false)}
          >
            <X size={19} />
          </button>
        </div>
        <nav className="side-nav">
          {navItems.map(({ label, icon: Icon }) => (
            <button
              key={label}
              className={`nav-item ${activeNav === label ? "active" : ""}`}
              onClick={() => {
                setActiveNav(label);
                setMobileMenu(false);
              }}
            >
              <Icon size={19} />
              <span>{label}</span>
            </button>
          ))}
        </nav>
        <div className="sidebar-status">
          <span className={`online-dot ${error ? "warning" : ""}`} />
          <div>
            <span>
              {error
                ? "Using saved data"
                : loading
                  ? "Updating data"
                  : "Data loaded"}
            </span>
            <small>
              {data ? formatUpdated(data.calculatedAt) : "Waiting for data"}
            </small>
            <small>After market close</small>
          </div>
        </div>
      </aside>
      {mobileMenu && (
        <button
          className="mobile-scrim"
          aria-label="Close navigation"
          onClick={() => setMobileMenu(false)}
        />
      )}
      <main className="main-area">
        <header className="topbar">
          <button
            className="mobile-menu icon-button"
            aria-label="Open menu"
            onClick={() => setMobileMenu(true)}
          >
            <Menu size={22} />
          </button>
          <div className="page-heading">
            <h1>
              {activeNav === "Watchlist"
                ? "Your Watchlist"
                : activeNav === "About"
                  ? "About StockPulse"
                  : "NSE RSI Dashboard"}
            </h1>
            <p>
              {activeNav === "About"
                ? "Relative Strength Index analytics for NSE stocks."
                : "Relative Strength Index for NSE stocks. Updated after market close."}
            </p>
          </div>
          <div className="topbar-actions">
            <div className="updated-block">
              <span>Last updated</span>
              <strong>
                {data ? formatUpdated(data.calculatedAt) : "Waiting for data"}
              </strong>
            </div>
            <button
              className="refresh-button"
              onClick={() => void refresh()}
              disabled={loading}
            >
              <RefreshCw size={17} className={loading ? "spin" : ""} />
              <span>{loading ? "Refreshing" : "Refresh"}</span>
            </button>
          </div>
        </header>

        {activeNav === "About" ? (
          <section className="about-panel panel">
            <div className="about-icon">
              <Activity size={28} />
            </div>
            <h2>Market strength, at a glance.</h2>
            <p>
              StockPulse presents Relative Strength Index (RSI) values for NSE
              stocks across daily, weekly and monthly timeframes. RSI is a
              momentum indicator, commonly interpreted with 30 and 70 as
              reference thresholds.
            </p>
            <p>
              Values are supplied by the connected backend and reflect its
              latest completed calculation. RSI is an analytical indicator and
              should not be used as a standalone investment decision.
            </p>
          </section>
        ) : (
          <>
            <section className="summary-grid">
              <SummaryCard
                label="Total Stocks"
                value={stocks.length}
                note="NSE stocks tracked"
                kind="total"
                icon={BarChart3}
              />
              <SummaryCard
                label="Oversold"
                value={counts.Oversold}
                note="RSI below 30"
                kind="oversold"
                icon={ArrowDown}
              />
              <SummaryCard
                label="Neutral"
                value={counts.Neutral}
                note="RSI 30 – 70"
                kind="neutral"
                icon={ArrowDownUp}
              />
              <SummaryCard
                label="Overbought"
                value={counts.Overbought}
                note="RSI above 70"
                kind="overbought"
                icon={ArrowUp}
              />
            </section>

            {error && (
              <div className="error-banner">
                <Info size={16} />
                <span>
                  {error}.{" "}
                  {data
                    ? "Showing previously loaded data."
                    : "Check your API URL and backend availability."}
                </span>
              </div>
            )}

            <div className="content-grid">
              <section className="table-panel panel">
                <div className="table-toolbar">
                  <div
                    className="timeframe-tabs"
                    role="tablist"
                    aria-label="RSI timeframe"
                  >
                    {timeframes.map((t) => (
                      <button
                        role="tab"
                        aria-selected={timeframe === t}
                        key={t}
                        className={timeframe === t ? "selected" : ""}
                        onClick={() => setTimeframe(t)}
                      >
                        {timeframeLabels[t]}
                      </button>
                    ))}
                  </div>
                  <label className="search-box">
                    <Search size={17} />
                    <input
                      value={search}
                      onChange={(e) => setSearch(e.target.value)}
                      placeholder="Search by symbol or company name..."
                      aria-label="Search stocks"
                    />
                    {search && (
                      <button
                        aria-label="Clear search"
                        onClick={() => setSearch("")}
                      >
                        <X size={15} />
                      </button>
                    )}
                  </label>
                </div>
                <div className="filter-toolbar">
                  <label className="select-wrap">
                    <SlidersHorizontal size={14} />
                    <select
                      value={statusFilter}
                      onChange={(e) => setStatusFilter(e.target.value)}
                      aria-label="Filter by status"
                    >
                      {statusOptions.map((s) => (
                        <option key={s}>{s}</option>
                      ))}
                    </select>
                    <ChevronDown size={15} />
                  </label>
                  <label className="select-wrap">
                    <select
                      value={rangeFilter}
                      onChange={(e) => setRangeFilter(e.target.value)}
                      aria-label="Filter by RSI range"
                    >
                      {rsiRangeOptions.map((s) => (
                        <option key={s}>{s}</option>
                      ))}
                    </select>
                    <ChevronDown size={15} />
                  </label>
                  <div className="sort-control">
                    <span>Sort by</span>
                    <button onClick={() => setSortAsc((v) => !v)}>
                      {sortAsc ? "RSI (Low to High)" : "RSI (High to Low)"}
                      <ArrowDownUp size={14} />
                    </button>
                  </div>
                </div>
                <div className="table-scroll">
                  <table className="stock-table">
                    <thead>
                      <tr>
                        <th className="rank-col">#</th>
                        <th>Symbol</th>
                        <th className="company-col">Company Name</th>
                        <th>
                          <button
                            className="th-sort"
                            onClick={() => setSortAsc((v) => !v)}
                          >
                            RSI <ArrowDownUp size={13} />
                          </button>
                        </th>
                        <th>Status</th>
                        <th className="bar-col">RSI Bar</th>
                        <th aria-label="Details" />
                      </tr>
                    </thead>
                    <tbody>
                      {visible.map((stock, i) => {
                        const value = currentValue(stock);
                        return (
                          <tr
                            key={stock.symbol}
                            className={
                              selected?.symbol === stock.symbol
                                ? "row-selected"
                                : ""
                            }
                            onClick={() => setSelectedSymbol(stock.symbol)}
                            tabIndex={0}
                            onKeyDown={(e) => {
                              if (e.key === "Enter")
                                setSelectedSymbol(stock.symbol);
                            }}
                          >
                            <td className="rank-col">
                              {(page - 1) * pageSize + i + 1}
                            </td>
                            <td>
                              <span className="symbol-cell">
                                {stock.symbol}
                              </span>
                            </td>
                            <td className="company-col company-cell">
                              {stock.companyName}
                            </td>
                            <td className="rsi-number">{value.toFixed(1)}</td>
                            <td>
                              <StatusBadge value={value} />
                            </td>
                            <td className="bar-col">
                              <div className="bar-cell">
                                <RsiBar value={value} />
                                <span>{value.toFixed(1)}</span>
                              </div>
                            </td>
                            <td>
                              <button
                                className="row-open"
                                aria-label={`View ${stock.symbol} details`}
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setSelectedSymbol(stock.symbol);
                                }}
                              >
                                <ChevronRight size={17} />
                              </button>
                            </td>
                          </tr>
                        );
                      })}
                      {visible.length === 0 && (
                        <tr>
                          <td colSpan={7} className="empty-state">
                            No stocks match your filters.
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
                <div className="table-footer">
                  <span>
                    Showing {filtered.length ? (page - 1) * pageSize + 1 : 0} to{" "}
                    {Math.min(page * pageSize, filtered.length)} of{" "}
                    {filtered.length} stocks
                  </span>
                  <div className="pagination">
                    <button
                      aria-label="Previous page"
                      disabled={page === 1}
                      onClick={() => setPage((p) => p - 1)}
                    >
                      <ChevronLeft size={16} />
                    </button>
                    {Array.from({ length: pages }, (_, i) => i + 1)
                      .slice(
                        Math.max(0, Math.min(page - 3, pages - 5)),
                        Math.max(5, Math.min(page + 2, pages)),
                      )
                      .map((n) => (
                        <button
                          key={n}
                          className={page === n ? "current" : ""}
                          onClick={() => setPage(n)}
                        >
                          {n}
                        </button>
                      ))}
                    <button
                      aria-label="Next page"
                      disabled={page === pages}
                      onClick={() => setPage((p) => p + 1)}
                    >
                      <ChevronRight size={16} />
                    </button>
                  </div>
                </div>
              </section>

              <aside className="detail-panel panel">
                {selected ? (
                  <>
                    <div className="detail-heading">
                      <div className="company-avatar">
                        {selected.symbol.slice(0, 1)}
                      </div>
                      <div className="detail-company">
                        <h2>{selected.symbol}</h2>
                        <p>{selected.companyName}</p>
                      </div>
                      <button
                        className={`icon-button favorite ${watchlist.includes(selected.symbol) ? "favorited" : ""}`}
                        aria-label="Toggle watchlist"
                        onClick={() => toggleWatch(selected.symbol)}
                      >
                        <Star
                          size={19}
                          fill={
                            watchlist.includes(selected.symbol)
                              ? "currentColor"
                              : "none"
                          }
                        />
                      </button>
                    </div>
                    <div className="detail-score">
                      <strong>{currentValue(selected).toFixed(1)}</strong>
                      <StatusBadge value={currentValue(selected)} />
                    </div>
                    <div className="timeframe-metrics">
                      {timeframes.map((t) => (
                        <button
                          key={t}
                          className={`metric-tile ${timeframe === t ? "metric-active" : ""}`}
                          onClick={() => setTimeframe(t)}
                        >
                          <span>{timeframeLabels[t]} RSI</span>
                          <strong>{valueFor(selected, t).toFixed(1)}</strong>
                        </button>
                      ))}
                    </div>
                    <div className="chart-heading">
                      <h3>RSI Trend ({timeframeLabels[timeframe]})</h3>
                      <span className="chart-period">Illustrative trend</span>
                    </div>
                    <TrendChart
                      value={currentValue(selected)}
                      timeframe={timeframe}
                    />
                    <div className="detail-facts">
                      <div>
                        <span>Symbol</span>
                        <strong>{selected.symbol}</strong>
                      </div>
                      <div>
                        <span>Company</span>
                        <strong>{selected.companyName}</strong>
                      </div>
                      <div>
                        <span>Daily RSI</span>
                        <strong>{selected.dailyRsi.toFixed(1)}</strong>
                      </div>
                      <div>
                        <span>Weekly RSI</span>
                        <strong>{selected.weeklyRsi.toFixed(1)}</strong>
                      </div>
                      <div>
                        <span>Monthly RSI</span>
                        <strong>{selected.monthlyRsi.toFixed(1)}</strong>
                      </div>
                      <div>
                        <span>Status ({timeframeLabels[timeframe]})</span>
                        <StatusBadge value={currentValue(selected)} />
                      </div>
                      <div>
                        <span>Last updated</span>
                        <strong>
                          {data ? formatUpdated(data.calculatedAt) : "—"}
                        </strong>
                      </div>
                    </div>
                    <p className="detail-note">
                      <Info size={13} /> RSI is a momentum indicator, not a
                      standalone buy or sell signal.
                    </p>
                  </>
                ) : (
                  <div className="empty-detail">
                    Select a stock to view details.
                  </div>
                )}
              </aside>
            </div>
          </>
        )}
        <footer className="app-footer">
          <span>StockPulse · NSE RSI Analytics</span>
          <span>RSI values are informational and not investment advice.</span>
        </footer>
      </main>
    </div>
  );
}
