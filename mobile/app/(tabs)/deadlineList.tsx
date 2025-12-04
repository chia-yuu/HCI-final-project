import React, { isValidElement, useEffect, useState } from "react";
import { View, Text, TouchableOpacity, StyleSheet, Modal, TextInput } from "react-native";
import api from '../../api/api';
import PageTemplate from '@/components/page-template';
import DeadlineItem from "@/components/deadline-item";
import { ThemedText } from '@/components/themed-text';
import { useFocusEffect } from '@react-navigation/native';
import DraggableFlatList, { RenderItemParams } from "react-native-draggable-flatlist";
import { Background } from "@react-navigation/elements";
import { setStatusBarBackgroundColor } from "expo-status-bar";

interface TodoItem {
  id: number;
  user_id: number;
  deadline_date?: string;
  thing: string;
  is_done: boolean;
  display_order: number;
}

export default function DeadlineListScreen() {
  const [deadlines, setDeadlines] = useState<TodoItem[]>([]);
  const [showAddModal, setShowAddModal] = useState(false);
  const [newTask, setNewTask] = useState("");
  const [newDate, setNewDate] = useState("");
  const [editing, setEditing] = useState(false);

  // === get deadlines from DB ===
  const fetchDeadlines = async () => {
    try {
      const response = await api.get('/deadlines/get-deadlines');
      const todos = response.data.filter((item: TodoItem) => !item.is_done);
      setDeadlines(todos);
    } catch (error) {
      console.error("fetchDeadlines() in deadlineList.tsx: 抓不到清單: ", error);
    }
  };

  useFocusEffect(
      React.useCallback(() => {
        fetchDeadlines();
      }, [])
  );

  // === reorder ===
  const updateOrder = async (newData: TodoItem[]) => {
    try {
      setDeadlines(newData);

      const body = newData.map((item, index) => ({
        id: item.id,
        user_id: item.user_id,
        display_order: index + 1,
      }));

      // console.log(body);

      await api.post("/deadlines/reorder", body);

      fetchDeadlines();

    } catch (error) {
      console.error("updateOrder() in deadlineList.tsx: ", error);
    }
  };

  // === click check box, modify is_done ===
  const onClickCheckBox = async (item: TodoItem) => {
    try{
      const newData = deadlines.map((d) =>
        d.id === item.id ? { ...d, is_done: !d.is_done } : d
      );
      setDeadlines(newData);

      const body = {
        id: item.id,
        is_done: !item.is_done
      }
      // console.log(body);
      await api.post("/deadlines/click-done", body);

      fetchDeadlines();
    } catch (error){
      console.error("onClickCheckBox() in deadlineList.tsx: ", error);
    }
  };

  // 🟦 4. 點擊項目 → 編輯頁面
  const onPressItem = (item: TodoItem) => {
    if (!editing) return;
    // TODO: navigation.navigate("EditDeadline", { id })
  };


  // === add item ===
  const addItem = () => {
    setShowAddModal(true);
  }

  function is_valid_date(dateStr: string) {
    if (!/^\d{4}-\d{2}-\d{2}$/.test(dateStr)){
      alert("日期格式應為YYYY-MM-DD");
      return false;
    }

    const date = new Date(dateStr);
    if (isNaN(date.getTime())){
      alert("請輸入合法日期");
      return false;
    }

    const [year, month, day] = dateStr.split("-").map(Number);

    return (
      date.getUTCFullYear() === year &&
      date.getUTCMonth() + 1 === month &&
      date.getUTCDate() === day
    );
  }

  // add item into db
  const submitNewDeadline = async () => {
    try {
      // check input valid
      if (!newTask.trim()) {
        alert("請填寫事項名稱！");
        return;
      }
      if(!newDate.trim()){
        alert("請填寫截止日期！");
        return;
      }
      if(!is_valid_date(newDate.trim())){
        alert("請輸入合法日期");
        return;
      }

      const body = {
        task: newTask,
        deadline_date: newDate,
        is_done: false,
      };

      await api.post("/deadlines/add-item", body);

      setShowAddModal(false);
      setNewTask("");
      setNewDate("");

      fetchDeadlines();
    } catch (error) {
      console.error("submitNewDeadline() in deadlineList.tsx: ", error);
    }
  }


  return (
    <PageTemplate title="任務清單" selectedTab="deadline">
      {/* <TouchableOpacity onPress={() => setEditing(!editing)}>
        <Text style={styles.editBtn}>{editing ? "完成" : "編輯"}</Text>
      </TouchableOpacity> */}
      <View style = {styles.container}>
        <DraggableFlatList<TodoItem>
          data={deadlines}
          keyExtractor={(item) => item.id.toString()}
          onDragEnd={({ data }) => { updateOrder(data); }}
          renderItem={({ item, drag, isActive, getIndex }: RenderItemParams<TodoItem>) => (
            <DeadlineItem
              item={item}
              isActive={isActive}
              drag={drag}
              onClickCheckBox={onClickCheckBox}
              onPressItem={onPressItem}
            />
          )}
          activationDistance={10}
          style={styles.dragListContainer}
        />

        <TouchableOpacity
          onPress={addItem}
          style={[styles.addBtn]}
        >
          <Text style={{ fontSize: 18 }}>+ 新增</Text>
        </TouchableOpacity>

        <Modal
          transparent={true}
          visible={showAddModal}
          animationType="fade"
        >
          <View style={styles.modalOverlay}>
            <View style={styles.modalContent}>
              <Text style={styles.modalTitle}>新增事項</Text>

              <TextInput
                placeholder="輸入事項名稱"
                style={styles.input}
                value={newTask}
                onChangeText={setNewTask}
              />

              <TextInput
                placeholder="輸入截止日期 (YYYY-MM-DD)"
                style={[styles.input, {marginBottom: 15}]}
                value={newDate}
                onChangeText={setNewDate}
              />

              <View style={styles.modalButtons}>
                <TouchableOpacity
                  style={[styles.modalButton, { backgroundColor: "#c2dfe3" }]}
                  onPress={() => setShowAddModal(false)}
                >
                  <Text style={styles.btnText}>取消</Text>
                </TouchableOpacity>
                
                <TouchableOpacity
                  style={[styles.modalButton, { backgroundColor: "#415a77" }]}
                  onPress={async () => {
                    await submitNewDeadline();
                  }}
                >
                  <Text style={[styles.btnText]}>新增</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </Modal>
      </View>
    </PageTemplate>
  );
}


