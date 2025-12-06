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

interface UserData {
  title: string;
  badgeCount: number;
}

const fetchFriendStatuses = async (friendIds: number[]): Promise<FriendStatusAPIResponse[]> => {
    
    const idsString = friendIds.join(',');
    
    try {
        // console.log(`[API 呼叫] 請求網址: ${API_URL}`);
        
        const response = await api.get("/api/v1/friends/status", {
          params: { ids: idsString }
        });
        const data = response.data;
        
        // console.log("[API 檢查] 從後端接收到的好友狀態資料:");
        // console.log(data); 
        
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
  
  const [userData, setUserData] = useState<UserData>({
    title: '專注新人', 
    badgeCount: 16,     
  });
  
  const [isDropdownVisible, setIsDropdownVisible] = useState(false);

  const dropdownOptions = [
    '專注新人',
    '學習狂人',
    '時間管理大師',
  ];

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

  const handleTitleSelect = (newTitle: string) => {
    setUserData({ ...userData, title: newTitle });
    setIsDropdownVisible(false);
  };
  
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
      
      {/* 頂部 Bar 容器 */}
      <View style={styles.topBarContainer}>
        
        {/* 左側：加好友按鈕 */}
        <TouchableOpacity 
          style={styles.iconButton}
          onPress={() => Alert.alert('加好友', '點擊了加好友圖標！')}
        >
          <Text style={styles.iconText}>👤+</Text> 
        </TouchableOpacity>
        
        {/* 中間：頭銜/可下拉選單 */}
        <View style={styles.titleContainer}>
          <Text style={styles.titleText}>title:</Text>
          <TouchableOpacity 
            onPress={() => setIsDropdownVisible(!isDropdownVisible)}
            style={styles.dropdownToggle}
          >
            <Text style={styles.titleTextBold}>{userData.title}</Text>
            <Text style={styles.dropdownArrow}> ▼</Text> 
          </TouchableOpacity>
          
          {/* 渲染下拉選單 */}
          {isDropdownVisible && (
            <View style={styles.dropdownMenu}>
              {dropdownOptions.map((title, index) => (
                <TouchableOpacity
                  key={index}
                  style={styles.dropdownItem}
                  onPress={() => handleTitleSelect(title)}
                >
                  <Text style={styles.dropdownItemText}>{title}</Text>
                </TouchableOpacity>
              ))}
            </View>
          )}
        </View>

        {/* 右側：好寶寶徽章 */}
        <View style={styles.badgeContainer}>
          <Text style={styles.badgeIcon}>🏅</Text> 
          <Text style={styles.badgeCount}>X{userData.badgeCount}</Text>
        </View>
        
      </View>

      {/* 列表內容開始 (已調整位置) */}
      <View style={styles.container}>
        {friendsList.length === 0 && <Text style={styles.loadingText}>好友列表載入中...</Text>}
        {friendsList.map((f) => {
          
          const currentStatusDisplay = getDisplayStatus(f); 
          const isRelaxing = currentStatusDisplay === 'relaxing';

          return (
            <View
              key={f.friend_id} 
              style={[
                styles.row,
              ]}
            >
              <View style={[styles.fixedBox, styles.nameBox]}>
                <Text style={styles.nameText} numberOfLines={1}>
                  {f.name} 
                </Text>
              </View>

              <View style={[styles.fixedBox, styles.statusBox]}>
                <Text style={styles.statusText} numberOfLines={1}>
                  {currentStatusDisplay}
                </Text>
              </View>

              {isRelaxing && (
                <TouchableOpacity onPress={() => handleReminderPress(f.name, f.friend_id)}>
                  <Text style={styles.emoji}>🔔</Text>
                </TouchableOpacity>
              )}
            </View>
          );
        })}
      </View>
    </PageTemplate>
  );
}

const styles = StyleSheet.create({
  // 💡 頂部 Bar 樣式
  topBarContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between', 
    alignItems: 'center',
    width: '100%',
    paddingHorizontal: 16,
    paddingVertical: 10, 
    backgroundColor: '#fff', 
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  
  iconButton: {
    width: 45,
    height: 45,
    borderRadius: 18,
    backgroundColor: '#d1d5db',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 10,
    borderWidth: 1,
    borderColor: '#000',
    transform: [{ translateY: 2 }],
  },
  iconText: {
    fontSize: 25,
    color: '#000',
    transform: [{ translateY: 6}],
  },
  
  titleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    position: 'relative', 
    flex: 1, 
    paddingVertical: 4,
    paddingHorizontal: 8,
    backgroundColor: '#d1d5db', 
    borderRadius: 18,
    borderWidth: 1,
    borderColor: '#000',
  },
  titleText: {
    fontSize: 16,
    color: '#333',
  },
  titleTextBold: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  dropdownToggle: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 5,
  },
  dropdownArrow: {
    fontSize: 12,
    marginLeft: 3,
  },

  dropdownMenu: {
    position: 'absolute',
    top: 35, 
    left: 40,
    backgroundColor: '#fff',
    borderRadius: 5,
    borderWidth: 1,
    borderColor: '#ccc',
    zIndex: 10,
    minWidth: 150,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 5,
  },
  dropdownItem: {
    padding: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  dropdownItemText: {
    fontSize: 16,
    color: '#333',
  },

  badgeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginLeft: 10,
    paddingVertical: 4,
    paddingHorizontal: 8,
    backgroundColor: '#d1d5db', 
    borderRadius: 18,
    borderWidth: 1,
    borderColor: '#000',
  },
  badgeIcon: {
    fontSize: 20,
    marginRight: 5,
  },
  badgeCount: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#000',
  },

  // --- 列表內容樣式 (已修改: marginTop: 0) ---
  container: {
    marginTop: 70, // <--- 讓清單緊貼在 TopBar 下方
    width: '100%',
    paddingHorizontal: 16,
    gap: 16,
  },
  loadingText: {
    textAlign: 'center',
    fontSize: 16,
    color: '#666',
    marginTop: 20,
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