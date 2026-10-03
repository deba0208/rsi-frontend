import { demoData } from "./data";
import type { RsiResponse } from "./types";

const API_URL = import.meta.env.VITE_API_URL?.replace(/\/$/, "");
const ENDPOINT = import.meta.env.VITE_RSI_ENDPOINT || "/metrics/top50";
const STORAGE_KEY = "stockpulse:rsi:v1";

export function readCachedData(): RsiResponse | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;

    const parsed: unknown = JSON.parse(raw);

    if (
      typeof parsed === "object" &&
      parsed !== null &&
      "stocks" in parsed &&
      Array.isArray(parsed.stocks) &&
      "calculatedAt" in parsed &&
      typeof parsed.calculatedAt === "string"
    ) {
      return parsed as RsiResponse;
    }
  } catch {
    localStorage.removeItem(STORAGE_KEY);
  }

  return null;
}

export async function fetchRsiData(signal?: AbortSignal): Promise<RsiResponse> {
  console.log("API URL:", API_URL);
  console.log("Vite env:", import.meta.env);

  if (!API_URL) {
    console.warn("API URL not configured. Using demo data.");
    return {
      ...demoData,
      calculatedAt: new Date().toISOString(),
    };
  }

  const url = `${API_URL}${ENDPOINT}`;

  const response = await fetch(url, {
    method: "GET",
    headers: {
      Accept: "application/json",
    },
    signal,
  });

  if (!response.ok) {
    throw new Error(`RSI API request failed (${response.status})`);
  }

  // Parse the response body only once
  const payload: unknown = await response.json();

  console.log("API response:", payload);

  if (!Array.isArray(payload)) {
    throw new Error("Unexpected API response. Expected an array of stocks.");
  }

  const result: RsiResponse = {
    stocks: payload,
    calculatedAt: new Date().toISOString(),
  };

  localStorage.setItem(STORAGE_KEY, JSON.stringify(result));

  return result;
}
