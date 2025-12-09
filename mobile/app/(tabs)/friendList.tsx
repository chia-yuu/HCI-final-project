import PageTemplate from '@/components/page-template';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Modal,
  TextInput,
  TouchableWithoutFeedback,
  Alert,
  FlatList,
  ActivityIndicator,
} from 'react-native';
import React, { useState, useEffect } from 'react';
import api from '../../api/api';
import { useUser } from '../../context/UserContext';
// 1. 引入 Notifications
import * as Notifications from 'expo-notifications';

// 2. 設定通知行為 (確保 App 開著的時候也會跳出通知)
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowBanner: true, // 確保會跳出橫幅
    shouldShowList: true,   // 確保會顯示在通知中心
    shouldPlaySound: true, // 播放聲音
    shouldSetBadge: false,
  }),
});

// --- 1. 定義 Props 介面 (ReminderModal) ---
interface ReminderModalProps {
  visible: boolean;
  friendName: string;
  onCancel: () => void;
  onSend: () => void;
  message: string;
  setMessage: (text: string) => void;
}

const ReminderModal: React.FC<ReminderModalProps> = ({
  visible,
  friendName,
  onCancel,
  onSend,
  message,
  setMessage,
}) => (
  <Modal
    animationType="fade"
    transparent={true}
    visible={visible}
    onRequestClose={onCancel}
  >
    <TouchableWithoutFeedback onPress={onCancel}>
      <View style={styles.modalOverlay}>
        <TouchableWithoutFeedback>
          <View style={styles.modalContainer}>
            <Text style={styles.modalText}>
              將會消耗一枚**好寶寶徽章**！
            </Text>
            <Text style={styles.modalText}>
              來揪**{friendName}**回到專注模式吧～
            </Text>
            <Text style={[styles.modalText, styles.messageTitle]}>
              傳送訊息:
            </Text>
            <TextInput
              style={styles.messageInput}
              onChangeText={setMessage}
              value={message}
              placeholder="休息太久了!回來!!"
            />
            <View style={styles.buttonContainer}>
              <TouchableOpacity
                style={[styles.modalButton, styles.cancelButton]}
                onPress={onCancel}
              >
                <Text style={styles.buttonText}>取消</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.modalButton, styles.sendButton]}
                onPress={onSend}
              >
                <Text style={styles.buttonText}>傳送</Text>
              </TouchableOpacity>
            </View>
          </View>
        </TouchableWithoutFeedback>
      </View>
    </TouchableWithoutFeedback>
  </Modal>
);

// --- FriendListScreen 相關邏輯 ---

interface FriendStatusAPIResponse {
  friend_id: number;
  name: string;
  is_studying: boolean;
  current_timer: string | null;
}

/**
 * 步驟 1: 取得好友 ID 列表
 */
const fetchFriendIds = async (userId: number | null): Promise<number[]> => {
  if (userId === null) return [];
  try {
    console.log(`[API] 正在取得用戶 ${userId} 的好友列表...`);
    const response = await api.get(`/api/v1/new-friends/${userId}`);
    const data = response.data;
    
    console.log(`[API] 好友列表回應:`, data);

    if (data && Array.isArray(data.friend_ids)) {
      return data.friend_ids;
    }
    return [];
  } catch (error) {
    console.error("[API Error] fetchFriendIds 失敗:", error);
    return [];
  }
}

/**
 * 步驟 2: 取得好友詳細狀態
 */
const fetchFriendStatuses = async (friendIds: number[]): Promise<FriendStatusAPIResponse[]> => {
  if (friendIds.length === 0) return [];

  const idsString = friendIds.join(',');
  
  try {
    console.log(`[API] 正在取得好友狀態，IDs: ${idsString}`);
    const response = await api.get("/api/v1/friends/status", {
      params: { ids: idsString }
    });
    const data = response.data;
    
    if (!Array.isArray(data)) {
       console.error("API 返回的資料格式不正確 (不是陣列)。");
       return [];
    }
    
    const validatedData = data.map((item: any) => ({
      friend_id: item.friend_id,
      name: item.name || 'Unknown Friend', 
      is_studying: item.is_studying,
      current_timer: item.current_timer,
    })) as FriendStatusAPIResponse[];

    return validatedData;

  } catch (error) {
    console.error("[API Error] fetchFriendStatuses 失敗:", error);
    return []; 
  }
};

