import React, { useState, useEffect } from "react";
import { View, Text, TextInput, Button, FlatList, StyleSheet, TouchableOpacity } from "react-native";
import api from "../../api/api";
import PageTemplate from "@/components/page-template";
import { useRouter } from 'expo-router';

export default function App() {
  const [items, setItems] = useState([]);
  const [input, setInput] = useState("");

  // 讀取資料庫的 items
  const loadItems = async () => {
    try {
      const res = await api.get("/items");
      setItems(res.data);
    } catch (err) {
      console.log("GET /items error:", err);
    }
  };

  // 新增 item
  const addItem = async () => {
    if (!input.trim()) return;

    try {
      await api.post("/items", { title: input, done: false });
      setInput("");
      loadItems(); // 重新載入資料
    } catch (err) {
      console.log("POST /items error:", err);
    }
  };

  useEffect(() => {
    loadItems();
  }, []);

  const router = useRouter();

  return (
    <View style={styles.container}>
      {/* <PageTemplate title="Home" selectedTab="home"> */}
      <Text style={styles.title}>📦 Items from Database</Text>

      <FlatList
        data={items}
        keyExtractor={(item) => item.id.toString()}
        renderItem={({ item }) => (
          <Text style={styles.item}>
            {item.done ? "✅ " : "⬜ "} {item.title}
          </Text>
        )}
      />

      <View style={{
        flexDirection: 'row',
        justifyContent: 'center',
      }}>
        <TouchableOpacity
          style={{
            backgroundColor: '#000000',
            padding: 15,
            marginBottom: 20,
            marginHorizontal: 10
          }}
          onPress={() => router.push('/explore')}
        >
          <Text style={{ color: 'white', textAlign: 'center' }}>explore</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={{
            backgroundColor: '#000000',
            padding: 15,
            marginBottom: 20,
            marginHorizontal: 10
          }}
          onPress={() => router.push('/focusMode')}
        >
          <Text style={{ color: 'white', textAlign: 'center' }}>專注模式</Text>
        </TouchableOpacity>
      </View>
      
      <TextInput
        style={styles.input}
        value={input}
        onChangeText={setInput}
        placeholder="Enter new item"
      />

      <Button title="Add Item" onPress={addItem} />
      {/* </PageTemplate> */}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 20, marginTop: 50 },
  title: { fontSize: 24, fontWeight: "bold", marginBottom: 10 },
  item: { fontSize: 18, marginVertical: 4 },
  input: {
    borderWidth: 1,
    padding: 10,
    marginVertical: 20,
    borderRadius: 8,
  },
});
