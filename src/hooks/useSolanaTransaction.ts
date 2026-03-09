import { transact } from '@solana-mobile/mobile-wallet-adapter-protocol-web3js';
import { VersionedTransaction } from '@solana/web3.js';

const APP_IDENTITY = {
  name: 'Envoy',
  uri: 'https://getenvoy.app',
  icon: 'favicon.ico',
};

const CHAIN = (process.env.EXPO_PUBLIC_SOLANA_NETWORK === 'mainnet'
  ? 'solana:mainnet'
  : 'solana:devnet') as `solana:${'mainnet' | 'devnet' | 'testnet'}`;

/**
 * Decodes a base64 unsigned tx from the backend, prompts the wallet to sign,
 * broadcasts it, and returns the tx signature string.
 */
export function useSolanaTransaction() {
  const signAndSend = async (base64Tx: string): Promise<string> => {
    const txBytes = Buffer.from(base64Tx, 'base64');
    const transaction = VersionedTransaction.deserialize(txBytes);

    let signature = '';

    await transact(async (wallet) => {
      await wallet.authorize({
        chain: CHAIN,
        identity: APP_IDENTITY,
      });

      const [txSignature] = await wallet.signAndSendTransactions({
        transactions: [transaction],
      });

      signature = txSignature;
    });

    return signature;
  };

  return { signAndSend };
}
