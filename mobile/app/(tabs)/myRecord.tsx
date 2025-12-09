import React, { useState, useEffect } from 'react'; 
import { ScrollView, View, Image, Dimensions, TouchableOpacity, Modal, Alert, StyleSheet } from 'react-native'; // ⭐ 1. 導入 StyleSheet
import PageTemplate from '@/components/page-template';
import { ThemedText } from '@/components/themed-text';
import { LineChart, BarChart } from 'react-native-chart-kit';
// import api from '../../api/api'; // ⭐ [移除] 移除 API 模組
import { useFocusEffect } from '@react-navigation/native'; // 引入 useFocusEffect
import { useUser } from '../../context/UserContext'; // 引入 useFocusEffect

// ----------------------------------------------------
// ⭐ 新增：後端 API 資料介面
// ----------------------------------------------------
interface UserRecordStatus {
  title_name: string;
  badge_count: number;
}
// ----------------------------------------------------

// 假設的稱號資料


// ⭐ 顏色定義
const PRIMARY_TEXT_COLOR = '#0D1B2A';
const PAGE_BACKGROUND_COLOR = '#E0E1DD'; 
const BAR_BACKGROUND_COLOR = '#d1d5db'; // 來自 FriendListScreen 的背景色

// ----------------------------------------------------
// ⭐ 模擬資料 (MOCK DATA)
// ----------------------------------------------------
interface ChartData {
    labels: string[];
    datasets: { data: number[] }[];
}

interface UserRecordData {
    AVAILABLE_TITLES: Title[];
    titleName: string;
    badgeCount: number;
    weeklyData: number[]; // Bar Chart 數據
    focusTimeData: number[]; // Line Chart 數據
    imageUri: string;
}
interface Title {
    id: string;
    name: string;
}
const MOCK_DATA: Record<number, UserRecordData> = {
    // User 1: 高成就 (時光大師)
    1: {
        AVAILABLE_TITLES: [{ id: 'novice', name: '專注新人' },
          { id: 'expert', name: '閱讀專家' },
          { id: 'master', name: '時光大師' },],
        titleName: '時光大師', 
        badgeCount: 99, 
        weeklyData: [6.5, 4.8, 7.5, 8.5, 5.0, 6.5, 7.0], 
        focusTimeData: [0.0, 0.0, 0.0, 1.0, 0.5, 1.0, 0.5, 0.0],
        imageUri: 'https://placekitten.com/400/300', // 範例圖片
    },
    // User 2: 低成就 (專注新人)
    2: {
        AVAILABLE_TITLES: [{ id: 'novice', name: '專注新人' },
          { id: 'expert', name: '閱讀大師' },
          { id: 'master', name: '內卷小丑' },],
        titleName: '專注新人', 
        badgeCount: 5, 
        weeklyData: [2.1, 1.5, 3.0, 2.5, 1.8, 2.2, 3.1],
        focusTimeData: [0.0, 0.2, 0.5, 0.8, 0.3, 0.1, 0.0, 0.0],
        imageUri: 'https://placehold.co/400x300/F4D35E/000000/png', // 另一張範例圖片
    },
};

const DEFAULT_USER_DATA = MOCK_DATA[1];
// ----------------------------------------------------

