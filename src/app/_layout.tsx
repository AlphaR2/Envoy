import 'react-native-reanimated';
import 'react-native-gesture-handler';
import { Buffer } from 'buffer'
import 'react-native-get-random-values'
import 'react-native-url-polyfill/auto'

import { ErrorBoundary } from '@/components/common/ErrorBoundary'
import { ModalProvider, ToastProvider } from '@/components/ui'
import { MWAProvider, PhantomWalletProvider } from '@/providers'
import { StoreProvider } from '@/store'
import { Stack } from 'expo-router'
import { StatusBar } from 'expo-status-bar'
import React from 'react'
import { StyleSheet } from 'react-native'
import { GestureHandlerRootView } from 'react-native-gesture-handler'
import { SafeAreaProvider } from 'react-native-safe-area-context'
import { ThemeProvider } from './providers/ThemeProvider'

global.Buffer = global.Buffer || Buffer

export default function RootLayout() {
  return (
    <StoreProvider>
      <StatusBar style="auto" />
      <GestureHandlerRootView style={styles.fullscreen}>
        <PhantomWalletProvider>
          <MWAProvider>
            <SafeAreaProvider>
              <ThemeProvider>
                <ErrorBoundary>
                  <ToastProvider>
                    <ModalProvider>
                      <Stack
                        screenOptions={{
                          headerShown: false,
                        }}
                      >
                        <Stack.Screen name="index" />
                        <Stack.Screen name="role-selection" />
                        <Stack.Screen name="auth" />
                        <Stack.Screen name="(client)" />
                        <Stack.Screen name="(freelancer)" />
                        <Stack.Screen name="bounty" />
                        <Stack.Screen name="agent/[id]" />
                      </Stack>
                    </ModalProvider>
                  </ToastProvider>
                </ErrorBoundary>
              </ThemeProvider>
            </SafeAreaProvider>
          </MWAProvider>
        </PhantomWalletProvider>
      </GestureHandlerRootView>
    </StoreProvider>
  )
}

const styles = StyleSheet.create({
  fullscreen: {
    flex: 1,
  },
})
