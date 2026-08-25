# 資料導入後端與前端功能列表整合說明書

## 1. 文件目的

這份文件是針對目前這個專案撰寫的實作手冊，目標是說明：

1. 如何把外部資料導入後端資料庫（PostgreSQL / PostGIS）
2. 如何處理不同格式資料：GeoJSON、CSV、XML、TIFF、Shapefile、KML、KMZ、XLSX、ODS、API
3. 如何讓導入後的資料透過後端 API 提供給前端
4. 如何在前端左側圖層列表或右側功能列表加入開關
5. 如何把資料顯示在地圖上

這份文件會優先以目前專案實際結構來說明，而不是泛用教材。

---

## 2. 目前專案結構與現況

### 2.1 後端現況

目前後端使用：

- Node.js + Express
- PostgreSQL
- 可搭配 PostGIS

目前關鍵檔案：

- `backend/db.js`
  - 建立 PostgreSQL connection pool
- `backend/server.js`
  - 掛載 API 路由
- `backend/routes/layers.js`
  - 提供向量圖層資料 API
- `backend/routes/tiles.js`
  - 提供本機切圖 PNG tiles API
- `backend/routes/terrain.js`
  - 地形 API，目前是 placeholder
- `backend/scripts/migrate_pg.mjs`
  - 目前已經有一份匯入 GeoJSON / CSV 到 PostGIS 的腳本

### 2.2 前端現況

目前前端使用：

- React + Vite
- Cesium

目前圖層與功能開關主要在：

- `frontend/src/App.jsx`
  - `INITIAL_LAYERS` 管理所有 layer key
  - `FEATURE_LIST_CONFIG` 管理右側功能列表
- `frontend/src/components/LayerControls.jsx`
  - 左側圖層列表 UI
- `frontend/src/components/MapViewer.jsx`
  - 真正把圖層資料載入地圖、控制顯示、點選查詢

### 2.3 目前已原生支援的資料導入方式

目前專案後端原生支援：

1. `backend/data/<layer>.geojson`
2. `backend/data/<layer>.csv`
3. PostgreSQL / PostGIS 中與 layer key 同名的 table

也就是說，其他格式若要進來，最穩定的方法是：

1. 先轉成 GeoJSON
2. 或直接匯入 PostGIS
3. 再由 `/api/layers/:type` 提供給前端

---

## 3. 建議的資料導入總策略

### 3.1 最建議的主流程

對這個專案，建議統一用下面流程：

1. 取得原始資料
2. 轉成標準空間格式
   - 向量資料優先轉成 GeoJSON 或直接匯入 PostGIS
   - raster 資料優先轉成 GeoTIFF 或切 tile
3. 統一座標系統為 `EPSG:4326` 或明確標記來源 CRS
4. 導入 PostGIS
5. 在後端加 API
6. 在前端新增 layer key 與開關
7. 在 `MapViewer.jsx` 中決定如何顯示

### 3.2 為什麼建議用 PostGIS 當中介層

因為 PostGIS 可以：

- 統一管理資料來源
- 支援空間查詢
- 處理點、線、面
- 支援索引
- 之後比較容易做範圍查詢、附近查詢、屬性查詢

如果只是臨時展示少量點位，也可以直接用檔案方式提供 GeoJSON，不一定要先進 DB。

---

## 4. 後端圖層資料流

### 4.1 目前 `/api/layers/:type` 的邏輯

`backend/routes/layers.js` 目前流程如下：

1. 檢查 `type` 是否在允許清單內
2. 若 PostgreSQL 有同名 table 且有資料，優先從 DB 取資料
3. 若 DB 沒資料，退回讀取 `backend/data/<type>.geojson` 或 `backend/data/<type>.csv`
4. 回傳 GeoJSON FeatureCollection 給前端

### 4.2 這代表什麼

這代表你只要做到以下任一種，就能供前端使用：

1. 建立 `backend/data/my_layer.geojson`
2. 建立 `backend/data/my_layer.csv`
3. 建立 PostgreSQL table `my_layer`

但前提是：

- `my_layer` 必須列入 `LAYER_KEYS`

目前 `LAYER_KEYS` 來源：

- `STATIC_LAYER_KEYS`
- 或 `.env` 內 `LAYER_KEYS=flood_risk,hospitals,...`

