# FocusMate
- [Environment setup](#environment-setup)
  * [Implementation plan](#implementation-plan)
  * [Pre-request](#pre-request)
    + [1. 安裝docker desktop](#1-安裝docker-desktop)
    + [2. 安裝node.js](#2-安裝nodejs)
  * [React Native + FastAPI + postgreSQL](#react-native--fastapi--postgresql)
    + [1. 下載專案](#1-下載專案)
    + [2. 設定IP](#2-設定ip)
    + [3. 安裝前端所需套件(Expo Go)](#3-安裝前端所需套件expo-go)
    + [4. 啟動Docker](#4-啟動docker)
    + [Docker 小筆記：開啟 / 關掉docker](#docker-小筆記開啟--關掉docker)
  * [之後每次要開啟專案](#之後每次要開啟專案)
- [React Native 小筆記 - 和HTML 對應的概念](#react-native-小筆記---和html-對應的概念)
- [Database 小筆記 - 從terminal 查看資料庫](#database-小筆記---從terminal-查看資料庫)

## Environment setup
### Implementation plan
- APP 前端：React Native
- 後端：FastAPI
- 資料庫：PostgreSQL


### Pre-request
#### 1. 安裝docker desktop

專業版：Docker 是今日相當常見的程式部署方案，可輕易的在不同電腦中建立相同的操作環境，避免環境不同造成實作上的困擾，並獲得相較虛擬機器更佳的執行效能。

白話版：這次用到的 backend(fastAPI) & PostgreSQL 是裝在docker 裡面的

Windows:

[Install Docker Desktop on Windows](./Install%20docker%20-%20wins.md)

Mac:  
[Install Docker Desktop on Mac (官方英文文件)](https://docs.docker.com/desktop/setup/install/mac-install/)

[Install Docker Desktop on Mac (中文)](https://dockerdocs.tw/desktop/setup/install/mac-install/)

> Windows 的是我從其他課的講義複製過來的，照著做應該就能裝起來了。Mac 的是官方文件，但應該也算清楚，我之前在Mac 裝印象中滿好裝的，比Windows 簡單多了，應該也不會太難。

#### 2. 安裝node.js
之後要用到npm install

[NodeJS、npm 的安裝與配置](https://hackmd.io/@kenny88881234/Hyz69OXJB)

> 我只是隨便網路找了一篇，我沒有照著這篇裝過，但node.js 也滿好裝的，只是單純下載 + 設定環境變數，網路也有很多很多教學可以參考～


### React Native + FastAPI + postgreSQL
好欸終於進入正題
#### 1. 下載專案
從我的[GitHub](https://github.com/chia-yuu/HCI-final-project?tab=readme-ov-file) 下載檔案。

```bash
git clone https://github.com/chia-yuu/HCI-final-project.git
```

檔案大致架構如下：
```
HCI-final-project/
│
├── backend/                        # FastAPI backend
│   ├── Dockerfile
│   ├── main.py
│   └── requirements.txt
│
├── mobile/                       # Expo React Native app
│   ├── api/
│   ├── app/
|   |   ├── (tabs)                # App 的每個頁面
|   |   |   ├── _layout.tsx
|   |   |   ├── deadline.tsx      # 任務清單
|   |   |   ├── explore.tsx
|   |   |   ├── focusMode.tsx     # 專注模式
|   |   |   ├── friendList.tsx    # 好友列表
|   |   |   ├── index.tsx
|   |   |   └── myRecord.tsx      # 我的紀錄
|   |   ├── _layout.tsx
|   |   └── modal.tsx
|   ├── components/
|   ├── .env                      # 沒有在GitHub 上，是下一步設定IP 那裡你自己新增的
│   ├── package.json
│   ├── app.json
│   └── ...
│
├── docker-compose.yml
└── README.md
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

這個`.env` 有被加入`.gitignore`，所以不會上傳到github，你的IP 是安全的

> 怎麼看IP  
> Windows: `ipconfig`  
> Mac: `ifconfig`
>
> Windows 的範例輸出
> ```
> 無線區域網路介面卡 Wi-Fi:     <--- 注意名字，是要找Wi-Fi 不是乙太網路
>
>  連線特定 DNS 尾碼 . . . . . . . . :
>  連結-本機 IPv6 位址 . . . . . . . : xxxx::xxxx:xxxx:xxxx:xxxxxxx
>  IPv4 位址 . . . . . . . . . . . . : 192.xxx.xxx.xxx      <--- IPv4 就是我們要的IP address
>  子網路遮罩 . . . . . . . . . . . .: 255.xxx.xxx.xxx
>  預設閘道 . . . . . . . . . . . . .: 192.xxx.xxx.xxx
> ```

#### 3. 安裝前端所需套件(Expo Go)
在手機上可以打開我們寫的APP。

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

> 因為docker 還沒開始跑(還沒有server)，所以現在看到的畫面只有單純前端UI，沒有任何功能，也不能連結資料庫，所以如果這時候看到terminal 有報錯說`LOG  GET /items error: [AxiosError: Network Error]` 這是正常的！因為他找不到資料庫、抓不到資料。

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
因為我一開始這裡是true，結果第二天打開APP 就連不上了QAQ，結果這裡改成false 就好了，我也不懂為什麼==
> reference: [Expo (SDK 51) not finding app/_layout.tsx in expo-router/entry.js](https://stackoverflow.com/questions/79147456/expo-sdk-51-not-finding-app-layout-tsx-in-expo-router-entry-js)

#### 4. 啟動Docker
打開docker desktop，然後在自己電腦的終端機輸入下列指令：
```bash
cd HCI-final-project
docker compose up --build
```
第一次跑因為要安裝FastAPI、PostgreSQL 等東西，可能要等一下下。

等他跑完，你的手機APP 應該可以看到Items from Database 的畫面，中間列表就是現在資料庫有的東西，下面輸入框可以新增東西。能新增東西(沒有出現`LOG GET /items error: [AxiosError: Network Error]` 之類的**GET** 相關error) 就表示資料可以傳進資料庫，能在列表中看到Item (沒有出現`LOG POST /items error: [AxiosError: Network Error]` 之類的**POST** 相關error) 就表示前端可以順利從後端拿到資料。

手機畫面正常顯示就完成了！恭喜你～～

#### Docker 小筆記：開啟 / 關掉docker
有專業版本跟無腦照做版本，不想理解只是想簡單把project 做完的可以看無腦照做版本就好了

**1. 專業版本：**

|             指令             |             功能             |
| --------------------------- | ---------------------------- |
| `docker compose up --build` | build image 並啟動服務，**會**在terminal 顯示log |
| `docker compose up -d --build` | build image 並啟動服務，**不會**在terminal 顯示log |
| `Ctrl + C`                  | 停掉正在前台執行的服務，等同`docker compose down` |
| `docker compose down`       | 停掉並刪掉容器（docker desktop 裡面看不到該容器）|
| `docker compose up -d`      | 背景啟動服務 |
| `docker compose stop`       | 停止容器但不刪掉（docker desktop 還是看的到容器，只是被暫停了） |
| `docker compose start`      | 重新啟動已存在容器 |

**2. 無腦照做版本：**

1. 打開docker desktop (每一次要用docker 都要開，就算你都是輸指令還是要開)
2. 進到專案資料夾(有`docker-compose.yml` 的資料夾)：`cd HCI-final-project`
3. 第一次啟動服務：`docker compose up --build`
4. 之後啟動服務：`docker compose start` 或是從docker desktop 按開始鍵
5. 關閉服務：`docker compose stop` 或是從docker desktop 按暫停鍵

### 之後每次要開啟專案
前面Environment setup 建立好環境，之後就照下面這樣就可以開啟app 啦，不用再像上面那麼麻煩了

1. 電腦打開docker desktop
2. 開啟後端伺服器(docker container)
    ```
    cd HCI-final-project
    docker compose start
    ```
3. 開啟前端伺服器(Expo Go)
    ```
    cd HCI-final-project\modile
    npm start
    ```
4. 手機開啟Expo Go App，即可看到完整App！


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
