import { DarkTheme, DefaultTheme, ThemeProvider } from '@react-navigation/native';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import 'react-native-reanimated';

import { useColorScheme } from '@/hooks/use-color-scheme';
import { FocusProvider } from '../context/FocusContext';
import { UserProvider } from '../context/UserContext';

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
      <UserProvider>
        <FocusProvider>
          <ThemeProvider value={colorScheme === 'dark' ? DarkTheme : DefaultTheme}>
            <Stack>
              {/* 1. 💡 讓 index.tsx 成為第一個畫面，這才是應用程式啟動時應顯示的 */}
              <Stack.Screen name="index" options={{ headerShown: false }} /> 

              {/* 2. (tabs) 群組放在後面，只有在選完 User ID 後才導航進去 */}
              <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
              
              {/* 3. 其他路由... */}
              <Stack.Screen name="modal" options={{ presentation: 'modal', title: 'Modal' }} />
              <Stack.Screen name="CameraScreen" options={{ headerShown: false }} />
            </Stack>
            <StatusBar style="auto" />
          </ThemeProvider>
        </FocusProvider>
      </UserProvider>
    </GestureHandlerRootView>
  );
}
