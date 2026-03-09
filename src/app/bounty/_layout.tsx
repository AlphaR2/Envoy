import { Stack } from 'expo-router';
import React from 'react';

export default function BountyLayout() {
  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="[id]/index" />
      <Stack.Screen name="[id]/winner" options={{ presentation: 'modal' }} />
      <Stack.Screen name="[id]/rate" options={{ presentation: 'modal' }} />
    </Stack>
  );
}
