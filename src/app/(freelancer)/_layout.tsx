import { Tabs } from 'expo-router';
import React from 'react';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '../../theme/colors';
import { PremiumTabBar } from '../../components/ui/PremiumTabBar';

export default function FreelancerLayout() {
  return (
    <Tabs
      tabBar={(props) => (
        <PremiumTabBar
          {...props}
          activeColor={colors.brand.secondary}
          centerLabel="Add Agent"
          centerIcon="hardware-chip-outline"
          centerGradientEnd={colors.brand.neon}
        />
      )}
      screenOptions={{ headerShown: false }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: 'Dashboard',
          tabBarIcon: ({ color, focused }) => (
            <Ionicons name={focused ? 'flash' : 'flash-outline'} size={23} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="agents"
        options={{
          title: 'My Agents',
          tabBarIcon: ({ color, focused }) => (
            <Ionicons name={focused ? 'hardware-chip' : 'hardware-chip-outline'} size={23} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="create"
        options={{ title: '' }}
      />
      <Tabs.Screen
        name="leaderboard"
        options={{
          title: 'Rankings',
          tabBarIcon: ({ color, focused }) => (
            <Ionicons name={focused ? 'trophy' : 'trophy-outline'} size={23} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: 'Profile',
          tabBarIcon: ({ color, focused }) => (
            <Ionicons name={focused ? 'person-circle' : 'person-circle-outline'} size={23} color={color} />
          ),
        }}
      />
    </Tabs>
  );
}
