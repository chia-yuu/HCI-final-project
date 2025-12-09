import React, { useState, useEffect } from 'react'; 
import { ScrollView, View, Image, Dimensions, TouchableOpacity, Modal, Alert, StyleSheet, RefreshControl } from 'react-native'; 
import PageTemplate from '@/components/page-template';
import { ThemedText } from '@/components/themed-text';
import { LineChart, BarChart } from 'react-native-chart-kit';
import api from '../../api/api'; // ⭐ 引入 API
import { useFocusEffect } from '@react-navigation/native'; 
import { useUser } from '../../context/UserContext';

// ----------------------------------------------------
// ⭐ 後端 API 資料介面
// ----------------------------------------------------
interface UserRecordStatus {
  title_name: string;
  badge_count: number;
}

// [新增] 照片資料介面
interface PhotoItem {
  id: number;
  uri: string;
  description?: string;
}
// ----------------------------------------------------

// 假設的稱號資料
const AVAILABLE_TITLES = [
  { id: 'novice', name: '專注新人' },
  { id: 'expert', name: '閱讀專家' },
  { id: 'master', name: '時光大師' },
];

// ⭐ 顏色定義
const PRIMARY_TEXT_COLOR = '#0D1B2A';
const PAGE_BACKGROUND_COLOR = '#E0E1DD'; 
const BAR_BACKGROUND_COLOR = '#d1d5db'; 

// ----------------------------------------------------
// ⭐ 模擬資料 (MOCK DATA)
// ----------------------------------------------------
const MOCK_STATUS_DATA = {
    titleName: AVAILABLE_TITLES[1].name, 
    badgeCount: 15, 
};

const MOCK_WEEKLY_DATA = {
    labels: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'],
    data: [6.5, 4.8, 7.5, 8.5, 5.0, 6.5, 7.0], 
};
// ----------------------------------------------------

