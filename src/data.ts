import type { RsiResponse, StockRsi, Timeframe } from "./types";

const seed: Array<[string, string, number, number, number]> = [
  ["RELIANCE", "Reliance Industries Ltd.", 72.4, 58.2, 62.1],
  ["ADANIENT", "Adani Enterprises Ltd.", 71.8, 61.4, 57.8],
  ["ICICIBANK", "ICICI Bank Ltd.", 68.6, 64.1, 59.2],
  ["HDFCBANK", "HDFC Bank Ltd.", 64.3, 57.2, 60.4],
  ["TCS", "Tata Consultancy Services Ltd.", 58.1, 55.7, 53.9],
  ["INFY", "Infosys Ltd.", 42.7, 49.3, 54.8],
  ["SBIN", "State Bank of India", 37.2, 46.1, 51.7],
  ["HINDUNILVR", "Hindustan Unilever Ltd.", 29.4, 38.7, 48.2],
  ["ITC", "ITC Ltd.", 26.8, 43.2, 50.1],
  ["LT", "Larsen & Toubro Ltd.", 24.5, 35.4, 47.3],
  ["BHARTIARTL", "Bharti Airtel Ltd.", 66.2, 60.8, 64.1],
  ["AXISBANK", "Axis Bank Ltd.", 53.8, 56.2, 58.1],
  ["KOTAKBANK", "Kotak Mahindra Bank Ltd.", 48.6, 52.7, 55.2],
  ["MARUTI", "Maruti Suzuki India Ltd.", 61.7, 63.2, 59.8],
  ["SUNPHARMA", "Sun Pharmaceutical Industries Ltd.", 74.1, 68.4, 64.5],
  ["TATAMOTORS", "Tata Motors Ltd.", 32.6, 41.8, 49.6],
  ["WIPRO", "Wipro Ltd.", 28.1, 36.4, 44.7],
  ["BAJFINANCE", "Bajaj Finance Ltd.", 57.9, 62.5, 67.1],
  ["ONGC", "Oil and Natural Gas Corporation Ltd.", 45.3, 48.8, 52.3],
  ["NTPC", "NTPC Ltd.", 69.2, 65.1, 61.4],
];
const extras = ["POWERGRID","TATASTEEL","JSWSTEEL","TECHM","HCLTECH","ULTRACEMCO","TITAN","ASIANPAINT","NESTLEIND","M&M","BAJAJFINSV","COALINDIA","GRASIM","DRREDDY","CIPLA","EICHERMOT","HEROMOTOCO","INDUSINDBK","DIVISLAB","APOLLOHOSP","BRITANNIA","BPCL","IOC","SHRIRAMFIN","TRENT","BEL","HAL","PIDILITIND","SBILIFE","HDFCLIFE"];
const companies = ["Power Grid Corporation of India Ltd.","Tata Steel Ltd.","JSW Steel Ltd.","Tech Mahindra Ltd.","HCL Technologies Ltd.","UltraTech Cement Ltd.","Titan Company Ltd.","Asian Paints Ltd.","Nestlé India Ltd.","Mahindra & Mahindra Ltd.","Bajaj Finserv Ltd.","Coal India Ltd.","Grasim Industries Ltd.","Dr. Reddy's Laboratories Ltd.","Cipla Ltd.","Eicher Motors Ltd.","Hero MotoCorp Ltd.","IndusInd Bank Ltd.","Divi's Laboratories Ltd.","Apollo Hospitals Enterprise Ltd.","Britannia Industries Ltd.","Bharat Petroleum Corporation Ltd.","Indian Oil Corporation Ltd.","Shriram Finance Ltd.","Trent Ltd.","Bharat Electronics Ltd.","Hindustan Aeronautics Ltd.","Pidilite Industries Ltd.","SBI Life Insurance Company Ltd.","HDFC Life Insurance Company Ltd."];
const stocks: StockRsi[] = [
  ...seed.map(([symbol, companyName, dailyRsi, weeklyRsi, monthlyRsi]) => ({ symbol, companyName, dailyRsi, weeklyRsi, monthlyRsi })),
  ...extras.map((symbol, i) => ({
    symbol, companyName: companies[i],
    dailyRsi: Number((25 + ((i * 17 + 19) % 53) + (i % 3) * 0.3).toFixed(1)),
    weeklyRsi: Number((32 + ((i * 13 + 11) % 43) + (i % 4) * 0.2).toFixed(1)),
    monthlyRsi: Number((38 + ((i * 11 + 7) % 36) + (i % 5) * 0.2).toFixed(1)),
  })),
];

export const demoData: RsiResponse = {
  calculatedAt: new Date().toISOString(),
  stocks,
};

export function valueFor(stock: StockRsi, timeframe: Timeframe): number {
  return stock[`${timeframe}Rsi`];
}

export function statusFor(value: number): "Overbought" | "Neutral" | "Oversold" {
  if (value > 70) return "Overbought";
  if (value < 30) return "Oversold";
  return "Neutral";
}