建議用 `.env` 管理，較不需要改碼。

---

## 5. 前置安裝

## 5.1 PostgreSQL / PostGIS

請先安裝：

1. PostgreSQL
2. PostGIS extension

建立資料庫範例：

```sql
CREATE DATABASE geodata;
\c geodata
CREATE EXTENSION IF NOT EXISTS postgis;
```

### 5.2 專案 `.env` 建議

可在 `backend/.env` 放：

```env
PGHOST=localhost
PGPORT=5432
PGDATABASE=geodata
PGUSER=postgres
PGPASSWORD=your_password
PORT=3001
FRONTEND_ORIGIN=http://localhost:5173
LAYER_KEYS=flood_risk,hospitals,police_stations,landslide_risk,cameras
```

### 5.3 建議工具

建議準備以下工具，因為不同格式轉換幾乎一定會用到：

1. QGIS
2. GDAL / OGR
3. `ogr2ogr`
4. `raster2pgsql`
5. Python 或 Node.js 腳本（處理 Excel / XML / API）

---

## 6. 每種格式的導入方法

## 6.1 GeoJSON 導入

### 方法 A：直接放檔案

適合：

- 小型資料
- 靜態展示
- 不需要空間查詢

步驟：

1. 準備 `my_layer.geojson`
2. 放到 `backend/data/my_layer.geojson`
3. 在 `.env` 加上 `LAYER_KEYS=my_layer`
4. 啟動 backend
5. 呼叫 `/api/layers/my_layer`

### 方法 B：匯入 PostGIS

適合：

- 中大型資料
- 需要查詢 / 篩選 / 空間分析

可用目前已有的 `backend/scripts/migrate_pg.mjs`：

1. 將檔案放到 `backend/data/my_layer.geojson`
2. 修改 `LAYERS` 陣列加入 `my_layer`
3. 執行：

```powershell
Set-Location backend
node scripts/migrate_pg.mjs
```

### 資料表結構

目前腳本建立的資料表格式為：

```sql
CREATE TABLE my_layer (
  id SERIAL PRIMARY KEY,
  properties JSONB,
  geom GEOMETRY(Geometry, 4326)
);
```

---

## 6.2 CSV 導入

### 目前專案現成支援

`backend/routes/layers.js` 已經能把 CSV 轉成 GeoJSON，但前提是 CSV 內有座標欄位。

可辨識欄位名稱包含：

- `longitude`
- `lng`
- `lon`
- `x`
- `easting`
- `latitude`
- `lat`
- `y`
- `northing`

### 方法 A：直接放檔案

1. 建立 `backend/data/my_points.csv`
2. 確保每列有座標欄位
3. 在 `.env` 加 `my_points`
4. API 自動轉成 GeoJSON

### CSV 範例

```csv
name,category,lat,lon
台北車站,transport,25.0478,121.5170
台大醫院,hospital,25.0417,121.5188
```

### 方法 B：匯入 PostGIS

如果資料量大，建議先轉 GeoJSON 再跑 `migrate_pg.mjs`，或自己寫 bulk insert。

---

## 6.3 XML 導入

XML 沒有固定地理格式，必須先分辨它是哪種 XML：

1. 一般自訂 XML
2. GML
3. 某政府 API 回傳 XML

### 建議流程

1. 解析 XML
2. 萃取座標與屬性
3. 轉成 GeoJSON
4. 匯入 PostGIS 或放成檔案

### Node.js 作法

建議安裝：

```powershell
Set-Location backend
npm install fast-xml-parser
```

### 典型流程

1. 讀 XML
2. 用 `fast-xml-parser` 轉成 JS object
3. 找出座標欄位
4. 組成 GeoJSON FeatureCollection
5. 寫入 `backend/data/my_layer.geojson`
6. 或直接 insert DB

### 如果是 GML

優先建議用 `ogr2ogr` 轉換：

```powershell
ogr2ogr -f GeoJSON my_layer.geojson input.gml
```

---

## 6.4 TIFF / GeoTIFF 導入

TIFF 分兩種：

1. 一般 TIFF
2. GeoTIFF

### GeoTIFF 適合用途

- DEM
- 正射影像
- 淹水深度 raster
- 土地覆蓋影像

### 導入方向有兩種

