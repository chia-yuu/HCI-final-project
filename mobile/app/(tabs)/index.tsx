import React, { useState, useEffect } from "react";
import { View, Text, TextInput, Button, FlatList, StyleSheet } from "react-native";
import api from "../../api/api";

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

  return (
    <View style={styles.container}>
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

      <TextInput
        style={styles.input}
        value={input}
        onChangeText={setInput}
        placeholder="Enter new item"
      />

      <Button title="Add Item" onPress={addItem} />
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
