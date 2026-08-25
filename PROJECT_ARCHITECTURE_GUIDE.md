# 專案架構說明書

## 1. 文件目的

這份文件用來說明目前 `geo-map-template` 專案的整體架構，重點不是單純列檔案，而是回答下面幾件事：

1. 這個專案分成哪些層
2. 每個資料夾與檔案負責什麼
3. 前端與後端如何串接
4. 地圖圖層如何被註冊、載入、顯示、切換
5. 新功能或新資料應該加在哪裡

這份說明是依目前 repo 的真實結構撰寫。

---

## 2. 專案總覽

這個專案是「前後端分離」的地圖系統模板，分成兩個主體：

1. `frontend/`
   - React + Vite + Cesium
   - 負責地圖畫面、圖層控制、使用者互動

2. `backend/`
   - Node.js + Express + PostgreSQL
   - 負責圖資 API、資料轉換、資料庫存取

整體上，它是一個以 Cesium 為核心的 3D/2D 地圖應用，支援：

- 全球底圖
- NLSC WMTS
- NLSC 3D Tiles
- NLSC I3S
- 自訂資料圖層 API
- PostgreSQL / PostGIS 圖資供應

---

## 3. 目錄結構

```text
geo-map-template/
├─ backend/
│  ├─ db.js
│  ├─ package.json
│  ├─ server.js
│  ├─ routes/
│  │  ├─ layers.js
│  │  ├─ terrain.js
│  │  └─ tiles.js
│  ├─ scripts/
│  │  └─ migrate_pg.mjs
│  └─ utils/
│     └─ coordTransform.js
├─ frontend/
│  ├─ index.html
│  ├─ package.json
│  ├─ vite.config.js
│  └─ src/
│     ├─ App.css
│     ├─ App.jsx
│     ├─ index.css
│     ├─ main.jsx
│     └─ components/
│        ├─ LayerControls.css
│        ├─ LayerControls.jsx
│        ├─ MapViewer.css
│        └─ MapViewer.jsx
├─ DATA_IMPORT_GUIDE.md
├─ PROJECT_ARCHITECTURE_GUIDE.md
└─ layer-sources.txt
```

---

## 4. 架構分層

可以把這個專案拆成 5 層來理解：

1. UI 控制層
2. 地圖顯示層
3. 前端狀態層
4. API / 服務層
5. 資料來源層

### 4.1 UI 控制層

負責：

- 左側圖層面板
- 右側功能列表
- 搜尋列
- Render 設定面板
- 點選查詢面板

主要檔案：

- `frontend/src/App.jsx`
- `frontend/src/components/LayerControls.jsx`
- `frontend/src/components/MapViewer.css`
- `frontend/src/App.css`

### 4.2 地圖顯示層

負責：

- 建立 Cesium Viewer
- 載入底圖
- 載入 3D Tiles / I3S / WMTS
- 控制地形與 3D 顯示條件
- 處理滑鼠點選與屬性面板

主要檔案：

- `frontend/src/components/MapViewer.jsx`

### 4.3 前端狀態層

負責：

- 哪些圖層打開
- 目前 2D / 3D 模式
- 畫質 / 效能設定
- 右側功能列表項目

主要檔案：

- `frontend/src/App.jsx`

### 4.4 API / 服務層

負責：

- 提供圖層資料 API
- 提供 tile API
- 提供 terrain API
- 存取 PostgreSQL / PostGIS

主要檔案：

- `backend/server.js`
- `backend/routes/layers.js`
- `backend/routes/tiles.js`
- `backend/routes/terrain.js`
- `backend/db.js`

### 4.5 資料來源層

來源包含：

- PostgreSQL / PostGIS
- `backend/data/*.geojson`
- `backend/data/*.csv`
- 本機 tiles
- 外部 WMTS / 3D Tiles / I3S
- 外部 API

---

## 5. 前端架構

## 5.1 啟動入口

檔案：`frontend/src/main.jsx`

這個檔案只做一件事：

1. 掛載 React root
2. 載入 `App.jsx`

也就是說，前端所有互動的真正入口是 `App.jsx`。

---

## 5.2 App.jsx 的角色

`frontend/src/App.jsx` 是前端的頁面級組裝器，負責把 UI 狀態和地圖元件串起來。

### 它目前管理的重點 state

1. `layers`
   - 所有圖層與功能的開關狀態

2. `sceneMode`
   - `3d` 或 `2d`