#### 方向 A：匯入 PostGIS raster

適合：

- 需要後端空間分析
- 需要從 raster 計算值

使用 `raster2pgsql`：

```powershell
raster2pgsql -s 4326 -I -C -M input.tif public.dem_layer | psql -d geodata -U postgres
```

#### 方向 B：切 tile 供前端顯示

適合：

- 當底圖或影像圖層顯示
- 不一定需要進 PostgreSQL

你目前專案的 `backend/routes/tiles.js` 是從：

- `backend/data/tiles/<source>/<z>/<x>/<y>.png`

讀切好的圖磚。

所以可以：

1. 把 GeoTIFF 先切成 XYZ tiles
2. 放進 `backend/data/tiles/my_raster/...`
3. 前端用 `UrlTemplateImageryProvider` 指向 `/api/tiles/my_raster/{z}/{x}/{y}`

### 若要做地形

目前 `backend/routes/terrain.js` 仍是 placeholder。

如果要真正支援地形，建議：

1. 用 Cesium quantized mesh terrain
2. 或先做 DEM sampling API
3. 或接既有 terrain server

---

## 6.5 Shapefile 導入

Shapefile 一般包含：

- `.shp`
- `.shx`
- `.dbf`
- 常見還有 `.prj`

### 最建議方法：用 `ogr2ogr` 直接匯入 PostGIS

```powershell
ogr2ogr -f PostgreSQL "PG:host=localhost port=5432 dbname=geodata user=postgres password=your_password" input.shp -nln my_layer -nlt PROMOTE_TO_MULTI -lco GEOMETRY_NAME=geom
```

### 若需要轉座標系統

```powershell
ogr2ogr -f PostgreSQL "PG:host=localhost port=5432 dbname=geodata user=postgres password=your_password" input.shp -t_srs EPSG:4326 -nln my_layer
```

### 另一種方法：先轉 GeoJSON

```powershell
ogr2ogr -f GeoJSON my_layer.geojson input.shp -t_srs EPSG:4326
```

再丟到 `backend/data/` 或跑 migration。

---

## 6.6 KML 導入

KML 可以用 `ogr2ogr` 直接轉：

```powershell
ogr2ogr -f GeoJSON my_layer.geojson input.kml -t_srs EPSG:4326
```

或直接進 PostGIS：

```powershell
ogr2ogr -f PostgreSQL "PG:host=localhost port=5432 dbname=geodata user=postgres password=your_password" input.kml -nln my_layer -t_srs EPSG:4326
```

注意事項：

- KML 樣式通常不會完整保留
- 屬性結構常需要清洗

---

## 6.7 KMZ 導入

KMZ 本質上是壓縮過的 KML。

方法：

1. 先解壓縮
2. 取出裡面的 `.kml`
3. 用 KML 的流程處理

若用 `ogr2ogr`，很多情況也能直接讀：

```powershell
ogr2ogr -f GeoJSON my_layer.geojson input.kmz -t_srs EPSG:4326
```

如果失敗，就先手動解壓縮。

---

## 6.8 XLSX 導入

Excel 很常拿來存點位資料，但不適合直接當空間資料庫。

### 建議流程

1. 讀 XLSX
2. 指定哪幾欄是座標
3. 轉成 GeoJSON 或 CSV
4. 匯入 PostGIS

### Node.js 套件

建議安裝：

```powershell
Set-Location backend
npm install xlsx
```

### 實作方向

1. 用 `xlsx` 讀工作表
2. 轉 JSON row array
3. 依欄位名找 `lat/lon` 或 `x/y`
4. 輸出 GeoJSON

### 如果 Excel 沒有座標

就不能直接放點。

你需要其中一種：

1. 地址欄位，先 geocode
2. TWD97 / TM2 座標欄位，先轉 WGS84
3. 與其他圖資 join 後補 geometry

---

## 6.9 ODS 導入

ODS 是 OpenDocument Spreadsheet，流程與 XLSX 類似。

可用：

1. LibreOffice 轉成 CSV / XLSX
2. 或用支援 ODS 的程式庫讀取

### 最穩定建議

先轉 CSV：

```powershell
libreoffice --headless --convert-to csv input.ods
```

再用目前專案已支援的 CSV 流程處理。

---

