export type TradeSide = "BUY" | "SELL";

export interface ActivityTrade {
  proxyWallet: string;
  timestamp: number;
  conditionId: string;
  type: "TRADE";
  size: number;
  usdcSize: number;
  transactionHash: string;
  price: number;
  asset: string; // tokenId
  side: TradeSide;
  outcomeIndex: number;
  outcome?: string;
  title?: string;
  slug?: string;
  eventSlug?: string;
}

export interface Position {
  conditionId: string;
  asset: string; // tokenId
  outcomeIndex: number;
  size: number;
  avgPrice?: number;
  curPrice?: number;
  redeemable?: boolean;
  negativeRisk?: boolean;
  outcome?: string;
}