3. `renderSettings`
   - 畫質、效能、請求數、顯示距離等設定

### 它目前管理的關鍵常數

1. `INITIAL_LAYERS`
   - 圖層 key 的來源總表

2. `EXCLUSIVE_BASEMAP_KEYS`
   - 定義哪些底圖互斥

3. `FEATURE_LIST_CONFIG`
   - 右側功能列表項目

4. `RENDER_PROFILES`
   - 畫質優先 / 性能優先的預設組合

### 它的責任邊界

`App.jsx` 負責「狀態與組裝」，不負責實際載入地圖資料。

實際載入圖層的工作，是交給 `MapViewer.jsx`。

---

## 5.3 LayerControls.jsx 的角色

`frontend/src/components/LayerControls.jsx` 是左側控制面板。

它主要負責：

1. 顯示一般圖層列表
2. 顯示 3D Tiles 群組按鈕
3. 顯示 I3S 群組按鈕
4. 顯示 Render Settings

### 它是純 UI 元件

這個元件本身不直接載入任何圖層，它只是：

- 收到 `layers`
- 收到 `onToggle`
- 收到 `renderSettings`
- 收到 `onApplyProfile` / `onUpdateSetting`

然後把控制事件回傳給 `App.jsx`。

也就是說，它本質上是 presentation component。

### 左側圖層清單的來源

一般圖層來自：

- `LAYER_CONFIG`

3D Tiles 來自：

- `THREE_D_TILE_BUTTON_CONFIG`

I3S 來自：

- `I3S_BUTTON_CONFIG`

如果要新增左側圖層，通常先改這裡。

---

## 5.4 MapViewer.jsx 的角色

`frontend/src/components/MapViewer.jsx` 是整個專案最核心的檔案。

可以把它看成「地圖 runtime engine」。

它負責的事情非常多：

1. 建立 Cesium Viewer
2. 建立與控制底圖
3. 建立與控制 WMTS
4. 載入 NLSC 3D Tiles
5. 載入 NLSC I3S
6. 控制 2D / 3D 切換
7. 控制 terrain 顯示
8. 控制建物只在近距離載入
9. 管理 grouped loaders 與 retry
10. 依視角分層載入 3D Tiles
11. 控制搜尋
12. 控制點選查詢面板
13. 管理道路監視器載入
14. 管理 render error 顯示與 recovery

### 為什麼這個檔案重要

因為目前幾乎所有地圖行為都集中在這裡。

這代表：

- 擴充功能很快
- 但檔案會越來越大

如果未來功能持續增加，這個檔案應拆模組。

---

## 5.5 MapViewer.jsx 的內部子系統

可以把 `MapViewer.jsx` 再拆成幾個邏輯區塊。

### A. 常數與來源清單

這一段管理：

- `NLSC_TILESETS`
- `NLSC_I3S`
- `NLSC_WMTS`
- 載入限制與快取常數
- twipcam API URL

這一層是「資料來源宣告層」。

### B. 群組載入器

這一段管理：

- grouped 3D Tiles / I3S 載入
- concurrency
- retry
- blacklist
- 分層載入排序
- source center cache

這一段是整個專案效能控制的關鍵。

### C. 顯示控制

這一段管理：

- 建物顯示高度
- 地形顯示高度
- adaptive detail
- tile / terrain SSE
- 移動中降載

### D. 點選與屬性查詢

這一段管理：

- feature picking
- 屬性解析
- 建物名稱 fallback
- 屬性快取
- 右側屬性面板

### E. 搜尋功能

這一段管理：

- ArcGIS geocode
- 本地建物名稱索引
- 飛到搜尋結果

### F. 道路監視器

這一段管理：

- twipcam camera list fetch
- entity 建立
- 顯示 / 隱藏
- snapshot 預覽

### G. Render Error 防護

這一段管理：

- Cesium render error 捕捉
- 文字正規化
- 零寬度畫布 recovery
- requestRender 補強

---

## 5.6 前端 UI 資料流

前端圖層開關流程如下：

1. 使用者點擊左側或右側開關
2. `LayerControls.jsx` 或 `App.jsx` 呼叫 `toggleLayer`
3. `App.jsx` 更新 `layers` state
4. `MapViewer.jsx` 收到新的 `layers` props
5. `useEffect` 依照 `layers` 決定 add/remove/show/hide 圖層
6. `viewer.scene.requestRender()` 觸發畫面更新

這是目前最核心的前端控制鏈。

---

## 6. 後端架構

