import { useState } from 'react'
import MapViewer from './components/MapViewer'
import LayerControls from './components/LayerControls'
import './App.css'

// Define your layers here. Add a key and initial visibility (true = on).
const INITIAL_LAYERS = {
  osm: false,
  global_satellite: false,
  terrain_cesium: false,
  buildings:      false,
  nlsc_buildings: false,
  nlsc_roads:     false,
  nlsc_roads2:    false,
  i3s_buildings:  false,
  i3s_roads:      false,
  i3s_roads2:     false,
  road_cameras:   false,
  nlsc_photo:     true,
  nlsc_emap:      false,
  // my_data_layer: false,
}

const EXCLUSIVE_BASEMAP_KEYS = ['osm', 'global_satellite']
const BUILDING_LAYER_KEYS = ['buildings', 'nlsc_buildings', 'i3s_buildings']
const HAS_CESIUM_TERRAIN = !!import.meta.env.VITE_CESIUM_TOKEN

const FEATURE_LIST_CONFIG = [
  { key: 'road_cameras', label: '道路監視器', desc: '即時影像監視器' },
]

const RENDER_PROFILES = {
  quality: {
    resolutionScaleMax: 2,
    msaaSamples: 4,
    maxRequestsPerServer: 16,
    maxRequests: 64,
    terrainSseFactor: 1,
    tilesSseFactor: 1,
    movingTerrainBoost: 1.7,
    buildingShowMaxHeight: 65000,
    buildingConcurrentLoads: 4,
    groupKeepCount: 4,
  },
  performance: {
    resolutionScaleMax: 1.25,
    msaaSamples: 2,
    maxRequestsPerServer: 10,
    maxRequests: 40,
    terrainSseFactor: 1.35,
    tilesSseFactor: 1.4,
    movingTerrainBoost: 2.2,
    buildingShowMaxHeight: 45000,
    buildingConcurrentLoads: 2,
    groupKeepCount: 2,
  },
}

function App() {
  const [layers, setLayers] = useState(INITIAL_LAYERS)
  const [sceneMode, setSceneMode] = useState('3d')
  const [renderSettings, setRenderSettings] = useState({
    profile: 'quality',
    ...RENDER_PROFILES.quality,
  })

  const toggleLayer = (key) =>
    setLayers((prev) => {
      const next = { ...prev }
      const nextValue = !prev[key]

      if (EXCLUSIVE_BASEMAP_KEYS.includes(key)) {
        // OSM 與全球衛星圖互斥；NLSC 電子地圖與正射影圖可疊加。
        for (const baseKey of EXCLUSIVE_BASEMAP_KEYS) next[baseKey] = false
        next[key] = nextValue
        return next
      }

      next[key] = nextValue
      // 3D 建物含有絕對高程；有 Cesium token 時同步開啟地形，避免相對零高程球面懸空。
      if (nextValue && HAS_CESIUM_TERRAIN && BUILDING_LAYER_KEYS.includes(key)) {
        next.terrain_cesium = true
      }
      return next
    })

  const toggleSceneMode = () =>
    setSceneMode((m) => (m === '3d' ? '2d' : '3d'))

  const applyRenderProfile = (profile) => {
    const next = RENDER_PROFILES[profile]
    if (!next) return
    setRenderSettings({
      profile,
      ...next,
    })
  }

  const updateRenderSetting = (key, value) => {
    setRenderSettings((prev) => ({
      ...prev,
      profile: 'custom',
      [key]: value,
    }))
  }

  return (
    <div className="app">
      <button className="scene-mode-btn" onClick={toggleSceneMode}>
        {sceneMode === '3d' ? '3D' : '2D'}
      </button>
      <MapViewer layers={layers} sceneMode={sceneMode} renderSettings={renderSettings} />
      <LayerControls
        layers={layers}
        onToggle={toggleLayer}
        renderSettings={renderSettings}
        onApplyProfile={applyRenderProfile}
        onUpdateSetting={updateRenderSetting}
      />
      {false && FEATURE_LIST_CONFIG.length > 0 && (
        <aside className="layer-panel feature-list-panel" aria-label="Feature List">
          <div className="layer-panel-title">功能列表</div>
          <ul className="layer-list">
            {FEATURE_LIST_CONFIG.map(({ key, label, desc }) => (
              <li key={key}>
                <label className={`layer-item ${layers[key] ? 'active' : ''}`}>
                  <input
                    type="checkbox"
                    checked={!!layers[key]}
                    onChange={() => toggleLayer(key)}
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
        </aside>
      )}
    </div>
  )
}

export default App
