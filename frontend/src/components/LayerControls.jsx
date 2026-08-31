import { useState } from 'react'
import './LayerControls.css'

// Mirror the keys defined in App.jsx INITIAL_LAYERS
const LAYER_CONFIG = [
  { key: 'osm',              label: '全球街道圖',        desc: 'OpenStreetMap' },
  { key: 'global_satellite', label: '全球衛星圖',        desc: 'Esri World Imagery' },
  { key: 'nlsc_photo',     label: '正射影圖',           desc: '國土測繪中心 20M正射影圖' },
  { key: 'nlsc_emap',      label: '電子地圖',           desc: '國土測繪中心 20M電子地圖' },
  { key: 'terrain_cesium', label: 'Cesium Terrain',   desc: 'Global terrain' },
  { key: 'buildings',      label: '3D Buildings',     desc: 'OSM 3D buildings' },
  // Add entries here when you add layers to App.jsx INITIAL_LAYERS
]

const THREE_D_TILE_BUTTON_CONFIG = [
  { key: 'nlsc_buildings', label: '建物圖層', desc: 'NLSC 全台建物模型（群組）' },
  { key: 'nlsc_roads', label: '道路（原始成果版）', desc: 'NLSC 全台道路模型 Original（群組）' },
  { key: 'nlsc_roads2', label: '道路（地形貼合版）', desc: 'NLSC 全台道路模型 Terrain Fitting（群組）' },
]

const I3S_BUTTON_CONFIG = [
  { key: 'i3s_buildings', label: 'I3S 建物圖層', desc: 'NLSC i3s 建物 SceneServer（群組）' },
  { key: 'i3s_roads', label: 'I3S 道路（原始成果版）', desc: 'NLSC i3s road SceneServer（群組）' },
  { key: 'i3s_roads2', label: 'I3S 道路（地形貼合版）', desc: 'NLSC i3s road2nd SceneServer（群組）' },
]

const SETTING_CONFIG = [
  {
    key: 'resolutionScaleMax',
    label: '解析度倍率上限',
    min: 1,
    max: 2,
    step: 0.05,
    toNumber: true,
  },
  {
    key: 'msaaSamples',
    label: 'MSAA 樣本數',
    min: 1,
    max: 8,
    step: 1,
    toNumber: true,
  },
  {
    key: 'maxRequestsPerServer',
    label: '單伺服器最大請求',
    min: 4,
    max: 24,
    step: 1,
    toNumber: true,
  },
  {
    key: 'maxRequests',
    label: '總最大請求',
    min: 20,
    max: 120,
    step: 1,
    toNumber: true,
  },
  {
    key: 'terrainSseFactor',
    label: '地形精度係數',
    min: 0.6,
    max: 2,
    step: 0.05,
    toNumber: true,
  },
  {
    key: 'tilesSseFactor',
    label: '3D Tiles 精度係數',
    min: 0.6,
    max: 2,
    step: 0.05,
    toNumber: true,
  },
  {
    key: 'movingTerrainBoost',
    label: '移動中地形降載倍率',
    min: 1,
    max: 3,
    step: 0.05,
    toNumber: true,
  },
  {
    key: 'buildingShowMaxHeight',
    label: '建築顯示高度門檻',
    min: 20000,
    max: 120000,
    step: 1000,
    toNumber: true,
  },
  {
    key: 'buildingConcurrentLoads',
    label: '建物同時載入數量',
    min: 1,
    max: 12,
    step: 1,
    toNumber: true,
  },
  {
    key: 'groupKeepCount',
    label: '3D群組保留數量',
    min: 1,
    max: 12,
    step: 1,
    toNumber: true,
  },
]

function formatSettingValue(key, value) {
  if (key === 'resolutionScaleMax' || key === 'terrainSseFactor' || key === 'tilesSseFactor' || key === 'movingTerrainBoost') {
    return Number(value).toFixed(2)
  }
  return String(value)
}