## 6.1 server.js 的角色

`backend/server.js` 是後端啟動入口。

它負責：

1. 載入 `.env`
2. 建立 Express app
3. 設定 CORS
4. 掛載 JSON parser
5. 掛載三條主路由
6. 提供 health check

目前掛載的 API：

- `/api/layers`
- `/api/tiles`
- `/api/terrain`

### 目前後端定位

它不是複雜的商業 API 伺服器，而是偏圖資服務層。

---

## 6.2 db.js 的角色

`backend/db.js` 專門建立 PostgreSQL connection pool。

目前它負責：

1. 讀取 `PGHOST`、`PGPORT`、`PGDATABASE`、`PGUSER`、`PGPASSWORD`
2. 建立 `pg.Pool`
3. 統一提供給 routes 使用

這代表整個後端的資料庫存取，目前都應該透過這個 pool。

---

## 6.3 routes/layers.js 的角色

`backend/routes/layers.js` 是目前最重要的資料 API。

它的功能是：

1. 管理允許的 layer key
2. 支援從 PostgreSQL 讀 Geo 資料
3. 支援從 `backend/data` 讀 GeoJSON / CSV
4. 統一回傳 GeoJSON
5. 提供 reload cache API

### 它的優先順序

對某個 layer key，讀取順序是：

1. PostgreSQL table 是否存在且有資料
2. 若沒有，再讀 `backend/data/<key>.geojson`
3. 若沒有，再讀 `backend/data/<key>.csv`

### 它的定位

這個檔案是目前自訂向量圖層系統的核心。

未來若加入：

- 避難所
- 醫院
- 警察局
- 風險區
- 斷層

大多都會經過這個 route。

---

## 6.4 routes/tiles.js 的角色

`backend/routes/tiles.js` 提供本機切圖 PNG tile。

路徑格式：

```text
/api/tiles/:source/:z/:x/:y
```

它會從：

```text
backend/data/tiles/<source>/<z>/<x>/<y>.png
```

讀取檔案。

### 適用場景

- 本機 raster tiles
- 自製影像圖層
- 已切好的風險圖或正射圖

它不負責做切圖，只負責提供已存在的圖磚。

---

## 6.5 routes/terrain.js 的角色

`backend/routes/terrain.js` 目前是地形模組的佔位層。

現況：

1. `/heightmap` 固定回 0
2. `/status` 只檢查 terrain 目錄是否存在

這表示目前專案還沒有真正完整的自訂地形服務。

如果未來要接 DEM / terrain，這裡需要擴充。

---

## 6.6 scripts/migrate_pg.mjs 的角色

這是一支把檔案匯入 PostgreSQL / PostGIS 的 migration/import script。

目前已支援：

1. `GeoJSON`
2. `CSV`

它的流程是：

1. 建立 PostGIS extension
2. 建立同名 table
3. 讀 GeoJSON / CSV
4. 轉成 feature
5. Insert 到 `properties + geom`

### 它的價值

這支腳本其實已經是整個專案資料匯入流程的原型。

未來如果你要支援：

- XML
- XLSX
- KML
- Shapefile

最合理的作法通常是：

1. 先轉成 GeoJSON
2. 再沿用這支腳本匯入

---

## 6.7 utils/coordTransform.js 的角色

這支工具目前專門處理座標轉換。

它支援：

- WGS84
- TWD97 TM2 119 / 121
- TWD67 TM2 119 / 121

### 它的主要用途

在 CSV 或外部資料座標不統一時，自動轉換成 WGS84。

這對台灣政府資料很重要，因為來源常混用：

- 經緯度
- TWD97
- TWD67

這支工具是目前資料導入穩定性的關鍵之一。

---

## 7. 前後端串接方式

## 7.1 開發環境串接

`frontend/vite.config.js` 目前設定了：

```js
server: {
  proxy: {
    '/api': { target: 'http://localhost:3001', changeOrigin: true },
  },
}
```

這代表：

- 前端開發時請求 `/api/...`
- Vite 會轉發到後端 `http://localhost:3001`

### 好處

1. 前端不用寫死完整 backend URL
2. 可避免部分 CORS 問題
3. 本地開發較簡單

---

## 7.2 圖資資料流

一般向量圖層的典型資料流如下：

```text
資料檔 / PostgreSQL
    ↓
backend/routes/layers.js
    ↓
/api/layers/:type
    ↓
frontend MapViewer.jsx
    ↓
Cesium entity / GeoJsonDataSource / 自訂顯示
```

