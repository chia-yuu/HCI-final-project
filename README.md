# FocusMate
## Introduction
114上 張永儒、顏羽君 多媒體與人機互動總整與實作 Final Project

### Problem Statement
我們想解決使用者在專注與休息過程中常見的效率問題。許多使用者在專注時，容易因手機干擾而分心，缺乏持續專注的動力，難以長時間維持專注狀態；而在休息階段，又經常因休息過久而難以重新進入專注，進而影響整體效率與進度。

因此我們設計了FocusMate 這個App，在專注階段，透過計時、死線壓力以及獎勵系統，提升使用者的專注動機與投入程度；在休息階段，則結合系統提醒與好友互動機制，讓使用者能彼此提醒與督促，避免休息過久，並順利銜接回下一個專注階段。希望能藉此幫助使用者在專注與休息間建立良好的節奏，提升學習與工作的整體效率。

### App Introduction

<table>
  <tr>
    <td>
      <h3>1. 專注模式</h3>
      <br>
      <br>
      當使用這開始做事時，可以透過這裡的計時器記錄他已經專注了多久，這個時間除了幫使用者紀錄自己專注了多久以外，也有和獎勵機制結合，每專注一小時就可以獲得一個好寶寶徽章，可以用來發通知給好友（提醒對方該去讀書了）。為了累積徽章，使用者就會願意一次專注久一點。
      <br>
      要休息時按下暫停並存檔，可以拍照紀錄我現在做到哪裡，這樣一天下來看到這些照片，就會很清楚知道自己完成了什麼，而不會覺得忙了一整天但什麼也沒完成。在休息時，系統也會在十分鐘時提醒我該回去做事了，或是提醒我最近有什麼死線快到了，讓我可以及時結束休息。
    </td>
    <td width="380" align="center">
      <img src="./uploads/focus mode.png" height="500"/>
    </td>
  </tr>

  <tr>
    <td>
      <h3>2. 任務清單</h3>
      <br>
      <br>
      在任務清單中可以看到我最近的死線，日期越近的會有越明顯的視覺效果，像是顏色、圖示、震動等。透過死線壓力可以增加使用者開始做事的動力。
    </td>
    <td width="380" align="center">
      <img src="./uploads/deadline list.png" height="500"/>
    </td>
  </tr>

  <tr>
    <td>
      <h3>3. 好友列表</h3>
      <br>
      <br>
      在好友列表中可以看到朋友現在是專心還是休息，如果是休息的話可以給對方發通知提醒他該回去念書了，這樣當對方收到通知，就會覺得別人都開始專心了、自己也要開始來做事了。
    </td>
    <td width="380" align="center">
      <img src="./uploads/friend list.png" height="500"/>
    </td>
  </tr>

  <tr>
    <td>
      <h3>4. 我的紀錄</h3>
      <br>
      <br>
      這裡會記錄我每天和每個時段的專注時長，讓我更知道自己在哪一個時段是更專心的，下次就可以把一些比較困難、需要花多一點時間的任務安排在這些時段。另外也可以看到之前在專注模式拍過的照片，讓使用者能夠清楚回顧當時實際完成的內容，使專注成果更具體，提升成就感與持續使用的動機。
    </td>
    <td width="380" align="center">
      <img src="./uploads/my record.png" height="500"/>
    </td>
  </tr>
</table>

## Environment setup
React Native + FastAPI + PostgreSQL
### Pre-request
1. 安裝docker desktop
2. 安裝node.js

### React Native + FastAPI + postgreSQL
#### 1. 下載專案
```bash
git clone https://github.com/chia-yuu/HCI-final-project.git
```

#### 2. 設定IP
為了讓電腦和手機能順利連線，**電腦和手機連的要是同一個網路**

在mobile/ 底下自己新增一個檔案`.env`，放入你的IP：
```
# in mobile/.env
API_URL=http://YOUR_IP:8000
```

#### 3. 設定前端環境

**在電腦**
```bash
cd HCI-final-project
npm install -g expo-cli

cd mobile
npm install                     # 安裝所需dependency
npm start                       # 開始執行app，terminal 會出現一個QR code
```

**在手機**

Google Play / App Store 下載Expo Go App，打開APP 用scan QR code 掃剛才電腦terminal 出現的QR code，就可以看到我們寫的APP 了

#### 4. 設定後端環境
打開docker desktop，輸入下列指令：
```bash
cd HCI-final-project
docker compose up --build
```
