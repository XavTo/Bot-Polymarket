import { BuilderConfig, BuilderApiKeyCreds } from "@polymarket/builder-signing-sdk";
import { RelayClient, RelayerTxType, Transaction } from "@polymarket/builder-relayer-client";
import { createWalletClient, encodeFunctionData, prepareEncodeFunctionData, http, zeroHash, Hex } from "viem";
import { privateKeyToAccount } from "viem/accounts";
import { polygon } from "viem/chains";
import { Logger } from "./logger.js";
import { Position } from "./types.js";
import { toBaseUnits } from "./utils.js";

const CTF_ADDRESS = "0x4d97dcd97ec945f40cf65f87097ace5ea0476045";
const USDC_ADDRESS = "0x2791Bca1f2de4661ED88A30C99A7a9449Aa84174";
const NEG_RISK_ADAPTER = "0xd91E80cF2E7be2e162c6513ceD06f1dD0dA35296";

const ctfRedeemAbi = [
  {
    constant: false,
    inputs: [
      { name: "collateralToken", type: "address" },
      { name: "parentCollectionId", type: "bytes32" },
      { name: "conditionId", type: "bytes32" },
      { name: "indexSets", type: "uint256[]" },
    ],
    name: "redeemPositions",
    outputs: [],
    payable: false,
    stateMutability: "nonpayable",
    type: "function",
  },
] as const;

const nrAdapterRedeemAbi = [
  {
    inputs: [
      { internalType: "bytes32", name: "_conditionId", type: "bytes32" },
      { internalType: "uint256[]", name: "_amounts", type: "uint256[]" },
    ],
    name: "redeemPositions",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
] as const;

const ctfRedeemFn = prepareEncodeFunctionData({
  abi: ctfRedeemAbi,
  functionName: "redeemPositions",
});

const nrRedeemFn = prepareEncodeFunctionData({
  abi: nrAdapterRedeemAbi,
  functionName: "redeemPositions",
});

export interface RedeemConfig {
  relayerUrl: string;
  chainId: number;
  privateKey: string;
  rpcUrl: string;
  txType: "SAFE" | "PROXY";
  builderCreds?: BuilderApiKeyCreds;
  builderSigningUrl?: string;
  builderSigningToken?: string;
}

export class RedeemService {
  private client: RelayClient;
  private logger: Logger;

  private constructor(client: RelayClient, logger: Logger) {
    this.client = client;
    this.logger = logger;
  }

  static init(config: RedeemConfig, logger: Logger): RedeemService {
    if (config.chainId !== 137) {
      throw new Error(`Unsupported chainId for redeem: ${config.chainId}`);
    }
  const account = privateKeyToAccount(config.privateKey as Hex);
    const wallet = createWalletClient({
      account,
      chain: polygon,
      transport: http(config.rpcUrl),
    });

    let builderConfig: BuilderConfig | undefined;
    if (config.builderCreds) {
      builderConfig = new BuilderConfig({ localBuilderCreds: config.builderCreds });
    } else if (config.builderSigningUrl && config.builderSigningToken) {
      builderConfig = new BuilderConfig({
        remoteBuilderConfig: {
          url: config.builderSigningUrl,
          token: config.builderSigningToken,
        },
      });
    }

    const txType = config.txType === "SAFE" ? RelayerTxType.SAFE : RelayerTxType.PROXY;
    const client = new RelayClient(config.relayerUrl, config.chainId, wallet, builderConfig, txType);
    return new RedeemService(client, logger);
  }

  private async execute(tx: Transaction, description: string): Promise<string | null> {
    try {
      const response = await this.client.execute([tx], description);
      const result = await response.wait();
      if (!result?.transactionHash) return null;
      return result.transactionHash;
    } catch (err) {
      this.logger.warn("Redeem transaction failed", { error: (err as Error).message });
      return null;
    }
  }

  private createCtfRedeem(conditionId: string): Transaction {
    const calldata = encodeFunctionData({
      ...ctfRedeemFn,
      args: [USDC_ADDRESS as Hex, zeroHash, conditionId as Hex, [1n, 2n]],
    });
    return { to: CTF_ADDRESS, data: calldata, value: "0" };
  }

  private createNegRiskRedeem(conditionId: string, amounts: bigint[]): Transaction {
    const calldata = encodeFunctionData({
      ...nrRedeemFn,
      args: [conditionId as Hex, amounts],
    });
    return { to: NEG_RISK_ADAPTER, data: calldata, value: "0" };
  }

  async redeemPositions(positions: Position[]): Promise<string[]> {
    const byCondition: Record<string, Position[]> = {};
    for (const pos of positions) {
      if (!pos.redeemable) continue;
      if (!byCondition[pos.conditionId]) byCondition[pos.conditionId] = [];
      byCondition[pos.conditionId].push(pos);
    }

    const txHashes: string[] = [];
    for (const [conditionId, group] of Object.entries(byCondition)) {
      const isNegRisk = group.some((p) => p.negativeRisk);
      const tx = isNegRisk
        ? this.createNegRiskRedeem(conditionId, this.buildNegRiskAmounts(group))
        : this.createCtfRedeem(conditionId);

      const txHash = await this.execute(tx, "redeem positions");
      if (txHash) {
        txHashes.push(txHash);
        this.logger.info("Redeem executed", { conditionId, txHash });
      }
    }
    return txHashes;
  }

  private buildNegRiskAmounts(group: Position[]): bigint[] {
    const amounts: bigint[] = [0n, 0n];
    for (const pos of group) {
      const idx = pos.outcomeIndex === 0 ? 0 : 1;
      amounts[idx] = amounts[idx] + toBaseUnits(pos.size, 6);
    }
    return amounts;
  }
}
