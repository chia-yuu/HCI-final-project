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
} from 'react-native';
import React, { useState, useEffect } from 'react';
import api from '../../api/api';

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

// 💡 刪除 UserData 介面，因為不再需要頭銜和徽章計數

const fetchFriendStatuses = async (friendIds: number[]): Promise<FriendStatusAPIResponse[]> => {
    
    const idsString = friendIds.join(',');
    
    try {
        const response = await api.get("/api/v1/friends/status", {
          params: { ids: idsString }
        });
        const data = response.data;
        
        if (!Array.isArray(data)) {
             console.error("API 返回的資料格式不正確 (不是陣列)。");
             throw new Error("API 返回的資料格式不正確。");
        }
        
        const validatedData = data.map((item: any) => ({
            friend_id: item.friend_id,
            name: item.name || 'Unknown Friend', 
            is_studying: item.is_studying,
            current_timer: item.current_timer,
        })) as FriendStatusAPIResponse[];

        return validatedData;

    } catch (error) {
        console.error("[API 錯誤] 處理好友狀態 API 失敗:", error);
        return []; 
    }
};


export default function FriendListScreen() {
  const hardcodedFriendIds = [10, 11, 12, 13, 14, 15]; 
  
  const [friendsList, setFriendsList] = useState<FriendStatusAPIResponse[]>([]);
  
  // 💡 刪除 userData 和相關狀態
  
  useEffect(() => {
    const loadStatuses = async () => {
      try {
        const apiData = await fetchFriendStatuses(hardcodedFriendIds); 
        setFriendsList(apiData); 
      } catch (error) {
        console.error("主要狀態載入流程發生錯誤:", error);
      }
    };

    loadStatuses();
  }, []); 

  const [modalVisible, setModalVisible] = useState(false);
  const [targetFriend, setTargetFriend] = useState('');
  const [targetFriendId, setTargetFriendId] = useState<number | null>(null); 
  const [message, setMessage] = useState(''); 

  // 💡 刪除 handleTitleSelect 函式
  
  const handleReminderPress = (friendName: string, friendId: number) => {
    setTargetFriend(friendName);
    setTargetFriendId(friendId);
    setModalVisible(true);
    setMessage(''); 
  };

  const handleSend = () => {
    if (message.trim().length > 0) { 
        console.log(`Sending reminder to ID: ${targetFriendId} via API with message: "${message}"`);
        
        setModalVisible(false); 
        
        Alert.alert('傳送成功 🎉', `已成功提醒 ${targetFriend}！ (ID: ${targetFriendId})`, [{ text: '好的' }]);
        
    } else {
        Alert.alert('提示', '請輸入傳送訊息！'); 
    }
  };

  const handleCancel = () => {
    setModalVisible(false); 
  };

  const getDisplayStatus = (statusObj: FriendStatusAPIResponse): string => {
    if (statusObj.current_timer) { 
        return statusObj.current_timer; 
    } else if (statusObj.is_studying) {
        return 'studying';
    } else {
        return 'relaxing';
    }
  };
  
  const renderFriendItem = ({ item }: { item: FriendStatusAPIResponse }) => {
      const currentStatusDisplay = getDisplayStatus(item); 
      const isRelaxing = currentStatusDisplay === 'relaxing';

      return (
        <View
          key={item.friend_id} 
          style={[
            styles.row,
            styles.listItemMargin, 
          ]}
        >
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

  return (
    // 💡 標題保持在 PageTemplate 上方
    <PageTemplate title="好友列表" selectedTab="friend">
      <ReminderModal 
          visible={modalVisible}
          friendName={targetFriend}
          onCancel={handleCancel}
          onSend={handleSend}
          message={message}
          setMessage={setMessage}
      />
      
      {/* 💡 移除頂部 Bar 容器 <View style={styles.topBarContainer}> */}

      {/* 列表內容開始：使用 FlatList 實現捲動 */}
      <FlatList
        data={friendsList}
        renderItem={renderFriendItem}
        keyExtractor={(item) => item.friend_id.toString()}
        // 💡 調整 contentContainerStyle
        contentContainerStyle={styles.listContentContainer} 
        ListEmptyComponent={() => (
          <Text style={styles.loadingText}>好友列表載入中...</Text>
        )}
      />
    </PageTemplate>
  );
}

const styles = StyleSheet.create({
  // 💡 刪除所有頂部 Bar 樣式 (topBarContainer, iconButton, titleContainer, badgeContainer 等)

  // --- 列表內容樣式 (為 FlatList 調整) ---
  listContentContainer: {
    paddingHorizontal: 16,
    paddingTop: 0, // 💡 設為 0，讓列表緊貼 PageTemplate 內容區的頂部
    paddingBottom: 20,
  },
  loadingText: {
    textAlign: 'center',
    fontSize: 16,
    color: '#666',
    marginTop: 20,
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

  // --- Modal 相關樣式 (保持不變) ---
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
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5,
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