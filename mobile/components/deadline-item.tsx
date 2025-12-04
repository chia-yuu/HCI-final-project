import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import React from "react";
import { View, Text, TouchableOpacity, StyleSheet } from "react-native";
import Icon from 'react-native-vector-icons/MaterialIcons';

interface TodoItem {
  id: number;
  user_id: number;
  deadline_date?: string;
  thing: string;
  is_done: boolean;
  display_order: number;
}

interface DeadlineItemProps {
  item: TodoItem;
  isActive: boolean;
  drag: () => void;
  onClickCheckBox: (item: TodoItem) => void;
  onPressItem: (item: TodoItem) => void;
}

export default function DeadlineItem({
  item,
  isActive,
  drag,
  onClickCheckBox,
  onPressItem,
}: DeadlineItemProps) {
  let bgColor = "#ccc";
  if (item.display_order === 1) bgColor = "#ff6b6b";
  else if (item.display_order === 2) bgColor = "#ffa94d";

  return (
    <TouchableOpacity
      onPress={() => onPressItem(item)}
      style={[styles.container, { backgroundColor: isActive ? "#eee" : bgColor }]}
    >
      <TouchableOpacity
        onLongPress={drag}
        style = {{padding: 6}}
        delayLongPress={120}
      >
        <Icon name="drag-indicator" size={24} color="black"/>
      </TouchableOpacity>

      <TouchableOpacity
        onPress={() => onClickCheckBox(item)}
        style={[styles.checkbox, item.is_done && styles.checkboxChecked]}
      >
        {item.is_done && <Text style={{ color: "#fff", fontWeight: "bold" }}>✓</Text>}
      </TouchableOpacity>

      <View style={styles.textContainer}>
        <Text style={styles.dateText}>{item.deadline_date ?? ""}</Text>
        <Text style={[styles.taskText, item.is_done && { textDecorationLine: "line-through" }]}>
          {item.thing}
        </Text>
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    alignItems: "center",
    width: "100%",
    paddingVertical: 12,
    paddingHorizontal: 6,
    marginVertical: 4,
    // marginHorizontal: 20,
    borderRadius: 6,
  },
  dragHandle: {
    width: 30,
    alignItems: "center",
    justifyContent: "center",
  },
  checkbox: {
    width: 24,
    height: 24,
    borderWidth: 1,
    borderColor: "#333",
    // marginHorizontal: 12,
    marginLeft: 3,
    marginRight: 12,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#fff",
  },
  checkboxChecked: {
    backgroundColor: "#333",
  },
  textContainer: {
    flex: 1,
  },
  dateText: {
    fontSize: 12,
    color: "#555",
  },
  taskText: {
    fontSize: 16,
    color: "#111",
  },
});
