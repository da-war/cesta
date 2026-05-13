import React from 'react';
import { Tabs } from 'expo-router';
import { Text } from 'react-native';
import { palette, font } from '@/lib/theme';

export default function TabsLayout() {
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: palette.primary,
        tabBarInactiveTintColor: palette.inkMuted,
        tabBarStyle: { borderTopColor: palette.borderSoft, backgroundColor: palette.surfaceRaised, height: 84, paddingTop: 6, paddingBottom: 24 },
        tabBarLabelStyle: { fontSize: font.size.xs, fontWeight: font.weight.semibold },
      }}
    >
      <Tabs.Screen name="index" options={{ title: 'Path', tabBarIcon: ({ color }) => <Text style={{ fontSize: 22, color }}>🗺️</Text> }} />
      <Tabs.Screen name="practice" options={{ title: 'Practice', tabBarIcon: ({ color }) => <Text style={{ fontSize: 22, color }}>🎯</Text> }} />
      <Tabs.Screen name="leagues" options={{ title: 'Leagues', tabBarIcon: ({ color }) => <Text style={{ fontSize: 22, color }}>🏆</Text> }} />
      <Tabs.Screen name="profile" options={{ title: 'Profile', tabBarIcon: ({ color }) => <Text style={{ fontSize: 22, color }}>👤</Text> }} />
    </Tabs>
  );
}
