import { useState, useEffect, useCallback } from 'react'
import { Connection, PublicKey } from '@solana/web3.js'
import { useAppSelector } from '../store/store'

/**
 * Solana constants
 */
const RPC_URL = process.env.EXPO_PUBLIC_SOLANA_RPC_URL ?? 'https://api.devnet.solana.com'

const USDC_MINT = process.env.EXPO_PUBLIC_USDC_MINT ?? '4zMMC9srt5Ri5X14GAgXhaHii3GnPAEERYPJgZJDncDU'

const TOKEN_PROGRAM_ID = new PublicKey('TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA')

const ASSOCIATED_TOKEN_PROGRAM_ID = new PublicKey('ATokenGPvbdGVxr1b2hvZbsiqW5xWH25efTNsLJA8knL')

/**
 * Shared connection instance
 */
const connection = new Connection(RPC_URL, 'confirmed')

/**
 * Derive the associated token account for a wallet + mint
 */
function getAssociatedTokenAddress(wallet: PublicKey, mint: PublicKey): PublicKey {
  const [address] = PublicKey.findProgramAddressSync(
    [wallet.toBuffer(), TOKEN_PROGRAM_ID.toBuffer(), mint.toBuffer()],
    ASSOCIATED_TOKEN_PROGRAM_ID,
  )

  return address
}

/**
 * Fetch USDC balance for a wallet
 */
export async function fetchUsdcBalance(pubkey: string): Promise<number> {
  try {
    const owner = new PublicKey(pubkey)
    const mint = new PublicKey(USDC_MINT)

    const ata = getAssociatedTokenAddress(owner, mint)

    const balance = await connection.getTokenAccountBalance(ata)

    return balance.value.uiAmount ?? 0
  } catch (err) {
    console.warn('Failed to fetch USDC balance:', err)
    return 0
  }
}

/**
 * React hook — fetches USDC balance for the authenticated wallet
 */
export function useUsdcBalance() {
  const pubkey = useAppSelector((s) => s.auth.pubkey)

  const [balance, setBalance] = useState<number | null>(null)
  const [isLoading, setIsLoading] = useState(false)

  const refresh = useCallback(async () => {
    if (!pubkey) {
      setBalance(null)
      return
    }

    setIsLoading(true)

    try {
      const result = await fetchUsdcBalance(pubkey)
      setBalance(result)
    } catch (err) {
      console.warn(err)
      setBalance(0)
    } finally {
      setIsLoading(false)
    }
  }, [pubkey])

  useEffect(() => {
    refresh()
  }, [refresh])

  return {
    balance,
    isLoading,
    refresh,
  }
}
