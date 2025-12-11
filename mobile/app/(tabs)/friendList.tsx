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
import * as Notifications from 'expo-notifications';

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowBanner: true,
    shouldShowList: true,
    shouldPlaySound: true,
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
    const response = await api.get(`/api/v1/new-friends/${userId}`);
    const data = response.data;
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
    const response = await api.get("/api/v1/friends/status", {
      params: { ids: idsString }
    });
    const data = response.data;
    
    if (!Array.isArray(data)) {
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

  // [修改 1] 新增狀態：自己是否正在讀書
  const [isUserStudying, setIsUserStudying] = useState(false);

  // [修改 2] 抓取自己資訊的函式 (更名為 fetchMyInfo 比較貼切)
  // 假設後端 /api/v1/user/record_status 回傳結構包含 { badge_count: number, is_studying: boolean }
  const fetchMyInfo = async () => {
    if (!userId) return;
    try {
      const response = await api.get(`/api/v1/user/record_status?user_id=${userId}`);
      
      // 設定徽章
      setMyBadgeCount(response.data.badge_count);
      
      // 設定讀書狀態 (如果後端回傳欄位名稱不同，請在此調整，例如 response.data.status === 'studying')
      setIsUserStudying(response.data.is_studying); 
      
      console.log(`[User Status] 徽章: ${response.data.badge_count}, 讀書中: ${response.data.is_studying}`);
    } catch (error) {
      console.error("無法取得使用者資訊:", error);
    }
  };

  useEffect(() => {
    let isMounted = true; 

    const loadStatuses = async () => {
      if (!userId) {
        if (isMounted) setIsLoading(false);
        return;
      }

      if (isMounted) setIsLoading(true);

      try {
        // 1. 抓好友狀態
        const friendIds = await fetchFriendIds(userId);
        if (friendIds.length > 0) {
           const apiData = await fetchFriendStatuses(friendIds);
           if (isMounted) setFriendsList(apiData);
        } else {
           if (isMounted) setFriendsList([]);
        }
      } catch (error) {
        console.error("載入流程錯誤:", error);
      } finally {
        if (isMounted) setIsLoading(false);
      }
      
      // 2. 載入自己的資訊 (徽章 + 讀書狀態)
      await fetchMyInfo();
    };

    loadStatuses();

    return () => { isMounted = false; };
  }, [userId]); 

  const [modalVisible, setModalVisible] = useState(false);
  const [targetFriend, setTargetFriend] = useState('');
  const [targetFriendId, setTargetFriendId] = useState<number | null>(null); 
  const [message, setMessage] = useState(''); 
  
  const handleReminderPress = (friendName: string, friendId: number) => {
    if (myBadgeCount < 1) {
        Alert.alert(
            "徽章不足 😱", 
            "你需要至少一枚好寶寶徽章才能傳送訊息！\n快去專注賺取徽章吧～",
            [{ text: "好，我去努力" }]
        );
        return; 
    }

    setTargetFriend(friendName);
    setTargetFriendId(friendId);
    setModalVisible(true);
    setMessage(''); 
  };

  const handleSend = async () => {
      if (message.trim().length === 0) {
          Alert.alert('提示', '請輸入傳送訊息！');
          return;
      }
      if (!userId || !targetFriendId) {
          Alert.alert('錯誤', '系統錯誤：無法識別用戶或好友 ID');
          return;
      }

      try {
          // 呼叫後端 API
          await api.post('/api/v1/messages', {
              sender_id: userId,
              receiver_id: targetFriendId,
              content: message
          });

          setModalVisible(false); 
          setMessage(''); 
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
      const isFriendRelaxing = currentStatusDisplay === 'relaxing';

      // [修改 3] 按鈕顯示邏輯：好友在休息 AND 我自己"不是"在讀書
      // 如果 isUserStudying 為 true，則 showButton 為 false
      const showButton = isFriendRelaxing && !isUserStudying;

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

          {/* 只有在 showButton 為真時才渲染 */}
          {showButton && (
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