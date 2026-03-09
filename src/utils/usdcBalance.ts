import { Connection, PublicKey } from '@solana/web3.js';

const RPC_URL = process.env.EXPO_PUBLIC_SOLANA_RPC_URL ?? 'https://api.devnet.solana.com';

// Devnet USDC: 4zMMC9srt5Ri5X14GAgXhaHii3GnPAEERYPJgZJDncDU
// Mainnet USDC: EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v
const USDC_MINT =
  process.env.EXPO_PUBLIC_USDC_MINT ?? '4zMMC9srt5Ri5X14GAgXhaHii3GnPAEERYPJgZJDncDU';

/**
 * Returns the USDC balance (in human-readable units, e.g. 12.50) for the
 * given wallet address. Returns 0 if the account has no USDC token account.
 */
export async function fetchUsdcBalance(pubkey: string): Promise<number> {
  try {
    const connection = new Connection(RPC_URL, 'confirmed');
    const owner = new PublicKey(pubkey);
    const mint = new PublicKey(USDC_MINT);
  

    const { value: accounts } = await connection.getParsedTokenAccountsByOwner(owner, { mint });



    if (accounts.length === 0) return 0;

    const uiAmount = accounts[0].account.data.parsed.info.tokenAmount.uiAmount as number | null;
    return uiAmount ?? 0;
  } catch {
    return 0;
  }
}
