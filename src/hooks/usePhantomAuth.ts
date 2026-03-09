// Phantom embedded SDK removed for MVP.
// Re-implement with @phantom/react-native-sdk after MVP.
// The hook interface is preserved so imports don't break at the call-site.

export function usePhantomAuth() {
  const connectAndAuth = async (_options?: unknown): Promise<void> => {
    throw new Error('Phantom embedded auth not available in this build.');
  };

  return { connectAndAuth };
}
