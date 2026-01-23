# Deploy and Host Polymarket Bot V2 on Railway

Polymarket Bot V2 is a lightweight, TypeScript copy‑trading bot that mirrors trades from selected Polymarket traders while enforcing spend limits and optional auto‑cashout (redeem) after resolution. It runs continuously, polls Polymarket activity, and executes trades with clear risk controls and a minimal configuration surface.

## About Hosting Polymarket Bot V2

Hosting Polymarket Bot V2 on Railway means running a long‑lived Node.js process with a small local state file. You’ll configure environment variables for the wallet, traders to copy, and risk limits. If you enable auto‑redeem, you’ll also provide a Polygon RPC URL and Polymarket Builder credentials. Railway handles deployment, restarts, and logs, while you attach a volume to persist state across restarts. Once deployed, the bot keeps polling and mirroring trades automatically.

## Common Use Cases

- Copy‑trade a single high‑signal Polymarket trader with hard spend limits
- Mirror multiple traders at a fixed percentage to diversify exposure
- Run an always‑on bot that auto‑redeems resolved markets

## Dependencies for Polymarket Bot V2 Hosting

- Node.js 18+ (recommended 22)
- A Polymarket account (Magic email login supported)

### Deployment Dependencies

- Polymarket Builder Profile (for auto‑redeem) — `https://polymarket.com/settings?tab=builder`
- Magic private key export — `https://reveal.magic.link/polymarket`

### Implementation Details <OPTIONAL>

Environment variables example (copy/paste and edit):

```bash
PRIVATE_KEY="0x..." # Magic EOA private key used to sign orders
PROFILE_ADDRESS="0x..." # Polymarket profile/proxy address (visible in your account)
COPY_TRADERS="0xabc...,0xdef..." # comma-separated trader addresses to copy
MAX_DAILY_VOLUME_USD="10" # daily USD cap for buys
MAX_POSITION_SIZE_USD="20" # per-position USD cap for buys
SIGNATURE_TYPE="1" # 1=Polymarket proxy (Magic), 0=EOA, 2=Gnosis Safe
COPY_STRATEGY="PERCENT_USD" # PERCENT_USD | PERCENT_SHARES | FIXED_USD | FIXED_SHARES
COPY_RATIO="0.1" # percent multiplier (0.1 = 10%)
FIXED_TRADE_USD="10" # fixed USD per trade when COPY_STRATEGY=FIXED_USD
MIN_TRADE_USD="1" # minimum USD per trade
MAX_TRADE_USD="10" # maximum USD per trade
COPY_SIDE="BOTH" # BUY | SELL | BOTH
AUTO_REDEEM="true" # auto cashout when a market resolves
RPC_URL="https://xxx" # Polygon RPC endpoint
RELAYER_URL="https://relayer-v2.polymarket.com" # Polymarket relayer endpoint
RELAYER_TX_TYPE="PROXY" # PROXY (default) or SAFE
BUILDER_API_KEY="..." # Builder API key from polymarket.com/settings?tab=builder
BUILDER_API_SECRET="..." # Builder API secret
BUILDER_API_PASSPHRASE="..." # Builder API passphrase
DRY_RUN="true" # simulate orders without sending them
DEBUG="true" # verbose logs
RAILPACK_NODE_VERSION="22" # force Node 22 on Railway
```

## How to Get the Required Environment Variables

### Wallet & Signature

- **PRIVATE_KEY** (Magic login):
  - Go to `https://reveal.magic.link/polymarket` and export your Magic private key.
  - This is the EOA used to sign orders.

- **PROFILE_ADDRESS**:
  - This is the address you see in your Polymarket account (proxy/profile wallet).
  - Example: `https://polymarket.com/@0x...`

- **SIGNATURE_TYPE**:
  - `1` for Magic/Polymarket proxy (recommended default).
  - `0` for a standard EOA wallet.
  - `2` for a Gnosis Safe.

### Copy Trading

- **COPY_TRADERS**: paste the trader wallet addresses you want to follow.
- **COPY_STRATEGY** and **COPY_RATIO**:
  - To copy 10% of a trader’s USD size: `COPY_STRATEGY=PERCENT_USD`, `COPY_RATIO=0.1`.
- **MAX_DAILY_VOLUME_USD** / **MAX_POSITION_SIZE_USD**: hard caps for safety.

### Auto‑Redeem (Cashout)

Auto‑redeem requires Builder credentials and a Polygon RPC URL:

- **RPC_URL**: use a Polygon RPC provider (Alchemy, Infura, etc.).
- **BUILDER_API_KEY / SECRET / PASSPHRASE**:
  - Go to `https://polymarket.com/settings?tab=builder`.
  - Create a Builder Profile, then “+ Create New”.

## Railway Setup Steps

1. **Deploy the repo** to Railway.
2. **Set environment variables** (see above).
3. **Attach a Volume** and mount it at `/data`.
4. Set `STATE_FILE=/data/state.json` (optional but recommended for persistence).
5. Set `RAILPACK_NODE_VERSION=22` to force Node 22.
6. Start the service (Railway will run `npm run build` and `npm run start`).

## Why Deploy Polymarket Bot V2 on Railway?

Railway is a singular platform to deploy your infrastructure stack. Railway will host your infrastructure so you don't have to deal with configuration, while allowing you to vertically and horizontally scale it.

By deploying Polymarket Bot V2 on Railway, you are one step closer to supporting a complete full-stack application with minimal burden. Host your servers, databases, AI agents, and more on Railway.
