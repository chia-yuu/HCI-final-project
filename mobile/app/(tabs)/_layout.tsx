import { Stack, Tabs } from 'expo-router';
import React from 'react';

import { HapticTab } from '@/components/haptic-tab';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { Colors } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';

export default function TabLayout() {
  return <Stack
    screenOptions={{
      headerShown: false,
      animation: 'none'
    }}>
        <Stack.Screen name="focusMode"/>
        <Stack.Screen name="deadlineList"/>
        <Stack.Screen name="friendList"/>
        <Stack.Screen name="myRecord"/>
    </Stack>;
}
