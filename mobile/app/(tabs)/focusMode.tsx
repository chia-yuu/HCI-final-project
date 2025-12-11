import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Modal, ScrollView } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { Audio } from 'expo-av'; // [新增] 音樂套件
import { Ionicons } from '@expo/vector-icons'; // [新增] 圖標
import { useRouter } from 'expo-router';
import PageTemplate from '@/components/page-template';
import { useFocus } from '../../context/FocusContext';
import api from '../../api/api';
import { useUser } from '../../context/UserContext';

interface TodoItem {
  id: number;
  thing: string;
  is_done: boolean;
  deadline_date?: string;
}

export default function FocusModeScreen() {
  const router = useRouter();
  const { isFocusing, seconds, startFocus, stopFocus } = useFocus();
  const { userId } = useUser();
  
  const [deadlines, setDeadlines] = useState<TodoItem[]>([]);
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [modalType, setModalType] = useState<'pause' | 'end'>('pause');

  const [sound, setSound] = useState<Audio.Sound | null>(null);
  const [isPlayingMusic, setIsPlayingMusic] = useState(false);

  useFocusEffect(
    React.useCallback(() => {
      fetchDeadlines();
    }, [userId])
  );

  useEffect(() => {
    return sound
      ? () => {
          sound.unloadAsync();
        }
      : undefined;
  }, [sound]);

  // [新增] 播放/暫停白噪音邏輯
  const toggleMusic = async () => {
    try {
      if (sound) {
        if (isPlayingMusic) {
          await sound.pauseAsync();
          setIsPlayingMusic(false);
        } else {
          await sound.playAsync();
          setIsPlayingMusic(true);
        }
      } else {
        // 播音樂
        const { sound: newSound } = await Audio.Sound.createAsync(
          { uri: 'https://www.soundjay.com/nature/rain-01.mp3' }, 
          { shouldPlay: true, isLooping: true }
        );
        setSound(newSound);
        setIsPlayingMusic(true);
      }
    } catch (error) {
      console.error("播放失敗:", error);
    }
  };

  const fetchDeadlines = async () => {
    if (userId === null) return;
    try {
      const response = await api.get('/deadlines', {
        params: { user_id: userId } 
      });
      const todos = response.data.filter((item: TodoItem) => !item.is_done);
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

  const handleRestPress = () => {
    setModalType('pause');
    setShowConfirmModal(true);
  };

  const handleEndPress = () => {
    setModalType('end');
    setShowConfirmModal(true);
  };

  const handleContinueFocus = () => setShowConfirmModal(false);

  const handleConfirmAction = () => {
    setShowConfirmModal(false);
    router.push({
        pathname: "/camera",
        params: { mode: modalType }
    });
  };

  return (
    <PageTemplate title="專注模式" selectedTab="focus">
      
      {/* [新增] 音樂按鈕 (放在 ScrollView 外面或裡面都可以，這裡放在裡面並用絕對定位固定在右上) */}
      <View style={{zIndex: 10, elevation: 10}}> 
          <TouchableOpacity 
            style={[styles.musicButton, isPlayingMusic && styles.musicButtonActive]} 
            onPress={toggleMusic}
          >
            <Ionicons 
                name={isPlayingMusic ? "musical-notes" : "musical-notes-outline"} 
                size={24} 
                color={isPlayingMusic ? "#fff" : "#0D1B2A"} 
            />
          </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={styles.container}>
        
        {!isFocusing ? (
          // === 準備畫面 ===
          <View style={styles.centerContent}>
            <View style={styles.circle}>
                <Text style={styles.mainTitle}>開始專注!</Text>
            </View>
            <TouchableOpacity style={styles.startButton} onPress={startFocus}>
              <Text style={styles.startButtonText}>開始</Text>
            </TouchableOpacity>

            <View style={styles.deadlineBox}>
                <Text style={styles.deadlineTitle}>💡 待辦事項</Text>
                {deadlines.length === 0 ? <Text style={{color:'#999'}}>去任務清單選擇現在要做的事項吧！</Text> : 
                  deadlines.map(item => (
                    <Text key={item.id} style={styles.deadlineText}>⏳ {item.deadline_date ? `${item.deadline_date} ` : ''}{item.thing}</Text>
                  ))
                }
            </View>
          </View>
        ) : (
          // === 計時中畫面 ===
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
                <Text style={styles.deadlineTitle}>▶️ 進行中：</Text>
                {deadlines.length === 0 ? <Text style={{color:'#999'}}>去任務清單選擇現在要做的事項吧！</Text> : 
                  deadlines.map(item => (
                    <Text key={item.id} style={styles.deadlineText}>⏳ {item.deadline_date ? `${item.deadline_date} ` : ''}{item.thing}</Text>
                  ))
                }
            </View>
          </View>
        )}

        {/* Modal */}
        <Modal transparent={true} visible={showConfirmModal} animationType="fade">
          <View style={styles.modalOverlay}>
            <View style={styles.modalContent}>
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
                <TouchableOpacity 
                    style={[styles.modalButton, {backgroundColor: '#415a77'}]} 
                    onPress={handleConfirmAction}
                >
                    <Text style={styles.btnText}>
                        {modalType === 'pause' ? '暫停並存檔' : '結束並存檔'}
                    </Text>
                </TouchableOpacity>

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
  
  musicButton: {
    position: 'absolute',
    top: 10,
    right: 100, 
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#fff',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#ddd',
    elevation: 5, // Android 陰影
    shadowColor: '#000', // iOS 陰影
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 3,
  },
  // [新增] 播放時的樣式 (變色)
  musicButtonActive: {
    backgroundColor: '#415a77',
    borderColor: '#415a77',
  },

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