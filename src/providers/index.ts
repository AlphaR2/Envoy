import React, { ReactNode } from 'react';

interface ProviderProps {
  children: ReactNode;
}

// Passthrough — Phantom embedded SDK removed for MVP.
// Re-wire with @phantom/react-native-sdk after MVP.
export const MWAProvider: React.FC<ProviderProps> = ({ children }) => {
  return React.createElement(React.Fragment, null, children);
};

export const PhantomWalletProvider: React.FC<ProviderProps> = ({ children }) => {
  return React.createElement(React.Fragment, null, children);
};
