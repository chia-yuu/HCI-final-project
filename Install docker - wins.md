# Install Docker on Windows 10

## Introduction to Docker
Docker 是一項開放原始碼專案，將應用程式的部署流程自動化、可攜化，提供使用者輕鬆建立執行所需環境並啟動程式的方案，極大程度免除因系統環境條件不同等因素而無法部署的困擾。

Docker 的概念與虛擬機器（VM）相似但仍有所不同，每個 VM 皆包含虛擬硬體結構、作業系統及應用程式，Docker 則僅含括應用程式及必需的相依性程式套件、並共用宿主機（Host Machine）的作業系統服務。這樣的架構使得應用程式於 Docker Container 內執行時可獲得與 Host Machine 幾近相同的效能，這正是其與 VM 相較最大的優勢之一。


## STEP 1 開啟 Windows 功能
1. 在檔案總管的位址欄輸入「控制台\程式集」並前往
2. 點選「開啟或關閉 Windows 功能」
3. 勾選「Windows 子系統 Linux 版」及「虛擬機器平台」
4. 依序點選「確定」、「立即重新啟動」


![](https://course.playlab.tw/md/uploads/8d2084b3-8192-4923-9a81-54732cbbb844.png)


## STEP 2 安裝 WSL2 套件
- 請下載 [WSL2 Linux 核心更新套件 (適用於 x64 電腦)](https://wslstorestorage.blob.core.windows.net/wslblob/wsl_update_x64.msi) 並進行安裝
> WSL更新方式已變更:
> 1. Open **PowerShell** as Administrator.
> 2. Run the following command to install WSL2 and the default Linux distribution (Ubuntu):
>      ```sh
>      wsl --update --web-download
>      ```
> 3. Wait for the installation to complete. Once finished, restart your computer if prompted.


## STEP 3 安裝 Docker 套件
1. 下載 [Docker Desktop for Windows](https://desktop.docker.com/win/main/amd64/Docker%20Desktop%20Installer.exe) 並執行
2. 勾選「Install required Windows components for WSL 2」並開始安裝
    ![](https://course.playlab.tw/md/uploads/6eaa8332-73c8-4b89-8150-4df043cb80ce.png)
3. 在「Installation succeeded」畫面點選「Close and log out」登出系統

    **:::warning  
    此步驟將會關閉所有已開啟的程式與視窗，請先將其它執行中的工作儲存並關閉，以免遺失工作進度  
    :::**

4. 重新登入系統並等待下方畫面出現即完成安裝
    ![](https://course.playlab.tw/md/uploads/4f0333e3-2953-4241-bddd-aa5fae12fe53.png)


## STEP 4 測試 Docker 安裝
- 在命令提示字元、Windows PowerShell 或 Git Bash 執行
    ```bash
    $ docker -v
    ```
- 系統回應安裝版本資訊即表示安裝成功
    ![](https://course.playlab.tw/md/uploads/d8058e2b-0b42-4c04-a883-08d3f71eef48.png)




## Reference
- [Install Docker Desktop on Windows - Docker](https://docs.docker.com/docker-for-windows/install/)
- [Docker Desktop WSL 2 backend - Docker](https://docs.docker.com/docker-for-windows/wsl/)
- [安裝 WSL | Microsoft Docs](https://docs.microsoft.com/zh-tw/windows/wsl/install-win10)
