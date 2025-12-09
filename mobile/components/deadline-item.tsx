import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import React, { useRef, useEffect, useState } from "react";
import { View, Text, TouchableOpacity, StyleSheet, Animated, Image, Easing } from "react-native";
import Icon from 'react-native-vector-icons/MaterialIcons';

interface TodoItem {
  id: number;
  user_id: number;
  deadline_date?: string;
  thing: string;
  is_done: boolean;
  display_order: number;
  current_doing: boolean;
}

interface DeadlineItemProps {
  item: TodoItem;
  isActive: boolean;
  isEditing: boolean;
  drag: () => void;
  onClickCheckBox: (item: TodoItem) => void;
  onClickDoing: (item: TodoItem) => void;
  onClickEditBox: (item: TodoItem) => void;
  onClickRemoveBox: (item: TodoItem) => void;
}

export default function DeadlineItem({
  item,
  isActive,
  isEditing,
  drag,
  onClickCheckBox,
  onClickDoing,
  onClickEditBox,
  onClickRemoveBox,
}: DeadlineItemProps) {
  // 震動效果 (urgent item)
  const shakeAnim = useRef(new Animated.Value(0)).current;
  const [urgentLevel, setUrgentLevel] = useState<1 | 2 | 0>(0);
  useEffect(() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const deadline = new Date(item.deadline_date as string);
    deadline.setHours(0, 0, 0, 0);

    const diffTime = deadline.getTime() - today.getTime();
    const diffDays = diffTime / (1000 * 60 * 60 * 24);

    if(item.is_done){
      setUrgentLevel(0);
    }
    else if (diffDays <= 1) {
      setUrgentLevel(1);
        Animated.loop(
        Animated.sequence([
            Animated.timing(shakeAnim, { toValue: 1, duration: 50, useNativeDriver: true }),
            Animated.timing(shakeAnim, { toValue: -1, duration: 50, useNativeDriver: true }),
            Animated.timing(shakeAnim, { toValue: 0, duration: 50, useNativeDriver: true }),
        ]), {iterations: 10}
        ).start();
    }
    else if (diffDays <= 2) {
      setUrgentLevel(2);
        Animated.loop(
        Animated.sequence([
            Animated.timing(shakeAnim, { toValue: 1, duration: 200, useNativeDriver: true }),
            Animated.timing(shakeAnim, { toValue: -1, duration: 200, useNativeDriver: true }),
            Animated.timing(shakeAnim, { toValue: 0, duration: 200, useNativeDriver: true }),
        ]), {iterations: 3}
        ).start();
    }
    else{
      setUrgentLevel(0);
    }
  }, [item.deadline_date, item.is_done]);

  const rotate = urgentLevel <= 2? shakeAnim.interpolate({ inputRange: [-1, 1], outputRange: ["-1deg", "1deg"] }) : "0deg";

  // 旋轉效果 (current doing icon)
  const spinAnim = useRef(new Animated.Value(0)).current;
  const animationRef = useRef(null);

  useEffect(() => {
    if (!isEditing && item.current_doing) {
      spinAnim.setValue(0);

      animationRef.current = Animated.loop(
        Animated.timing(spinAnim, {
          toValue: 1,
          duration: 3000,
          easing: Easing.linear,
          useNativeDriver: true,
        })
      );

      animationRef.current.start();
    } else {
      if (animationRef.current) {
        animationRef.current.stop();
        animationRef.current = null;
      }
      spinAnim.setValue(0);
    }
  }, [item.current_doing, isEditing]);

  const spin = spinAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ["0deg", "360deg"],
  });
  

  // set color
  let bgColor = "#92a3ba";      // background color
  let bdColor = "#49515d";      // border color
  if (urgentLevel === 1) bgColor = "#F0716F", bdColor = "#a84f4d";
  else if (urgentLevel === 2) bgColor = "#F0B56F", bdColor = "#a87e4d";
  else if (item.display_order === -1) bgColor = "#E0E1ED", bdColor = "#b3b4bd";

  return (
    <Animated.View style={{ transform: [{ rotate }] }}>
    <TouchableOpacity
      style={[styles.container, { backgroundColor: isActive ? "#c2dfe3" : bgColor, borderColor: bdColor}]}
    >
      {/* left most: drag icon */}
      <TouchableOpacity
        onLongPress={item.is_done ? null : drag}
        style={{ padding: 6, opacity: item.is_done ? 0 : 1 }}
        delayLongPress={120}
      >
        <Icon name="drag-indicator" size={24} color="#1f1f1f" />
      </TouchableOpacity>


      {/* second: box */}
      {/* not editing -> select current doing */}
      {/* is editing -> show checkbox */}
      {!isEditing &&
        <TouchableOpacity
            onPress={() => onClickDoing(item)}
            style={[styles.doingBox, item.current_doing && styles.doingBoxChecked]}
        >
          {item.current_doing && 
            <Animated.View style={{
              transform: [{ rotate: spin }],
              justifyContent: 'center',
              alignItems: 'center',
              width: 24,
              height: 24,
            }}>
              <Icon name="autorenew" size={24} color="white" />
            </Animated.View>
          }
          {!item.current_doing &&
            <View style={{
              justifyContent: 'center',
              alignItems: 'center',
              width: 24,
              height: 24,
            }}>
              <Icon name="pause" size={24} color="#78797f" />
            </View>
          }
        </TouchableOpacity>
      }
      {isEditing && 
        <TouchableOpacity
            onPress={() => onClickCheckBox(item)}
            style={[styles.checkbox, item.is_done && styles.checkboxChecked]}
        >
            {item.is_done && <Text style={{ color: "#fff", fontWeight: "bold" }}>✓</Text>}
        </TouchableOpacity>
      }


      {/* third: item body: date & task name */}
      {/* when editing, click item body to modify item */}
      <TouchableOpacity
            onPress={() => {
              if (isEditing) {
                onClickEditBox(item);
              }
            }}
            style={styles.textContainer}
      >
        <Text style={[styles.dateText, item.is_done && { color: "#c9cad5"}]}>{item.deadline_date ?? ""}</Text>
        <Text style={[styles.taskText, item.is_done && { textDecorationLine: "line-through", color: "#b3b4bd"}]}>
          {item.thing}
        </Text>
      </TouchableOpacity>


      {/* fourth: is editing -> show remove icon */}
      {isEditing &&
        <TouchableOpacity
            onPress={() => onClickRemoveBox(item)}
            style={[styles.editingBox, {marginRight: urgentLevel == 1 || urgentLevel == 2? -17 : 12}]}
        >
            <Icon name="delete" size={24} color={"#707177"}/>
        </TouchableOpacity>
      }

      {/* visual effect: bomb */}
      {urgentLevel == 1 && 
        <Image source={require('../assets/images/bomb1.png')} style={[styles.bombImg, {top: -15}]}></Image>
      }
      {urgentLevel == 2 && 
        <Image source={require('../assets/images/bomb2.png')} style={[styles.bombImg, {bottom: -20}]}></Image>
      }
    </TouchableOpacity>
    </Animated.View>
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
    position: 'relative',
  },
  dragHandle: {
    width: 30,
    alignItems: "center",
    justifyContent: "center",
  },
  doingBox: {
    width: 24,
    height: 24,
    borderWidth: 1,
    borderColor: "#333",
    marginLeft: 3,
    marginRight: 12,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#c9cad5",
  },
  doingBoxChecked: {
    borderColor: "#4a9832",
    backgroundColor: "#78B17D",
  },
  checkbox: {
    width: 24,
    height: 24,
    borderWidth: 1,
    borderColor: "#333",
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
  bombImg: {
    height: 30,
    width: 30,
    right: -18
  },
});