const styles = StyleSheet.create({
  container: {
    // backgroundColor: "green",
    height: "100%",
    width: "100%",
    paddingVertical: 10,
  },
  dragListContainer: {
    // backgroundColor: "black",
    width: "100%",
    maxHeight: "100%",
    paddingHorizontal: 10,
    marginBottom: 5,
  },
  editBtn: {
    fontSize: 18,
    color: "#3B82F6",
  },
  addBtn: {
    marginTop: 16,
    marginHorizontal: 10,
    padding: 15,
    backgroundColor: "#D1D5DB",
    borderRadius: 12,
    alignItems: "center",
  },
  input: {
    width: "100%",
    borderWidth: 1,
    borderColor: "#ccc",
    padding: 10,
    borderRadius: 8,
    marginTop: 15,
    backgroundColor: "#fff"
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center'
  },
  modalContent: {
    width: '80%',
    backgroundColor: '#809bb9ff',
    padding: 25,
    borderRadius: 10,
    alignItems: 'center',
    borderWidth: 1, 
    borderColor: '#ccc'
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 10 ,
    color:'#0D1B2A'
  },
  modalButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '100%'
  },
  modalButton: {
    padding: 12,
    borderRadius: 5,
    width: '45 %',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#999'
  },
  btnText: {
    fontWeight: 'bold',
    fontSize: 14
  }
});
