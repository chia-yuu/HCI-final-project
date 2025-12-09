import React, { createContext, useState, useContext, useRef, useEffect } from 'react';
import { Alert, Platform, Modal, View, Text, Image, TouchableOpacity, StyleSheet } from 'react-native'; // 1. [修改] 引入 UI 元件
import * as Notifications from 'expo-notifications';
import api from '../api/api'; 
import { useUser } from './UserContext';

// 2.【設定】確保 App 在前景時，通知會以橫幅 (Banner) 顯示
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowBanner: true, // 新版寫法：顯示橫幅
    shouldShowList: true,   // 新版寫法：保留在通知中心
    shouldPlaySound: true,
    shouldSetBadge: false,
  }),
});

interface FocusContextType {
  isFocusing: boolean;
  seconds: number;
  startFocus: () => void;
  stopFocus: (mode: 'pause' | 'end', photoBase64?: string) => Promise<void>;
}
const FocusContext = createContext<FocusContextType | undefined>(undefined);

export const FocusProvider = ({ children }: { children: React.ReactNode }) => {
  // === 原有 State 保持不變 ===
  const [isFocusing, setIsFocusing] = useState(false);
  const [seconds, setSeconds] = useState(0);
  const [isResting, setIsResting] = useState(false);
  const restStartTimeRef = useRef<number | null>(null);
  const startTimeRef = useRef<number | null>(null);
  const { userId } = useUser();
  
  // 記錄最後一則通知 ID (Polling 用)
  const lastNotificationIdRef = useRef<number | null>(null);

  // === [新增] 圖片彈窗的 State ===
  const [showImageModal, setShowImageModal] = useState(false);
  const [notificationImage, setNotificationImage] = useState<string | null>(null);
  const [notificationMessage, setNotificationMessage] = useState<string>("");

  // 3.【初始設定】請求權限 + Android 頻道設定
  useEffect(() => {
    async function configurePushNotifications() {
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

  // 4. [新增] 監聽：使用者點擊通知 (Response Received)
  useEffect(() => {
    // 當使用者點擊通知時觸發
    const subscription = Notifications.addNotificationResponseReceivedListener(response => {
      console.log("👆 使用者點擊了通知！");
      
      const content = response.notification.request.content;
      const data = content.data; // 取得我們在 Polling 裡塞的 data
      
      // 設定彈窗文字與圖片
      setNotificationMessage(content.body || "收到新訊息");
      
      // 如果 data 裡有 imageUrl 就用，沒有就用預設圖片
      const imageToShow = data.imageUrl || 'https://cdn-icons-png.flaticon.com/512/3769/3769038.png'; 
      setNotificationImage(imageToShow);
      
      // 開啟 Modal
      setShowImageModal(true);
    });

    return () => subscription.remove();
  }, []);

  // 5.【Polling 核心】檢查訊息 (有加入圖片參數)
  useEffect(() => {
    if (!userId) return;

    const checkNewMessages = async () => {
      try {
        const response = await api.get('/api/v1/messages/unread/latest', {
           params: { user_id: userId }
        });
        
        const { has_unread, data } = response.data;

        if (has_unread && data) {
           if (data.id !== lastNotificationIdRef.current) {
              console.log("🚀 觸發通知 function...");

              // 定義要在通知與彈窗顯示的圖片
              // 範例：一張「快回來」的圖 (可替換成你想要的 URL)
              const alertImage = "https://media1.giphy.com/media/v1.Y2lkPTc5MGI3NjExMmUxdXNxMm1kaW1uOWdxbmRkZHZ6bHVseTRvaG9tNzUyanh6M25iOSZlcD12MV9pbnRlcm5hbF9naWZfYnlfaWQmY3Q9Zw/s35s4lFBxpndm/giphy.gif"; 

              await Notifications.scheduleNotificationAsync({
                content: {
                  title: `來自 ${data.sender_name} 的訊息 🔔`,
                  body: data.content,
                  sound: true, 
                  priority: Notifications.AndroidNotificationPriority.HIGH,
                  // [新增] 在這裡塞入圖片資料，供點擊後讀取
                  data: { 
                    messageId: data.id,
                    imageUrl: alertImage 
                  },
                },
                trigger: null, 
              });

              lastNotificationIdRef.current = data.id;
           }
        }
      } catch (error) {
         // console.error("Polling Error:", error);
      }
    };
    
    const intervalId = setInterval(checkNewMessages, 1000); 
    return () => clearInterval(intervalId);
  }, [userId]);


  // =======================================================
  // [保留] 原本的計時器 useEffect
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

  // =======================================================
  // [保留] 原本的 startFocus (完全沒動)
  // =======================================================
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

  // =======================================================
  // [保留] 原本的 stopFocus (完全沒動)
  // =======================================================
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

      {/* === [新增] 全域圖片彈窗 Modal === */}
      <Modal
        animationType="fade"
        transparent={true}
        visible={showImageModal}
        onRequestClose={() => setShowImageModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>🔔 新通知</Text>
            
            {/* 訊息內容 */}
            <Text style={styles.modalText}>{notificationMessage}</Text>

            {/* 圖片顯示 */}
            {notificationImage && (
              <Image 
                source={{ uri: notificationImage }} 
                style={styles.modalImage} 
                resizeMode="contain"
              />
            )}

            <TouchableOpacity 
              style={styles.closeButton} 
              onPress={() => setShowImageModal(false)}
            >
              <Text style={styles.closeButtonText}>收到！</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

    </FocusContext.Provider>
  );
};

export const useFocus = () => {
  const context = useContext(FocusContext);
  if (!context) throw new Error('useFocus must be used within a FocusProvider');
  return context;
};

// [新增] Styles 用於彈窗
const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.6)', 
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    width: 300,
    backgroundColor: 'white',
    borderRadius: 20,
    padding: 20,
    alignItems: 'center',
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 10,
    color: '#333',
  },
  modalText: {
    fontSize: 16,
    color: '#666',
    marginBottom: 15,
    textAlign: 'center',
  },
  modalImage: {
    width: 250,
    height: 200, 
    marginBottom: 20,
    borderRadius: 10,
    backgroundColor: '#f0f0f0', 
  },
  closeButton: {
    backgroundColor: '#FF6B6B',
    paddingVertical: 10,
    paddingHorizontal: 30,
    borderRadius: 25,
  },
  closeButtonText: {
    color: 'white',
    fontWeight: 'bold',
    fontSize: 16,
  },
});