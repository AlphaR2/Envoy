import { useState, useEffect, useCallback } from 'react';
import { Connection, PublicKey } from '@solana/web3.js';
import { getAssociatedTokenAddress } from '@solana/spl-token';
import { useAppSelector } from '../store/store';

const RPC_URL = process.env.EXPO_PUBLIC_SOLANA_RPC_URL ?? 'https://api.devnet.solana.com';
const USDC_MINT = process.env.EXPO_PUBLIC_USDC_MINT ?? '4zMMC9srt5Ri5X14GAgXhaHii3GnPAEERYPJgZJDncDU';

export async function fetchUsdcBalance(pubkey: string): Promise<number> {
  const connection = new Connection(RPC_URL, 'confirmed');
  const owner = new PublicKey(pubkey);
  const mint = new PublicKey(USDC_MINT);
  const ata = await getAssociatedTokenAddress(mint, owner);
  const balance = await connection.getTokenAccountBalance(ata);
  return balance.value.uiAmount ?? 0;
}

/**
 * Hook — fetches USDC balance for the authenticated wallet.
 * Returns { balance, isLoading, refresh }.
 */
export function useUsdcBalance() {
  const pubkey = useAppSelector((s) => s.auth.pubkey);
  const [balance, setBalance] = useState<number | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const refresh = useCallback(async () => {
    if (!pubkey) return;
    setIsLoading(true);
    try {
      const result = await fetchUsdcBalance(pubkey);
      setBalance(result);
    } catch {
      setBalance(0);
    } finally {
      setIsLoading(false);
    }
  }, [pubkey]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  return { balance, isLoading, refresh };
}
