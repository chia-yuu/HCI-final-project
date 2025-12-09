import React, { createContext, useState, useContext, useRef, useEffect } from 'react';
import { Alert, Platform } from 'react-native';
import * as Notifications from 'expo-notifications'; // 1. 引入
import api from '../api/api'; 
import { useUser } from './UserContext';

// 2.【關鍵設定】確保 App 在前景 (畫面中) 時，通知依然會跳出來
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowBanner: true, // 確保會跳出橫幅
    shouldShowList: true,   // 確保會顯示在通知中心
    
    shouldPlaySound: true,
    shouldSetBadge: false,
  }),
});

// ... (Interface 和 Context 定義保持不變) ...
interface FocusContextType {
  isFocusing: boolean;
  seconds: number;
  startFocus: () => void;
  stopFocus: (mode: 'pause' | 'end', photoBase64?: string) => Promise<void>;
}
const FocusContext = createContext<FocusContextType | undefined>(undefined);

export const FocusProvider = ({ children }: { children: React.ReactNode }) => {
  // ... (State 保持不變) ...
  const [isFocusing, setIsFocusing] = useState(false);
  const [seconds, setSeconds] = useState(0);
  const [isResting, setIsResting] = useState(false);
  const restStartTimeRef = useRef<number | null>(null);
  const startTimeRef = useRef<number | null>(null);
  const { userId } = useUser();
  
  // 記錄最後一則通知 ID
  const lastNotificationIdRef = useRef<number | null>(null);

  // 3.【初始設定】請求權限 + Android 頻道設定
  useEffect(() => {
    async function configurePushNotifications() {
      // (A) 請求權限
      const { status: existingStatus } = await Notifications.getPermissionsAsync();
      let finalStatus = existingStatus;
      if (existingStatus !== 'granted') {
        const { status } = await Notifications.requestPermissionsAsync();
        finalStatus = status;
      }
      
      if (finalStatus !== 'granted') {
        Alert.alert('提示', '請開啟通知權限以接收訊息提醒！');
        return;
      }

      // (B) Android 頻道設定 (重要！否則 Android 可能不會響)
      if (Platform.OS === 'android') {
        await Notifications.setNotificationChannelAsync('default', {
          name: 'default',
          importance: Notifications.AndroidImportance.MAX,
          vibrationPattern: [0, 250, 250, 250],
          lightColor: '#FF231F7C',
        });
      }
    }

    configurePushNotifications();
  }, []);

  // 4.【Polling 核心】檢查訊息
  useEffect(() => {
    if (!userId) return;

    const checkNewMessages = async () => {
      try {
        // 呼叫你的後端
        const response = await api.get('/api/v1/messages/unread/latest', {
           params: { user_id: userId }
        });
        
        // Log 檢查回傳資料
        // console.log("Polling API 回應:", response.data);

        const { has_unread, data } = response.data;

        // 判斷邏輯
        if (has_unread && data) {
           // 這裡加一個檢查 log
           // console.log(`比對 ID: 新=${data.id}, 舊=${lastNotificationIdRef.current}`);

           if (data.id !== lastNotificationIdRef.current) {
              console.log("🚀 觸發通知 function...");

              await Notifications.scheduleNotificationAsync({
                content: {
                  title: `來自 ${data.sender_name} 的訊息 🔔`,
                  body: data.content,
                  sound: true, // 確保有聲音
                  priority: Notifications.AndroidNotificationPriority.HIGH, // Android 優先級
                },
                trigger: null, // 立即觸發
              });

              // 更新 Ref
              lastNotificationIdRef.current = data.id;
           }
        }

      } catch (error) {
         // console.error("Polling Error:", error);
      }
    };
    
    const intervalId = setInterval(checkNewMessages, 5000); // 5秒一次
    return () => clearInterval(intervalId);
  }, [userId]);


  // =======================================================
  // 以下維持原有的專注計時器邏輯
  // =======================================================
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
      await api.post('/user/status', { is_studying: true, user_id: userId });
    } catch (e) { console.error("Status update failed", e); }
  };

  // === 停止/暫停專注 ===
  const stopFocus = async (mode: 'pause' | 'end', photoBase64?: string) => {
    const finalDuration = startTimeRef.current 
      ? Math.floor((Date.now() - startTimeRef.current) / 1000) 
      : 0;

    setIsFocusing(false);
    setSeconds(0);
    startTimeRef.current = null;

    if (mode === 'pause') {
      // === [休息模式] ===
      setIsResting(true);
      restStartTimeRef.current = Date.now();
      
      // 設定休息提醒通知
      await Notifications.scheduleNotificationAsync({
        content: {
          title: 'FocusMate 提醒 🐱',
          body: '已經休息 1 分鐘了喔，該回來了！',
          sound: true,
        },
        trigger: {
          type: Notifications.SchedulableTriggerInputTypes.TIME_INTERVAL,
          seconds: 60,       
          repeats: false,
        },
      });

    } else {
      // === [結束模式] ===
      setIsResting(false);
      restStartTimeRef.current = null;
      
      try {
        await api.post('/user/status', { is_studying: false, user_id: userId });
      } catch (e) { console.error("Status update failed", e); }
    }

    // 存檔邏輯
    try {
      const response = await api.post('/focus/save', {
        duration_seconds: finalDuration,
        note: mode === 'pause' ? "暫停休息" : "結束專注",
        user_id: userId 
      });

      if (photoBase64) {
        // ... (上傳照片邏輯)
        await api.post('/camera/upload', { user_id: userId || 1, image_base64: photoBase64 });
      }

      const data = response.data;
      let msg = `此次專注：${data.minutes} 分鐘`;
      if (data.badge_earned) msg += "\n🎉 恭喜獲得好寶寶徽章！";
      
      setTimeout(() => {
         if (mode === 'pause') {
             Alert.alert("休息開始 ☕", "已幫您設定通知，1 分鐘後會提醒您回來！");
         } else {
             Alert.alert("專注結束", msg);
         }
      }, 500);

    } catch (error: any) {
      console.error("存檔錯誤:", error);
      Alert.alert("存檔失敗", "請檢查網路連線");
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