// --- FriendListScreen 主程式 ---
export default function FriendListScreen() {
  const { userId } = useUser();
  const [friendsList, setFriendsList] = useState<FriendStatusAPIResponse[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  
  // 儲存自己的徽章數量
  const [myBadgeCount, setMyBadgeCount] = useState(0);

  // 抓取自己徽章的函式
  const fetchMyBadge = async () => {
    if (!userId) return;
    try {
      const response = await api.get(`/api/v1/user/record_status?user_id=${userId}`);
      setMyBadgeCount(response.data.badge_count);
    } catch (error) {
      console.error("無法取得徽章數量:", error);
    }
  };

  // ---------------------------------------------------
  // 唯一的 useEffect: 負責載入好友列表與自己的徽章
  // ---------------------------------------------------
  useEffect(() => {
    let isMounted = true; // 防止組件卸載後更新狀態

    const loadStatuses = async () => {
      if (!userId) {
        console.log("等待 userId...");
        if (isMounted) setIsLoading(false);
        return;
      }

      if (isMounted) setIsLoading(true);

      try {
        // 1. 先抓 ID 列表
        const friendIds = await fetchFriendIds(userId);
        
        if (friendIds.length > 0) {
           // 2. 再抓狀態
           const apiData = await fetchFriendStatuses(friendIds);
           if (isMounted) setFriendsList(apiData);
        } else {
           console.log("沒有好友 ID，跳過狀態查詢");
           if (isMounted) setFriendsList([]);
        }
      } catch (error) {
        console.error("載入流程錯誤:", error);
      } finally {
        if (isMounted) setIsLoading(false);
      }
      
      // [保留] 順便載入自己的徽章
      await fetchMyBadge();
    };

    loadStatuses();

    return () => { isMounted = false; };
  }, [userId]); 

  // (原本的第二個 useEffect 已刪除，因為已經搬到 Global Context 了)

  const [modalVisible, setModalVisible] = useState(false);
  const [targetFriend, setTargetFriend] = useState('');
  const [targetFriendId, setTargetFriendId] = useState<number | null>(null); 
  const [message, setMessage] = useState(''); 
  
  const handleReminderPress = (friendName: string, friendId: number) => {
    // [邏輯判斷] 檢查徽章是否足夠
    if (myBadgeCount < 1) {
        Alert.alert(
            "徽章不足 😱", 
            "你需要至少一枚好寶寶徽章才能傳送訊息！\n快去專注賺取徽章吧～",
            [{ text: "好，我去努力" }]
        );
        return; // 直接結束，不開啟 Modal
    }

    // 若足夠，才執行原本的開啟視窗邏輯
    setTargetFriend(friendName);
    setTargetFriendId(friendId);
    setModalVisible(true);
    setMessage(''); 
  };

  const handleSend = async () => {
      // 1. 防呆檢查：訊息不能為空
      if (message.trim().length === 0) {
          Alert.alert('提示', '請輸入傳送訊息！');
          return;
      }

      // 2. 防呆檢查：確保 ID 存在
      if (!userId || !targetFriendId) {
          Alert.alert('錯誤', '系統錯誤：無法識別用戶或好友 ID');
          return;
      }

      try {
          console.log(`[API] 正在傳送訊息... 寄件人:${userId}, 收件人:${targetFriendId}, 內容:${message}`);

          // 3. 呼叫後端 API
          const response = await api.post('/api/v1/messages', {
              sender_id: userId,
              receiver_id: targetFriendId,
              content: message
          });

          console.log('[API] 傳送成功:', response.data);

          // 4. 成功後的 UI 處理
          setModalVisible(false); // 關閉 Modal
          setMessage('');         // 清空輸入框
          
          // 更新本地顯示的徽章數量 (不需要重 call API)
          setMyBadgeCount(prev => Math.max(0, prev - 1));

          Alert.alert(
              '傳送成功 🎉', 
              `已成功提醒 ${targetFriend}！\n(已消耗一枚好寶寶徽章)`, 
              [{ text: '好的' }]
          );

      } catch (error) {
          console.error("傳送訊息失敗:", error);
          Alert.alert('傳送失敗', '伺服器忙線中或網路不穩，請稍後再試。');
      }
  };

  const handleCancel = () => {
    setModalVisible(false); 
  };

  const getDisplayStatus = (statusObj: FriendStatusAPIResponse): string => {
    if (statusObj.current_timer) return statusObj.current_timer;
    if (statusObj.is_studying) return 'studying';
    return 'relaxing';
  };
  
  const renderFriendItem = ({ item }: { item: FriendStatusAPIResponse }) => {
      const currentStatusDisplay = getDisplayStatus(item); 
      const isRelaxing = currentStatusDisplay === 'relaxing';

      return (
        <View style={[styles.row, styles.listItemMargin]}>
          <View style={[styles.fixedBox, styles.nameBox]}>
            <Text style={styles.nameText} numberOfLines={1}>
              {item.name} 
            </Text>
          </View>

          <View style={[styles.fixedBox, styles.statusBox]}>
            <Text style={styles.statusText} numberOfLines={1}>
              {currentStatusDisplay}
            </Text>
          </View>

          {isRelaxing && (
            <TouchableOpacity onPress={() => handleReminderPress(item.name, item.friend_id)}>
              <Text style={styles.emoji}>🔔</Text>
            </TouchableOpacity>
          )}
        </View>
      );
  }

  const renderEmptyComponent = () => {
    return (
      <View style={{ alignItems: 'center', marginTop: 20 }}>
        {isLoading ? (
            <>
              <ActivityIndicator size="small" color="#666" />
              <Text style={styles.loadingText}>好友列表載入中...</Text>
            </>
        ) : (
            <Text style={styles.loadingText}>
              {userId ? '你還沒有好友喔！' : '無法載入用戶資訊'}
            </Text>
        )}
      </View>
    );
  };

  return (
    <PageTemplate title="好友列表" selectedTab="friend">
      <ReminderModal 
          visible={modalVisible}
          friendName={targetFriend}
          onCancel={handleCancel}
          onSend={handleSend}
          message={message}
          setMessage={setMessage}
      />
      
      <FlatList
        data={friendsList}
        renderItem={renderFriendItem}
        keyExtractor={(item) => item.friend_id.toString()}
        contentContainerStyle={styles.listContentContainer} 
        ListEmptyComponent={renderEmptyComponent} 
      />
    </PageTemplate>
  );
}

const styles = StyleSheet.create({
  listContentContainer: {
    paddingHorizontal: 16,
    paddingTop: 10, 
    paddingBottom: 20,
  },
  loadingText: {
    textAlign: 'center',
    fontSize: 16,
    color: '#666',
    marginTop: 10,
  },
  listItemMargin: {
    marginBottom: 16, 
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 12,
    backgroundColor: '#e5e7eb',
  },
  fixedBox: {
    backgroundColor: '#d1d5db',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  nameBox: {
    width: 100,
    marginRight: 16,
  },
  statusBox: {
    width: 120,
    marginRight: 16,
  },
  nameText: {
    fontSize: 18,
    fontWeight: '500',
  },
  statusText: {
    fontSize: 16,
    fontStyle: 'italic',
  },
  emoji: {
    fontSize: 26,
  },
  // --- Modal Styles ---
  modalOverlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  modalContainer: {
    width: 300,
    padding: 20,
    backgroundColor: '#f0f8ff', 
    borderRadius: 10,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#ccc',
  },
  modalText: {
    fontSize: 16,
    marginBottom: 8,
    textAlign: 'center',
  },
  messageTitle: {
    marginTop: 15,
    marginBottom: 5,
    alignSelf: 'flex-start',
  },
  messageInput: {
    width: '100%',
    height: 40,
    borderColor: '#ccc',
    borderWidth: 1,
    borderRadius: 5,
    paddingHorizontal: 10,
    marginBottom: 20,
    backgroundColor: '#fff', 
    fontSize: 16,
  },
  buttonContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '100%',
    paddingHorizontal: 10,
  },
  modalButton: {
    flex: 1,
    paddingVertical: 8,
    borderRadius: 6,
    marginHorizontal: 5,
    alignItems: 'center',
  },
  cancelButton: {
    backgroundColor: '#f5caca', 
    borderColor: '#e79e9e',
    borderWidth: 1,
  },
  sendButton: {
    backgroundColor: '#fcfcd7', 
    borderColor: '#e7e7a3',
    borderWidth: 1,
  },
  buttonText: {
    fontSize: 16,
    fontWeight: 'bold',
  },
});