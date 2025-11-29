import React, { useState, useEffect } from "react";
import api from "./api/axios";

function App() {
  const [items, setItems] = useState([]); // 從後端拿到的資料
  const [title, setTitle] = useState(""); // 新增項目輸入欄位

  // Component 載入時，取得後端資料
  useEffect(() => {
    api.get("/items")
      .then((res) => setItems(res.data))
      .catch((err) => console.error("GET /items error:", err));
  }, []);

  // 新增一筆 item
  const addItem = () => {
    if (!title) return;
    api.post("/items", { title, done: false })
      .then((res) => {
        setItems((prev) => [...prev, res.data]);
        setTitle(""); // 清空輸入欄
      })
      .catch((err) => console.error("POST /items error:", err));
  };

  return (
    <div style={{ padding: "20px" }}>
      <h1>React + FastAPI + PostgreSQL</h1>

      <div>
        <input
          type="text"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="New item"
        />
        <button onClick={addItem}>Add</button>
      </div>

      <ul>
        {items.map((item) => (
          <li key={item.id}>
            {item.title} {item.done ? "(Done)" : ""}
          </li>
        ))}
      </ul>
    </div>
  );
}

export default App;