export default function MyRecordScreen() {
  const { userId } = useUser(); // 取得動態 User ID
  const screenWidth = Dimensions.get('window').width;
  const chartWidth = screenWidth - 40; 
  
  // [新增] 計算照片寬度 (一排三張，扣掉 padding)
  const imageSize = (screenWidth - 60) / 3;

  // ⭐ 1. 狀態
  const [titleName, setTitleName] = useState(MOCK_STATUS_DATA.titleName); 
  const [badgeCount, setBadgeCount] = useState(MOCK_STATUS_DATA.badgeCount); 
  const [isTitleMenuVisible, setIsTitleMenuVisible] = useState(false);
  const [weeklyReadingData, setWeeklyReadingData] = useState({
    labels: MOCK_WEEKLY_DATA.labels,
    datasets: [{ data: MOCK_WEEKLY_DATA.data }],
  });
  
  // [新增] 照片相關狀態
  const [photos, setPhotos] = useState<PhotoItem[]>([]);
  const [selectedPhoto, setSelectedPhoto] = useState<PhotoItem | null>(null);
  const [isPhotoModalVisible, setIsPhotoModalVisible] = useState(false);

  const [isLoading, setIsLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false); // 下拉更新用

  // ----------------------------------------------------
  // ⭐ 2. 資料獲取邏輯
  // ----------------------------------------------------
  useFocusEffect(
    React.useCallback(() => {
      fetchData();
    }, [userId]) 
  );

  const fetchData = async () => {
    // 如果不是下拉更新，才顯示全屏 Loading
    if (!refreshing) setIsLoading(true);

    const currentUserId = userId || 1; // 防呆

    try {
        // 1. 抓取稱號徽章
        const statusResponse = await api.get<UserRecordStatus>(`/api/v1/user/record_status?user_id=${currentUserId}`);
        console.log("API 成功回傳資料:", statusResponse.data);
        setTitleName(statusResponse.data.title_name);
        setBadgeCount(statusResponse.data.badge_count);

    } catch (error) {
      // console.error("API 呼叫失敗，使用模擬資料:", error);
      setTitleName(MOCK_STATUS_DATA.titleName);
      setBadgeCount(MOCK_STATUS_DATA.badgeCount);
    }
    
    // [新增] 2. 抓取照片列表
    try {
        const picturesResponse = await api.get(`/pictures?user_id=${currentUserId}`);
        if (picturesResponse.data) {
            setPhotos(picturesResponse.data);
        }
    } catch (error) {
        console.error("抓取照片失敗:", error);
    }

    // 3. 抓取週資料 (保持模擬)
    try {
        const chartColors = [
          (opacity = 1) => `rgba(0, 150, 136, ${opacity})`, 
          (opacity = 1) => `rgba(255, 87, 34, ${opacity})`, 
          (opacity = 1) => `rgba(103, 58, 183, ${opacity})`, 
          (opacity = 1) => `rgba(76, 175, 80, ${opacity})`, 
          (opacity = 1) => `rgba(255, 193, 7, ${opacity})`, 
          (opacity = 1) => `rgba(121, 85, 72, ${opacity})`, 
          (opacity = 1) => `rgba(244, 67, 54, ${opacity})`, 
        ];

        setWeeklyReadingData({
          labels: MOCK_WEEKLY_DATA.labels,
          datasets: [{ 
            data: MOCK_WEEKLY_DATA.data,
            colors: chartColors.slice(0, MOCK_WEEKLY_DATA.data.length),
          }],
        });
    } catch (error) {
        console.error("Error fetching weekly data:", error);
    } finally {
      setIsLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    fetchData();
  };
  
  // 稱號選單點擊處理
  const selectTitle = (newTitle: string) => {
    setIsTitleMenuVisible(false); 
    Alert.alert("更換稱號", `稱號已更換為「${newTitle}」`);
    setTitleName(newTitle);
  };

  // [新增] 照片點擊處理
  const handlePhotoPress = (photo: PhotoItem) => {
    setSelectedPhoto(photo);
    setIsPhotoModalVisible(true);
  };

  const closePhotoModal = () => {
    setIsPhotoModalVisible(false);
    setSelectedPhoto(null);
  };

  const focusTimeData = { 
    labels: ['00:00', '03:00', '06:00', '09:00', '12:00', '15:00', '18:00', '21:00'],
    datasets: [{ data: [0.0, 0.0, 0.0, 1.0, 0.5, 1.0, 0.5, 0.0], color: (opacity = 1) => `rgba(0, 122, 255, ${opacity})`, strokeWidth: 1.5 }],
  };

  const commonChartConfig = { 
    backgroundColor: '#ffffff',
    backgroundGradientFrom: '#ffffff',
    backgroundGradientTo: '#ffffff',
    decimalPlaces: 1,
    color: (opacity = 1) => `rgba(13, 27, 42, ${opacity})`, 
    labelColor: (opacity = 1) => `rgba(13, 27, 42, ${opacity})`, 
    style: { borderRadius: 12 },
    paddingLeft: 0, 
  };

  if (isLoading && !refreshing) {
    return (
      <PageTemplate title="我的紀錄" selectedTab="record">
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: PAGE_BACKGROUND_COLOR }}>
          <ThemedText type="default" style={{ color: PRIMARY_TEXT_COLOR }}>載入數據中...</ThemedText>
        </View>
      </PageTemplate>
    );
  }

  return (
    <PageTemplate title="我的紀錄" selectedTab="record">
      <ScrollView 
        style={{ paddingHorizontal: 20, paddingBottom: 40, backgroundColor: PAGE_BACKGROUND_COLOR }}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
      >

        {/* 修正: 外層 Wrapper，整體向左移 50 單位 */}
        <View style={{ marginLeft: -50 }}>

          {/* Title & Badge */}
          <View style={styles.titleBadgeRow}> 
            <View style={styles.titleContainer}> 
              <ThemedText style={styles.titleText}>title:</ThemedText>
              <TouchableOpacity onPress={() => setIsTitleMenuVisible(!isTitleMenuVisible)} style={styles.dropdownToggle}>
                <ThemedText style={styles.titleTextBold}>{titleName}</ThemedText>
                <ThemedText style={styles.dropdownArrow}> ▼</ThemedText> 
              </TouchableOpacity>
              
              {isTitleMenuVisible && (
                <View style={styles.dropdownMenu}>
                  {AVAILABLE_TITLES.map((title) => (
                    <TouchableOpacity key={title.id} style={styles.dropdownItem} onPress={() => selectTitle(title.name)}>
                      <ThemedText style={styles.dropdownItemText}>{title.name}</ThemedText>
                    </TouchableOpacity>
                  ))}
                </View>
              )}
            </View>

            <View style={styles.badgeContainer}> 
              <ThemedText style={styles.badgeIcon}>🏅</ThemedText> 
              <ThemedText style={styles.badgeCount}>X{badgeCount}</ThemedText>
            </View>
          </View>

          {/* 每日專注時長 */}
          <ThemedText type="default" style={styles.sectionHeader}>每日專注時長</ThemedText>
          <View>
            <BarChart
              data={weeklyReadingData}
              width={chartWidth}
              height={180}              
              fromZero
              showValuesOnTopOfBars={false}
              withInnerLines={false}
              withCustomBarColorFromData={true}
              flatColor={true}
              chartConfig={{
                ...commonChartConfig,
                paddingLeft: 30, 
                color: (opacity = 1) => `rgba(13, 27, 42, ${opacity})`, 
                propsForBackgroundLines: { strokeDasharray: '' },
                paddingRight: 0,
                barPercentage: 0.8
              }}
              style={styles.chartStyle}
              showBarTops={false}
            />
          </View>

          {/* 專注時間 */}
          <ThemedText type="default" style={styles.sectionHeader}>專注時間</ThemedText>
          <View>
            <LineChart
              data={focusTimeData}
              width={chartWidth}
              height={160}  
              yAxisLabel=""
              chartConfig={{
                ...commonChartConfig,
                paddingLeft: 30, 
                color: (opacity = 1) => `rgba(0, 122, 255, ${opacity})`, 
                propsForDots: { r: '3' },
              }}
              bezier
              style={styles.chartStyle}
            />
          </View>

          {/* ---------------------------------------------------- */}
          {/* [修改] 今日回顧：改為顯示真實照片牆 */}
          {/* ---------------------------------------------------- */}
          <ThemedText type="default" style={styles.sectionHeader}>
            今日回顧 ({photos.length})
          </ThemedText>

          {/* 照片牆容器，marginLeft 30 為了對齊上面的圖表 */}
          <View style={[styles.photoGrid, { marginLeft: 30 }]}> 
            {photos.length === 0 ? (
               <View style={styles.emptyPhotoBox}>
                  <ThemedText type="default" style={{color: '#888'}}>還沒有照片喔，快去專注拍照吧！</ThemedText>
               </View>
            ) : (
               photos.map((photo) => (
                  <TouchableOpacity 
                      key={photo.id} 
                      onPress={() => handlePhotoPress(photo)}
                      style={{ marginBottom: 10 }}
                  >
                      <Image
                        source={{ uri: photo.uri }}
                        style={{ 
                          width: imageSize, 
                          height: imageSize, 
                          borderRadius: 8,
                          borderWidth: 1,
                          borderColor: '#ddd',
                          backgroundColor: '#ccc'
                        }}
                      />
                  </TouchableOpacity>
               ))
            )}
          </View>

        </View> 
      </ScrollView>

      {/* [新增] 照片詳細檢視 Modal */}
      <Modal animationType="fade" transparent={true} visible={isPhotoModalVisible} onRequestClose={closePhotoModal}>
        <View style={styles.photoModalOverlay}>
            <View style={styles.photoModalContent}>
                {selectedPhoto && (
                    <>
                        <Image source={{ uri: selectedPhoto.uri }} style={styles.fullImage} resizeMode="contain" />
                        
                        <View style={styles.photoInfoBox}>
                            <ThemedText type="subtitle" style={{color: '#333', marginBottom: 5}}>
                                📝 附註：
                            </ThemedText>
                            <ScrollView style={{maxHeight: 100}}>
                                <ThemedText type="default" style={{fontSize: 16, color: '#555', lineHeight: 24}}>
                                    {selectedPhoto.description || "（這張照片沒有附註）"}
                                </ThemedText>
                            </ScrollView>
                        </View>

                        <TouchableOpacity style={styles.closePhotoButton} onPress={closePhotoModal}>
                            <ThemedText type="default" style={{color: 'white', fontWeight: 'bold'}}>關閉</ThemedText>
                        </TouchableOpacity>
                    </>
                )}
            </View>
        </View>
      </Modal>

      {/* 稱號 Modal (保持不變) */}
      <Modal animationType="fade" transparent={true} visible={isTitleMenuVisible} onRequestClose={() => setIsTitleMenuVisible(false)}>
        <TouchableOpacity style={styles.modalOverlay} activeOpacity={1} onPressOut={() => setIsTitleMenuVisible(false)}>
          <View style={styles.titleModalContent}>
            <ThemedText type="default" style={styles.modalHeader}>選擇稱號</ThemedText>
            {AVAILABLE_TITLES.map((title) => (
              <TouchableOpacity key={title.id} onPress={() => selectTitle(title.name)} style={styles.modalItem}>
                <ThemedText type="default" style={{ color: title.name === titleName ? 'blue' : PRIMARY_TEXT_COLOR }}>
                  {title.name}
                </ThemedText>
              </TouchableOpacity>
            ))}
          </View>
        </TouchableOpacity>
      </Modal>

    </PageTemplate>
  );
}