export default function MyRecordScreen() {
  const screenWidth = Dimensions.get('window').width;
  // 讓圖表寬度與 ScrollView 的 padding 一致 (screenWidth - 2*20)
  const chartWidth = screenWidth - 40; 
  const { userId } = useUser();
  const currentUserId = userId || 1
  // ⭐ 1. 狀態：從模擬資料設定初始值
  const [titleName, setTitleName] = useState(MOCK_DATA[currentUserId].titleName); 
  const AVAILABLE_TITLES = MOCK_DATA[currentUserId].AVAILABLE_TITLES;
  const [badgeCount, setBadgeCount] = useState(MOCK_DATA[currentUserId].badgeCount); 
  const [isTitleMenuVisible, setIsTitleMenuVisible] = useState(false);
  const [weeklyReadingData, setWeeklyReadingData] = useState({
    labels: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'],
    datasets: [{ data: MOCK_DATA[currentUserId].weeklyData }],
  });
  const [isLoading, setIsLoading] = useState(true);

  // ----------------------------------------------------
  // ⭐ 2. 資料獲取邏輯 (使用 API 呼叫)
  // ----------------------------------------------------
  // 使用 useFocusEffect 確保每次進入頁面都重新載入
  useFocusEffect(
    React.useCallback(() => {
      fetchData();
    }, [])
  );

  const fetchData = async () => {
    setIsLoading(true);

    // ------------------------------------------------
    // ⭐ 抓取用戶稱號和徽章數 (API 呼叫)
    // ------------------------------------------------
    try {
        const user_id = 1; // 假設用戶 ID 為 1
        // API 呼叫路徑：/api/v1/user/record_status
        const statusResponse = await api.get<UserRecordStatus>(`/api/v1/user/record_status?user_id=${user_id}`);
        
        // 成功，使用 API 傳回的資料
        console.log("API 成功回傳資料:", statusResponse.data);
        setTitleName(statusResponse.data.title_name);
        setBadgeCount(statusResponse.data.badge_count);

    } catch (error) {
//       console.error("API 呼叫失敗，使用模擬資料:", error);
      // API 失敗，退回使用模擬資料
      setTitleName(MOCK_DATA[currentUserId].titleName);
      setBadgeCount(MOCK_DATA[currentUserId].badgeCount);
    }
    
    // ------------------------------------------------
    // 抓取週專注紀錄 (保持使用模擬資料)
    // ------------------------------------------------
    try {
        // 這裡可以插入抓取週專注紀錄的 API 呼叫 (例如 /api/v1/user/weekly_focus_time)
        // const weeklyResponse = await api.get<WeeklyFocusData>(...);

        // ⭐ 保持使用模擬資料設定週專注紀錄
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
          labels: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'],
          datasets: [{ 
            data: MOCK_DATA[currentUserId].weeklyData,
            colors: chartColors.slice(0, MOCK_DATA[currentUserId].weeklyData.length),
          }],
        });
    } catch (error) {
        // 處理週數據抓取錯誤 (如果有的話)
        // console.error("Error fetching weekly data:", error);
    } finally {
      setIsLoading(false);
    }
  };
  
  // 稱號選單點擊處理
  const selectTitle = (newTitle) => {
    setIsTitleMenuVisible(false); // 關閉下拉選單

    Alert.alert(
      "更換稱號確認",
      `您確定要將稱號更換為「${newTitle}」嗎？`,
      [
        {
          text: "取消",
          onPress: () => console.log("取消更換稱號"),
          style: "cancel"
        },
        { 
          text: "確認更換", 
          onPress: () => {
            setTitleName(newTitle);
            // ⭐ 此處應新增 API 呼叫以將新稱號存入後端
            console.log(`稱號已更換為: ${newTitle}`);
          }
        }
      ],
      { cancelable: false }
    );
  };

  const focusTimeData = { 
    labels: ['00:00', '03:00', '06:00', '09:00', '12:00', '15:00', '18:00', '21:00'],
    datasets: [
      {
        data: MOCK_DATA[currentUserId].focusTimeData,
        color: (opacity = 1) => `rgba(0, 122, 255, ${opacity})`, 
        strokeWidth: 1.5,
      },
    ],
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

  if (isLoading) {
    return (
      <PageTemplate title="我的紀錄" selectedTab="record">
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: PAGE_BACKGROUND_COLOR }}>
          <ThemedText type="default" style={{ color: PRIMARY_TEXT_COLOR }}>
            載入數據中...
          </ThemedText>
        </View>
      </PageTemplate>
    );
  }

  return (
    <PageTemplate title="我的紀錄" selectedTab="record">
      <ScrollView style={{ paddingHorizontal: 20, paddingBottom: 40, backgroundColor: PAGE_BACKGROUND_COLOR }}>

        {/* 修正 1: 外層 Wrapper，整體向左移 50 單位 */}
        <View style={{ marginLeft: -50 }}>

          {/* ---------------------------------------------------- */}
          {/* ⭐ 修正 2: 使用 FriendList 的樣式重構 Title & Badge 區塊 */}
          {/* ---------------------------------------------------- */}
          <View style={styles.titleBadgeRow}> 
            
            {/* 左側：稱號與下拉選單 */}
            <View style={styles.titleContainer}> 
              <ThemedText style={styles.titleText}>title:</ThemedText>
              <TouchableOpacity 
                onPress={() => setIsTitleMenuVisible(!isTitleMenuVisible)} // 切換下拉選單
                style={styles.dropdownToggle}
              >
                <ThemedText style={styles.titleTextBold}>{titleName}</ThemedText>
                <ThemedText style={styles.dropdownArrow}> ▼</ThemedText> 
              </TouchableOpacity>
              
              {/* 渲染下拉選單 (絕對定位，取代原 Modal) */}
              {isTitleMenuVisible && (
                <View style={styles.dropdownMenu}>
                  {AVAILABLE_TITLES.map((title) => (
                    <TouchableOpacity
                      key={title.id}
                      style={styles.dropdownItem}
                      onPress={() => selectTitle(title.name)}
                    >
                      <ThemedText style={styles.dropdownItemText}>{title.name}</ThemedText>
                    </TouchableOpacity>
                  ))}
                </View>
              )}
            </View>

            {/* 右側：徽章圖像與計數 */}
            <View style={styles.badgeContainer}> 
              <ThemedText style={styles.badgeIcon}>🏅</ThemedText> 
              <ThemedText style={styles.badgeCount}>X{badgeCount}</ThemedText>
            </View>
          </View>


          {/* 每日專注時長 (BarChart) - 以下內容保持原樣 */}
          <ThemedText 
            type="default" 
            style={{ 
              marginTop: 10, 
              fontSize: 20, 
              color: PRIMARY_TEXT_COLOR,
              fontWeight: 'bold',
            }}
          >
            每日專注時長
          </ThemedText>
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
              style={{
                marginVertical: 10,
                borderRadius: 12,
                marginLeft: 30, 
              }}
              showBarTops={false}
            />
          </View>

          {/* 專注時間 (LineChart) */}
          <ThemedText 
            type="default" 
            style={{ 
              marginTop: 20, 
              fontSize: 18, 
              color: PRIMARY_TEXT_COLOR,
              fontWeight: 'bold',
            }}
          >
            專注時間
          </ThemedText>
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
              style={{
                marginVertical: 10,
                borderRadius: 12,
                marginLeft: 30, 
              }}
            />
          </View>

          {/* 今日回顧圖片區 */}
          <ThemedText 
            type="default" 
            style={{ 
              marginTop: 20, 
              fontSize: 18, 
              color: PRIMARY_TEXT_COLOR,
              fontWeight: 'bold',
            }}
          >
            今日回顧
          </ThemedText>

          <View
            style={{
              marginTop: 10,
              padding: 12,
              backgroundColor: PAGE_BACKGROUND_COLOR, 
              borderRadius: 12,
              alignItems: 'center',
            }}
          >
            <Image
              source={{
                uri: MOCK_DATA[currentUserId].imageUri,
              }}
              style={{ width: screenWidth - 64, height: 120, borderRadius: 8 }}
            />
          </View>
        </View> {/* End of Wrapper View (marginLeft: -50) */}
      </ScrollView>
    </PageTemplate>
  );
}

