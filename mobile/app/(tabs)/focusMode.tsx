import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Modal, ScrollView } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import PageTemplate from '@/components/page-template';
import { useFocus } from '../../context/FocusContext';
import api from '../../api/api';
import { router } from 'expo-router';
import { useUser } from '../../context/UserContext';

interface TodoItem {
  id: number;
  thing: string;
  is_done: boolean;
  deadline_date?: string;
}

export default function FocusModeScreen() {
  const { isFocusing, seconds, startFocus, stopFocus } = useFocus();
  const [deadlines, setDeadlines] = useState<TodoItem[]>([]);
  
  // modalType: 'pause' (休息) | 'end' (結束)
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [modalType, setModalType] = useState<'pause' | 'end'>('pause');
  const { userId } = useUser();
  useFocusEffect(
    React.useCallback(() => {
      fetchDeadlines();
    }, [userId])
  );

  const fetchDeadlines = async () => {
    if (userId === null) return;
  try {
      const response = await api.get('/deadlines', {
        params: { user_id: userId } //修正：傳遞 user_id 參數
      });
      const todos = response.data.filter((item: TodoItem) => !item.is_done).slice(0, 3);
      setDeadlines(todos);
    } catch (error) {
      console.error("抓不到清單TAT", error);
    }
  };

  const formatTime = (totalSeconds: number) => {
    const hours = Math.floor(totalSeconds / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const secs = totalSeconds % 60;
    return `${hours.toString().padStart(2, '0')} : ${minutes.toString().padStart(2, '0')} : ${secs.toString().padStart(2, '0')}`;
  };

  // === 按鈕的部分 ===
  
  // 按下"休息"
  const handleRestPress = () => {
    setModalType('pause'); // 設為休息模式
    setShowConfirmModal(true);
  };

  // 按下"結束"
  const handleEndPress = () => {
    setModalType('end'); // 設為結束模式
    setShowConfirmModal(true);
  };

  // 決定繼續專注-> 關閉通知
  const handleContinueFocus = () => setShowConfirmModal(false);

  // 確認要走了 
  // const handleConfirmAction = () => {
  //   setShowConfirmModal(false);
  //   stopFocus(modalType); 
  // };
const handleConfirmAction = async () => { // 💡 必須改為 async
  setShowConfirmModal(false);

  // 1. 停止計時並儲存數據 (假設 stopFocus 會回傳 true/false)
  const savedSuccessfully = await stopFocus(modalType); 

  // 2. 只有在按下「結束」並儲存成功時才導航到相機
  if (modalType === 'end' && savedSuccessfully) {
    // 💡 導航到相機畫面
    router.push('/CameraScreen'); 
  }
  
  // 3. 如果是「休息」，則回到主頁或停留在這裡
  // 如果是暫停，且數據未成功儲存，則可能要給予錯誤提示
};
 
  return (
    <PageTemplate title="專注模式" selectedTab="focus">
      <ScrollView contentContainerStyle={styles.container}>
        
        {!isFocusing ? (
          // ===init的畫面 ===
          <View style={styles.centerContent}>
            <View style={styles.circle}>
                <Text style={styles.mainTitle}>開始專注!</Text>
            </View>
            <TouchableOpacity style={styles.startButton} onPress={startFocus}>
              <Text style={styles.startButtonText}>開始</Text>
            </TouchableOpacity>

            {/* 待辦事項列表 (準備畫面) */}
            <View style={styles.deadlineBox}>
                <Text style={styles.deadlineTitle}>待辦事項提醒：</Text>
                {deadlines.length === 0 ? <Text style={{color:'#999'}}>暫無待辦事項</Text> : 
                  deadlines.map(item => (
                    <Text key={item.id} style={styles.deadlineText}>☐ {item.thing}</Text>
                  ))
                }
            </View>
          </View>
        ) : (
          // === 計時中的畫面 ===
          <View style={styles.centerContent}>
            <View style={styles.circle}>
                <Text style={styles.timerLabel}>持續專注時間:</Text>
                <Text style={styles.timerText}>{formatTime(seconds)}</Text>
            </View>
            
            <View style={styles.buttonGroup}>
                <TouchableOpacity style={styles.actionButton} onPress={handleEndPress}>
                    <Text style={styles.actionText}>📷 結束</Text>
                </TouchableOpacity>
                <View style={{width: 20}} />
                <TouchableOpacity style={styles.actionButton} onPress={handleRestPress}>
                    <Text style={styles.actionText}>☕ 休息</Text>
                </TouchableOpacity>
            </View>

            <View style={styles.deadlineBox}>
                <Text style={styles.deadlineTitle}>待辦事項：</Text>
                {deadlines.length === 0 ? <Text style={{color:'#999'}}>暫無待辦事項</Text> : 
                  deadlines.map(item => (
                    <Text key={item.id} style={styles.deadlineText}>☐ {item.thing}</Text>
                  ))
                }
            </View>
          </View>
        )}

        {/* 不同通知 */}
        <Modal transparent={true} visible={showConfirmModal} animationType="fade">
          <View style={styles.modalOverlay}>
            <View style={styles.modalContent}>
              {/* 標題根據模式改變 */}
              <Text style={styles.modalTitle}>
                {modalType === 'pause' ? '確認暫停專注?' : '確認結束專注?'}
              </Text>
              
              <Text style={styles.modalDesc}>
                 {modalType === 'pause' 
                    ? `若再專注 ${Math.max(0, 60 - Math.floor(seconds/60))} 分鐘\n可以獲得一枚好寶寶徽章喔 👍`
                    : '結束後將停止累積好寶寶徽章進度\n確定要收工了嗎？'
                 }
              </Text>

              <View style={styles.modalButtons}>
                {/* 左下選擇 */}
                <TouchableOpacity 
                    style={[styles.modalButton, {backgroundColor: '#415a77'}]} 
                    onPress={handleConfirmAction}
                >
                    <Text style={styles.btnText}>
                        {modalType === 'pause' ? '暫停並存檔' : '結束並存檔'}
                    </Text>
                </TouchableOpacity>

                {/* 右下選擇 */}
                <TouchableOpacity 
                    style={[styles.modalButton, {backgroundColor: '#e0fbfc'}]} 
                    onPress={handleContinueFocus}
                >
                    <Text style={styles.btnText}>繼續專注</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </Modal>

      </ScrollView>
    </PageTemplate>
  );
}

const styles = StyleSheet.create({
  container: { flexGrow: 1, padding: 20, alignItems: 'center' },
  centerContent: { alignItems: 'center', width: '100%', marginTop: 20 },
  circle: { width: 250, height: 250, borderRadius: 125, borderWidth: 4, borderColor: '#5c6b73', justifyContent: 'center', alignItems: 'center', marginBottom: 30, backgroundColor: '#5c6b73' },
  mainTitle: { fontSize: 24, fontWeight: 'bold', color:'#0D1B2A' },
  timerLabel: { fontSize: 16, color:'#0D1B2A', marginBottom: 5 },
  timerText: { fontSize: 40, fontWeight: 'bold', fontVariant: ['tabular-nums'], color:'#0D1B2A' },
  startButton: { backgroundColor: '#778da9', paddingVertical: 15, paddingHorizontal: 80, borderRadius: 30, marginBottom: 30 },
  startButtonText: { fontSize: 24, fontWeight: 'bold' , color:'#0D1B2A'},
  buttonGroup: { flexDirection: 'row', marginBottom: 30 },
  actionButton: { backgroundColor: '#778da9', paddingVertical: 15, paddingHorizontal: 20, borderRadius: 10, minWidth: 100, alignItems: 'center' },
  actionText: { fontWeight: 'bold', color:'#0D1B2A' },
  deadlineBox: { borderWidth: 2, borderColor: '#415a77', width: '100%', padding: 15, borderRadius: 0, marginTop: 10 },
  deadlineTitle: { fontWeight: 'bold', marginBottom: 5 , color:'#0D1B2A'},
  deadlineText: { fontSize: 16, marginVertical: 2 , color:'#0D1B2A'},
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', alignItems: 'center' },
  modalContent: { width: '80%', backgroundColor: '#809bb9ff', padding: 25, borderRadius: 10, alignItems: 'center', borderWidth: 1, borderColor: '#ccc' },
  modalTitle: { fontSize: 18, fontWeight: 'bold', marginBottom: 10 , color:'#0D1B2A'},
  modalDesc: { textAlign: 'center', marginBottom: 20, lineHeight: 22 },
  modalButtons: { flexDirection: 'row', justifyContent: 'space-between', width: '100%' },
  modalButton: { padding: 12, borderRadius: 5, width: '45 %', alignItems: 'center', borderWidth: 1, borderColor: '#999' },
  btnText: { fontWeight: 'bold', fontSize: 14 }
});