import React, { useState, useEffect, useRef } from 'react';
import { StyleSheet, Text, View, TouchableOpacity, Button, Image, Alert } from 'react-native';
import { Camera, CameraType } from 'expo-camera';
import { router } from 'expo-router';
import { useUser } from '../context/UserContext'; // 引入 UserContext
import api from '../api/api';

export default function CameraScreen() {
  const { userId } = useUser();
  const [hasPermission, setHasPermission] = useState<boolean | null>(null);
  const [photoUri, setPhotoUri] = useState<string | null>(null); // 本地 URI
  const cameraRef = useRef<typeof Camera | null>(null);

  // 1. 請求相機權限
  useEffect(() => {
    (async () => {
      const cameraStatus = await Camera.requestCameraPermissionsAsync();
      setHasPermission(cameraStatus.status === 'granted');
    })();
  }, []);

  // 2. 核心：上傳 Base64 數據到後端
  const uploadPhotoToBackend = async (base64Data: string) => {
    if (userId === null) {
      Alert.alert("錯誤", "無法確認使用者 ID，請重新選擇身份。");
      return;
    }

    const payload = {
        user_id: userId,
        // Base64 數據是字串，直接傳輸
        image_data: base64Data, 
        description: `專注結束於 ${new Date().toLocaleDateString()}`
    };

    try {
        await api.post('/pictures/upload', payload); // 呼叫您的新 API
        Alert.alert("成功", "專注證明照片已上傳！");
    } catch (error) {
        console.error("照片上傳失敗:", error);
        Alert.alert("錯誤", "照片上傳失敗，請檢查網路或後端服務。");
    } finally {
        // 無論成功或失敗，都導航回主頁或回顧頁
        router.replace('/(tabs)/');
    }
  };

  // 3. 實作拍照功能
  const takePicture = async () => {
    if (cameraRef.current) {
      const photo = await cameraRef.current.takePictureAsync({
        quality: 0.5, 
        base64: true, // 💡 關鍵：要求 Base64 數據
        exif: false,
      });
      setPhotoUri(photo.uri); // 顯示預覽
      
      // 拍照後立即上傳
      if (photo.base64) {
          uploadPhotoToBackend(photo.base64); 
      }
    }
  };

  if (hasPermission === null || hasPermission === false) {
    return <Text>載入或權限不足：請檢查 app.json 配置</Text>;
  }

  // 顯示相機預覽
  return (
    <View style={styles.container}>
      {/* ⚠️ 必須將 ref 傳遞給 Camera 元件 */}
      <Camera style={styles.camera} type={CameraType.back} ref={cameraRef}>
        <View style={styles.snapButtonContainer}>
          <TouchableOpacity style={styles.snapButton} onPress={takePicture}>
            <Text style={styles.snapText}>拍照並上傳</Text>
          </TouchableOpacity>
        </View>
      </Camera>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  camera: { flex: 1 },
  snapButtonContainer: {
    position: 'absolute',
    bottom: 30,
    width: '100%',
    alignItems: 'center',
  },
  snapButton: {
    width: 70,
    height: 70,
    borderRadius: 35,
    backgroundColor: '#fff',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 5,
    borderColor: '#000',
  },
  snapText: { fontSize: 14, color: '#000' },
});