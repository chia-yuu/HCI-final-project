# FocusMate
## Environment setup
哇裝環境真的好可怕啊啊啊啊，我不會弄環境 我不會docker，好可怕啊啊啊，嗚嗚嗚Ethon 救我QQ

### Pre-request
#### 1. 安裝docker desktop

Docker 是今日相當常見的程式部署方案，可輕易的在不同電腦中建立相同的操作環境，並獲得相較虛擬機器更佳的執行效能。

Windows: [Install Docker Desktop on Windows](./Install%20docker%20-%20wins.md)

Mac:  
[Install Docker Desktop on Mac (官方英文文件)](https://docs.docker.com/desktop/setup/install/mac-install/)
[Install Docker Desktop on Mac (中文)](https://dockerdocs.tw/desktop/setup/install/mac-install/)

> Windows 的是我從其他課的講義複製過來的，照著做應該就能裝起來了。Mac 的是官方文件，但應該也算清楚，我之前在Mac 裝印象中滿好裝的，比Windows 簡單多了，應該也不會太難。

#### 2. 安裝node.js
因為一開始建立環境有要用到npm install，所以還是要在本機裝node.js (對我不知道為什麼他不能放到docker 裡面，隨便)

[NodeJS、npm 的安裝與配置](https://hackmd.io/@kenny88881234/Hyz69OXJB)

> 我只是隨便網路找了一篇，我沒有照著這篇裝過，但node.js 也滿好裝的，只是單純下載 + 設定環境變數，網路也有很多很多教學可以參考～


### Docker
好欸終於進入正題
#### 0. 下載專案
```bash
git clone
```

#### 1. 初始化React 專案 (我已經弄好了，不用做)
```bash
cd frontend
npx create-react-app .
```
看到`Happy hacking!` 就是裝好了，過程中有出現`9 vulnerabilities (3 moderate, 6 high)` 之類的可以不用管他，最後提示`npm start` 不用理他，可以直接開始弄docker。

這個是要建立`frontend/` 那些資料夾架構、package.json 那些用的。

#### 2. 安裝axios (從這裡開始！)
```bash
cd frontend
npm install axios
```

#### 3. 啟動Docker
```bash
cd HCI
docker compose up --build
```
第一次跑因為要安裝React、FastAPI、PostgreSQL，可能要等一下下。

會看到`focus_frontend`, `focus_backend`, `focus_db` 各自的log (很長很長)，這三個就是這次project 用到的三個服務。


### 測試有沒有裝成功 (可略過)

在瀏覽器輸入下列網址，有出現畫面或文字就表示對應的服務有成功裝好跑起來
|          網址          |                              預期結果                              | 為什麼會有這個畫面 |
| ---------------------- | ----------------------------------------------------------------- | --- |
| http://localhost:8000/ | 醜醜JSON：{"message":"Backend is running!"} | `backend/main.py` 寫的，表示FastAPI 後端正常運作 |
| http://localhost:8000/db-test | 醜醜JSON：{"db":"connected","result":[{"?column?":1}]} | `backend/main.py` 寫的，表示FastAPI 能連上PostgreSQL |
| http://localhost:8000/docs | FastAPI 的官方生成的API 文件頁面，會顯示目前所有endpoint(`GET /root`, `GET /db-test`, `GET /items`, `POST /items`) | `backend/main.py` 寫的，每一個`@app.get` / `@app.post` 就是建立一個endpoint，可以用`http://localhost:8000/XXX` 連到 |
| http://localhost:3000/ | 簡單的HTML，有一個框框可以新增item，新增後會在下面出現你新增的東西 | React 前端透過 Axios 呼叫後端 API，新增的 item 會存到 PostgreSQL 資料庫，列表從資料庫讀取資料 |

### Docker 小筆記 1：開啟 / 關掉docker
有專業版本、白話版本、無腦照做版本，不想理解只是想簡單把project 做完的可以看無腦照做版本就好了

#### 1. 專業版本：
|             指令             |             功能             |
| --------------------------- | ---------------------------- |
| `docker compose up --build` | build image 並啟動服務，**會**在terminal 顯示log |
| `docker compose up -d --build` | build image 並啟動服務，**不會**在terminal 顯示log |
| `Ctrl + C`                  | 停掉正在前台執行的服務，等同`docker compose down` |
| `docker compose down`       | 停掉並刪掉容器（docker desktop 裡面看不到該容器）|
| `docker compose up -d`      | 背景啟動服務 |
| `docker compose stop`       | 停止容器但不刪掉（docker desktop 還是看的到容器，只是被暫停了） |
| `docker compose start`      | 重新啟動已存在容器 |

#### 2. 白話版本：
第一次做要`docker compose up --build`，之後除非有修改docker 相關的檔案(ex, 新安裝東西、改變設定之類的)，不然如果只是一般寫程式的話不用重新build

docker 跑起來後可以從terminal 看到他的log，或是如果指令裡有`-d` 就會在背景跑，要看log 的話可以去docker desktop 看

啟動 / 停止容器的指令兩兩一組，如果用`docker compose down` 停止服務的話下次就用`docker compose up -d` 啟動，如果用`docker compose stop` 停止的話下次就用`docker compose start` 啟動，兩組指令的功能差不多，所以記指令只要記一組你喜歡的就好了

或是如果不想背指令的話也可以直接從docker desktop 按按鈕，第一次build 完之後就用Actions 那個按鈕開始、結束

#### 3. 無腦照做版本：
1. 打開docker desktop (每一次要用docker 都要開，就算你都是輸指令還是要開)
2. 進到專案資料夾(有`docker-compose.yml` 的資料夾)：`cd HCI`
3. 第一次啟動服務：`docker compose up --build`
4. 之後啟動服務：`docker compose start` 或是從docker desktop 按開始鍵
5. 關閉服務：`docker compose stop` 或是從docker desktop 按暫停鍵

### Docker 小筆記 2：Docker 相關指令(應該用不太到，可以先不用看，只是我寫給自己看的免得忘記了)
- 檢查現有的containers

    command:
    ```
    docker ps -a
    ```
    sample output:
    ```bash
    CONTAINER ID   IMAGE                             COMMAND                   CREATED        STATUS                 PORTS                                                   NAMES
    8d94e75873c8   hci-frontend                      "docker-entrypoint.s…"   3 hours ago    Up 2 hours             0.0.0.0:3000->3000/tcp, [::]:3000->3000/tcp              focus_frontend

    32b2ec08f6b9   hci-backend                       "uvicorn main:app --…"   3 hours ago    Up 2 hours             0.0.0.0:8000->8000/tcp, [::]:8000->8000/tcp              focus_backend

    34fa3433337b   postgres:15                       "docker-entrypoint.s…"   3 hours ago    Up 2 hours (healthy)   0.0.0.0:5432->5432/tcp, [::]:5432->5432/tcp              focus_db

    64924c160c50   acal-workspace-spring-2025-main   "bash /docker/start.…"   2 months ago   Up 3 days              0.0.0.0:5000->5000/tcp, [::]:5000->5000/tcp, 0.0.0.0:5173->5173/tcp, [::]:5173->5173/tcp, 0.0.0.0:8888->8888/tcp, [::]:8888->8888/tcp, 0.0.0.0:10000->10000/tcp, [::]:10000->10000/tcp   acal-workspace-spring-2025-main
    ```

- 進入container (開啟docker 的terminal)

    因為我們的環境都是裝在docker 裡面，所以如果要跑一些指令的話也得在docker 裡面跑，比如說我們平常要跑一個python program，只要在自己電腦輸入`python code.py` 就好了，但現在所有相關的library、環境等等都在docker 裡面，如果直接在電腦本機跑的話，他會找不到這些library ，所以要進到docker 裡面，用docker 的terminal 跑`python code.py` 才能順利運行！（但這次project 應該不太會需要進到容器裡面，應該直接從瀏覽器看就好了）
    ```bash
    # 進入 backend 容器
    docker exec -it focus_backend /bin/bash

    # 進入 frontend 容器
    docker exec -it focus_frontend /bin/bash

    # 進入 PostgreSQL 容器
    docker exec -it focus_db /bin/bash
    ```