const styles = StyleSheet.create({
  // 統一樣式
  sectionHeader: {
    marginTop: 20, 
    fontSize: 18, 
    color: PRIMARY_TEXT_COLOR,
    marginLeft: -20, 
    paddingLeft: 20, 
    fontWeight: 'bold',
  },
  chartStyle: {
    marginVertical: 10,
    borderRadius: 12,
    marginLeft: 30, 
  },
  
  // Title & Badge
  titleBadgeRow: {
    flexDirection: 'row',
    justifyContent: 'flex-start', 
    alignItems: 'center',
    marginTop: 10,
    marginBottom: 10,
    marginLeft: 30, 
  },
  titleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    position: 'relative', 
    paddingVertical: 4,
    paddingHorizontal: 8,
    backgroundColor: BAR_BACKGROUND_COLOR, 
    borderRadius: 18,
    borderWidth: 1,
    borderColor: '#000',
    flexShrink: 1, 
    marginRight: 10,
  },
  titleText: { fontSize: 16, color: PRIMARY_TEXT_COLOR },
  titleTextBold: { fontSize: 16, fontWeight: 'bold', color: PRIMARY_TEXT_COLOR },
  dropdownToggle: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 5 },
  dropdownArrow: { fontSize: 12, marginLeft: 3, color: PRIMARY_TEXT_COLOR },
  
  dropdownMenu: {
    position: 'absolute',
    top: 35, 
    left: 0,
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
  dropdownItem: { padding: 10, borderBottomWidth: 1, borderBottomColor: '#eee' },
  dropdownItemText: { fontSize: 16, color: PRIMARY_TEXT_COLOR },

  badgeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 4,
    paddingHorizontal: 8,
    backgroundColor: BAR_BACKGROUND_COLOR, 
    borderRadius: 18,
    borderWidth: 1,
    borderColor: '#000',
    marginLeft: 'auto', 
  },
  badgeIcon: { fontSize: 20, marginRight: 5 },
  badgeCount: { fontSize: 16, fontWeight: 'bold', color: PRIMARY_TEXT_COLOR },

  // Photo Grid
  photoGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, paddingBottom: 20 },
  emptyPhotoBox: { width: '100%', padding: 20, alignItems: 'center', backgroundColor: '#f0f0f0', borderRadius: 8, marginTop: 10 },

  // Modal Common
  modalOverlay: { flex: 1, justifyContent: 'center', padding: 40, backgroundColor: 'rgba(0,0,0,0.3)' },

  // Title Modal
  titleModalContent: { backgroundColor: 'white', borderRadius: 8, padding: 10, elevation: 5 },
  modalHeader: { fontSize: 16, fontWeight: 'bold', marginBottom: 10, color: PRIMARY_TEXT_COLOR },
  modalItem: { paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: '#eee' },

  // [新增] Photo Modal 樣式
  photoModalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.85)', justifyContent: 'center', alignItems: 'center' },
  photoModalContent: { width: '90%', backgroundColor: 'white', borderRadius: 20, overflow: 'hidden', alignItems: 'center' },
  fullImage: { width: '100%', height: 350, backgroundColor: '#000' },
  photoInfoBox: { padding: 20, width: '100%', alignItems: 'flex-start', marginBottom: 50 },
  closePhotoButton: { position: 'absolute', bottom: 20, backgroundColor: '#415a77', paddingVertical: 10, paddingHorizontal: 30, borderRadius: 25 },
});