# FocusMate
## Environment setup
哇裝環境真的好可怕啊啊啊啊，我不會弄環境 我不會docker，好可怕啊啊啊，嗚嗚嗚Ethon 救我QQ

### Implementation plan
- APP 前端：React Native
- 前後端連結：axios
- 後端：fastAPI
- 資料庫：postgreSQL
- ~~網頁前端：React~~

#### 觀念釐清

我們之前說要用React 做APP，應該指的是**React Native**，React 做出來的話會是一個"web APP"，是寫HTML、用電腦瀏覽器打開的網頁；React Native 跟React 很像，但是他可以寫跨平台手機 App（iOS & Android），可以用手機APP 打開，像是一個真正的APP 而不是網頁。


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
從我的[github](https://github.com/chia-yuu/HCI-final-project?tab=readme-ov-file) 下載檔案。

```bash
git clone https://github.com/chia-yuu/HCI-final-project.git
```

檔案大致架構如下：
```
HCI-final-project/
│
├── backend/                # FastAPI backend
│   ├── Dockerfile
│   ├── main.py
│   └── requirements.txt
│
├── mobile/                 # Expo React Native app
│   ├── api/
|   |   └── api.js          # need to modify：要改成你自己的電腦 IP！！！
│   ├── app/                # App 相關的檔案
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
>  IPv4 位址 . . . . . . . . . . . . : 192.168.xxx.xxx      <--- IPv4 就是我們要的IP address
>  子網路遮罩 . . . . . . . . . . . .: 255.xxx.xxx.xxx
>  預設閘道 . . . . . . . . . . . . .: 192.xxx.xxx.xxx
> ```

<!-- #### 1. 初始化React 專案 (我已經弄好了，不用做)
```bash
cd frontend
npx create-react-app .
```
看到`Happy hacking!` 就是裝好了，過程中有出現`9 vulnerabilities (3 moderate, 6 high)` 之類的可以不用管他，最後提示`npm start` 不用理他，可以直接開始弄docker。

這個是要建立`frontend/` 那些資料夾架構、package.json 那些用的。

這個是網頁前端的，這次project 不需要-->

<!-- #### 3. 安裝frontend 所需套件
```bash
cd HCI-final-project\mobile
npm install
``` -->

#### 3. 安裝前端所需套件(Expo Go)
在手機上可以打開我們寫的APP。

**在電腦**
```bash
cd HCI-final-project
npm install -g expo-cli
# npx create-expo-app mobile    # 建立app frontend 的資料夾 (這個我已經做完了，你們不用做)

cd mobile
npm install                     # 你們要做的是這個，安裝所需dependency
npm start                       # 開始執行app，terminal 會出現一個QR code
```

**在手機**

Google Play / App Store 下載Expo Go App，打開APP 用scan QR code 掃剛才電腦terminal 出現的QR code，就可以看到我們寫的APP 了！

> 因為docker 還沒開始跑(還沒有server)，所以現在看到的畫面只有單純前端UI，沒有任何功能，也不能連結資料庫，所以如果這時候看到terminal 有報錯說`LOG  GET /items error: [AxiosError: Network Error]` 這是正常的！因為他找不到資料庫、抓不到資料。


#### 4. 啟動Docker
打開docker desktop，然後在自己電腦的終端機輸入下列指令：
```bash
cd HCI-final-project
docker compose up --build
```
第一次跑因為要安裝FastAPI、PostgreSQL 等東西，可能要等一下下。

等他跑完，你的手機APP 應該可以看到Items from Database 的畫面，中間列表就是現在資料庫有的東西，下面輸入框可以新增東西。能新增東西(沒有出現`LOG GET /items error: [AxiosError: Network Error]` 之類的**GET** 相關error) 就表示資料可以傳進資料庫，能在列表中看到Item (沒有出現`LOG POST /items error: [AxiosError: Network Error]` 之類的**POST** 相關error) 就表示前端可以順利從後端拿到資料。

手機畫面正常顯示就完成了！恭喜你～～

<!-- 會看到`focus_backend` & `focus_db` 各自的log (很長很長)，這兩個就是這次project 用到的服務。 -->


<!-- #### 測試有沒有裝成功 (可略過)

在瀏覽器輸入下列網址，有出現畫面或文字就表示對應的服務有成功裝好跑起來
|          網址          |                              預期結果                              | 為什麼會有這個畫面 |
| ---------------------- | ----------------------------------------------------------------- | --- |
| http://localhost:8000/ | 醜醜JSON：`{"message":"Backend is running!"}` | `backend/main.py` 寫的，表示FastAPI 後端正常運作 |
| http://localhost:8000/db-test | 醜醜JSON：`{"db":"connected","result":[{"?column?":1}]}` | `backend/main.py` 寫的，表示FastAPI 能連上PostgreSQL |
| http://localhost:8000/docs | FastAPI 的官方生成的API 文件頁面，會顯示目前所有endpoint(`GET /root`, `GET /db-test`, `GET /items`, `POST /items`) | `backend/main.py` 寫的，每一個`@app.get` / `@app.post` 就是建立一個endpoint，可以用`http://localhost:8000/XXX` 連到 | -->

#### Docker 小筆記：開啟 / 關掉docker
有專業版本、白話版本、無腦照做版本，不想理解只是想簡單把project 做完的可以看無腦照做版本就好了

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

**2. 白話版本：**

第一次做要`docker compose up --build`，之後除非有修改docker 相關的檔案(ex, 新安裝東西、改變設定之類的)，不然如果只是一般寫程式的話不用重新build

docker 跑起來後可以從terminal 看到他的log，或是如果指令裡有`-d` 就會在背景跑，要看log 的話可以去docker desktop 看

啟動 / 停止容器的指令兩兩一組，如果用`docker compose down` 停止服務的話下次就用`docker compose up -d` 啟動，如果用`docker compose stop` 停止的話下次就用`docker compose start` 啟動，兩組指令的功能差不多，所以記指令只要記一組你喜歡的就好了

或是如果不想背指令的話也可以直接從docker desktop 按按鈕，第一次build 完之後就用Actions 那個按鈕開始、結束

**3. 無腦照做版本：**

1. 打開docker desktop (每一次要用docker 都要開，就算你都是輸指令還是要開)
2. 進到專案資料夾(有`docker-compose.yml` 的資料夾)：`cd HCI`
3. 第一次啟動服務：`docker compose up --build`
4. 之後啟動服務：`docker compose start` 或是從docker desktop 按開始鍵
5. 關閉服務：`docker compose stop` 或是從docker desktop 按暫停鍵

### 之後每次要開啟專案
前面Environment setup 建立好環境，之後就照下面這樣就可以開啟app 啦，不用再向上面那麼麻煩了

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