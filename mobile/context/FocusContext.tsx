import React, { createContext, useState, useContext, useRef, useEffect } from 'react';
import { Alert, Platform, Modal, View, Text, Image, TouchableOpacity, StyleSheet } from 'react-native';
import * as Notifications from 'expo-notifications';
import api from '../api/api'; 
import { useUser } from './UserContext';

// 設定通知行為
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowBanner: true,
    shouldShowList: true,
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
  const [isFocusing, setIsFocusing] = useState(false);
  const [seconds, setSeconds] = useState(0);
  const [isResting, setIsResting] = useState(false);
  const restStartTimeRef = useRef<number | null>(null);
  const startTimeRef = useRef<number | null>(null);
  const { userId } = useUser();
  const lastNotificationIdRef = useRef<number | null>(null);

  // === 圖片彈窗 State ===
  const [showImageModal, setShowImageModal] = useState(false);
  const [notificationImage, setNotificationImage] = useState<string | null>(null);
  const [notificationMessage, setNotificationMessage] = useState<string>("");
  const [notificationTitle, setNotificationTitle] = useState("提醒"); 

  // === 1. 初始設定 ===
  useEffect(() => {
    async function configurePushNotifications() {
      const { status: existingStatus } = await Notifications.getPermissionsAsync();
      let finalStatus = existingStatus;
      if (existingStatus !== 'granted') {
        const { status } = await Notifications.requestPermissionsAsync();
        finalStatus = status;
      }
      if (finalStatus !== 'granted') return;

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

  // === 2. [修改] 監聽點擊通知 + 標記已讀 ===
  useEffect(() => {
    // 注意：這裡加上 async 以便呼叫 API
    const subscription = Notifications.addNotificationResponseReceivedListener(async response => {
      console.log("👆 使用者點擊了通知！");
      
      const content = response.notification.request.content;
      const data = content.data || {}; 
      
      // 設定彈窗內容
      setNotificationMessage(content.body || "收到新訊息");
      
      // 設定標題
      if (data.senderName) {
        setNotificationTitle(`${data.senderName}提醒你該專注了`);
      } else {
        setNotificationTitle(content.title || "提醒");
      }

      // 設定圖片
      if (data.imageUrl) {
        setNotificationImage(data.imageUrl);
      } else {
        setNotificationImage(null);
      }
      
      // 開啟彈窗
      setShowImageModal(true);

      // 👇👇👇 [新增功能] 呼叫後端 API 標記已讀 👇👇👇
      if (data.messageId) {
        try {
          console.log(`正在標記訊息 ID ${data.messageId} 為已讀...`);
          await api.post(`/api/v1/messages/${data.messageId}/read`);
          console.log("✅ 標記成功！");
        } catch (error) {
          console.error("❌ 標記已讀失敗:", error);
          // 這裡不跳 Alert，避免影響使用者看圖片的心情，只要後台紀錄就好
        }
      }
    });

    return () => subscription.remove();
  }, []);

  // === 3. Polling 檢查新訊息 ===
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
              // 這可更換圖片
              const alertImage = "https://media1.giphy.com/media/v1.Y2lkPTc5MGI3NjExMmUxdXNxMm1kaW1uOWdxbmRkZHZ6bHVseTRvaG9tNzUyanh6M25iOSZlcD12MV9pbnRlcm5hbF9naWZfYnlfaWQmY3Q9Zw/s35s4lFBxpndm/giphy.gif"; 

              await Notifications.scheduleNotificationAsync({
                content: {
                  title: `來自 ${data.sender_name} 的訊息 🔔`,
                  body: data.content,
                  sound: true, 
                  priority: Notifications.AndroidNotificationPriority.HIGH,
                  // 這裡記得要傳 messageId，上面的監聽器才抓得到
                  data: { 
                    messageId: data.id,
                    imageUrl: alertImage,
                    senderName: data.sender_name 
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
    
    const intervalId = setInterval(checkNewMessages, 3000); 
    return () => clearInterval(intervalId);
  }, [userId]);


  // === 專注計時器 (維持不動) ===
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

  const startFocus = async () => {
    await Notifications.cancelAllScheduledNotificationsAsync();
    setIsResting(false);
    restStartTimeRef.current = null;
    startTimeRef.current = Date.now();
    setSeconds(0);
    setIsFocusing(true);
    try { await api.post('/user/status', { is_studying: true, user_id: userId }); } catch (e) {}
  };

  const stopFocus = async (mode: 'pause' | 'end', photoBase64?: string) => {
    const finalDuration = startTimeRef.current ? Math.floor((Date.now() - startTimeRef.current) / 1000) : 0;
    setIsFocusing(false);
    setSeconds(0);
    startTimeRef.current = null;

    if (mode === 'pause') {
      setIsResting(true);
      restStartTimeRef.current = Date.now();
      await Notifications.scheduleNotificationAsync({
        content: {
          title: 'FocusMate 提醒 🐱',
          body: '已經休息 1 分鐘了喔，該回來了！',
          sound: true,
        },
        trigger: { type: Notifications.SchedulableTriggerInputTypes.TIME_INTERVAL, seconds: 60, repeats: false },
      });
    } else {
      setIsResting(false);
      restStartTimeRef.current = null;
      try { await api.post('/user/status', { is_studying: false, user_id: userId }); } catch (e) {}
    }

    try {
      const response = await api.post('/focus/save', {
        duration_seconds: finalDuration,
        note: mode === 'pause' ? "暫停休息" : "結束專注",
        user_id: userId 
      });
      if (photoBase64) await api.post('/camera/upload', { user_id: userId || 1, image_base64: photoBase64 });

      const data = response.data;
      let msg = `此次專注：${data.minutes} 分鐘`;
      if (data.badge_earned) msg += "\n🎉 恭喜獲得好寶寶徽章！";
      
      setTimeout(() => {
         if (mode === 'pause') Alert.alert("休息開始 ☕", "已幫您設定通知，1 分鐘後會提醒您回來！");
         else Alert.alert("專注結束", msg);
      }, 500);
    } catch (error: any) { Alert.alert("存檔失敗", "請檢查網路連線"); }
  };

  return (
    <FocusContext.Provider value={{ isFocusing, seconds, startFocus, stopFocus }}>
      {children}

      <Modal
        animationType="fade"
        transparent={true}
        visible={showImageModal}
        onRequestClose={() => setShowImageModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            
            <Text style={styles.modalTitle}>{notificationTitle}</Text>
            
            <Text style={styles.modalText}>{notificationMessage}</Text>

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
    textAlign: 'center',
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