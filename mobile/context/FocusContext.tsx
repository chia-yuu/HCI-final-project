import React, { createContext, useState, useContext, useRef, useEffect } from 'react';
import { AppState, Alert, Platform } from 'react-native';
import * as Notifications from 'expo-notifications';
import api from '../api/api'; 

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
  }),
});

interface FocusContextType {
  isFocusing: boolean;
  seconds: number;
  startFocus: () => void;
  stopFocus: (mode: 'pause' | 'end') => Promise<void>;
}

const FocusContext = createContext<FocusContextType | undefined>(undefined);

export const FocusProvider = ({ children }: { children: React.ReactNode }) => {
  const [isFocusing, setIsFocusing] = useState(false);
  const [seconds, setSeconds] = useState(0);
  
  // 休息模式專用
  const [isResting, setIsResting] = useState(false);
  const restStartTimeRef = useRef<number | null>(null);

  const startTimeRef = useRef<number | null>(null);
  
  // 通知權限
  useEffect(() => {
    async function requestPermissions() {
      const { status } = await Notifications.requestPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('權限不足', '請允許通知權限，才能在休息時提醒你回來喔！');
      }
    }
    requestPermissions();
  }, []);

  // 專注計時器
  useEffect(() => {
    let interval: NodeJS.Timeout | null = null;
    if (isFocusing) {
      if (startTimeRef.current === null) startTimeRef.current = Date.now();
      interval = setInterval(() => {
        if (startTimeRef.current) {
          setSeconds(Math.floor((Date.now() - startTimeRef.current) / 1000));
        }
      }, 1000);
    }
    return () => { if (interval) clearInterval(interval); };
  }, [isFocusing]);

  // === 開始專注 ===
  const startFocus = async () => {
    await Notifications.cancelAllScheduledNotificationsAsync();
    
    setIsResting(false);
    restStartTimeRef.current = null;

    startTimeRef.current = Date.now();
    setSeconds(0);
    setIsFocusing(true);

    try {
      await api.post('/user/status', { is_studying: true });
    } catch (e) { console.error("Status update failed", e); }
  };

  // === 停止/暫停專注 ===
  const stopFocus = async (mode: 'pause' | 'end') => {
    await Notifications.cancelAllScheduledNotificationsAsync();

    const finalDuration = startTimeRef.current 
      ? Math.floor((Date.now() - startTimeRef.current) / 1000) 
      : 0;

    setIsFocusing(false);
    setSeconds(0);
    startTimeRef.current = null;

    if (mode === 'pause') {
      // === [休息模式] ===
      // 休息計時
      setIsResting(true);
      restStartTimeRef.current = Date.now();

      //設定通知時間
      const scheduleReminder = async (minutes: number) => {
        await Notifications.scheduleNotificationAsync({
          content: {
            title: "FocusMate 提醒 🐱",
            body: `已經休息 ${minutes} 分鐘了喔，該回來了！`,
            sound: true,
          },
          trigger: { seconds: minutes * 60 }, 
        });
      };


      await scheduleReminder(1);

    } else {
      // === [結束模式] ===
      setIsResting(false);
      restStartTimeRef.current = null;
      
      try {
        await api.post('/user/status', { is_studying: false });
      } catch (e) { console.error("Status update failed", e); }
    }

    // 存檔
    try {
      const response = await api.post('/focus/save', {
        duration_seconds: finalDuration,
        note: mode === 'pause' ? "暫停休息" : "結束專注"
      });

      const data = response.data;
      let msg = `此次專注：${data.minutes} 分鐘`;
      if (data.badge_earned) msg += "\n🎉 恭喜獲得好寶寶徽章！";
      
      setTimeout(() => {
         if (mode === 'pause') {
             Alert.alert("休息開始 ☕", "已幫您設定通知，10 分鐘後會提醒您回來！\n(現在您可以安心跳出 App)");
         } else {
             Alert.alert("專注結束", msg);
         }
      }, 500);

    } catch (error) {
      console.error(error);
      Alert.alert("錯誤", "存檔失敗");
    }
  };

  return (
    <FocusContext.Provider value={{ isFocusing, seconds, startFocus, stopFocus }}>
      {children}
    </FocusContext.Provider>
  );
};

export const useFocus = () => {
  const context = useContext(FocusContext);
  if (!context) throw new Error('useFocus must be used within a FocusProvider');
  return context;
};