## 6.10 API 導入

API 資料源分兩種：

1. 靜態 / 定期更新
2. 即時資料

### 方案 A：定期抓取後寫入資料庫

適合：

- 政府 open data
- 每日 / 每小時更新
- 需要快取與穩定顯示

流程：

1. 寫抓取腳本
2. 轉 GeoJSON
3. 寫入 PostGIS
4. 前端只打你自己的 `/api/layers/:type`

這種方法最穩，因為前端不直接依賴外部來源。

### 方案 B：後端代理轉發

適合：

- 外部 API 有 CORS 問題
- 想統一 token / headers / cache

流程：

1. 後端呼叫外部 API
2. 清洗資料
3. 回傳 GeoJSON 給前端

### 方案 C：前端直連外部 API

不建議當主方案，因為會遇到：

- CORS
- TLS
- 來源不穩
- 金鑰暴露

目前 `road_cameras` 就遇過外部來源不可直接穩定讀取的情況，這種更適合改為後端定時快取。

---

## 7. 匯入到 PostgreSQL / PostGIS 的標準表設計

## 7.1 通用圖層表設計

如果你要快速接到目前專案，最相容的表設計是：

```sql
CREATE TABLE my_layer (
  id SERIAL PRIMARY KEY,
  properties JSONB,
  geom GEOMETRY(Geometry, 4326)
);

CREATE INDEX my_layer_geom_idx ON my_layer USING GIST (geom);
```

因為 `backend/routes/layers.js` 目前查詢語句就是：

```sql
SELECT properties, ST_AsGeoJSON(geom)::jsonb AS geometry FROM my_layer;
```

### 優點

- 所有屬性集中在 `properties`
- geometry 型別彈性高
- 與現在後端邏輯相容

### 缺點

- 不利於複雜欄位查詢

如果之後常查某些欄位，例如 `name`、`type`、`county`，建議改成：

```sql
CREATE TABLE hospitals (
  id SERIAL PRIMARY KEY,
  name TEXT,
  hospital_type TEXT,
  county TEXT,
  properties JSONB,
  geom GEOMETRY(Point, 4326)
);
```

然後在 API 中重新組 Feature properties。

---

## 8. 建立新資料圖層的實作步驟

下面用 `hospitals` 當例子。

## 8.1 準備資料

例如有：

- `hospitals.geojson`
- 或 `hospitals.csv`
- 或 `hospitals.xlsx`

## 8.2 轉成可用格式

建議最終至少得到其中一種：

1. `backend/data/hospitals.geojson`
2. PostgreSQL table `hospitals`

## 8.3 註冊 layer key

在 `backend/.env`：

```env
LAYER_KEYS=hospitals
```

如果已有其他項目，記得一起寫：

```env
LAYER_KEYS=flood_risk,hospitals,police_stations
```

## 8.4 驗證後端 API

啟動 backend：

```powershell
Set-Location backend
npm run dev
```

測試：

```text
GET http://localhost:3001/api/layers/hospitals
```

正確時應回傳 GeoJSON。

---

## 9. 如何把新資料顯示到前端地圖

這裡分兩件事：

1. 新增開關
2. 在地圖載入資料

## 9.1 在前端新增 layer key

到 `frontend/src/App.jsx` 的 `INITIAL_LAYERS`：

```jsx
const INITIAL_LAYERS = {
  ...,
  hospitals: false,
}
```

這一步是必要的，否則前端 state 不知道有這個圖層。

## 9.2 決定放左邊還右邊

### 左邊圖層列表

如果這個資料是一般地圖圖層，放到 `LayerControls.jsx` 的 `LAYER_CONFIG`：

```jsx
{ key: 'hospitals', label: '區域醫院', desc: '衛福部資料' }
```

### 右邊功能列表

如果這個資料比較偏功能或主題圖層，放到 `App.jsx` 的 `FEATURE_LIST_CONFIG`：

```jsx
const FEATURE_LIST_CONFIG = [
  { key: 'road_cameras', label: '道路監視器', desc: '即時影像監視器' },
  { key: 'hospitals', label: '區域醫院', desc: '醫療設施點位' },
]
```

## 9.3 在 `MapViewer.jsx` 載入資料

目前專案的 3D / WMTS / imagery 都是手寫載入邏輯。

