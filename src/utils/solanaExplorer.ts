import { Linking } from 'react-native';

const NETWORK = process.env.EXPO_PUBLIC_SOLANA_NETWORK ?? 'devnet';

export function explorerUrl(address: string, type: 'address' | 'tx' = 'address'): string {
  const base = `https://explorer.solana.com/${type}/${address}`;
  return NETWORK === 'mainnet-beta' ? base : `${base}?cluster=${NETWORK}`;
}

export function openInExplorer(address: string, type: 'address' | 'tx' = 'address'): void {
  Linking.openURL(explorerUrl(address, type));
}

export function shortAddress(address: string, start = 6, end = 4): string {
  if (!address || address.length <= start + end + 3) return address;
  return `${address.slice(0, start)}...${address.slice(-end)}`;
}
