export const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

export const nowSec = () => Math.floor(Date.now() / 1000);

export const toBaseUnits = (amount: number, decimals = 6): bigint => {
  if (!Number.isFinite(amount)) return 0n;
  const factor = 10 ** decimals;
  return BigInt(Math.max(0, Math.round(amount * factor)));
};

export const fromBaseUnits = (amount: bigint, decimals = 6): number => {
  const factor = 10 ** decimals;
  return Number(amount) / factor;
};

export const formatUsd = (amount: number) => amount.toFixed(2);

export const isPositive = (n: number) => Number.isFinite(n) && n > 0;
