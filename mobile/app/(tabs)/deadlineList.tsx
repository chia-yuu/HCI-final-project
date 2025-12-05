import React, { isValidElement, useEffect, useState } from "react";
import { View, Text, TouchableOpacity, StyleSheet, Modal, TextInput, Animated } from "react-native";
import api from '../../api/api';
import PageTemplate from '@/components/page-template';
import DeadlineItem from "@/components/deadline-item";
import { useFocusEffect } from '@react-navigation/native';
import DraggableFlatList, { RenderItemParams } from "react-native-draggable-flatlist";
import Icon from 'react-native-vector-icons/MaterialIcons';
import ConfettiCannon from 'react-native-confetti-cannon';

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
  const [showEditModal, setShowEditModal] = useState(false);
  const [newTask, setNewTask] = useState("");
  const [newDate, setNewDate] = useState("");
  const [editItemid, setEditItemid] = useState(-1);
  const [editing, setEditing] = useState(false);
  const [exploded, setExploded] = useState(false);
  const scale = new Animated.Value(1);

  // === get deadlines from DB ===
  const fetchDeadlines = async () => {
    try {
      const response = await api.get('/deadlines/get-deadlines');
      // const todos = response.data.filter((item: TodoItem) => !item.is_done);
      setDeadlines(response.data);
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


  // === add item ===
  const addItem = () => {
    setShowAddModal(true);
  }

  function is_valid_date(dateStr: string) {
    if (!/^\d{4}-\d{1,2}-\d{1,2}$/.test(dateStr)){
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


  // === edit ===
  const onPressItem = () => {
    setEditing(!editing);
    if (!editing) return;
  };

  const onClickEditBox = async (item: TodoItem) => {
    setEditItemid(item.id);
    setNewTask(item.thing);
    setNewDate(item.deadline_date);
    setShowEditModal(true);
  };

  const submitEditDeadline = async () => {
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
        return;
      }

      const body = {
        id: editItemid,
        task: newTask,
        deadline_date: newDate,
      };

      await api.post("/deadlines/edit-item", body);

      setEditItemid(-1);
      setNewTask("");
      setNewDate("");
      setShowEditModal(false);

      fetchDeadlines();
    } catch (error) {
      console.error("submitEditDeadline() in deadlineList.tsx: ", error);
    }
  }

  // remove
  const onClickRemoveBox = async (item: TodoItem) => {
    await api.post("/deadlines/remove-item", {id: item.id});
    fetchDeadlines();
  }

  return (
    <PageTemplate title="任務清單" selectedTab="deadline">
      <View style = {styles.container}>
        <View style = {styles.editContainer}>
          <TouchableOpacity onPress={onPressItem} style={{paddingLeft: 10}}>
            {!editing && <Icon name="edit" size={26} style={styles.editIcon} />}
            {editing && <Icon name="draw" size={26} style={styles.editIcon} />}
          </TouchableOpacity>
        </View>
        
        <DraggableFlatList<TodoItem>
          data={deadlines}
          keyExtractor={(item) => item.id.toString()}
          onDragEnd={({ data }) => { updateOrder(data); }}
          renderItem={({ item, drag, isActive, getIndex }: RenderItemParams<TodoItem>) => (
            <DeadlineItem
              item={item}
              isActive={isActive}
              isEditing={editing == true}
              drag={drag}
              onClickCheckBox={onClickCheckBox}
              onClickEditBox={onClickEditBox}
              onClickRemoveBox={onClickRemoveBox}
            />
          )}
          activationDistance={10}
          style={[styles.deadlineContainer, {height: editing? "80%" : "90%"}]}
        />

        {editing &&
          <TouchableOpacity
            onPress={addItem}
            style={[styles.addBtn]}
          >
            <Text style={{ fontSize: 18 }}>+ 新增</Text>
          </TouchableOpacity>
        }

        {/* add new item window */}
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

        {/* edit item window */}
        <Modal
          transparent={true}
          visible={showEditModal}
          animationType="fade"
        >
          <View style={styles.modalOverlay}>
            <View style={styles.modalContent}>
              <Text style={styles.modalTitle}>編輯事項</Text>

              <TextInput
                placeholder={newTask}
                style={styles.input}
                value={newTask}
                onChangeText={setNewTask}
              />

              <TextInput
                placeholder={newDate}
                style={[styles.input, {marginBottom: 15}]}
                value={newDate}
                onChangeText={setNewDate}
              />

              <View style={styles.modalButtons}>
                <TouchableOpacity
                  style={[styles.modalButton, { backgroundColor: "#c2dfe3" }]}
                  onPress={() => setShowEditModal(false)}
                >
                  <Text style={styles.btnText}>取消</Text>
                </TouchableOpacity>
                
                <TouchableOpacity
                  style={[styles.modalButton, { backgroundColor: "#415a77" }]}
                  onPress={async () => {
                    await submitEditDeadline();
                  }}
                >
                  <Text style={[styles.btnText]}>更新</Text>
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
    // paddingVertical: 10,
    flex: 1,
    flexDirection: "column"
  },
  deadlineContainer: {
    // backgroundColor: "black",
    width: "100%",
    paddingHorizontal: 10,
    marginBottom: 5,
    borderWidth: 0,
  },
  editContainer: {
    height: 30,
    alignItems: "flex-end",
    paddingHorizontal: 10,
    marginBottom: 10,
  },
  editIcon: {
    flex: 1,
    height: "100%",
    backgroundColor: "white",
    color: "black",
    borderRadius:6,
    borderColor: "black",
    borderWidth: 1
  },
  addBtn: {
    height: 60,
    marginTop: 16,
    marginHorizontal: 10,
    padding: 15,
    backgroundColor: "#B9C2D4",
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#949ba9",
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
