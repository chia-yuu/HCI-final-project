import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { useUser } from '../context/UserContext'; // 確保路徑正確

// 這個元件現在是您的應用程式入口頁面 (Router Path: '/')
export default function UserSelectionScreen() {
  // 透過 useUser 取得設定 User ID 的函式
  const { setUserId } = useUser(); 

  const handleSelectUser = (id: number) => {
    // 呼叫 Context 函式來設定 ID。
    // 💡 根據您的 UserContext.tsx 邏輯，設定完成後會自動導航到 '/(tabs)/'
    setUserId(id); 
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>請選擇使用者身份</Text>

      <TouchableOpacity
        style={[styles.button, styles.user1Button]}
        onPress={() => handleSelectUser(1)}
      >
        <Text style={styles.buttonText}>User 1</Text>
      </TouchableOpacity>

      <TouchableOpacity
        style={[styles.button, styles.user2Button]}
        onPress={() => handleSelectUser(2)}
      >
        <Text style={styles.buttonText}>User 2</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#0D1B2A',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 40,
    color: '#E0E1DD'
  },
  button: {
    padding: 15,
    borderRadius: 10,
    marginVertical: 10,
    width: '60%',
    alignItems: 'center',
  },
  user1Button: {
    backgroundColor: '#778DA9',
  },
  user2Button: {
    backgroundColor: '#415A77',
  },
  buttonText: {
    color: 'white',
    fontSize: 18,
    fontWeight: '600',
  },
});