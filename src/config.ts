import { Wallet } from "ethers";

export type CopyStrategy = "PERCENT_USD" | "PERCENT_SHARES" | "FIXED_USD" | "FIXED_SHARES";
export type CopySide = "BUY" | "SELL" | "BOTH";
export type RelayerTxTypeOption = "SAFE" | "PROXY";

export interface ApiCreds {
  key: string;
  secret: string;
  passphrase: string;
}

export interface BuilderCreds {
  key: string;
  secret: string;
  passphrase: string;
}

export interface Config {
  clobHost: string;
  dataApiHost: string;
  chainId: number;
  privateKey: string;
  signatureType: number;
  funderAddress?: string;
  profileAddress: string;
  apiCreds?: ApiCreds;
  copyTraders: string[];
  traderAllocations: Record<string, number>;
  copyStrategy: CopyStrategy;
  copyRatio: number;
  fixedUsd: number;
  fixedShares: number;
  minTradeUsd: number;
  maxTradeUsd: number;
  maxDailyVolumeUsd: number;
  maxPositionSizeUsd: number;
  copySide: CopySide;
  pollIntervalMs: number;
  tradeLookbackSec: number;
  stateFile: string;
  dryRun: boolean;
  debug: boolean;
  autoRedeem: boolean;
  redeemPollIntervalMs: number;
  relayerUrl: string;
  relayerTxType: RelayerTxTypeOption;
  builderCreds?: BuilderCreds;
  builderSigningUrl?: string;
  builderSigningToken?: string;
  rpcUrl?: string;
  maxSeenTradesAgeSec: number;
}

const getEnv = (name: string): string | undefined => {
  const val = process.env[name];
  return val === undefined || val === "" ? undefined : val;
};

const requireEnv = (name: string): string => {
  const val = getEnv(name);
  if (!val) throw new Error(`Missing required env var: ${name}`);
  return val;
};

const parseNumber = (name: string, fallback?: number): number => {
  const raw = getEnv(name);
  if (raw === undefined) {
    if (fallback !== undefined) return fallback;
    throw new Error(`Missing required numeric env var: ${name}`);
  }
  const num = Number(raw);
  if (!Number.isFinite(num)) throw new Error(`Invalid number for ${name}: ${raw}`);
  return num;
};

const parseBoolean = (name: string, fallback = false): boolean => {
  const raw = getEnv(name);
  if (raw === undefined) return fallback;
  return ["1", "true", "yes", "on"].includes(raw.toLowerCase());
};

const parseList = (name: string, fallback: string[] = []): string[] => {
  const raw = getEnv(name);
  if (!raw) return fallback;
  return raw
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);
};

const normalizeStrategy = (raw?: string): CopyStrategy => {
  if (!raw) return "PERCENT_USD";
  const val = raw.toUpperCase();
  if (["PERCENT", "PERCENT_USD", "PCT_USD", "PROPORTIONAL"].includes(val)) return "PERCENT_USD";
  if (["PERCENT_SHARES", "PCT_SHARES"].includes(val)) return "PERCENT_SHARES";
  if (["FIXED", "BRUT", "FIXED_USD", "FLAT_USD"].includes(val)) return "FIXED_USD";
  if (["FIXED_SHARES", "FLAT_SHARES"].includes(val)) return "FIXED_SHARES";
  throw new Error(`Unsupported COPY_STRATEGY: ${raw}`);
};

const normalizeSide = (raw?: string): CopySide => {
  if (!raw) return "BOTH";
  const val = raw.toUpperCase();
  if (val === "BUY" || val === "SELL") return val;
  if (val === "BOTH" || val === "ALL") return "BOTH";
  throw new Error(`Unsupported COPY_SIDE: ${raw}`);
};

const normalizeTxType = (raw?: string): RelayerTxTypeOption => {
  if (!raw) return "PROXY";
  const val = raw.toUpperCase();
  if (val === "SAFE" || val === "PROXY") return val;
  throw new Error(`Unsupported RELAYER_TX_TYPE: ${raw}`);
};

const parseTraderAllocations = (raw?: string): Record<string, number> => {
  if (!raw) return {};
  const out: Record<string, number> = {};
  for (const entry of raw.split(",")) {
    const [address, ratioRaw] = entry.split("=").map((part) => part.trim());
    if (!address || !ratioRaw) continue;
    const ratio = Number(ratioRaw);
    if (!Number.isFinite(ratio)) continue;
    out[address.toLowerCase()] = ratio;
  }
  return out;
};

