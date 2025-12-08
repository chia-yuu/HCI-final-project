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
import { useUser } from '../../context/UserContext';

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
 * 取得當前用戶的好友 ID 列表。
 * @param userId 當前用戶 ID。
 * @returns 包含好友 ID (number) 的列表，失敗則返回空列表。
 */
const fetchFriendIds = async (userId: number | null): Promise<number[]> => {
 if (userId === null) return [];
 try {
  const response = await api.get(`/api/v1/new-friends/${userId}`);
  const data = response.data;
  
  // 檢查後端返回的結構是否符合預期：{ user_id: number, friend_ids: number[] }
  if (data && Array.isArray(data.friend_ids)) {
   return data.friend_ids as number[];
  }
    
    // ⚠️ 優化: 處理 API 返回成功但數據結構不對的情況
    if (data) {
        console.warn(`[API Warning] fetchFriendIds for user ${userId} returned unexpected data structure:`, data);
    }

  return [];
 } catch (error) {
  console.error("fetchFriendIds 發生錯誤:", error);
  return []; 
 }
}

/**
 * 根據好友 ID 列表，獲取每個好友的狀態資訊。
 */
const fetchFriendStatuses = async (friendIds: number[]): Promise<FriendStatusAPIResponse[]> => {
  
  if (friendIds.length === 0) return [];

  const idsString = friendIds.join(',');
    
  try {
    const response = await api.get("/api/v1/friends/status", {
     params: { ids: idsString }
    });
    const data = response.data;
    
    // 檢查是否為陣列，這是最常見的 API 返回資料結構檢查
    if (!Array.isArray(data)) {
      console.error("[API 錯誤] 好友狀態 API 返回的資料格式不正確 (不是陣列)。");
      return []; // 返回空列表，而不是拋出錯誤
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
 const { userId } = useUser(); 
 
 const [friendsList, setFriendsList] = useState<FriendStatusAPIResponse[]>([]);
 
 // 使用一個 state 來追蹤是否仍在載入好友列表
 const [isLoading, setIsLoading] = useState(true);

 useEffect(() => {
  const loadStatuses = async () => {
        setIsLoading(true); // 開始載入
   if (userId === null) {
            setIsLoading(false);
            return; 
        }
   
   try {
    // 步驟 1: 取得好友 ID 列表
    const friendIds = await fetchFriendIds(userId);
    
    // 步驟 2: 使用取得的 ID 列表獲取好友狀態
    const apiData = await fetchFriendStatuses(friendIds); 
    setFriendsList(apiData); 
   } catch (error) {
    console.error("主要狀態載入流程發生錯誤:", error);
    setFriendsList([]); // 載入失敗時清空列表
   } finally {
          setIsLoading(false); // 結束載入
      }
  };

  loadStatuses();
 }, [userId]); 

 const [modalVisible, setModalVisible] = useState(false);
 const [targetFriend, setTargetFriend] = useState('');
 const [targetFriendId, setTargetFriendId] = useState<number | null>(null); 
 const [message, setMessage] = useState(''); 
 
 const handleReminderPress = (friendName: string, friendId: number) => {
  setTargetFriend(friendName);
  setTargetFriendId(friendId);
  setModalVisible(true);
  setMessage(''); 
 };

 const handleSend = () => {
  if (message.trim().length > 0) { 
    console.log(`Sending reminder to ID: ${targetFriendId} via API with message: "${message}". Current UserID: ${userId}`);
    
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
    ListEmptyComponent={() => (
     <Text style={styles.loadingText}>
      {isLoading 
              ? '好友列表載入中...' 
              : userId === null 
                ? '無法載入用戶資訊，請重新登入。' 
                : friendsList.length === 0 
                  ? '你還沒有好友喔！' 
                  : '好友列表載入中...'}
     </Text>
    )}
   />
  </PageTemplate>
 );
}

const styles = StyleSheet.create({
 // --- 列表內容樣式 (為 FlatList 調整) ---
 listContentContainer: {
  paddingHorizontal: 16,
  paddingTop: 0, 
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