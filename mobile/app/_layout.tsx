import { DarkTheme, DefaultTheme, ThemeProvider } from '@react-navigation/native';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import 'react-native-reanimated';

import { useColorScheme } from '@/hooks/use-color-scheme';
import { FocusProvider } from '../context/FocusContext';

import 'react-native-reanimated';
import { GestureHandlerRootView } from 'react-native-gesture-handler';

export const unstable_settings = {
  anchor: '(tabs)',
};

export default function RootLayout() {
  const colorScheme = useColorScheme();

  return (
    // GestureHandlerRootView 覆蓋整個應用，確保所有手勢都能被正確處理(DraggableFlatList)
    <GestureHandlerRootView style={{ flex: 1 }}>
      {/* [修改] FocusProvider 包在最外層，這樣他才會切換介面時同時計時 */}
      <FocusProvider>
        <ThemeProvider value={colorScheme === 'dark' ? DarkTheme : DefaultTheme}>
          <Stack>
            <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
            <Stack.Screen name="modal" options={{ presentation: 'modal', title: 'Modal' }} />
          </Stack>
          <StatusBar style="auto" />
        </ThemeProvider>
      </FocusProvider>
    </GestureHandlerRootView>
  );
}
