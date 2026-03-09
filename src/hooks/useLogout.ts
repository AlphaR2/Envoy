import { useState } from 'react';
import { useRouter } from 'expo-router';
import { useAppDispatch } from '../store/store';
import { clearAuth } from '../store/authSlice';
import { tokenStorage } from '../utils/tokenStorage';
import { useLogoutMutation } from '../store/api/authApi';

export function useLogout() {
  const dispatch         = useAppDispatch();
  const router           = useRouter();
  const [logoutMutation] = useLogoutMutation();
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  const logout = async () => {
    setIsLoggingOut(true);
    try {
      const refreshToken = await tokenStorage.getRefreshToken();
      if (refreshToken) {
        try {
          await logoutMutation({ refreshToken }).unwrap();
        } catch {
          // best-effort — clear locally regardless
        }
      }
      await tokenStorage.clearTokens();
      dispatch(clearAuth());
      router.replace('/auth');
    } finally {
      setIsLoggingOut(false);
    }
  };

  return { logout, isLoggingOut };
}
