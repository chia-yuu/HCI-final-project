import React, { useState, useEffect } from 'react'; 
import { ScrollView, View, Image, Dimensions, TouchableOpacity, Modal, Alert } from 'react-native';
import PageTemplate from '@/components/page-template';
import { ThemedText } from '@/components/themed-text';
import { LineChart, BarChart } from 'react-native-chart-kit';

// 假設的稱號資料
const AVAILABLE_TITLES = [
  { id: 'novice', name: '專注新人' },
  { id: 'expert', name: '閱讀專家' },
  { id: 'master', name: '時光大師' },
];

// ⭐ 顏色定義
const PRIMARY_TEXT_COLOR = '#0D1B2A';
const PAGE_BACKGROUND_COLOR = '#E0E1DD'; 

// ⭐ 假設後端 URL 和用戶 ID
const BASE_URL = 'http://192.168.0.151:8000'; 
const USER_ID = 1;

export default function MyRecordScreen() {
  const screenWidth = Dimensions.get('window').width;
  const chartWidth = screenWidth - 20; 

  // ⭐ 1. 狀態：預設為 '專注新人'
  const [titleName, setTitleName] = useState(AVAILABLE_TITLES[0].name); 
  const [badgeCount, setBadgeCount] = useState(0); 
  const [isTitleMenuVisible, setIsTitleMenuVisible] = useState(false);
  const [weeklyReadingData, setWeeklyReadingData] = useState({
    labels: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'],
    datasets: [{ data: [0, 0, 0, 0, 0, 0, 0] }],
  });
  const [isLoading, setIsLoading] = useState(true);

  // ----------------------------------------------------
  // ⭐ 2. 資料獲取邏輯
  // ----------------------------------------------------
  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setIsLoading(true);
    try {
      const statusResponse = await fetch(`${BASE_URL}/user/status/${USER_ID}`);
      const statusData = await statusResponse.json();
      if (!statusData.error) {
        setTitleName(statusData.titleName);
        setBadgeCount(statusData.badgeCount);
      }

      const weeklyResponse = await fetch(`${BASE_URL}/record/weekly-focus/${USER_ID}`);
      const weeklyData = await weeklyResponse.json();
      if (!weeklyData.error) {
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
          labels: weeklyData.labels,
          datasets: [{ 
            data: weeklyData.data,
            colors: chartColors.slice(0, weeklyData.data.length),
          }],
        });
      }
    } catch (error) {
      console.error("Failed to fetch data:", error);
      Alert.alert("錯誤", "無法連線到後端服務或獲取數據。");
    } finally {
      setIsLoading(false);
    }
  };
  
  const selectTitle = (newTitle) => {
    setIsTitleMenuVisible(false); 

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
        data: [0.0, 0.0, 0.0, 1.0, 0.5, 1.0, 0.5, 0.0],
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
    paddingLeft: 30, 
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

        {/* ---------------------------------------------------- */}
        {/* 稱號與徽章顯示區 (Title & Badge) */}
        {/* ---------------------------------------------------- */}
        <View style={{ 
          flexDirection: 'row', 
          alignItems: 'center', 
          marginTop: 10,
          marginBottom: 10,
          marginLeft: -80
        }}>
          
          {/* 左側：稱號與下拉選單 - 最終修正：確保內部緊貼 */}
          <TouchableOpacity 
            onPress={() => setIsTitleMenuVisible(true)} 
            style={{ 
              flexDirection: 'row', 
              // ⭐ 關鍵修正：確保所有子元素從左側緊密排列，消除文字元件可能產生的多餘空間
              justifyContent: 'flex-start', 
              alignItems: 'center',
              backgroundColor: PAGE_BACKGROUND_COLOR, 
              padding: 8,
              borderRadius: 8,
              flexShrink: 1, // 讓整個按鈕在需要時可以被壓縮
            }}
          >
            <ThemedText 
              type="default" 
              style={{ 
                fontSize: 18, 
                marginRight: -20, 
                color: PRIMARY_TEXT_COLOR,
              }}
            >
              title: {titleName}
            </ThemedText>
            {/* 倒三角圖示 */}
            <View style={{ width: 0, height: 0, borderLeftWidth: 5, borderRightWidth: 5, borderTopWidth: 5, borderStyle: 'solid', backgroundColor: 'transparent', borderLeftColor: 'transparent', borderRightColor: 'transparent', borderTopColor: PRIMARY_TEXT_COLOR, marginTop: 3 }} />
          </TouchableOpacity>

          {/* 右側：徽章圖像與計數 - 使用絕對定位固定在右側 (保持不變) */}
          <View 
            style={{ 
              flexDirection: 'row', 
              alignItems: 'center',
              position: 'absolute', 
              right: 0, 
            }}
          >
            <Image
              source={{ uri: 'https://placekitten.com/50/50' }} 
              style={{ width: 30, height: 30, borderRadius: 15 }}
            />
            <ThemedText type="default" style={{ fontSize: 18, marginLeft: 5, color: PRIMARY_TEXT_COLOR }}>
              : X{badgeCount}
            </ThemedText>
            <ThemedText style={{ marginLeft: 10, fontSize: 12, color: 'red' }}>
                ({badgeCount})
            </ThemedText>
          </View>
        </View>

        {/* ---------------------------------------------------- */}
        {/* 每日專注時長 (BarChart) - 標題對齊修正保持不變 */}
        {/* ---------------------------------------------------- */}
        <ThemedText 
          type="default" 
          style={{ 
            marginTop: 10, 
            fontSize: 20, 
            color: PRIMARY_TEXT_COLOR,
            marginLeft: -20, 
            paddingLeft: 20, 
          }}
        >
          每日專注時長
        </ThemedText>
        <View style={{ marginLeft: -50 }}>
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
              color: (opacity = 1) => `rgba(13, 27, 42, ${opacity})`, 
              propsForBackgroundLines: { strokeDasharray: '' },
              paddingRight: 0,
              barPercentage: 0.8
            }}
            style={{
              marginVertical: 10,
              borderRadius: 12,
            }}
            showBarTops={false}
          />
        </View>

        {/* ---------------------------------------------------- */}
        {/* 專注時間 (LineChart) - 標題對齊修正保持不變 */}
        {/* ---------------------------------------------------- */}
        <ThemedText 
          type="default" 
          style={{ 
            marginTop: 20, 
            fontSize: 18, 
            color: PRIMARY_TEXT_COLOR,
            marginLeft: -20, 
            paddingLeft: 20, 
          }}
        >
          專注時間
        </ThemedText>
        <View style={{ marginLeft: -50 }}>
          <LineChart
            data={focusTimeData}
            width={chartWidth}
            height={160}  
            yAxisLabel=""
            chartConfig={{
              ...commonChartConfig,
              color: (opacity = 1) => `rgba(0, 122, 255, ${opacity})`, 
              propsForDots: { r: '3' },
            }}
            bezier
            style={{
              marginVertical: 10,
              borderRadius: 12,
            }}
          />
        </View>

        {/* ---------------------------------------------------- */}
        {/* 今日回顧圖片區 - 標題對齊與圖片寬度修正保持不變 */}
        {/* ---------------------------------------------------- */}
        <ThemedText 
          type="default" 
          style={{ 
            marginTop: 20, 
            fontSize: 18, 
            color: PRIMARY_TEXT_COLOR,
            marginLeft: -20, 
            paddingLeft: 20, 
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
              uri: 'https://placekitten.com/400/300',
            }}
            style={{ width: screenWidth - 64, height: 120, borderRadius: 8 }}
          />
        </View>
      </ScrollView>

      {/* ---------------------------------------------------- */}
      {/* 稱號選擇 Modal (保持不變) */}
      {/* ---------------------------------------------------- */}
      <Modal
        animationType="fade"
        transparent={true}
        visible={isTitleMenuVisible}
        onRequestClose={() => setIsTitleMenuVisible(false)}
      >
        <TouchableOpacity
          style={{ flex: 1, justifyContent: 'flex-start', alignItems: 'flex-start', paddingTop: 100, paddingLeft: 30 }} 
          activeOpacity={1}
          onPressOut={() => setIsTitleMenuVisible(false)}
        >
          <View style={{ backgroundColor: 'white', borderRadius: 8, padding: 10, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.25, shadowRadius: 3.84, elevation: 5 }}>
            <ThemedText type="default" style={{ fontSize: 16, marginBottom: 5, fontWeight: 'bold', color: PRIMARY_TEXT_COLOR }}>
              選擇稱號
            </ThemedText>
            {AVAILABLE_TITLES.map((title) => (
              <TouchableOpacity
                key={title.id}
                onPress={() => selectTitle(title.name)}
                style={{ paddingVertical: 8, paddingHorizontal: 15, borderBottomWidth: 1, borderBottomColor: '#f0f0f0' }}
              >
                <ThemedText type="default" style={{ fontSize: 16, color: title.name === titleName ? 'blue' : PRIMARY_TEXT_COLOR }}>
                  {title.name} {title.name === titleName ? ' (目前)' : ''}
                </ThemedText>
              </TouchableOpacity>
            ))}
          </View>
        </TouchableOpacity>
      </Modal>
    </PageTemplate>
  );
}