export const loadConfig = (): Config => {
  const clobHost = getEnv("CLOB_HOST") ?? "https://clob.polymarket.com";
  const dataApiHost = getEnv("DATA_API_HOST") ?? "https://data-api.polymarket.com";
  const chainId = parseNumber("CHAIN_ID", 137);

  const privateKey = requireEnv("PRIVATE_KEY");
  const signatureType = parseNumber("SIGNATURE_TYPE", 1);
  const profileRaw = getEnv("PROFILE_ADDRESS");
  const funderRaw = getEnv("FUNDER_ADDRESS");
  const derivedAddress = new Wallet(privateKey).address.toLowerCase();
  const profileAddress = (profileRaw ?? funderRaw ?? derivedAddress)?.toLowerCase();
  const funderAddress = (funderRaw ?? profileRaw)?.toLowerCase();

  if ((signatureType === 1 || signatureType === 2) && !funderAddress) {
    throw new Error("FUNDER_ADDRESS or PROFILE_ADDRESS is required for SIGNATURE_TYPE 1 or 2");
  }

  const apiKey = getEnv("CLOB_API_KEY");
  const apiSecret = getEnv("CLOB_API_SECRET");
  const apiPassphrase = getEnv("CLOB_API_PASSPHRASE");
  const apiCreds = apiKey && apiSecret && apiPassphrase
    ? { key: apiKey, secret: apiSecret, passphrase: apiPassphrase }
    : undefined;

  const copyTraders = parseList("COPY_TRADERS").map((a) => a.toLowerCase());
  if (copyTraders.length === 0) throw new Error("COPY_TRADERS is required (comma-separated list)");

  const traderAllocations = parseTraderAllocations(getEnv("TRADER_ALLOCATIONS"));

  const copyStrategy = normalizeStrategy(getEnv("COPY_STRATEGY"));
  const copyRatio = parseNumber("COPY_RATIO", 1);
  const fixedUsd = parseNumber("FIXED_TRADE_USD", 10);
  const fixedShares = parseNumber("FIXED_TRADE_SHARES", 1);

  const minTradeUsd = parseNumber("MIN_TRADE_USD", 1);
  const maxTradeUsd = parseNumber("MAX_TRADE_USD", 1000);
  const maxDailyVolumeUsd = parseNumber("MAX_DAILY_VOLUME_USD");
  const maxPositionSizeUsd = parseNumber("MAX_POSITION_SIZE_USD");

  const copySide = normalizeSide(getEnv("COPY_SIDE"));
  const pollIntervalMs = parseNumber("POLL_INTERVAL_MS", 5000);
  const tradeLookbackSec = parseNumber("TRADE_LOOKBACK_SEC", 300);
  const stateFile = getEnv("STATE_FILE") ?? "./data/state.json";
  const dryRun = parseBoolean("DRY_RUN", false);
  const debug = parseBoolean("DEBUG", false);

  const autoRedeem = parseBoolean("AUTO_REDEEM", true);
  const redeemPollIntervalMs = parseNumber("REDEEM_POLL_INTERVAL_MS", 60000);
  const relayerUrl = getEnv("RELAYER_URL") ?? "https://relayer-v2.polymarket.com";
  const relayerTxType = normalizeTxType(getEnv("RELAYER_TX_TYPE"));

  const builderKey = getEnv("BUILDER_API_KEY");
  const builderSecret = getEnv("BUILDER_API_SECRET");
  const builderPassphrase = getEnv("BUILDER_API_PASSPHRASE");
  const builderCreds = builderKey && builderSecret && builderPassphrase
    ? { key: builderKey, secret: builderSecret, passphrase: builderPassphrase }
    : undefined;

  const builderSigningUrl = getEnv("BUILDER_SIGNING_URL");
  const builderSigningToken = getEnv("BUILDER_SIGNING_TOKEN");
  const rpcUrl = getEnv("RPC_URL");

  if (!profileAddress) {
    throw new Error("PROFILE_ADDRESS or FUNDER_ADDRESS is required to query your positions.");
  }

  if (autoRedeem) {
    if (!rpcUrl) throw new Error("RPC_URL is required when AUTO_REDEEM=true");
    const hasLocalCreds = !!builderCreds;
    const hasRemoteCreds = !!builderSigningUrl && !!builderSigningToken;
    if (!hasLocalCreds && !hasRemoteCreds) {
      throw new Error("Builder credentials are required when AUTO_REDEEM=true. Provide BUILDER_API_* or BUILDER_SIGNING_*.");
    }
  }

  const maxSeenTradesAgeSec = parseNumber("MAX_SEEN_TRADES_AGE_SEC", 60 * 60 * 24 * 7);

  return {
    clobHost,
    dataApiHost,
    chainId,
    privateKey,
    signatureType,
    funderAddress: funderAddress?.toLowerCase(),
    profileAddress,
    apiCreds,
    copyTraders,
    traderAllocations,
    copyStrategy,
    copyRatio,
    fixedUsd,
    fixedShares,
    minTradeUsd,
    maxTradeUsd,
    maxDailyVolumeUsd,
    maxPositionSizeUsd,
    copySide,
    pollIntervalMs,
    tradeLookbackSec,
    stateFile,
    dryRun,
    debug,
    autoRedeem,
    redeemPollIntervalMs,
    relayerUrl,
    relayerTxType,
    builderCreds,
    builderSigningUrl,
    builderSigningToken,
    rpcUrl,
    maxSeenTradesAgeSec,
  };
};
