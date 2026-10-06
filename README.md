# 台灣政黨與人口互動地圖

一個以純 HTML、CSS 與 JavaScript 製作的響應式資料探索網站，分開呈現四組不同時點的資料：2026 年全國政黨民調、2024 年立委政黨票、2025 年底人口／性別／年齡，以及 2014 年族群單一認同調查。

## 功能

- 台灣 22 縣市互動地圖與縣市選擇
- 國民黨、民進黨、民眾黨切換與政黨票著色
- 三黨全國好感度、反感度與支持度摘要
- 縣市人口、性別、年齡及族群結構
- 兩個縣市並排比較
- 資料時點、分母、缺漏與查核狀態說明

## 本機執行

網站本身不需要建置工具：

```bash
python -m http.server 8080 -d dist
```

開啟 `http://localhost:8080`。

若要從原始 XLS 重新產生 `dist/data.json`：

```bash
python -m pip install -r requirements.txt
python build_data.py
```

`build_data.py` 會在需要時從內政部戶政司下載官方 XLS 到 `data/raw/`，合併已核對的選舉與族群資料，並驗證：

- 共有 22 個縣市
- 總人口為 23,299,132 人
- 各縣市總人口等於男性加女性
- 各縣市總人口等於 0–14、15–64、65 歲以上三組合計

## 專案結構

```text
dist/             可直接部署的靜態網站
data/raw/         官方人口統計原始檔下載位置（XLS 不納入 Git）
build_data.py     資料整併與一致性檢查
DATA_SOURCES.md   資料口徑、來源與限制
```

## 授權

程式碼依 [MIT License](LICENSE) 授權。第三方資料與地圖形狀不因本專案授權而改變其原有權利；細節請見 [DATA_SOURCES.md](DATA_SOURCES.md)。