// ⭐ 複製並調整自 FriendListScreen.tsx 的樣式
const styles = StyleSheet.create({
  // 稱號/徽章外層容器 (取代 topBarContainer 的部分功能)
  titleBadgeRow: {
    flexDirection: 'row',
    justifyContent: 'flex-start', // 讓內容靠左對齊
    alignItems: 'center',
    marginTop: 10,
    marginBottom: 10,
    marginLeft: 30, // ⭐ 修正: 向右移動 10 單位
  },
  
  // 左側：稱號容器
  titleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    position: 'relative', // 讓 dropdownMenu 可以絕對定位
    paddingVertical: 4,
    paddingHorizontal: 8,
    backgroundColor: BAR_BACKGROUND_COLOR, 
    borderRadius: 18,
    borderWidth: 1,
    borderColor: '#000',
    flexShrink: 1, // 允許收縮
    marginRight: 20,
  },
  
  titleText: {
    fontSize: 16,
    color: PRIMARY_TEXT_COLOR,
  },
  
  titleTextBold: {
    fontSize: 16,
    fontWeight: 'bold',
    color: PRIMARY_TEXT_COLOR,
  },
  
  dropdownToggle: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 5,
  },
  
  dropdownArrow: {
    fontSize: 12,
    marginLeft: 3,
    color: PRIMARY_TEXT_COLOR,
  },

  // 絕對定位的下拉選單
  dropdownMenu: {
    position: 'absolute',
    // top 和 left 需要根據實際情況微調，確保對齊。
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
  
  dropdownItem: {
    padding: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  
  dropdownItemText: {
    fontSize: 16,
    color: PRIMARY_TEXT_COLOR,
  },

  // 右側：徽章容器
  badgeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 4,
    paddingHorizontal: 8,
    backgroundColor: BAR_BACKGROUND_COLOR, 
    borderRadius: 18,
    borderWidth: 1,
    borderColor: '#000',
    marginLeft: 50, 
  },
  
  badgeIcon: {
    fontSize: 20,
    marginRight: 5,
  },
  
  badgeCount: {
    fontSize: 16,
    fontWeight: 'bold',
    color: PRIMARY_TEXT_COLOR,
  },
});