如果你的新資料是一般 GeoJSON 點線面，建議新增一套共用函式，例如：

```jsx
async function loadGeoJsonLayer(viewer, refs, key, url) {
  const { GeoJsonDataSource } = await import('cesium')
  const ds = await GeoJsonDataSource.load(url, {
    clampToGround: true,
  })
  viewer.dataSources.add(ds)
  refs.current[key] = ds
}
```

然後在 layer change 的 `useEffect` 中控制：

```jsx
if (layers.hospitals && !refs.current.hospitals) {
  loadGeoJsonLayer(viewer, refs, 'hospitals', 'http://localhost:3001/api/layers/hospitals')
}

if (!layers.hospitals && refs.current.hospitals) {
  viewer.dataSources.remove(refs.current.hospitals)
  refs.current.hospitals = null
}
```

這是最適合新增一般 2D/3D GeoJSON 圖層的方式。

---

## 10. 建議新增一個共用 GeoJSON 圖層載入器

目前專案主要偏 3D Tiles / WMTS，若未來要大量加入公開資料圖層，建議補一組共用層。

### 建議能力

1. `loadGeoJsonLayer(key, url, style)`
2. `show/hide` 切換
3. `reload`
4. `pick info` 顯示屬性
5. cache / error state

### 建議在 `refs.current` 儲存

```jsx
refs.current.vectorLayers = {
  hospitals: dataSource,
  shelters: dataSource,
}
```

這樣未來管理會比現在每個 layer 個別掛一個 ref 更乾淨。

---

## 11. 不同資料類型的前端顯示建議

## 11.1 點位資料

例如：

- 醫院
- 警察局
- 加油站
- 避難所
- 車站
- 監視器

建議用：

- `GeoJsonDataSource`
- 或 `viewer.entities`

## 11.2 線資料

例如：

- 河川
- 斷層
- 管線
- 道路中心線

建議用：

- `GeoJsonDataSource`
- 設定 polyline 樣式

## 11.3 面資料

例如：

- 淹水潛勢區
- 土石流潛勢區
- 崩塌潛勢區
- 行政區

建議用：

- `GeoJsonDataSource`
- polygon fill + outline

## 11.4 Raster / 影像資料

例如：

- 正射影像
- 風險 raster
- DEM

建議用：

- WMTS
- XYZ tiles
- imagery provider

不要硬塞到 `/api/layers/:type`。

---

## 12. 各格式推薦導入路線總表

| 格式 | 推薦中間格式 | 建議最終落點 | 前端建議 |
| --- | --- | --- | --- |
| GeoJSON | 直接使用 | PostGIS 或檔案 | GeoJsonDataSource |
| CSV | GeoJSON | PostGIS 或檔案 | GeoJsonDataSource |
| XML | GeoJSON | PostGIS | GeoJsonDataSource |
| TIFF / GeoTIFF | tile / raster | tiles 或 PostGIS raster | ImageryProvider |
| Shapefile | GeoJSON 或直接匯入 | PostGIS | GeoJsonDataSource |
| KML | GeoJSON | PostGIS 或檔案 | GeoJsonDataSource |
| KMZ | GeoJSON | PostGIS 或檔案 | GeoJsonDataSource |
| XLSX | GeoJSON / CSV | PostGIS 或檔案 | GeoJsonDataSource |
| ODS | CSV / GeoJSON | PostGIS 或檔案 | GeoJsonDataSource |
| API | GeoJSON | PostGIS 或後端代理 | 視資料型態而定 |

---

## 13. 實作範例：把一個新圖層加入左側圖層開關

假設你要加入 `shelters`。

### 步驟 1：匯入資料

把資料導入為：

- PostgreSQL table `shelters`
  - 或 `backend/data/shelters.geojson`

### 步驟 2：後端註冊

在 `.env`：

```env
LAYER_KEYS=flood_risk,shelters
```

### 步驟 3：前端註冊 layer state

`frontend/src/App.jsx`

```jsx
shelters: false,
```

### 步驟 4：加到左側列表

`frontend/src/components/LayerControls.jsx`

```jsx
{ key: 'shelters', label: '避難所', desc: '政府開放資料' },
```

### 步驟 5：在 `MapViewer.jsx` 載入

