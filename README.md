## 系統架構
Frontend　<br> 
React + Vite + Cesium <br> 
React:使用者介面 <br> 
Vite:進行前端建構，在Localhost運行開發伺服器 <br> 
Cesium:作為地圖引擎載入地圖、影像、3D地形、3D Tiles、I3S <br> 
Backend <br> 
Node.js + Express + PostgreSQL <br> 
Node.js:進行後端建構，npm管理模組　<br> 
Express:API服務　<br> 
PostgreSQL:資料庫系統，PostGIS套件可以支援點陣資料、向量資料，支援 R-tree 空間索引 <br> 
以及很多跟地理資訊計算相關的函式，例如計算距離、區域覆蓋、相交等 <br> 
自寫函式：支援CRS轉換（WGS84轉TWD97）、資料轉換（CSV） <br> 
## 資料來源
全球衛星底圖：Esri World Imagery <br> 
全球電子底圖：OpenStreetMap <br> 
台灣正射影圖：NLSC　WMTS <br> 
台灣電子地圖：NLSC　WMTS <br> 
3D 城市模型：NLSC 3D Tiles/NLSC I3S SceneServer <br> 
3D地形DEM:Cesium World Terrain <br> 
## 專案目錄
geo-map-template/ <br> 
├─ frontend　<br> 
│  ├─ src/App.jsx                  # 全域 UI state、場景模式與圖層開關 <br> 
│  ├─ src/components/MapViewer.jsx # Cesium runtime 與地圖功能核心 <br> 
│  ├─ src/components/LayerControls # 圖層、3D/I3S、畫質設定UI <br> 
│  └─ vite.config.js               # Vite 與 /api proxy <br> 
└─ backend　<br> 
   ├─ server.js                    # Express 啟動入口 <br> 
   ├─ db.js                        # PostgreSQL <br> 
   ├─ routes/layers.js             # 向量圖層 API <br> 
   ├─ routes/tiles.js              # 3d Tiles API <br> 
   ├─ routes/terrain.js            # 地形服務介面 <br> 
   ├─ scripts/migrate_pg.mjs       # GeoJSON／CSV 匯入 PostGIS <br> 
   └─ utils/coordTransform.js      # WGS84、TWD97、TWD67 轉換 <br> 

