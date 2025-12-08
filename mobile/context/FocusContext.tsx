import React, { createContext, useState, useContext, useRef, useEffect } from 'react';
import { AppState, Alert, Platform } from 'react-native';
import * as Notifications from 'expo-notifications';
import api from '../api/api'; 
import { useUser } from './UserContext';

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
  const { userId } = useUser();

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
// 💡 修正 2: 傳遞 user_id 給 /user/status
    await api.post('/user/status', { is_studying: true, user_id: userId });
    } catch (e) { console.error("Status update failed", e); }
  };

  // === 停止/暫停專注 ===
  const stopFocus = async (mode: 'pause' | 'end', photoBase64?: string) => {
    //await Notifications.cancelAllScheduledNotificationsAsync();

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

      // //設定通知時間
      // const scheduleReminder = async (minutes: number) => {
      //   await Notifications.scheduleNotificationAsync({
      //     content: {
      //       title: "FocusMate 提醒 🐱",
      //       body: `已經休息 ${minutes} 分鐘了喔，該回來了！`,
      //       sound: true,
      //     },
      //     trigger: { seconds: minutes * 60 }, 
      //   });
      // };


      // await scheduleReminder(1);

      
    await Notifications.scheduleNotificationAsync({
      content: {
        title: 'FocusMate 提醒 🐱',
        body: '已經休息 1 分鐘了喔，該回來了！',
        sound: true,
      },
      trigger: {
        type: Notifications.SchedulableTriggerInputTypes.TIME_INTERVAL,
        seconds: 60,       // ← 1 分鐘
        repeats: false,
      },
    });


    } else {
      // === [結束模式] ===
      setIsResting(false);
      restStartTimeRef.current = null;
     
      try {
        // 💡 修正 3a: 傳遞 user_id 給 /user/status
        await api.post('/user/status', { is_studying: false, user_id: userId });
      } catch (e) { console.error("Status update failed", e); }
    }


// 存檔
    try {
      // 💡 修正 3b: 傳遞 user_id 給 /focus/save
      const safeUserId = userId || 1;
      const response = await api.post('/focus/save', {
        duration_seconds: finalDuration,
        note: mode === 'pause' ? "暫停休息" : "結束專注",
        user_id: userId // 💡 關鍵修正
      });

      if (photoBase64) {
        console.log("正在上傳照片...");
        await api.post('/camera/upload', {
          user_id: 1, // 預設 User
          image_base64: photoBase64
        });
        console.log("照片上傳成功！");
      }

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

    } catch (error: any) {
      // 顯示詳細錯誤資訊
      if (error.response) {
        // 後端有回應，但回傳錯誤代碼 (例如 422, 500)
        console.error("後端錯誤:", error.response.status, error.response.data);
        Alert.alert("存檔失敗", `伺服器拒絕: ${JSON.stringify(error.response.data)}`);
      } else if (error.request) {
        // 請求有發出去，但沒收到回應 (通常是網路問題)
        console.error("網路錯誤:", error.message);
        Alert.alert("存檔失敗", "網路連線逾時或照片太大");
      } else {
        console.error("程式錯誤:", error.message);
      }
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
