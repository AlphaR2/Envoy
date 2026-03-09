import { createSlice, PayloadAction } from '@reduxjs/toolkit';

type WalletType = 'phantom_embedded' | 'mwa' | null;

interface WalletState {
  walletType: WalletType;
  balance: number; // USDC balance
}

const initialState: WalletState = {
  walletType: null,
  balance: 0,
};

const walletSlice = createSlice({
  name: 'wallet',
  initialState,
  reducers: {
    setWalletType(state, action: PayloadAction<WalletType>) {
      state.walletType = action.payload;
    },
    setBalance(state, action: PayloadAction<number>) {
      state.balance = action.payload;
    },
  },
});

export const { setWalletType, setBalance } = walletSlice.actions;
export default walletSlice.reducer;