### 對 3D Tiles / I3S 而言

目前多數 3D Tiles / I3S 是前端直接連外部來源：

- NLSC 3D Tiles URL
- NLSC I3S URL

也就是說，這部分不是經過後端代理，而是前端直接載入。

---

## 8. 圖層系統架構

## 8.1 圖層分類

目前專案中的圖層大致分成 5 類：

1. 全球底圖
2. NLSC WMTS
3. 3D Tiles
4. I3S
5. 功能型資料圖層

### 1. 全球底圖

- OSM
- Esri World Imagery

### 2. NLSC WMTS

- 正射影圖
- 電子地圖

### 3. 3D Tiles

- NLSC 建物
- NLSC 道路
- NLSC 道路地形貼合版

### 4. I3S

- NLSC I3S 建物
- NLSC I3S 道路
- NLSC I3S 道路地形貼合版

### 5. 功能型資料圖層

- 道路監視器
- 之後可能增加的即時圖層或公開資料圖層

---

## 8.2 圖層 key 是核心識別碼

目前幾乎所有前端控制，都是靠 layer key 驅動。

例如：

- `osm`
- `global_satellite`
- `nlsc_photo`
- `nlsc_emap`
- `road_cameras`

### layer key 會出現在哪些地方

1. `App.jsx` 的 `INITIAL_LAYERS`
2. `LayerControls.jsx` 的 `LAYER_CONFIG`
3. `App.jsx` 的 `FEATURE_LIST_CONFIG`
4. `MapViewer.jsx` 的顯示控制
5. 後端 `LAYER_KEYS` 或資料表名稱

所以新增圖層時，最重要的是先決定 layer key。

---

## 8.3 左側與右側的分工

### 左側圖層列表

左側適合放：

- 常駐地圖圖層
- 底圖
- 3D / I3S 圖層
- 影像與地形相關圖層

### 右側功能列表

右側適合放：

- 功能型資料
- 即時資料
- 專題列表
- 使用者操作型開關

目前 `road_cameras` 已放在右側，這是一個很明確的分層方向。

---

## 9. Cesium 地圖生命週期

## 9.1 初始化

在 `MapViewer.jsx` 的初始化 effect 中：

1. 建立 `Viewer`
2. 關掉不需要的 Cesium 預設 UI
3. 設定 request render mode
4. 設定 globe / fog / msaa
5. 設定預設台灣視角
6. 建立 click handler
7. 建立 move start / end handler
8. 建立預載入底圖

這個 effect 只執行一次。

## 9.2 更新

之後主要靠多個 `useEffect` 依 props / state 更新：

1. `layers` 改變
2. `renderSettings` 改變
3. `sceneMode` 改變

## 9.3 銷毀

在 cleanup 中會：

1. destroy pick handler
2. 清掉 listener
3. 清掉 road cameras
4. destroy viewer

這避免 Cesium listener 泄漏。

---

## 10. 效能架構

這個專案目前已經做了不少效能控制。

## 10.1 RequestScheduler

全域控制：

- 最大總請求數
- 每個 server 最大請求數

這是避免 3D Tiles / imagery 同時爆量。

## 10.2 建物近距離載入

`MapViewer.jsx` 會依相機高度決定是否顯示建物，避免高空時浪費資源。

## 10.3 自適應 detail

會依：

- 相機高度
- 是否移動中
- render settings

調整 terrain / tiles 的 screen space error。

## 10.4 群組載入器

對 NLSC 3D / I3S 圖層有：

- concurrency 限制
- retry
- blacklist
- pump 排程
- 分層載入

這一套是避免大量圖層一次把網路和 GPU 打爆。

## 10.5 屬性快取

建物點選屬性有快取，避免重複解析同一個 feature。

---

## 11. 搜尋與查詢架構

## 11.1 搜尋

目前有兩種搜尋來源：

1. 本地建物名稱索引
2. ArcGIS geocode

這代表搜尋功能不是純前端 UI，而是：

- 有本地索引
- 有外部 geocode fallback

## 11.2 點選查詢

目前點選查詢會：

1. `scene.pick`
2. 讀取 feature properties
3. 做欄位名稱 normalization
4. 把結果顯示到右側查詢面板

如果有圖層屬性資料表、feature info、camera preview，最終也都應該接到這個機制。

---

## 12. 專案目前的優點

### 12.1 明確前後端分離

前端專注地圖展示，後端專注資料提供。

