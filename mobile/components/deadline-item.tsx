import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import React from "react";
import { View, Text, TouchableOpacity, StyleSheet } from "react-native";
import { ColorProperties } from "react-native-reanimated/lib/typescript/Colors";
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
  isEditing: boolean;
  drag: () => void;
  onClickCheckBox: (item: TodoItem) => void;
  onClickEditBox: (item: TodoItem) => void;
  onClickRemoveBox: (item: TodoItem) => void;
}

export default function DeadlineItem({
  item,
  isActive,
  isEditing,
  drag,
  onClickCheckBox,
  onClickEditBox,
  onClickRemoveBox,
}: DeadlineItemProps) {
  let bgColor = "#92a3ba";      // background color
  let bdColor = "#49515d";      // border color
  if (item.display_order === 1) bgColor = "#F0716F", bdColor = "#a84f4d";
  else if (item.display_order === 2) bgColor = "#F0B56F", bdColor = "#a87e4d";
  else if (item.display_order === -1) bgColor = "#E0E1ED", bdColor = "#b3b4bd";

  return (
    <TouchableOpacity
      style={[styles.container, { backgroundColor: isActive ? "#eee" : bgColor, borderColor: bdColor}]}
    >
      <TouchableOpacity
        onLongPress={item.is_done ? null : drag}
        style={{ padding: 6, opacity: item.is_done ? 0 : 1 }}
        delayLongPress={120}
      >
        <Icon name="drag-indicator" size={24} color="#1f1f1f" />
      </TouchableOpacity>

      {/* not editing -> show checkbox */}
      {(!isEditing || (isEditing && item.is_done)) &&
        <TouchableOpacity
            onPress={() => onClickCheckBox(item)}
            style={[styles.checkbox, item.is_done && styles.checkboxChecked]}
        >
            {item.is_done && <Text style={{ color: "#fff", fontWeight: "bold" }}>✓</Text>}
        </TouchableOpacity>
      }

      {/* is editing -> show edit icon */}
      {isEditing && !item.is_done &&
        <TouchableOpacity
            onPress={() => onClickEditBox(item)}
            style={styles.editingBox}
        >
            <Icon name="edit" size={24}/>
        </TouchableOpacity>
      }

      <View style={styles.textContainer}>
        <Text style={[styles.dateText, item.is_done && { color: "#c9cad5"}]}>{item.deadline_date ?? ""}</Text>
        <Text style={[styles.taskText, item.is_done && { textDecorationLine: "line-through", color: "#b3b4bd"}]}>
          {item.thing}
        </Text>
      </View>

      {/* is editing -> show remove icon */}
      {isEditing &&
        <TouchableOpacity
            onPress={() => onClickRemoveBox(item)}
            style={styles.editingBox}
        >
            <Icon name="delete" size={24} color={"#707177"}/>
        </TouchableOpacity>
      }
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
    borderRadius: 6,
    borderWidth: 1,
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
    backgroundColor: "#c9cad5",
    borderColor: "#b3b4bd"
  },
  editingBox: {
    width: 24,
    height: 24,
    marginLeft: 3,
    marginRight: 12,
    justifyContent: "center",
    alignItems: "center",
  },
  textContainer: {
    flex: 1,
    // backgroundColor: "red"
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
