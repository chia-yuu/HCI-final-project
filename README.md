# FocusMate
- [Environment setup](#environment-setup)
  * [Implementation plan](#implementation-plan)
  * [Pre-request](#pre-request)
  * [React Native + FastAPI + postgreSQL](#react-native--fastapi--postgresql)
- [React Native 小筆記 - 和HTML 對應的概念](#react-native-小筆記---和html-對應的概念)
- [Database 小筆記 - 從terminal 查看資料庫](#database-小筆記---從terminal-查看資料庫)

## Environment setup
### Implementation plan
- APP 前端：React Native
- 後端：FastAPI
- 資料庫：PostgreSQL


### Pre-request
1. 安裝docker desktop
2. 安裝node.js

### React Native + FastAPI + postgreSQL
#### 1. 下載專案
從我的[GitHub](https://github.com/chia-yuu/HCI-final-project?tab=readme-ov-file) 下載檔案。

```bash
git clone https://github.com/chia-yuu/HCI-final-project.git
```

#### 2. 設定IP
為了讓電腦和手機能順利連線，要確定你的**電腦和手機連的是同一個網路**！

在mobile/ 底下自己新增一個檔案`.env`，放入你的IP：
```
# in mobile/.env
API_URL=http://YOUR_IP:8000
```
例如：
```
API_URL=http://192.168.123.456:8000
```

#### 3. 安裝前端所需套件(Expo Go)

**在電腦**
```bash
cd HCI-final-project
npm install -g expo-cli

cd mobile
npm install                     # 安裝所需dependency
npm start                       # 開始執行app，terminal 會出現一個QR code
```

**在手機**

Google Play / App Store 下載Expo Go App，打開APP 用scan QR code 掃剛才電腦terminal 出現的QR code，就可以看到我們寫的APP 了！

**Troubleshooting**

如果你的手機出現一個黑色畫面寫這樣：
```
Welcome to Expo Start by creating a file in the
D:\chia yu\nycu\HCI\mobile\app directory.
Learn more about Expo Router in the documentation.

$ touch D:\chia yu\nycu\HCI\mobile\app/index.tsx
```
可以試試看去`mobile\app.json` line 44 改改看true / false：
```
"experiments": {
  "typedRoutes": false,   // 試試看true 改成false / false 改成true
  "reactCompiler": true
}
```
> reference: [Expo (SDK 51) not finding app/_layout.tsx in expo-router/entry.js](https://stackoverflow.com/questions/79147456/expo-sdk-51-not-finding-app-layout-tsx-in-expo-router-entry-js)

#### 4. 啟動Docker
打開docker desktop，然後在自己電腦的終端機輸入下列指令：
```bash
cd HCI-final-project
docker compose up --build
```

手機畫面就可以正常顯示並連接前後端了

## React Native 小筆記 - 和HTML 對應的概念
React Native 和HTML 的概念滿類似的，只是元素名稱不一樣：

**結構**
| React Native   | HTML                             | 說明                             |
| -------------- | -------------------------------- | -------------------------------- |
| `View`         | `<div>`                          | 最常見容器，做排版、包其他元素。    |
| `SafeAreaView` | `<div>`（帶瀏覽器安全區）          | 多用在 iOS，避免內容貼到瀏海區域。 |
| `ScrollView`   | `<div style="overflow: scroll">` | 可捲動的容器。                    |
| `FlatList`     | `<ul>` / `<div>` + JS 渲染列表    | 高效列表，用於大量資料。           |
| `SectionList`  | `<ul>`（有群組）                  | 有群組標題的列表。                 |

**文字**
| React Native | HTML                       | 說明                           |
| ------------ | -------------------------- | ---------------------------- |
| `Text`       | `<p>` / `<span>` / `<h1>`… | 所有文字都是 `Text`（沒有 h1、h2 等標籤）。 |
| `Image`      | `<img>`                    | 顯示圖片。                        |

**互動**
| React Native         | HTML                         | 說明                 |
| -------------------- | ---------------------------- | ------------------ |
| `Pressable`          | `<button>` / `<a>` / 任意可點擊元素 | 最通用的可點擊元件（建議新專案用）。 |
| `TouchableOpacity`   | `<button>`                   | 點擊後會變透明。           |
| `TouchableHighlight` | `<button>`（高亮）               | 點擊時背景變色。           |
| `TextInput`          | `<input>` / `<textarea>`     | 輸入文字用。             |
| `Switch`             | `<input type="checkbox">`    | ON/OFF 開關。         |
| `Button`             | `<button>`                   | 基本按鈕（樣式可客製化程度低）。   |

**React Native 特有(沒有對應的HTML)**
| React Native        | HTML | 說明                |
| ------------------- | ---- | ----------------- |
| `StatusBar`         |  無  | 控制手機狀態列（時間、電量那條）。 |
| `Modal`             |  無  | 全螢幕彈窗。            |
| `ActivityIndicator` |  無  | loading spinner。  |

## Database 小筆記 - 從terminal 查看資料庫
```pgsql
/* 用terminal 開啟postgreSQL */
docker exec -it focus_db psql -U postgres -d focusmate


/* 查看有哪些table */
focusmate=# \dt

         List of relations
 Schema | Name  | Type  |  Owner
--------+-------+-------+----------
 public | items | table | postgres
(1 row)


/* 查看items 這個table 的schema */
focusmate=# \d items

                            Table "public.items"
 Column |  Type   | Collation | Nullable |              Default
--------+---------+-----------+----------+-----------------------------------
 id     | integer |           | not null | nextval('items_id_seq'::regclass)
 title  | text    |           | not null |
 done   | boolean |           |          | false
Indexes:
    "items_pkey" PRIMARY KEY, btree (id)


/* 執行SQL query */
focusmate=# SELECT * FROM items;

 id |   title   | done 
----+-----------+------
  1 | test      | f
  2 | Gwalalala | f
  3 | Wow       | f
  4 | Success?  | f
  6 | Try       | f
  7 | Hahaha    | f
  8 | What      | f
(7 rows)


/* 退出 */
focusmate=# \q
```