### 12.2 layer key 驅動清楚

新增圖層有固定入口，擴充成本低。

### 12.3 已具備多種資料來源能力

目前已同時支援：

- 外部底圖
- 外部 3D Tiles
- 外部 I3S
- 本機 tiles
- PostgreSQL / PostGIS
- 本機 GeoJSON / CSV

### 12.4 已有一定程度效能保護

對 Cesium 這種高負載地圖應用來說，這點很重要。

---

## 13. 專案目前的瓶頸

## 13.1 MapViewer.jsx 過大

目前太多責任集中在同一個檔案：

- 載入器
- 搜尋
- 屬性查詢
- 監視器
- render error
- terrain / imagery / 3D

短期可接受，但中長期一定要拆。

## 13.2 自訂 GeoJSON 圖層系統還未完整抽象化

目前對一般公開資料圖層，後端 API 已經有基礎，但前端還沒有完整的共用載入器。

也就是說：

- 後端比較接近平台化
- 前端還偏手工接線

## 13.3 terrain 模組 עדיין placeholder

自訂 terrain 還沒有真的完成。

## 13.4 即時外部 API 穩定性問題

像道路監視器這種外部來源，會有：

- CORS
- TLS
- 來源不可用

這類功能未來應偏向後端代理或後端定時快取。

---

## 14. 新功能應該加在哪裡

## 14.1 新增一般圖層

例如：醫院、避難所、警察局。

應該改：

1. `backend/.env` 的 `LAYER_KEYS`
2. `frontend/src/App.jsx` 的 `INITIAL_LAYERS`
3. `frontend/src/components/LayerControls.jsx` 或 `FEATURE_LIST_CONFIG`
4. `frontend/src/components/MapViewer.jsx`

## 14.2 新增右側功能列表項目

應該改：

1. `frontend/src/App.jsx` 的 `FEATURE_LIST_CONFIG`
2. `frontend/src/App.jsx` 的 `INITIAL_LAYERS`
3. `frontend/src/components/MapViewer.jsx`

## 14.3 新增後端資料 API

應該改：

1. `backend/routes/` 新增 route
2. `backend/server.js` 掛載
3. 需要時擴充 `backend/db.js` 用法或新 service

## 14.4 新增資料匯入格式

應該改：

1. `backend/scripts/`
2. 必要時加 npm 套件
3. 最終仍建議轉成 GeoJSON 或匯入 PostGIS

---

## 15. 建議的未來拆分方向

如果這個專案要持續長大，建議先拆 `MapViewer.jsx`。

### 建議拆法

1. `map/sources.js`
   - 3D Tiles / I3S / WMTS URL 常數

2. `map/groupLoader.js`
   - retry / blacklist / staged loading

3. `map/picking.js`
   - pick、屬性解析、快取

4. `map/search.js`
   - geocode、建物索引搜尋

5. `map/roadCameras.js`
   - 道路監視器功能

6. `map/vectorLayers.js`
   - 未來一般 GeoJSON 圖層共用載入器

這樣可維持 `MapViewer.jsx` 只負責組裝。

---

## 16. 最重要的設計觀念

如果只記住這個專案的幾個核心觀念，應該記住下面這些：

1. `App.jsx` 管 state 與開關，不管地圖細節
2. `LayerControls.jsx` 管 UI，不管載入邏輯
3. `MapViewer.jsx` 管 Cesium runtime
4. `backend/routes/layers.js` 是自訂向量圖層的核心 API
5. 圖層擴充基本靠 layer key 貫穿前後端
6. 一般公開資料最適合走 `GeoJSON / PostGIS -> /api/layers/:type -> 前端開關`
7. raster、terrain、3D Tiles 不應混成同一種處理方式

---

## 17. 總結

這個專案目前是一個以 Cesium 為核心的地圖模板，架構上已具備：

- 前後端分離
- 多來源圖層支援
- PostgreSQL / PostGIS 圖資能力
- 3D Tiles / I3S / WMTS 支援
- 圖層開關與功能列表
- 基本效能控制與錯誤恢復

它現在最需要的不是推倒重來，而是把既有模式再整理成更穩定的模組化結構。

如果後續要大量擴充圖層、公開資料、即時資料，最重要的工作會是：

1. 抽出共用 GeoJSON 圖層載入器
2. 拆分 `MapViewer.jsx`
3. 強化後端資料匯入腳本
4. 把即時外部 API 逐步改成後端可控來源