export default function LayerControls({
  layers,
  onToggle,
  renderSettings,
  onApplyProfile,
  onUpdateSetting,
}) {
  const [collapsed, setCollapsed] = useState(false)

  return (
    <aside className={`layer-panel ${collapsed ? 'is-collapsed' : ''}`} aria-label="Layer Controls">
      <div className="layer-panel-header">
        <div className="layer-panel-title">Layers</div>
        <button
          type="button"
          className="panel-collapse-btn"
          onClick={() => setCollapsed((value) => !value)}
          aria-expanded={!collapsed}
          aria-controls="layer-panel-content"
          title={collapsed ? '展開圖層面板' : '收合圖層面板'}
        >
          <span aria-hidden="true">{collapsed ? '＋' : '−'}</span>
          <span className="sr-only">{collapsed ? '展開' : '收合'}</span>
        </button>
      </div>

      <div id="layer-panel-content" hidden={collapsed}>
      <ul className="layer-list">
        {LAYER_CONFIG.map(({ key, label, icon, desc }) => (
          <li key={key}>
            <label className={`layer-item ${layers[key] ? 'active' : ''}`}>
              <input
                type="checkbox"
                checked={!!layers[key]}
                onChange={() => onToggle(key)}
                aria-label={label}
              />
              <span className="layer-text">
                <span className="layer-label">{label}</span>
                <span className="layer-desc">{desc}</span>
              </span>
              <span className={`layer-badge ${layers[key] ? 'on' : 'off'}`}>
                {layers[key] ? 'ON' : 'OFF'}
              </span>
            </label>
          </li>
        ))}
      </ul>

      <div className="settings-section">
        <div className="settings-title">3D Tiles Layers</div>
        <div className="i3s-buttons" role="group" aria-label="3D Tiles Layer Buttons">
          {THREE_D_TILE_BUTTON_CONFIG.map((item) => (
            <button
              key={item.key}
              type="button"
              className={`i3s-btn ${layers[item.key] ? 'active' : ''}`}
              onClick={() => onToggle(item.key)}
            >
              <span className="i3s-btn-label">{item.label}</span>
              <span className="i3s-btn-desc">{item.desc}</span>
            </button>
          ))}
        </div>
      </div>

      <div className="settings-section">
        <div className="settings-title">I3S Layers</div>
        <div className="i3s-buttons" role="group" aria-label="I3S Layer Buttons">
          {I3S_BUTTON_CONFIG.map((item) => (
            <button
              key={item.key}
              type="button"
              className={`i3s-btn ${layers[item.key] ? 'active' : ''}`}
              onClick={() => onToggle(item.key)}
            >
              <span className="i3s-btn-label">{item.label}</span>
              <span className="i3s-btn-desc">{item.desc}</span>
            </button>
          ))}
        </div>
      </div>

      <div className="settings-section">
        <div className="settings-title">Render Settings</div>

        <div className="profile-actions" role="group" aria-label="Render Profiles">
          <button
            type="button"
            className={`profile-btn ${renderSettings.profile === 'quality' ? 'active' : ''}`}
            onClick={() => onApplyProfile('quality')}
          >
            畫質優先
          </button>
          <button
            type="button"
            className={`profile-btn ${renderSettings.profile === 'performance' ? 'active' : ''}`}
            onClick={() => onApplyProfile('performance')}
          >
            性能優先
          </button>
        </div>

        <div className="profile-label">目前設定：{renderSettings.profile}</div>

        <div className="setting-list">
          {SETTING_CONFIG.map((item) => (
            <label key={item.key} className="setting-item">
              <span className="setting-row">
                <span className="setting-name">{item.label}</span>
                <span className="setting-value">{formatSettingValue(item.key, renderSettings[item.key])}</span>
              </span>
              <input
                type="range"
                min={item.min}
                max={item.max}
                step={item.step}
                value={renderSettings[item.key]}
                onChange={(e) => onUpdateSetting(item.key, item.toNumber ? Number(e.target.value) : e.target.value)}
              />
            </label>
          ))}
        </div>
      </div>
      </div>
    </aside>
  )
}
