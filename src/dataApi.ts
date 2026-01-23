import { Logger } from "./logger.js";
import { ActivityTrade, Position } from "./types.js";

export class DataApiClient {
  private host: string;
  private logger: Logger;

  constructor(host: string, logger: Logger) {
    this.host = host.replace(/\/$/, "");
    this.logger = logger;
  }

  private async fetchJson<T>(url: string): Promise<T> {
    const resp = await fetch(url, {
      headers: {
        "User-Agent": "copytrader-bot",
        Accept: "application/json",
      },
    });
    if (!resp.ok) {
      const text = await resp.text();
      throw new Error(`Data API error ${resp.status}: ${text}`);
    }
    return (await resp.json()) as T;
  }

  async getTrades(user: string, start?: number, end?: number, limit = 100): Promise<ActivityTrade[]> {
    const params = new URLSearchParams();
    params.set("user", user);
    params.set("type", "TRADE");
    params.set("limit", String(limit));
    params.set("sortDirection", "ASC");
    if (start) params.set("start", String(start));
    if (end) params.set("end", String(end));
    const url = `${this.host}/activity?${params}`;
    const data = await this.fetchJson<ActivityTrade[]>(url);
    return data;
  }

  async getPositions(user: string, redeemable?: boolean, limit = 200): Promise<Position[]> {
    const params = new URLSearchParams();
    params.set("user", user);
    params.set("limit", String(limit));
    if (redeemable !== undefined) params.set("redeemable", redeemable ? "true" : "false");
    const url = `${this.host}/positions?${params}`;
    try {
      return await this.fetchJson<Position[]>(url);
    } catch (err) {
      this.logger.warn("Failed to fetch positions", { error: (err as Error).message });
      return [];
    }
  }
}
