# Polymarket Copy-Trading Bot (TypeScript)

Minimal bot that mirrors trades from one or more Polymarket traders, with spend limits and automatic cashout after resolution.

## Install

```bash
npm install
cp .env.example .env
```

## Run

```bash
npm run build
npm run start
```

## Simple config (the essentials)

In `.env`:

- `PRIVATE_KEY`: private key for the wallet linked to your Polymarket account (needed to sign orders).
- `PROFILE_ADDRESS`: the Polymarket address visible in your account (proxy/profile wallet).
- `COPY_TRADERS`: comma‑separated list of trader addresses to copy.
- `MAX_DAILY_VOLUME_USD`: daily USD cap for **buys**.
- `MAX_POSITION_SIZE_USD`: per‑position USD cap for **buys**.

### Copy strategy (easy)
- `COPY_STRATEGY`: `PERCENT_USD` (default), `PERCENT_SHARES`, `FIXED_USD`, `FIXED_SHARES`
- `COPY_RATIO`: ratio for percent strategies (e.g. `0.25` = 25%)
- `FIXED_TRADE_USD`: fixed amount if `FIXED_USD`
- `MIN_TRADE_USD`, `MAX_TRADE_USD`
- `COPY_SIDE`: `BUY`, `SELL`, `BOTH`

### Auto cashout (optional)
To auto‑redeem when a market is resolved:
- `AUTO_REDEEM=true`
- `RPC_URL`: Polygon RPC URL
- **Local builder creds**: `BUILDER_API_KEY`, `BUILDER_API_SECRET`, `BUILDER_API_PASSPHRASE`
  - **or** remote signer: `BUILDER_SIGNING_URL`, `BUILDER_SIGNING_TOKEN`

#### How to get Builder API keys
1. Open `polymarket.com/settings?tab=builder`.
2. Create a Builder Profile if needed, then click “+ Create New”.
3. You’ll get `apiKey`, `secret`, and `passphrase` (keep them private).

## Advanced variables (explained, not required in `.env`)

These all have defaults in code. Only set them if you want overrides:

- `CLOB_HOST` (default: `https://clob.polymarket.com`): CLOB endpoint.
- `DATA_API_HOST` (default: `https://data-api.polymarket.com`): Data API endpoint.
- `CHAIN_ID` (default: `137`): Polygon chain id.
- `POLL_INTERVAL_MS` (default: `5000`): trade polling frequency.
- `TRADE_LOOKBACK_SEC` (default: `300`): startup catch‑up window.
- `STATE_FILE` (default: `./data/state.json`): local persistence file.
- `MAX_SEEN_TRADES_AGE_SEC` (default: `604800`): retention for seen trades.
- `CLOB_API_KEY`, `CLOB_API_SECRET`, `CLOB_API_PASSPHRASE`: use if you want to avoid auto‑derivation at startup.
- `RELAYER_URL` (default: `https://relayer-v2.polymarket.com`): redeem relayer endpoint.
- `RELAYER_TX_TYPE` (default: `PROXY`): relayer transaction type.
- `SIGNATURE_TYPE` (default: `0`): wallet signature type.
- `FUNDER_ADDRESS`: profile/funder address if needed (otherwise `PROFILE_ADDRESS`).

## Polymarket address (clear)

Use the **Polymarket address visible in your account** (proxy/profile wallet):
- Put it in `PROFILE_ADDRESS`.
- You **do not** need to put your EOA address in `.env`.
- You still need the `PRIVATE_KEY` of the wallet linked to your Polymarket account to sign orders.

## Minimal example

```bash
PRIVATE_KEY=0x...
PROFILE_ADDRESS=0x...   # Polymarket-visible address
COPY_TRADERS=0x123...,0x456...
MAX_DAILY_VOLUME_USD=200
MAX_POSITION_SIZE_USD=500
COPY_STRATEGY=PERCENT_USD
COPY_RATIO=0.25
```
