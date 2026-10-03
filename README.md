# StockPulse — React + TypeScript + Vite

Responsive NSE RSI dashboard frontend with daily, weekly and monthly timeframe switching, search, filters, sorting, pagination, stock details, watchlist, and RSI visualization.

## Run locally

```bash
npm install
cp .env.example .env
npm run dev
```

Open the local URL printed by Vite. If `VITE_API_URL` is empty, the app uses bundled illustrative demo data so the UI can be explored without a backend.

## Connect the Go backend

Set `.env`:

```env
VITE_API_URL=http://localhost:8080
VITE_RSI_ENDPOINT=/metrics/top50
```

Expected response contract:

```json
{
  "calculatedAt": "2026-10-03T16:15:00+05:30",
  "stocks": [
    {
      "symbol": "RELIANCE",
      "companyName": "Reliance Industries Ltd.",
      "dailyRsi": 65.4,
      "weeklyRsi": 58.2,
      "monthlyRsi": 62.1
    }
  ]
}
```

The frontend fetches this endpoint when the app loads and when the user clicks Refresh. Successful API data is saved to `localStorage`; timeframe changes are client-side and do not trigger a request. If an API request fails and prior data exists in localStorage, that cached response remains visible. Update `src/api.ts` if your actual Go API response shape differs.

If frontend and backend use different origins, configure CORS on the Go server to allow the Vite development origin (typically `http://localhost:5173`) and your production frontend origin.

## Build

```bash
npm run build
npm run preview
```

## Notes

- Demo stock values are illustrative, not live market data.
- The trend line in the detail panel is an illustrative visualization based on the selected RSI, not historical RSI observations. Connect a historical series endpoint if you want a true historical RSI chart.
- RSI labels use common thresholds: below 30 oversold, above 70 overbought, otherwise neutral. This is informational, not investment advice.
