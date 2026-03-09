import { transact } from '@solana-mobile/mobile-wallet-adapter-protocol-web3js';
import { PublicKey } from '@solana/web3.js';
import bs58 from 'bs58';
import { useAppDispatch } from '../store/store';
import { setAuth } from '../store/authSlice';
import { setWalletType } from '../store/walletSlice';
import { tokenStorage } from '../utils/tokenStorage';
import { useGetNonceMutation, useVerifyMutation } from '../store/api/authApi';
import { useLazyGetMeQuery } from '../store/api/usersApi';

const APP_IDENTITY = {
  name: 'Envoy',
  uri: 'https://getenvoy.app',
  icon: 'favicon.ico',
};

const CHAIN = (process.env.EXPO_PUBLIC_SOLANA_NETWORK === 'mainnet'
  ? 'solana:mainnet'
  : 'solana:devnet') as `solana:${'mainnet' | 'devnet' | 'testnet'}`;

/**
 * MWA accounts[0].address is base64url-encoded (wire format).
 * The backend and the rest of the app expect a standard base58 Solana address.
 */
function mwaAddressToBase58(base64Address: string): string {
  const bytes = Buffer.from(base64Address, 'base64');
  return new PublicKey(bytes).toBase58();
}

/**
 * MWA signMessages() returns the signed payload, which can be:
 *   (a) 64 bytes  → raw ed25519 signature (Phantom standard sign)
 *   (b) > 64 bytes → Solana off-chain header + original msg + 64-byte signature appended
 * In both cases the ed25519 signature is always the last 64 bytes.
 */
function extractSignatureBytes(signedPayload: Uint8Array): Uint8Array {
  if (signedPayload.length === 64) return signedPayload;
  return signedPayload.slice(signedPayload.length - 64);
}

export function useWalletAuth() {
  const dispatch = useAppDispatch();
  const [getNonce] = useGetNonceMutation();
  const [verify] = useVerifyMutation();
  const [getMe] = useLazyGetMeQuery();

  const connectAndAuth = async () => {
    await transact(async (wallet) => {
      const { accounts } = await wallet.authorize({
        chain: CHAIN,
        identity: APP_IDENTITY,
      });

      const account = accounts[0];

      // ── Key: convert base64 MWA address → base58 Solana pubkey ──
      const pubkey = mwaAddressToBase58(account.address);

      const { nonce } = await getNonce({ pubkey }).unwrap();

      const messageBytes = new TextEncoder().encode(nonce);

      // signMessages expects the base64 address (MWA wire format)
      const [signedPayload] = await wallet.signMessages({
        addresses: [account.address],
        payloads: [messageBytes],
      });

      // ── Key: extract the raw 64-byte ed25519 signature ──
      const signatureBytes = extractSignatureBytes(signedPayload);
      const signature = bs58.encode(signatureBytes);

      const { accessToken, refreshToken } = await verify({
        pubkey,
        nonce,
        signature,
      }).unwrap();

      await tokenStorage.saveTokens(accessToken, refreshToken);

      const user = await getMe().unwrap();
      dispatch(setWalletType('mwa'));
      dispatch(setAuth({ pubkey, accessToken, user }));
    });
  };

  return { connectAndAuth };
}
