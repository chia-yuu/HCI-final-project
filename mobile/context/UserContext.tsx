import React, { createContext, useState, useContext, ReactNode } from 'react';
import { router } from 'expo-router'; // 👈 [新增] 匯入 router 用於導航

interface UserContextType {
  userId: number | null;
  // 💡 setUserId 的名稱可以保持不變，但實作將包含導航邏輯
  setUserId: (id: number) => void; 
}

// 建立 Context
const UserContext = createContext<UserContextType | undefined>(undefined);

export const UserProvider = ({ children }: { children: ReactNode }) => {
  const [userId, setUserIdState] = useState<number | null>(null); // 💡 將 setUserId 更名為 setUserIdState

  // 💡 [修改] 新增包含導航邏輯的函式
  const setUserIdAndNavigate = (id: number) => {
    // 1. 設定 State
    setUserIdState(id);
    
    // 2. 導航到主應用程式 (Tab) 頁面
    // 使用 replace 是為了防止使用者按「上一頁」回到 User 選擇畫面
    router.replace('/(tabs)/'); 
  };

  return (
    <UserContext.Provider value={{ userId, setUserId: setUserIdAndNavigate }}>
      {children}
    </UserContext.Provider>
  );
};

export const useUser = () => {
  const context = useContext(UserContext);
  if (context === undefined) {
    throw new Error('useUser must be used within a UserProvider');
  }
  return context;
};