```jsx
if (layers.shelters && !refs.current.shelters) {
  loadGeoJsonLayer(viewer, refs, 'shelters', 'http://localhost:3001/api/layers/shelters')
}
```

---

## 14. 實作範例：把資料加入右側功能列表

如果你想像 `road_cameras` 一樣放右側。

### 步驟 1：保留 `INITIAL_LAYERS`

```jsx
river_level: false,
```

### 步驟 2：加入 `FEATURE_LIST_CONFIG`

```jsx
const FEATURE_LIST_CONFIG = [
  { key: 'road_cameras', label: '道路監視器', desc: '即時影像監視器' },
  { key: 'river_level', label: '河川水位', desc: '即時監測資料' },
]
```

### 步驟 3：在 `MapViewer.jsx` 接顯示邏輯

依資料型態選擇：

1. `viewer.entities`
2. `GeoJsonDataSource`
3. 自訂 API fetch

---

## 15. 常見錯誤與排查

## 15.1 API 404

原因通常是：

1. `LAYER_KEYS` 沒加
2. table 名稱和 layer key 不一致
3. `backend/data/<key>.geojson` 檔名不一致

## 15.2 地圖上沒顯示

常見原因：

1. 座標系統錯誤
2. geometry 不是 WGS84
3. layer 有載入但 style 太小或透明
4. 開關 state 有加，但 `MapViewer.jsx` 沒接載入邏輯

## 15.3 CSV 匯入沒點位

常見原因：

1. 沒有 `lat/lon` 或 `x/y`
2. 座標欄位名稱不在既有判斷內
3. 值不是數字

## 15.4 Shapefile 匯入後位置錯誤

通常是 `.prj` 或 CRS 問題。

請明確轉為：

```powershell
-t_srs EPSG:4326
```

## 15.5 GeoTIFF 無法直接顯示成圖層

因為 raster 不適合走目前 `/api/layers/:type` 的 GeoJSON 路徑。

請改走：

1. 切 tile
2. imagery provider
3. 或 raster API

---

## 16. 對這個專案的具體建議

### 16.1 如果你接的是公開資料點位

例如：

- 醫院
- 避難所
- 警察局
- 加油站
- 發電站

建議：

1. 先轉 GeoJSON
2. 匯入 PostGIS
3. 用 `/api/layers/:type`
4. 前端用 `GeoJsonDataSource`

### 16.2 如果你接的是風險面資料

例如：

- 淹水潛勢
- 土石流潛勢
- 崩塌潛勢

建議：

1. 保留 polygon / multipolygon
2. 匯入 PostGIS
3. 前端套半透明色塊

### 16.3 如果你接的是即時 API

例如：

- 道路監視器
- 河川水位
- 地震
- 天氣觀測

建議：

1. 優先由後端抓取
2. 做清洗與快取
3. 再供前端使用

不要直接讓前端長期依賴外部 API。

### 16.4 如果你接的是影像 / 高程

建議：

1. 走 tile / terrain 路線
2. 不要混進 `/api/layers/:type`

---

## 17. 建議下一步改造

如果你打算正式大量擴充資料圖層，建議下一步做這三件事：

1. 在 `MapViewer.jsx` 新增共用 `GeoJsonDataSource` 載入器
2. 在 `backend/scripts/` 新增多格式轉換與匯入腳本
3. 在 PostgreSQL 中為常用欄位拆出結構化欄位，而不是全部塞 `properties JSONB`

---

## 18. 最短可用流程

如果你現在只想最快把一個新資料圖層接進這個專案，照下面做就可以：

1. 把資料轉成 `EPSG:4326` 的 GeoJSON
2. 檔名命名成 `backend/data/my_layer.geojson`
3. 在 `backend/.env` 加 `LAYER_KEYS=my_layer`
4. 在 `frontend/src/App.jsx` 的 `INITIAL_LAYERS` 加 `my_layer: false`
5. 在左側 `LAYER_CONFIG` 或右側 `FEATURE_LIST_CONFIG` 加開關
6. 在 `frontend/src/components/MapViewer.jsx` 寫 `GeoJsonDataSource.load('http://localhost:3001/api/layers/my_layer')`
7. 用開關控制 add / remove 或 show / hide

這是目前這個 repo 成本最低、最不容易失敗的接法。
