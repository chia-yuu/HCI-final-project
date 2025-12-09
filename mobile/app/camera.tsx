import React, { useState, useRef } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Alert, Image, TextInput, KeyboardAvoidingView, Platform } from 'react-native';
import { CameraView, useCameraPermissions } from 'expo-camera';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { useFocus } from '../context/FocusContext';

export default function CameraScreen() {
  const [permission, requestPermission] = useCameraPermissions();
  const cameraRef = useRef<CameraView>(null);
  const router = useRouter();
  const { stopFocus } = useFocus();
  
  const params = useLocalSearchParams();
  const mode = (params.mode as 'pause' | 'end') || 'end';

  const [photo, setPhoto] = useState<string | null>(null);
  const [description, setDescription] = useState(""); 

  if (!permission) {
    return <View />; // 等待權限載入
  }

  if (!permission.granted) {
    return (
      <View style={styles.container}>
        <Text style={styles.text}>我們需要相機權限來紀錄！</Text>
        <TouchableOpacity onPress={requestPermission} style={styles.button}>
          <Text style={styles.buttonText}>授權相機</Text>
        </TouchableOpacity>
      </View>
    );
  }

  // 拍照功能
  const takePicture = async () => {
    if (cameraRef.current) {
      try {
        const photoData = await cameraRef.current.takePictureAsync({
          quality: 0.3, // 降低品質以加速上傳
          base64: true, 
        });
        
        if (photoData?.base64) {
          setPhoto(`data:image/jpg;base64,${photoData.base64}`);
        }
      } catch (error) {
        console.error(error);
        Alert.alert("錯誤", "拍照失敗");
      }
    }
  };

  // 確認上傳
  const handleConfirm = () => {
    if (photo) {
      stopFocus(mode, photo, description);
      // 這裡改成你的正確路徑，假設是全小寫
      router.replace('/(tabs)/focusMode');
    }
  };

  // 重拍
  const handleRetake = () => {
    setPhoto(null);
    setDescription("");
  };

  return (
    <View style={styles.container}>
      {!photo ? (
        // === 相機預覽畫面 ===
        <View style={{ flex: 1 }}>
            <CameraView style={styles.camera} ref={cameraRef} facing="back">
            <View style={styles.buttonContainer}>
                <TouchableOpacity style={styles.shutterButton} onPress={takePicture}>
                <View style={styles.shutterInner} />
                </TouchableOpacity>
            </View>
            
            {/* 取消按鈕 */}
            <TouchableOpacity 
                style={styles.closeButton} 
                onPress={() => router.back()} // 回上頁 (不存檔)
            >
                <Text style={{color: 'white', fontSize: 18}}>取消</Text>
            </TouchableOpacity>
            </CameraView>
        </View>
      ) : (
        // === 照片預覽與輸入畫面 ===
        <KeyboardAvoidingView 
            behavior={Platform.OS === "ios" ? "padding" : "height"}
            style={styles.previewContainer}
        >
          {/* 1. 顯示照片 */}
          <Image source={{ uri: photo }} style={styles.previewImage} />
          
          {/* 2. 輸入備註框 */}
          <View style={styles.inputContainer}>
              <TextInput
                style={styles.input}
                placeholder="寫下這張照片的備註..."
                placeholderTextColor="#ccc"
                value={description}
                onChangeText={setDescription}
                maxLength={50} // 限制字數
                returnKeyType="done"
              />
          </View>
        
          {/* 3. 按鈕區 */}
          <View style={styles.previewButtons}>
            <TouchableOpacity style={[styles.btn, styles.btnRetake]} onPress={handleRetake}>
              <Text style={styles.btnText}>重拍</Text>
            </TouchableOpacity>
            <TouchableOpacity style={[styles.btn, styles.btnConfirm]} onPress={handleConfirm}>
              <Text style={[styles.btnText, {color: 'white'}]}>確認並存檔</Text>
            </TouchableOpacity>
          </View>
        </KeyboardAvoidingView>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: 'black' },
  text: { color: 'white', textAlign: 'center', marginTop: 50 },
  button: { backgroundColor: '#444', padding: 10, margin: 20, borderRadius: 5, alignItems: 'center' },
  buttonText: { color: 'white' },
  
  camera: { flex: 1 },
  buttonContainer: { flex: 1, flexDirection: 'row', backgroundColor: 'transparent', margin: 64, justifyContent: 'center', alignItems: 'flex-end' },
  closeButton: { position: 'absolute', top: 50, left: 20 },
  
  shutterButton: { width: 70, height: 70, borderRadius: 35, backgroundColor: 'rgba(255,255,255,0.3)', justifyContent: 'center', alignItems: 'center' },
  shutterInner: { width: 60, height: 60, borderRadius: 30, backgroundColor: 'white' },

  // 預覽區塊樣式
  previewContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#000' },
  previewImage: { width: '100%', height: '50%', resizeMode: 'contain', marginTop: 20 }, // 調整高度比例
  
  inputContainer: {
    width: '90%',
    marginVertical: 20,
    backgroundColor: '#333',
    borderRadius: 10,
    padding: 10,
  },
  input: {
    color: 'white',
    fontSize: 16,
    padding: 5,
  },
  
  previewButtons: { flexDirection: 'row', width: '100%', justifyContent: 'space-around', paddingBottom: 40 },
  btn: { paddingVertical: 15, paddingHorizontal: 30, borderRadius: 30 },
  btnRetake: { backgroundColor: '#e0e0e0' },
  btnConfirm: { backgroundColor: '#5c6b73' },
  btnText: { fontSize: 16, fontWeight: 'bold' }
});