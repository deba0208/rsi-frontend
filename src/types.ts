export type Timeframe = "daily" | "weekly" | "monthly";
export type RsiStatus = "Overbought" | "Neutral" | "Oversold";

export interface StockRsi {
  symbol: string;
  companyName: string;
  dailyRsi: number;
  weeklyRsi: number;
  monthlyRsi: number;
}

export interface RsiResponse {
  calculatedAt: string;
  stocks: StockRsi[];
}
