import React, { isValidElement, useEffect, useState, useRef } from "react";
import { View, Text, TouchableOpacity, StyleSheet, Modal, TextInput, Dimensions, Pressable, Platform } from "react-native";
import api from '../../api/api';
import PageTemplate from '@/components/page-template';
import DeadlineItem from "@/components/deadline-item";
import { useFocusEffect } from '@react-navigation/native';
import DraggableFlatList, { RenderItemParams } from "react-native-draggable-flatlist";
import Icon from 'react-native-vector-icons/MaterialIcons';
import ConfettiCannon from 'react-native-confetti-cannon';
import { useUser } from '../../context/UserContext';
import DateTimePicker from '@react-native-community/datetimepicker';

interface TodoItem {
  id: number;
  user_id: number;
  deadline_date?: string;
  thing: string;
  is_done: boolean;
  display_order: number;
  current_doing: boolean;
}

const SCREEN_WIDTH = Dimensions.get('window').width;
const SCREEN_HEIGHT = Dimensions.get('window').height;

export default function DeadlineListScreen() {
  const [deadlines, setDeadlines] = useState<TodoItem[]>([]);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showInfoModal, setShowInfoModal] = useState(true);
  const [showPicker, setShowPicker] = useState(false);
  const [newTask, setNewTask] = useState("");
  const [newDate, setNewDate] = useState("");
  const [editItemid, setEditItemid] = useState(-1);
  const [editing, setEditing] = useState(false);
  const [showConfetti, setShowConfetti] = useState(false);
  const { userId } = useUser();

  // === get deadlines from DB ===
    const fetchDeadlines = async () => {
    if (userId === null) return;
    try {
        // 傳遞 user_id 作為查詢參數
        const response = await api.get('/deadlines/get-deadlines', { params: { user_id: userId } });
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
        user_id: userId,
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
    if (userId === null) return;
    try{
      if(!item.is_done){
        setShowConfetti(true);
        setTimeout(() => {
          setShowConfetti(false);
        }, 4000);
      }
      const newData = deadlines.map((d) =>
        d.id === item.id ? { ...d, is_done: !d.is_done } : d
      );
      setDeadlines(newData);

      const body = {
        id: item.id,
        is_done: !item.is_done,
        user_id: userId
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

  // add item into db
  const submitNewDeadline = async () => {
    if (userId === null) return;
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

      const body = {
        user_id: userId,
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

      const body = {
        user_id: userId,
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
    await api.post("/deadlines/remove-item", {id: item.id, user_id: userId});
    fetchDeadlines();
  }

  // set current_doing
  const onClickDoing = async (item: TodoItem) => {
    if (userId === null) return;
    try{
      const newData = deadlines.map((d) =>
        d.id === item.id ? { ...d, current_doing: !d.current_doing } : d
      );
      setDeadlines(newData);

      const body = {
        id: item.id,
        current_doing: !item.current_doing,
        user_id: userId
      }
      await api.post("/deadlines/doing-item", body);
      fetchDeadlines();
    } catch (error){
      console.error("onClickDoing() in deadlineList.tsx: ", error);
    }
  };

  return (
    <PageTemplate title="任務清單" selectedTab="deadline">
      <View style = {styles.container}>
        {/* header: intro + edit button */}
        <View style = {styles.editContainer}>
          {!editing && <View>
            <Text style={{fontSize: 15}}>選擇現在要做的事情</Text>
            <Text style={{fontSize: 15}}>開始專注吧！</Text>
          </View>}
          {editing && <View>
            <Text style={{fontSize: 15}}>將完成的任務打勾刪除</Text>
            <Text style={{fontSize: 15}}>或是點擊名稱來修改任務吧！</Text>
          </View>}
          <TouchableOpacity onPress={onPressItem} style={{paddingLeft: 10}}>
            {!editing && <Icon name="edit" size={26} style={styles.editIcon} />}
            {editing && <Icon name="draw" size={26} style={styles.editIcon} />}
          </TouchableOpacity>
        </View>
        
        {/* deadline list */}
        {deadlines.length > 0 ? (
        <DraggableFlatList<TodoItem>
          data={deadlines.filter(item => editing || !item.is_done)}
          keyExtractor={(item) => item.id.toString()}
          onDragEnd={({ data }) => { updateOrder(data); }}
          renderItem={({ item, drag, isActive, getIndex }: RenderItemParams<TodoItem>) => (
            <DeadlineItem
              item={item}
              isActive={isActive}
              isEditing={editing == true}
              drag={drag}
              onClickCheckBox={onClickCheckBox}
              onClickDoing={onClickDoing}
              onClickEditBox={onClickEditBox}
              onClickRemoveBox={onClickRemoveBox}
            />
          )}
          activationDistance={10}
          style={[styles.deadlineContainer, {height: editing? "75%" : "85%"}]}
        />
        ) : (
          !editing && <Text style={{color:'#999', fontSize: 18, marginHorizontal: 10, marginTop: 20}}>哇你所有事情都做完了！恭喜你～</Text>
        )
        }

        {/* add button (show when editing) */}
        {editing &&
          <TouchableOpacity
            onPress={addItem}
            style={[styles.addBtn]}
          >
            <Text style={{ fontSize: 18 }}>+ 新增</Text>
          </TouchableOpacity>
        }

        {showConfetti && <ConfettiCannon count={100} origin={{ x: SCREEN_WIDTH/2, y: 0 }} fadeOut={true} />}

        {/* add new item window */}
        <Modal
          transparent={true}
          visible={showAddModal}
          animationType="fade"
        >
          <View style={styles.modalOverlay}>
            <View style={styles.modalContent}>

              <Text style={styles.modalTitle}>新增事項</Text>

              <Pressable onPress={() => setShowPicker(true)} style={{width: "100%", marginLeft: -30}}>
                <TextInput
                  placeholder="選擇日期"
                  value={newDate}
                  editable={false}
                  style={styles.input}
                />
              </Pressable>

              {showPicker && (
                <DateTimePicker
                  value={newDate ? new Date(newDate) : new Date()}
                  mode="date"
                  display="calendar"
                  onChange={(event, selectedDate) => {
                    setShowPicker(false);

                    if (selectedDate) {
                      const year = selectedDate.getFullYear();
                      const month = String(selectedDate.getMonth() + 1).padStart(2, "0");
                      const day = String(selectedDate.getDate()).padStart(2, "0");

                      setNewDate(`${year}-${month}-${day}`);
                    }
                  }}
                />
              )}

              <TextInput
                placeholder="輸入事項名稱"
                style={styles.input}
                value={newTask}
                onChangeText={setNewTask}
              />

              <View style={styles.modalButtons}>
                <TouchableOpacity
                  style={[styles.modalButton, { backgroundColor: "#c2dfe3" }]}
                  onPress={() => {
                    setShowAddModal(false);
                    setNewDate("");
                    setNewTask("");
                  }}
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
              <Pressable onPress={() => setShowPicker(true)} style={{width: "100%", marginLeft: -30}}>
                <TextInput
                  placeholder="選擇日期"
                  value={newDate}
                  editable={false}
                  style={styles.input}
                />
              </Pressable>

              {showPicker && (
                <DateTimePicker
                  value={newDate ? new Date(newDate) : new Date()}
                  mode="date"
                  display="calendar"
                  onChange={(event, selectedDate) => {
                    setShowPicker(false);

                    if (selectedDate) {
                      const year = selectedDate.getFullYear();
                      const month = String(selectedDate.getMonth() + 1).padStart(2, "0");
                      const day = String(selectedDate.getDate()).padStart(2, "0");

                      setNewDate(`${year}-${month}-${day}`);
                    }
                  }}
                />
              )}

              <TextInput
                placeholder={newTask}
                style={styles.input}
                value={newTask}
                onChangeText={setNewTask}
              />

              <View style={styles.modalButtons}>
                <TouchableOpacity
                  style={[styles.modalButton, { backgroundColor: "#c2dfe3" }]}
                  onPress={() => {
                    setShowEditModal(false);
                    setNewDate("");
                    setNewTask("");
                  }}
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

        {/* 使用說明 (之後刪) */}
        <Modal
          transparent={true}
          visible={showInfoModal}
          animationType="fade"
        >
          <View style={styles.modalOverlay}>
            <View style={styles.modalContent}>
              <Text style={styles.modalTitle}>使用說明(之後會刪掉)</Text> 
              <Text>- 一進來可以點每個任務左邊那個暫停符號，選擇現在要做的事情。現在正在做的事情會顯示loading 的icon</Text>
              <Text></Text>
              <Text>- 點擊右上角的編輯icon 會進入編輯模式</Text>
              <Text></Text>
              <Text>- 在編輯模式中可以點左邊的框框，把完成的事情打勾</Text>
              <Text></Text>
              <Text>- 或是點任務名稱來修改任務(改名稱、日期)、或是點右邊的垃圾桶來刪除任務</Text>
              <Text></Text>
              <Text>(現在安卓和iOS 都可以正常選擇日期！)</Text>
              <Text></Text>
              <TouchableOpacity
                style={[styles.modalButton, { backgroundColor: "#415a77" }]}
                onPress={async () => {
                  setShowInfoModal(false);
                }}
              >
                <Text style={[styles.btnText]}>關閉</Text>
              </TouchableOpacity>
            </View>
          </View>
        </Modal>
      </View>
    </PageTemplate>
  );
}


const styles = StyleSheet.create({
  container: {
    height: "100%",
    width: "100%",
    flex: 1,
    flexDirection: "column",
  },
  deadlineContainer: {
    width: "100%",
    paddingHorizontal: 10,
    marginBottom: 5,
    borderWidth: 0,
  },
  editContainer: {
    flexDirection: "row",
    height: 40,
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 20,
    marginBottom: 10,
  },
  editIcon: {
    height: 30,
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
    margin: 15,
    backgroundColor: "#fff"
  },
  input_calander: {
    width: "100%",
    borderWidth: 1,
    borderColor: "#ccc",
    paddingHorizontal: 4,
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
