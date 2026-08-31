import { useEffect, useRef, useState } from 'react'
import {
  Ion,
  Viewer,
  EllipsoidTerrainProvider,
  Terrain,
  UrlTemplateImageryProvider,
  ArcGisMapServerImageryProvider,
  Cesium3DTileset,
  SceneMode,
  RequestScheduler,
  CameraEventType,
  KeyboardEventModifier,
  Rectangle,
  TextureMinificationFilter,
  TextureMagnificationFilter,
  ScreenSpaceEventHandler,
  ScreenSpaceEventType,
  Cartographic,
  Cartesian3,
  Color,
  Math as CesiumMath,
} from 'cesium'
import 'cesium/Build/Cesium/Widgets/widgets.css'
import './MapViewer.css'
import Compass from './Compass'
import ScaleBar from './ScaleBar'

Ion.defaultAccessToken = import.meta.env.VITE_CESIUM_TOKEN || ''

// 全域請求調度設定
RequestScheduler.maximumRequestsPerServer = 16
RequestScheduler.maximumRequests          = 64

// 國土測繪中心 3D Tiles 端點
const NLSC_TILESETS = {
  nlsc_buildings: [
    'https://3dtiles.nlsc.gov.tw/building/tiles3d/0/tileset.json',
    'https://3dtiles.nlsc.gov.tw/building/tiles3d/1/tileset.json',
    'https://3dtiles.nlsc.gov.tw/building/tiles3d/2/tileset.json',
    'https://3dtiles.nlsc.gov.tw/building/tiles3d/3/tileset.json',
    'https://3dtiles.nlsc.gov.tw/building/tiles3d/4/tileset.json',
    'https://3dtiles.nlsc.gov.tw/building/tiles3d/5/tileset.json',
    'https://3dtiles.nlsc.gov.tw/building/tiles3d/6/tileset.json',
    'https://3dtiles.nlsc.gov.tw/building/tiles3d/7/tileset.json',
    'https://3dtiles.nlsc.gov.tw/building/tiles3d/8/tileset.json',
    'https://3dtiles.nlsc.gov.tw/building/tiles3d/9/tileset.json',
    'https://3dtiles.nlsc.gov.tw/building/tiles3d/10/tileset.json',
    'https://3dtiles.nlsc.gov.tw/building/tiles3d/13/tileset.json',
    'https://3dtiles.nlsc.gov.tw/building/tiles3d/19/tileset.json',
    'https://3dtiles.nlsc.gov.tw/building/tiles3d/20/tileset.json',
    'https://3dtiles.nlsc.gov.tw/building/tiles3d/21/tileset.json',
    'https://3dtiles.nlsc.gov.tw/building/tiles3d/22/tileset.json',
    'https://3dtiles.nlsc.gov.tw/building/tiles3d/26/tileset.json',
  ],
  nlsc_roads: [
    'https://3dtiles.nlsc.gov.tw/road/tiles3d/0/tileset.json',
    'https://3dtiles.nlsc.gov.tw/road/tiles3d/1/tileset.json',
    'https://3dtiles.nlsc.gov.tw/road/tiles3d/2/tileset.json',
    'https://3dtiles.nlsc.gov.tw/road/tiles3d/3/tileset.json',
    'https://3dtiles.nlsc.gov.tw/road/tiles3d/4/tileset.json',
    'https://3dtiles.nlsc.gov.tw/road/tiles3d/5/tileset.json',
    'https://3dtiles.nlsc.gov.tw/road/tiles3d/6/tileset.json',
    'https://3dtiles.nlsc.gov.tw/road/tiles3d/7/tileset.json',
    'https://3dtiles.nlsc.gov.tw/road/tiles3d/8/tileset.json',
    'https://3dtiles.nlsc.gov.tw/road/tiles3d/9/tileset.json',
    'https://3dtiles.nlsc.gov.tw/road/tiles3d/10/tileset.json',
    'https://3dtiles.nlsc.gov.tw/road/tiles3d/11/tileset.json',
    'https://3dtiles.nlsc.gov.tw/road/tiles3d/12/tileset.json',
    'https://3dtiles.nlsc.gov.tw/road/tiles3d/13/tileset.json',
    'https://3dtiles.nlsc.gov.tw/road/tiles3d/14/tileset.json',
    'https://3dtiles.nlsc.gov.tw/road/tiles3d/15/tileset.json',
    'https://3dtiles.nlsc.gov.tw/road/tiles3d/16/tileset.json',
    'https://3dtiles.nlsc.gov.tw/road/tiles3d/17/tileset.json',
    'https://3dtiles.nlsc.gov.tw/road/tiles3d/18/tileset.json',
    'https://3dtiles.nlsc.gov.tw/road/tiles3d/20/tileset.json',
    'https://3dtiles.nlsc.gov.tw/road/tiles3d/22/tileset.json',
    'https://3dtiles.nlsc.gov.tw/road/tiles3d/23/tileset.json',
  ],
  nlsc_roads2: [
    'https://3dtiles.nlsc.gov.tw/road2nd/tiles3d/0/tileset.json',
    'https://3dtiles.nlsc.gov.tw/road2nd/tiles3d/1/tileset.json',
    'https://3dtiles.nlsc.gov.tw/road2nd/tiles3d/2/tileset.json',
    'https://3dtiles.nlsc.gov.tw/road2nd/tiles3d/3/tileset.json',
    'https://3dtiles.nlsc.gov.tw/road2nd/tiles3d/4/tileset.json',
    'https://3dtiles.nlsc.gov.tw/road2nd/tiles3d/5/tileset.json',
    'https://3dtiles.nlsc.gov.tw/road2nd/tiles3d/6/tileset.json',
    'https://3dtiles.nlsc.gov.tw/road2nd/tiles3d/7/tileset.json',
    'https://3dtiles.nlsc.gov.tw/road2nd/tiles3d/8/tileset.json',
    'https://3dtiles.nlsc.gov.tw/road2nd/tiles3d/9/tileset.json',
    'https://3dtiles.nlsc.gov.tw/road2nd/tiles3d/10/tileset.json',
    'https://3dtiles.nlsc.gov.tw/road2nd/tiles3d/11/tileset.json',
    'https://3dtiles.nlsc.gov.tw/road2nd/tiles3d/12/tileset.json',
    'https://3dtiles.nlsc.gov.tw/road2nd/tiles3d/13/tileset.json',
    'https://3dtiles.nlsc.gov.tw/road2nd/tiles3d/14/tileset.json',
    'https://3dtiles.nlsc.gov.tw/road2nd/tiles3d/15/tileset.json',
    'https://3dtiles.nlsc.gov.tw/road2nd/tiles3d/16/tileset.json',
    'https://3dtiles.nlsc.gov.tw/road2nd/tiles3d/17/tileset.json',
    'https://3dtiles.nlsc.gov.tw/road2nd/tiles3d/18/tileset.json',
    'https://3dtiles.nlsc.gov.tw/road2nd/tiles3d/20/tileset.json',
    'https://3dtiles.nlsc.gov.tw/road2nd/tiles3d/22/tileset.json',
    'https://3dtiles.nlsc.gov.tw/road2nd/tiles3d/23/tileset.json',
  ],
}

const NLSC_I3S = {
  i3s_buildings: [
    'https://i3s.nlsc.gov.tw/building/i3s/SceneServer/layers/0',
    'https://i3s.nlsc.gov.tw/building/i3s/SceneServer/layers/1',
    'https://i3s.nlsc.gov.tw/building/i3s/SceneServer/layers/2',
    'https://i3s.nlsc.gov.tw/building/i3s/SceneServer/layers/3',
    'https://i3s.nlsc.gov.tw/building/i3s/SceneServer/layers/4',
    'https://i3s.nlsc.gov.tw/building/i3s/SceneServer/layers/5',
    'https://i3s.nlsc.gov.tw/building/i3s/SceneServer/layers/6',
    'https://i3s.nlsc.gov.tw/building/i3s/SceneServer/layers/7',
    'https://i3s.nlsc.gov.tw/building/i3s/SceneServer/layers/8',
    'https://i3s.nlsc.gov.tw/building/i3s/SceneServer/layers/9',
    'https://i3s.nlsc.gov.tw/building/i3s/SceneServer/layers/10',
    'https://i3s.nlsc.gov.tw/building/i3s/SceneServer/layers/11',
    'https://i3s.nlsc.gov.tw/building/i3s/SceneServer/layers/12',
    'https://i3s.nlsc.gov.tw/building/i3s/SceneServer/layers/13',
    'https://i3s.nlsc.gov.tw/building/i3s/SceneServer/layers/14',
    'https://i3s.nlsc.gov.tw/building/i3s/SceneServer/layers/15',
    'https://i3s.nlsc.gov.tw/building/i3s/SceneServer/layers/16',
    'https://i3s.nlsc.gov.tw/building/i3s/SceneServer/layers/17',
    'https://i3s.nlsc.gov.tw/building/i3s/SceneServer/layers/18',
    'https://i3s.nlsc.gov.tw/building/i3s/SceneServer/layers/19',
    'https://i3s.nlsc.gov.tw/building/i3s/SceneServer/layers/20',
    'https://i3s.nlsc.gov.tw/building/i3s/SceneServer/layers/21',
  ],
  i3s_roads: [
    'https://i3s.nlsc.gov.tw/road/i3s/SceneServer/layers/0',
    'https://i3s.nlsc.gov.tw/road/i3s/SceneServer/layers/1',
    'https://i3s.nlsc.gov.tw/road/i3s/SceneServer/layers/2',
    'https://i3s.nlsc.gov.tw/road/i3s/SceneServer/layers/3',
    'https://i3s.nlsc.gov.tw/road/i3s/SceneServer/layers/4',
    'https://i3s.nlsc.gov.tw/road/i3s/SceneServer/layers/5',
    'https://i3s.nlsc.gov.tw/road/i3s/SceneServer/layers/6',
    'https://i3s.nlsc.gov.tw/road/i3s/SceneServer/layers/7',
    'https://i3s.nlsc.gov.tw/road/i3s/SceneServer/layers/8',
    'https://i3s.nlsc.gov.tw/road/i3s/SceneServer/layers/9',
    'https://i3s.nlsc.gov.tw/road/i3s/SceneServer/layers/10',
    'https://i3s.nlsc.gov.tw/road/i3s/SceneServer/layers/11',
    'https://i3s.nlsc.gov.tw/road/i3s/SceneServer/layers/12',
    'https://i3s.nlsc.gov.tw/road/i3s/SceneServer/layers/13',
    'https://i3s.nlsc.gov.tw/road/i3s/SceneServer/layers/14',
    'https://i3s.nlsc.gov.tw/road/i3s/SceneServer/layers/15',
    'https://i3s.nlsc.gov.tw/road/i3s/SceneServer/layers/16',
    'https://i3s.nlsc.gov.tw/road/i3s/SceneServer/layers/17',
    'https://i3s.nlsc.gov.tw/road/i3s/SceneServer/layers/18',
    'https://i3s.nlsc.gov.tw/road/i3s/SceneServer/layers/20',
    'https://i3s.nlsc.gov.tw/road/i3s/SceneServer/layers/22',
    'https://i3s.nlsc.gov.tw/road/i3s/SceneServer/layers/23',
  ],
  i3s_roads2: [
    'https://i3s.nlsc.gov.tw/road2nd/i3s/SceneServer/layers/0',
    'https://i3s.nlsc.gov.tw/road2nd/i3s/SceneServer/layers/1',
    'https://i3s.nlsc.gov.tw/road2nd/i3s/SceneServer/layers/2',
    'https://i3s.nlsc.gov.tw/road2nd/i3s/SceneServer/layers/3',
    'https://i3s.nlsc.gov.tw/road2nd/i3s/SceneServer/layers/4',
    'https://i3s.nlsc.gov.tw/road2nd/i3s/SceneServer/layers/5',
    'https://i3s.nlsc.gov.tw/road2nd/i3s/SceneServer/layers/6',
    'https://i3s.nlsc.gov.tw/road2nd/i3s/SceneServer/layers/7',
    'https://i3s.nlsc.gov.tw/road2nd/i3s/SceneServer/layers/8',
    'https://i3s.nlsc.gov.tw/road2nd/i3s/SceneServer/layers/9',
    'https://i3s.nlsc.gov.tw/road2nd/i3s/SceneServer/layers/10',
    'https://i3s.nlsc.gov.tw/road2nd/i3s/SceneServer/layers/11',
    'https://i3s.nlsc.gov.tw/road2nd/i3s/SceneServer/layers/12',
    'https://i3s.nlsc.gov.tw/road2nd/i3s/SceneServer/layers/13',
    'https://i3s.nlsc.gov.tw/road2nd/i3s/SceneServer/layers/14',
    'https://i3s.nlsc.gov.tw/road2nd/i3s/SceneServer/layers/15',
    'https://i3s.nlsc.gov.tw/road2nd/i3s/SceneServer/layers/16',
    'https://i3s.nlsc.gov.tw/road2nd/i3s/SceneServer/layers/17',
    'https://i3s.nlsc.gov.tw/road2nd/i3s/SceneServer/layers/18',
    'https://i3s.nlsc.gov.tw/road2nd/i3s/SceneServer/layers/20',
    'https://i3s.nlsc.gov.tw/road2nd/i3s/SceneServer/layers/22',
    'https://i3s.nlsc.gov.tw/road2nd/i3s/SceneServer/layers/23',
  ],
}

// 國土測繪中心 WMTS 影像端點 (GoogleMapsCompatible)
const NLSC_WMTS = {
  nlsc_emap:  'https://wmts.nlsc.gov.tw/wmts/EMAP2/default/GoogleMapsCompatible/',
  nlsc_photo: 'https://wmts.nlsc.gov.tw/wmts/PHOTO2/default/GoogleMapsCompatible/',
}

const NLSC_WMTS_LAYER_ORDER = ['nlsc_photo', 'nlsc_emap']
const GROUP_RETRY_MAX = 2
const GROUP_RETRY_BASE_MS = 1200
const GROUP_BLACKLIST_MS = 120000
const NON_BUILDING_GROUP_CONCURRENCY = 3
const LOAD_TIER_NEAR_M = 30000
const LOAD_TIER_MID_M = 120000
const GEOCODE_ENDPOINT = 'https://geocode.arcgis.com/arcgis/rest/services/World/GeocodeServer/findAddressCandidates'
const BUILDING_SEARCH_LIMIT = 8
const PICK_PROPERTY_CACHE_TTL_MS = 5 * 60 * 1000
const PICK_PROPERTY_CACHE_MAX = 5000
const TWIPCAM_CAM_LIST_URL = 'https://www.twipcam.com/api/v1/cam-list.json'
const ROAD_CAMERA_MAX_COUNT = 2500
const I3S_GEOID_SERVICE_URL =
  'https://tiles.arcgis.com/tiles/GVgbJbqm8hXASVYi/arcgis/rest/services/EGM2008/ImageServer'

const OSM_URL = 'https://tile.openstreetmap.org/'

let i3sGeoidProviderPromise = null

const DEFAULT_RENDER_SETTINGS = {
  resolutionScaleMax: 2,
  msaaSamples: 4,
  maxRequestsPerServer: 16,
  maxRequests: 64,
  terrainSseFactor: 1,
  tilesSseFactor: 1,
  movingTerrainBoost: 1.7,
  buildingShowMaxHeight: 65000,
}

function normalizeRenderSettings(settings = {}) {
  return {
    ...DEFAULT_RENDER_SETTINGS,
    ...settings,
  }
}

function getGroupTilesets(refs, key) {
  const value = refs.current[key]
  return Array.isArray(value) ? value : []
}

function forEachGroupTileset(refs, key, iteratee) {
  for (const ts of getGroupTilesets(refs, key)) iteratee(ts)
}

function removeGroupTilesets(viewer, refs, key) {
  forEachGroupTileset(refs, key, (ts) => {
    if (ts?.tileVisible && ts.__buildNameTileVisibleListener) {
      ts.tileVisible.removeEventListener(ts.__buildNameTileVisibleListener)
      ts.__buildNameTileVisibleListener = null
      ts.__buildNameIndexerAttached = false
    }
    clearPickPropertyCacheForPrimitive(refs, ts)
    viewer.scene.primitives.remove(ts)
  })
  refs.current[key] = []
}

function trimGroupTilesets(viewer, refs, key, keepCount) {
  const group = getGroupTilesets(refs, key)
  while (group.length > keepCount) {
    const removed = group.shift()
    if (removed) viewer.scene.primitives.remove(removed)
  }
  refs.current[key] = group
}

function getGroupLoadState(refs, key) {
  if (!refs.current.groupLoaders) refs.current.groupLoaders = {}
  if (!refs.current.groupLoaders[key]) {
    refs.current.groupLoaders[key] = {
      loading: new Set(),
      retryCounts: new Map(),
      blacklistUntil: new Map(),
      lastError: '',
      pumpTimer: null,
    }
  }
  return refs.current.groupLoaders[key]
}

function scheduleGroupLoadPump(viewer, refs, key, urls, createProvider, onAfterEach, delayMs = 0) {
  const state = getGroupLoadState(refs, key)
  if (state.pumpTimer != null) return

  state.pumpTimer = setTimeout(() => {
    state.pumpTimer = null
    ensureGroupProvidersLoaded(viewer, refs, key, urls, createProvider, onAfterEach)
  }, delayMs)
}

function getCameraLonLat(viewer) {
  const c = viewer?.camera?.positionCartographic
  if (!c) return null
  return {
    lon: CesiumMath.toDegrees(c.longitude),
    lat: CesiumMath.toDegrees(c.latitude),
  }
}

function toRad(deg) {
  return (deg * Math.PI) / 180
}

function distanceMetersHaversine(a, b) {
  const R = 6371000
  const dLat = toRad(b.lat - a.lat)
  const dLon = toRad(b.lon - a.lon)
  const lat1 = toRad(a.lat)
  const lat2 = toRad(b.lat)

  const h = Math.sin(dLat / 2) ** 2
    + Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLon / 2) ** 2
  return 2 * R * Math.asin(Math.sqrt(h))
}

function getProviderCenterLonLat(provider) {
  const center = provider?.boundingSphere?.center
  const carto = center ? Cartographic.fromCartesian(center) : null
  if (!carto) return null

  return {
    lon: CesiumMath.toDegrees(carto.longitude),
    lat: CesiumMath.toDegrees(carto.latitude),
  }
}

function getGroupSourceCenters(refs, key) {
  if (!refs.current.groupSourceCenters) refs.current.groupSourceCenters = {}
  if (!refs.current.groupSourceCenters[key]) refs.current.groupSourceCenters[key] = new Map()
  return refs.current.groupSourceCenters[key]
}

function getTierCapByLoadedCount(loadedCount) {
  if (loadedCount < 3) return 0
  if (loadedCount < 9) return 1
  if (loadedCount < 18) return 2
  return 3
}

function prioritizeGroupUrlsByTier(viewer, refs, key, urls, loadedCount) {
  const cameraLL = getCameraLonLat(viewer)
  const centers = getGroupSourceCenters(refs, key)
  const tierCap = getTierCapByLoadedCount(loadedCount)

  const scored = urls.map((url, index) => {
    const center = centers.get(url)
    if (!cameraLL || !center) {
      return { url, index, tier: 3, dist: Number.POSITIVE_INFINITY }
    }

    const dist = distanceMetersHaversine(cameraLL, center)
    const tier = dist <= LOAD_TIER_NEAR_M ? 0 : dist <= LOAD_TIER_MID_M ? 1 : 2
    return { url, index, tier, dist }
  })

  const inCap = scored.filter((item) => item.tier <= tierCap)
  const target = inCap.length > 0 ? inCap : scored

  target.sort((a, b) => {
    if (a.tier !== b.tier) return a.tier - b.tier
    if (a.dist !== b.dist) return a.dist - b.dist
    return a.index - b.index
  })

  return target.map((item) => item.url)
}

function normalizeSourceUrl(url) {
  const value = typeof url === 'string' ? url.trim() : ''
  return value || null
}

function getI3SGeoidProvider(ArcGISTiledElevationTerrainProvider) {
  if (!i3sGeoidProviderPromise) {
    i3sGeoidProviderPromise = ArcGISTiledElevationTerrainProvider
      .fromUrl(I3S_GEOID_SERVICE_URL)
      .catch((error) => {
        console.warn('[I3S] Geoid 高程校正服務無法載入，改用原始高程。', error)
        return null
      })
  }
  return i3sGeoidProviderPromise
}

async function createI3S(url) {
  const sourceUrl = normalizeSourceUrl(url)
  if (!sourceUrl) {
    throw new Error('I3S source URL is missing')
  }

  const { ArcGISTiledElevationTerrainProvider, I3SDataProvider } = await import('cesium')
  if (!I3SDataProvider || typeof I3SDataProvider.fromUrl !== 'function') {
    throw new Error('Cesium I3SDataProvider is unavailable in current version')
  }

  const geoidTiledTerrainProvider = ArcGISTiledElevationTerrainProvider
    ? await getI3SGeoidProvider(ArcGISTiledElevationTerrainProvider)
    : null

  return I3SDataProvider.fromUrl(sourceUrl, {
    showFeatures: true,
    ...(geoidTiledTerrainProvider ? { geoidTiledTerrainProvider } : {}),
    cesium3dTilesetOptions: {
      skipLevelOfDetail: true,
      preferLeaves: true,
      immediatelyLoadDesiredLevelOfDetail: true,
      loadSiblings: false,
      cacheBytes: 256 * 1024 * 1024,
      maximumCacheOverflowBytes: 128 * 1024 * 1024,
      preloadWhenHidden: false,
      cullWithChildrenBounds: true,
    },
  })
}

function ensureGroupProvidersLoaded(viewer, refs, key, urls, createProvider, onAfterEach) {
  if (!viewer || viewer.isDestroyed()) return false

  const state = getGroupLoadState(refs, key)
  const currentLayers = refs.current.layerState || {}
  if (!currentLayers[key]) {
    return false
  }

  const settings = refs.current.renderSettings || DEFAULT_RENDER_SETTINGS
  const isBuildingGroup = key.endsWith('buildings')
  // 建物離開顯示範圍時暫停新的來源請求；已完成的 provider 仍會保留在 scene 中。
  if (isBuildingGroup && !isCloseFor3dBuildings(viewer, settings)) {
    return false
  }

  const loaded = getGroupTilesets(refs, key)
  const loadedSet = new Set(loaded.map((ts) => ts?.__sourceUrl).filter(Boolean))
  const maxConcurrentLoads = isBuildingGroup
    ? Math.max(1, Number(settings.buildingConcurrentLoads ?? 4))
    : NON_BUILDING_GROUP_CONCURRENCY
  const now = Date.now()

  for (const [url, until] of state.blacklistUntil.entries()) {
    if (until <= now) state.blacklistUntil.delete(url)
  }

  let startCount = 0
  const candidates = []
  for (const url of urls) {
    const sourceUrl = normalizeSourceUrl(url)
    if (!sourceUrl) continue
    if (loadedSet.has(url) || state.loading.has(url)) continue
    if ((state.blacklistUntil.get(sourceUrl) || 0) > now) continue
    candidates.push(sourceUrl)
  }

  const prioritizedUrls = prioritizeGroupUrlsByTier(viewer, refs, key, candidates, loadedSet.size)

  for (const url of prioritizedUrls) {
    if (state.loading.size >= maxConcurrentLoads) break

    startCount += 1
    state.loading.add(url)

    createProvider(url).then((provider) => {
      if (viewer.isDestroyed()) {
        if (typeof provider.destroy === 'function' && !provider.isDestroyed?.()) provider.destroy()
        return
      }

      provider.__sourceUrl = url
      const layerState = refs.current.layerState || {}
      const currentSettings = refs.current.renderSettings || DEFAULT_RENDER_SETTINGS
      const alreadyAttached = getGroupTilesets(refs, key)
        .some((item) => item?.__sourceUrl === url)

      if (alreadyAttached) {
        if (typeof provider.destroy === 'function' && !provider.isDestroyed?.()) provider.destroy()
        return
      }

      // 即使請求完成時圖層已關閉或鏡頭已拉遠，也把 provider 隱藏保留。
      // 之後重新開啟只切換 show，不再下載相同的 tileset.json / I3S layer。
      provider.show = !!layerState[key]
        && (!isBuildingGroup || isCloseFor3dBuildings(viewer, currentSettings))
      viewer.scene.primitives.add(provider)
      if (!Array.isArray(refs.current[key])) refs.current[key] = []
      refs.current[key].push(provider)
      const center = getProviderCenterLonLat(provider)
      if (center) {
        getGroupSourceCenters(refs, key).set(url, center)
      }
      if (key === 'nlsc_buildings') {
        registerNlscBuildingIndexer(refs, provider)
      }
      onAfterEach(provider)
    }).catch((error) => {
      const retries = (state.retryCounts.get(url) || 0) + 1
      state.retryCounts.set(url, retries)
      state.lastError = `${key}: ${url} -> ${error?.message || 'load failed'}`

      if (retries <= GROUP_RETRY_MAX) {
        const retryDelay = GROUP_RETRY_BASE_MS * (2 ** (retries - 1))
        scheduleGroupLoadPump(viewer, refs, key, urls, createProvider, onAfterEach, retryDelay)
      } else {
        state.blacklistUntil.set(url, Date.now() + GROUP_BLACKLIST_MS)
      }

      console.warn('[GroupLoad] failed', key, url, `retry=${retries}`)
    }).finally(() => {
      state.loading.delete(url)
      scheduleGroupLoadPump(viewer, refs, key, urls, createProvider, onAfterEach)
    })
  }

  return state.loading.size + startCount > 0
}

function ensureGroupTilesetsLoaded(viewer, refs, key, urls, onAfterEach) {
  return ensureGroupProvidersLoaded(viewer, refs, key, urls, createTileset, onAfterEach)
}

function ensureGroupI3SLoaded(viewer, refs, key, urls, onAfterEach) {
  return ensureGroupProvidersLoaded(viewer, refs, key, urls, createI3S, onAfterEach)
}

// 建立效能優化的 3D Tileset
function createTileset(url) {
  const sourceUrl = normalizeSourceUrl(url)
  if (!sourceUrl) {
    return Promise.reject(new Error('3D Tiles source URL is missing'))
  }

  return Cesium3DTileset.fromUrl(sourceUrl, {
    // ── LOD 策略：略過中間層級，直接請求目前視角需要的最佳解析度 ─────
    maximumScreenSpaceError:  10,
    skipLevelOfDetail:        true,
    preferLeaves:             true,
    immediatelyLoadDesiredLevelOfDetail: true,
    loadSiblings:             false,
    // ── 遠景降質 ────────────────────────────────────────────────────
    dynamicScreenSpaceError:        true,
    dynamicScreenSpaceErrorDensity: 0.00278,
    dynamicScreenSpaceErrorFactor:  2.0,
    // ── 移動時暫緩非關鍵請求 ─────────────────────────────────────────
    cullRequestsWhileMoving:           true,
    cullRequestsWhileMovingMultiplier: 20,
    // ── 視野中心優先 ─────────────────────────────────────────────────
    foveatedScreenSpaceError: false,
    // ── 保留已載入的高解析度 tile，減少移回相同區域時重新請求 ────────
    cacheBytes: 256 * 1024 * 1024,
    maximumCacheOverflowBytes: 256 * 1024 * 1024,
    preloadWhenHidden: false,
    cullWithChildrenBounds: true,
  })
}

function createWmtsProvider(baseUrl) {
  const sourceUrl = normalizeSourceUrl(baseUrl)
  if (!sourceUrl) {
    throw new Error('WMTS base URL is missing')
  }

  return new UrlTemplateImageryProvider({
    // GoogleMapsCompatible matrix: z / y(row) / x(col)
    url: `${sourceUrl}{z}/{y}/{x}`,
    credit: 'NLSC WMTS',
    maximumLevel: 20,
  })
}

function createGlobalSatelliteProvider() {
  return ArcGisMapServerImageryProvider.fromUrl(
    'https://services.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer',
    {
      enablePickFeatures: false,
    }
  )
}

function createOsmProvider() {
  return new UrlTemplateImageryProvider({
    url: `${OSM_URL}{z}/{x}/{y}.png`,
    credit: 'OpenStreetMap contributors',
    maximumLevel: 20,
  })
}

function syncNlscLayerBlend(viewer, refs, layers) {
  const photoLayer = refs.current.nlsc_photo
  const emapLayer = refs.current.nlsc_emap
  if (!photoLayer || !emapLayer) return

  const photoOn = !!layers.nlsc_photo
  const emapOn = !!layers.nlsc_emap

  photoLayer.alpha = 1.0
  emapLayer.alpha = photoOn && emapOn ? 0.62 : 1.0

  if (photoOn) viewer.imageryLayers.raiseToTop(photoLayer)
  if (emapOn) viewer.imageryLayers.raiseToTop(emapLayer)
}

function isCloseFor3dBuildings(viewer, settings) {
  const h = viewer.camera.positionCartographic?.height ?? Number.POSITIVE_INFINITY
  return h <= settings.buildingShowMaxHeight
}

function ensureCloseRangeBuildingLoads(viewer, refs, layers, settings) {
  const inBuildingRange = isCloseFor3dBuildings(viewer, settings)

  if (refs.current.buildings) {
    refs.current.buildings.show = !!layers.buildings && inBuildingRange
  }
  syncTilesetVisibilityByView(viewer, refs, layers, settings)

  if (!inBuildingRange) {
    return
  }

  if (layers.buildings && !refs.current.buildings && !refs.current.loadingOsmBuildings) {
    refs.current.loadingOsmBuildings = true
    import('cesium').then(({ Cesium3DTileset }) => {
      Cesium3DTileset.fromIonAssetId(96188, {
        maximumScreenSpaceError: 16,
        skipLevelOfDetail: true,
        preferLeaves: true,
        immediatelyLoadDesiredLevelOfDetail: true,
        loadSiblings: false,
        dynamicScreenSpaceError: true,
        cacheBytes: 256 * 1024 * 1024,
        maximumCacheOverflowBytes: 128 * 1024 * 1024,
        preloadWhenHidden: false,
        cullWithChildrenBounds: true,
      }).then((ts) => {
        if (viewer.isDestroyed()) return
        if (refs.current.buildings) {
          if (typeof ts.destroy === 'function' && !ts.isDestroyed?.()) ts.destroy()
          return
        }

        ts.show = !!(refs.current.layerState || {}).buildings
          && isCloseFor3dBuildings(viewer, refs.current.renderSettings || DEFAULT_RENDER_SETTINGS)
        viewer.scene.primitives.add(ts)
        refs.current.buildings = ts
        viewer.scene.requestRender()
      }).catch(() => {
      }).finally(() => {
        refs.current.loadingOsmBuildings = false
      })
    })
  }

  if (layers.nlsc_buildings) {
    ensureGroupTilesetsLoaded(
      viewer,
      refs,
      'nlsc_buildings',
      NLSC_TILESETS.nlsc_buildings,
      () => viewer.scene.requestRender()
    )
  }

  if (layers.i3s_buildings) {
    ensureGroupI3SLoaded(
      viewer,
      refs,
      'i3s_buildings',
      NLSC_I3S.i3s_buildings,
      () => viewer.scene.requestRender()
    )
  }
}

function syncTerrainVisibility(viewer, refs, layers, settings) {
  const terrainRequested = !!layers.terrain_cesium

  if (!terrainRequested) {
    if (refs.current.terrainActive) {
      viewer.scene.setTerrain(new Terrain(Promise.resolve(new EllipsoidTerrainProvider())))
      refs.current.terrainActive = false
      refs.current.loadingTerrain = false
      viewer.scene.requestRender()
    }
    return
  }

  if (terrainRequested && !refs.current.terrainActive && !refs.current.loadingTerrain) {
    if (!Ion.defaultAccessToken) {
      console.warn('[Terrain] Cesium ion token is missing; world terrain is unavailable.')
      return
    }

    refs.current.loadingTerrain = true
    try {
      const terrain = Terrain.fromWorldTerrain({
        requestVertexNormals: false,
        requestWaterMask: false,
      })
      terrain.readyEvent.addEventListener(() => {
        refs.current.loadingTerrain = false
        viewer.scene.requestRender()
      })
      terrain.errorEvent.addEventListener((err) => {
        refs.current.loadingTerrain = false
        refs.current.terrainActive = false
        console.error('[Terrain] 載入失敗:', err)
      })
      viewer.scene.setTerrain(terrain)
      refs.current.terrainActive = true
      viewer.scene.requestRender()
    } catch (e) {
      refs.current.loadingTerrain = false
      console.error('[Terrain] setTerrain 失敗:', e)
    }
    return
  }
}

function getExpandedViewRectangle(viewer, paddingDegrees = 0.35) {
  const viewRect = viewer.camera.computeViewRectangle(viewer.scene.globe.ellipsoid)
  if (!viewRect) return null

  const pad = CesiumMath.toRadians(paddingDegrees)
  const maxLat = CesiumMath.toRadians(85)

  return new Rectangle(
    viewRect.west - pad,
    Math.max(viewRect.south - pad, -maxLat),
    viewRect.east + pad,
    Math.min(viewRect.north + pad, maxLat)
  )
}

function syncTilesetVisibilityByView(viewer, refs, layers, settings) {
  const closeForBuildings = isCloseFor3dBuildings(viewer, settings)

  const nlscTilesetKeys = ['nlsc_buildings', 'nlsc_roads', 'nlsc_roads2', 'i3s_buildings', 'i3s_roads', 'i3s_roads2']
  for (const key of nlscTilesetKeys) {
    forEachGroupTileset(refs, key, (ts) => {
      if (!layers[key]) {
        ts.show = false
        return
      }

      if ((key === 'nlsc_buildings' || key === 'i3s_buildings') && !closeForBuildings) {
        ts.show = false
        return
      }

      ts.show = true
    })
  }
}

function applyAdaptiveDetail(viewer, refs, layers, settings) {
  const h = viewer.camera.positionCartographic?.height ?? 100000
  const cameraMoving = !!refs.current.cameraMoving

  let terrainSse = 1.5
  let tilesSse = 10

  if (h < 12000) {
    terrainSse = 0.45
    tilesSse = 4
  } else if (h < 45000) {
    terrainSse = 0.85
    tilesSse = 7
  }

  terrainSse *= settings.terrainSseFactor
  tilesSse *= settings.tilesSseFactor

  // 移動中先放寬地形精度，降低即時補 tile 壓力；停止後會回到高精度。
  if (cameraMoving) {
    terrainSse = Math.min(terrainSse * settings.movingTerrainBoost, 3.2)
  }

  viewer.scene.globe.maximumScreenSpaceError = terrainSse

  const targets = [
    refs.current.buildings,
    ...getGroupTilesets(refs, 'nlsc_buildings'),
    ...getGroupTilesets(refs, 'nlsc_roads'),
    ...getGroupTilesets(refs, 'nlsc_roads2'),
    ...getGroupTilesets(refs, 'i3s_buildings'),
    ...getGroupTilesets(refs, 'i3s_roads'),
    ...getGroupTilesets(refs, 'i3s_roads2'),
  ]

  for (const ts of targets) {
    if (!ts) continue
    if (Object.prototype.hasOwnProperty.call(ts, 'maximumScreenSpaceError')) {
      try {
        ts.maximumScreenSpaceError = tilesSse
      } catch {
      }
    }
  }

  if (refs.current.buildings) {
    refs.current.buildings.show = !!layers.buildings && isCloseFor3dBuildings(viewer, settings)
  }

  ensureCloseRangeBuildingLoads(viewer, refs, layers, settings)

  syncTilesetVisibilityByView(viewer, refs, layers, settings)

  viewer.scene.requestRender()
}

function getLonLatFromPosition(viewer, position) {
  const scene = viewer.scene
  let cartesian = null

  if (scene.pickPositionSupported) {
    cartesian = scene.pickPosition(position)
  }
  if (!cartesian) {
    cartesian = viewer.camera.pickEllipsoid(position, scene.globe.ellipsoid)
  }
  if (!cartesian) return null

  const cartographic = Cartographic.fromCartesian(cartesian)
  if (!cartographic) return null

  return {
    lon: CesiumMath.toDegrees(cartographic.longitude),
    lat: CesiumMath.toDegrees(cartographic.latitude),
    h: cartographic.height,
  }
}

function toDisplayValue(value) {
  if (value == null || value === '') return 'N/A'
  if (typeof value === 'number') return Number.isFinite(value) ? value.toString() : 'NaN'
  if (typeof value === 'object') {
    try {
      return JSON.stringify(value)
    } catch {
      return '[Object]'
    }
  }
  return String(value)
}

const BUILDING_NAME_KEYS = [
  'Build_Name',
  'BUILD_NAME',
  'Building_Name',
  'BuildingName',
  'NAME',
  'Name',
  'name',
  '建物名稱',
]

function resolvePropertyValue(featureLike, key) {
  if (!featureLike) return undefined

  if (typeof featureLike.getProperty === 'function') {
    try {
      return featureLike.getProperty(key)
    } catch {
    }
  }

  const rawProps = featureLike?.properties
  if (rawProps && typeof rawProps === 'object') {
    if (Object.prototype.hasOwnProperty.call(rawProps, key)) return rawProps[key]
    if (rawProps[key]?.getValue) {
      try {
        return rawProps[key].getValue()
      } catch {
      }
    }
  }

  return undefined
}

function normalizePropertyKey(key) {
  return String(key || '')
    .toLowerCase()
    .replace(/[\s_\-]/g, '')
}

function findBestBuildNameKey(names) {
  if (!Array.isArray(names) || names.length === 0) return null

  const normalizedAliases = new Set(BUILDING_NAME_KEYS.map(normalizePropertyKey))

  for (const name of names) {
    if (normalizedAliases.has(normalizePropertyKey(name))) return name
  }

  for (const name of names) {
    const n = normalizePropertyKey(name)
    if (n.includes('build') && n.includes('name')) return name
    if (n.includes('building') && n.includes('name')) return name
    if (n.includes('建物') && n.includes('名稱')) return name
  }

  return null
}

function extractFeaturePropertiesForPanel(picked) {
  const rows = []
  const usedKeys = new Set()

  const names = typeof picked?.getPropertyNames === 'function'
    ? (picked.getPropertyNames() || [])
    : typeof picked?.getPropertyIds === 'function'
      ? (picked.getPropertyIds() || [])
      : []

  for (const name of names.slice(0, 60)) {
    usedKeys.add(name)
    rows.push({
      name,
      value: toDisplayValue(resolvePropertyValue(picked, name)),
    })
  }

  let buildNameValue = undefined
  let buildNameKey = findBestBuildNameKey(names)

  if (buildNameKey) {
    buildNameValue = resolvePropertyValue(picked, buildNameKey)
  }

  if (buildNameValue == null || buildNameValue === '') {
    for (const key of BUILDING_NAME_KEYS) {
      const value = resolvePropertyValue(picked, key)
      if (value != null && value !== '') {
        buildNameValue = value
        buildNameKey = key
        break
      }
    }
  }

  if (buildNameKey && !usedKeys.has(buildNameKey)) {
    rows.unshift({
      name: 'Build_Name',
      value: toDisplayValue(buildNameValue),
    })
  }

  // Fallback for non-3DTiles picked objects (entity-like structures)
  if (rows.length === 0 && picked?.id?.properties) {
    const props = picked.id.properties
    for (const key of Object.keys(props).slice(0, 60)) {
      let raw = props[key]
      if (raw?.getValue) {
        try {
          raw = raw.getValue()
        } catch {
        }
      }
      rows.push({ name: key, value: toDisplayValue(raw) })
    }
  }

  return rows
}

function getPickPropertyCache(refs) {
  if (!refs.current.pickPropertyCache) {
    refs.current.pickPropertyCache = {
      byObject: new WeakMap(),
      byStableKey: new Map(),
      primitiveIds: new WeakMap(),
      nextPrimitiveId: 1,
    }
  }
  return refs.current.pickPropertyCache
}

function getPrimitiveRuntimeId(cache, primitive) {
  if (!primitive || typeof primitive !== 'object') return null

  let id = cache.primitiveIds.get(primitive)
  if (!id) {
    id = `p${cache.nextPrimitiveId}`
    cache.nextPrimitiveId += 1
    cache.primitiveIds.set(primitive, id)
  }
  return id
}

function getPickedFeatureStableKey(cache, picked) {
  const primitiveId = getPrimitiveRuntimeId(cache, picked?.primitive)
  if (!primitiveId) return null

  const featureIndex = [picked?.featureId, picked?.batchId, picked?._featureId, picked?._batchId]
    .find((value) => Number.isInteger(value) && value >= 0)

  if (!Number.isInteger(featureIndex)) return null
  return `${primitiveId}:${featureIndex}`
}

function cleanupExpiredPickPropertyCache(cache, now) {
  for (const [key, entry] of cache.byStableKey) {
    if (!entry || now - entry.savedAt > PICK_PROPERTY_CACHE_TTL_MS) {
      cache.byStableKey.delete(key)
    }
  }

  if (cache.byStableKey.size <= PICK_PROPERTY_CACHE_MAX) return

  const overflow = cache.byStableKey.size - PICK_PROPERTY_CACHE_MAX
  const oldest = Array.from(cache.byStableKey.entries())
    .sort((a, b) => (a[1]?.savedAt || 0) - (b[1]?.savedAt || 0))

  for (let i = 0; i < overflow; i += 1) {
    const key = oldest[i]?.[0]
    if (key) cache.byStableKey.delete(key)
  }
}

function getCachedFeaturePropertiesForPanel(refs, picked) {
  if (!picked) return []

  const cache = getPickPropertyCache(refs)
  const now = Date.now()
  const objectEntry = cache.byObject.get(picked)
  if (objectEntry && now - objectEntry.savedAt <= PICK_PROPERTY_CACHE_TTL_MS) {
    return objectEntry.rows
  }

  const stableKey = getPickedFeatureStableKey(cache, picked)
  if (stableKey) {
    const stableEntry = cache.byStableKey.get(stableKey)
    if (stableEntry && now - stableEntry.savedAt <= PICK_PROPERTY_CACHE_TTL_MS) {
      cache.byObject.set(picked, stableEntry)
      return stableEntry.rows
    }
  }

  const rows = extractFeaturePropertiesForPanel(picked)
  const entry = { rows, savedAt: now }

  cache.byObject.set(picked, entry)
  if (stableKey) {
    cache.byStableKey.set(stableKey, entry)
    cleanupExpiredPickPropertyCache(cache, now)
  }

  return rows
}

function clearPickPropertyCacheForPrimitive(refs, primitive) {
  if (!primitive) return

  const cache = refs.current.pickPropertyCache
  if (!cache) return

  const primitiveId = cache.primitiveIds.get(primitive)
  if (!primitiveId) return

  for (const key of cache.byStableKey.keys()) {
    if (String(key).startsWith(`${primitiveId}:`)) {
      cache.byStableKey.delete(key)
    }
  }

  cache.primitiveIds.delete(primitive)
}

function normalizeErrorMessage(errorLike) {
  if (!errorLike) return 'Unknown render error'
  if (typeof errorLike === 'string') return errorLike
  if (errorLike?.message) return String(errorLike.message)
  try {
    return JSON.stringify(errorLike)
  } catch {
    return String(errorLike)
  }
}

function toFiniteNumber(value) {
  const n = Number(value)
  return Number.isFinite(n) ? n : null
}

function normalizeRoadCameraRecord(raw) {
  const lat = toFiniteNumber(raw?.lat)
  const lon = toFiniteNumber(raw?.lon)
  const camUrl = typeof raw?.cam_url === 'string' ? raw.cam_url.trim() : ''
  if (lat == null || lon == null || !camUrl) return null

  const name = typeof raw?.name === 'string' ? raw.name.trim() : ''
  return {
    id: String(raw?.id || `${lat},${lon}`),
    lat,
    lon,
    name: name || '道路監視器',
    cam_url: camUrl,
  }
}

async function fetchRoadCameras(signal) {
  const response = await fetch(TWIPCAM_CAM_LIST_URL, {
    method: 'GET',
    signal,
  })

  if (!response.ok) {
    throw new Error(`Road camera request failed (${response.status})`)
  }

  const data = await response.json()
  if (!Array.isArray(data)) {
    throw new Error('Road camera response format is invalid')
  }

  const out = []
  for (const item of data) {
    const camera = normalizeRoadCameraRecord(item)
    if (camera) out.push(camera)
    if (out.length >= ROAD_CAMERA_MAX_COUNT) break
  }

  return out
}

function setRoadCameraVisibility(refs, visible) {
  const entities = refs.current.roadCameraEntities
  if (!Array.isArray(entities) || entities.length === 0) return
  for (const entity of entities) entity.show = !!visible
}

async function ensureRoadCamerasLoaded(viewer, refs, onErrorStateChange) {
  if (refs.current.roadCameraLoaded || refs.current.loadingRoadCameras) {
    setRoadCameraVisibility(refs, true)
    if (refs.current.roadCameraLoaded) onErrorStateChange('')
    return
  }

  refs.current.loadingRoadCameras = true
  refs.current.roadCameraError = ''
  onErrorStateChange('')

  const controller = new AbortController()
  refs.current.roadCameraAbort = controller

  try {
    const cameras = await fetchRoadCameras(controller.signal)
    const entities = []

    for (const camera of cameras) {
      const entity = viewer.entities.add({
        position: Cartesian3.fromDegrees(camera.lon, camera.lat, 35),
        point: {
          pixelSize: 11,
          color: Color.fromCssColorString('#f08a24').withAlpha(0.95),
          outlineColor: Color.fromCssColorString('#ffffff').withAlpha(0.95),
          outlineWidth: 1,
          disableDepthTestDistance: Number.POSITIVE_INFINITY,
        },
        properties: {
          id: camera.id,
          name: camera.name,
          cam_url: camera.cam_url,
          provider: 'twipcam',
          type: 'road_camera',
        },
      })
      entity.__layerKey = 'road_cameras'
      entities.push(entity)
    }

    refs.current.roadCameraEntities = entities
    refs.current.roadCameraLoaded = true
    setRoadCameraVisibility(refs, true)
    onErrorStateChange('')
    viewer.scene.requestRender()
  } catch (error) {
    if (error?.name !== 'AbortError') {
      refs.current.roadCameraError = error?.message || '道路監視器載入失敗'
      onErrorStateChange('')
      console.warn('[RoadCamera] load failed', error)
    }
  } finally {
    if (refs.current.roadCameraAbort === controller) {
      refs.current.roadCameraAbort = null
    }
    refs.current.loadingRoadCameras = false
  }
}

function disposeRoadCameras(viewer, refs) {
  const controller = refs.current.roadCameraAbort
  if (controller) {
    controller.abort()
    refs.current.roadCameraAbort = null
  }

  const entities = refs.current.roadCameraEntities
  if (Array.isArray(entities) && entities.length > 0 && viewer) {
    for (const entity of entities) {
      try {
        viewer.entities.remove(entity)
      } catch {
      }
    }
  }

  refs.current.roadCameraEntities = []
  refs.current.roadCameraLoaded = false
  refs.current.loadingRoadCameras = false
}

function createBuildingIndexEntry(name, lon, lat) {
  return {
    label: name,
    score: 100,
    lon,
    lat,
    source: 'nlsc_building',
    meta: 'NLSC 建物名稱',
  }
}

function registerNlscBuildingIndexer(refs, tileset) {
  if (!tileset || tileset.__buildNameIndexerAttached) return

  tileset.__buildNameIndexerAttached = true
  if (!refs.current.nlscBuildingNameIndex) refs.current.nlscBuildingNameIndex = new Map()
  if (!refs.current.nlscBuildingScannedTiles) refs.current.nlscBuildingScannedTiles = new WeakSet()

  const indexMap = refs.current.nlscBuildingNameIndex
  const scannedTiles = refs.current.nlscBuildingScannedTiles

  const onTileVisible = (tile) => {
    if (!tile || scannedTiles.has(tile)) return
    scannedTiles.add(tile)

    const featuresLength = Number(tile.content?.featuresLength || 0)
    if (featuresLength <= 0) return

    const center = tile.boundingSphere?.center
    const cartographic = center ? Cartographic.fromCartesian(center) : null
    if (!cartographic) return

    const lon = CesiumMath.toDegrees(cartographic.longitude)
    const lat = CesiumMath.toDegrees(cartographic.latitude)

    for (let i = 0; i < featuresLength; i += 1) {
      const feature = tile.content.getFeature(i)
      if (!feature || typeof feature.getProperty !== 'function') continue

      const rawName = feature.getProperty('Build_Name')
      const name = typeof rawName === 'string' ? rawName.trim() : ''
      if (!name) continue

      if (!indexMap.has(name)) {
        indexMap.set(name, createBuildingIndexEntry(name, lon, lat))
      }
    }
  }

  tileset.tileVisible.addEventListener(onTileVisible)
  tileset.__buildNameTileVisibleListener = onTileVisible
}

function searchNlscBuildingNames(refs, query, limit = BUILDING_SEARCH_LIMIT) {
  const indexMap = refs.current.nlscBuildingNameIndex
  if (!indexMap || !query) return []

  const q = query.toLowerCase()
  const results = []

  for (const item of indexMap.values()) {
    const label = item.label || ''
    const idx = label.toLowerCase().indexOf(q)
    if (idx === -1) continue

    const score = idx === 0 ? 200 : 140 - Math.min(idx, 80)
    results.push({ ...item, score })
  }

  results.sort((a, b) => b.score - a.score || a.label.localeCompare(b.label, 'zh-Hant'))
  return results.slice(0, limit)
}

async function geocodeAddressQuery(query, signal) {
  const params = new URLSearchParams({
    f: 'pjson',
    singleLine: query,
    sourceCountry: 'TWN',
    maxLocations: '6',
    outFields: 'Match_addr,Addr_type',
  })

  const response = await fetch(`${GEOCODE_ENDPOINT}?${params.toString()}`, {
    method: 'GET',
    signal,
  })

  if (!response.ok) {
    throw new Error(`Geocode request failed (${response.status})`)
  }

  const data = await response.json()
  const candidates = Array.isArray(data?.candidates) ? data.candidates : []

  return candidates
    .filter((item) => item?.location && Number.isFinite(item.location.x) && Number.isFinite(item.location.y))
    .map((item) => ({
      label: item.address || 'Unnamed location',
      score: Number(item.score || 0),
      lon: item.location.x,
      lat: item.location.y,
      source: 'geocode',
      meta: '地址/關鍵字定位',
    }))
}

export default function MapViewer({ layers, sceneMode, renderSettings }) {
  const containerRef  = useRef(null)
  const viewerRef     = useRef(null)
  const refs          = useRef({})
  const layersRef     = useRef(layers)
  const settingsRef   = useRef(normalizeRenderSettings(renderSettings))
  const [viewerReady, setViewerReady] = useState(null) // holds viewer instance for child UI
  const [pickInfo, setPickInfo] = useState(null)
  const [renderError, setRenderError] = useState('')
  const [searchText, setSearchText] = useState('')
  const [searchCollapsed, setSearchCollapsed] = useState(false)
  const [searching, setSearching] = useState(false)
  const [searchError, setSearchError] = useState('')
  const [searchResults, setSearchResults] = useState([])
  const [roadCameraError, setRoadCameraError] = useState('')
  const searchAbortRef = useRef(null)

  useEffect(() => { layersRef.current = layers }, [layers])
  useEffect(() => { settingsRef.current = normalizeRenderSettings(renderSettings) }, [renderSettings])
  useEffect(() => { refs.current.layerState = layers }, [layers])
  useEffect(() => { refs.current.renderSettings = settingsRef.current }, [renderSettings])

  // ── Initialize Viewer once ───────────────────────────────────────
  useEffect(() => {
    if (viewerRef.current) return

    RequestScheduler.maximumRequestsPerServer = settingsRef.current.maxRequestsPerServer
    RequestScheduler.maximumRequests = settingsRef.current.maxRequests

    const viewer = new Viewer(containerRef.current, {
      sceneMode:            SceneMode.SCENE3D,
      baseLayer:            false,             // 禁止自動載入 Bing Maps（需要 Ion 權限）
      useBrowserRecommendedResolution: false,
      baseLayerPicker:      false,
      navigationHelpButton: false,
      homeButton: false,
      sceneModePicker: false,
      geocoder: false,
      animation: false,
      timeline: false,
      fullscreenButton: false,
      shadows: false,                  // 關閉陰影（大幅降低 GPU 負擔）
      requestRenderMode: true,         // 只在場景變動時重繪，降低 CPU/GPU 閒置耗用
      maximumRenderTimeChange: 0.5,    // 最多每 0.5 秒強制重繪一次
      targetFrameRate: 60,
      showRenderLoopErrors: false,
    })

    viewer.resolutionScale = Math.min(window.devicePixelRatio || 1, settingsRef.current.resolutionScaleMax)

    const scene = viewer.scene
    const onRenderError = (...args) => {
      const rawError = args.length >= 2 ? args[1] : args[0]
      const msg = normalizeErrorMessage(rawError)
      const now = Date.now()
      const lastMsg = refs.current.lastRenderErrorMsg || ''
      const lastAt = refs.current.lastRenderErrorAt || 0

      console.error('[Cesium RenderError]', rawError)
      if (msg !== lastMsg || now - lastAt > 1200) {
        refs.current.lastRenderErrorMsg = msg
        refs.current.lastRenderErrorAt = now
        setRenderError(msg)
      }

      // Cesium may disable the default render loop after an exception.
      // Force it back on so the app can keep working while we diagnose.
      if (!viewer.useDefaultRenderLoop) {
        viewer.useDefaultRenderLoop = true
      }

      if (msg.toLowerCase().includes('width') && msg.includes('greater than 0')) {
        setTimeout(() => {
          const w = viewer.scene?.canvas?.clientWidth || 0
          const h = viewer.scene?.canvas?.clientHeight || 0
          if (w > 0 && h > 0) {
            try {
              viewer.resize()
              viewer.scene.requestRender()
            } catch {
            }
          }
        }, 120)
      }
    }
    scene.renderError.addEventListener(onRenderError)
    const removeTileProgressListener = scene.globe.tileLoadProgressEvent.addEventListener(() => {
      scene.requestRender()
    })
    const initialKickTimers = [0, 250, 800, 1800].map((ms) =>
      setTimeout(() => scene.requestRender(), ms)
    )

    scene.globe.maximumScreenSpaceError = 1
    scene.globe.tileCacheSize = 300           // 多保留已載入瓦片，降低往返相同區域的重複請求
    scene.globe.preloadAncestors = true       // 避免視角變化時出現大面積破圖
    scene.globe.preloadSiblings = true        // 保留邊界鄰接 tile 以維持連續性
    scene.globe.depthTestAgainstTerrain = true // 讓地形遮蔽低於地表的建物部分，消除懸浮感
    scene.globe.enableLighting = false        // 關閉球面光照
    scene.fog.enabled = true                  // 霧效讓遠處 tile 不需載入
    scene.fog.density = 0.0002
    scene.fxaa = false
    scene.msaaSamples = settingsRef.current.msaaSamples

    viewer.imageryLayers.removeAll()

    // ── 預設視角：台灣全島 ────────────────────────────────────────────
    viewer.camera.setView({
      destination: Rectangle.fromDegrees(116.8, 20.4, 124.2, 26.9),
    })

    // ── 滑鼠右鍵改為轉視角（Tilt） ──────────────────────────────────
    const ctrl = viewer.scene.screenSpaceCameraController
    ctrl.tiltEventTypes = [
      CameraEventType.RIGHT_DRAG,
      { eventType: CameraEventType.LEFT_DRAG, modifier: KeyboardEventModifier.CTRL },
    ]
    ctrl.zoomEventTypes = [
      CameraEventType.WHEEL,
      CameraEventType.PINCH,
    ]

    // 左鍵點選圖徵查詢
    const pickHandler = new ScreenSpaceEventHandler(viewer.scene.canvas)
    pickHandler.setInputAction((movement) => {
      const position = movement?.position
      if (!position) return

      const picked = viewer.scene.pick(position)
      const coord = getLonLatFromPosition(viewer, position)

      if (picked) {
        const properties = getCachedFeaturePropertiesForPanel(refs, picked)
        const camUrlProp = properties.find((item) => normalizePropertyKey(item.name) === 'camurl')
        const camUrlRaw = typeof camUrlProp?.value === 'string' ? camUrlProp.value.trim() : ''
        const cameraPreviewUrl = camUrlRaw && camUrlRaw !== 'N/A'
          ? `${camUrlRaw}${camUrlRaw.includes('?') ? '&' : '?'}t=${Date.now()}`
          : ''

        const primitive = picked.primitive
        const entityLayerKey = picked?.id?.__layerKey
        let source = '3D Feature'
        if (getGroupTilesets(refs, 'nlsc_buildings').includes(primitive)) source = 'NLSC 建物 3D'
        else if (getGroupTilesets(refs, 'nlsc_roads').includes(primitive)) source = 'NLSC 道路（原始成果版）3D'
        else if (getGroupTilesets(refs, 'nlsc_roads2').includes(primitive)) source = 'NLSC 道路（地形貼合版）3D'
        else if (getGroupTilesets(refs, 'i3s_buildings').includes(primitive)) source = 'NLSC I3S 建物 3D'
        else if (getGroupTilesets(refs, 'i3s_roads').includes(primitive)) source = 'NLSC I3S 道路（原始成果版）3D'
        else if (getGroupTilesets(refs, 'i3s_roads2').includes(primitive)) source = 'NLSC I3S 道路（地形貼合版）3D'
        else if (primitive === refs.current.buildings) source = 'OSM Buildings'
        else if (entityLayerKey === 'road_cameras') source = '道路監視器 (twipcam)'

        if (properties.length > 0) {
          setPickInfo({
            kind: 'feature',
            source,
            properties,
            coord,
            cameraPreviewUrl,
          })
        } else {
          setPickInfo(null)
        }
      } else {
        setPickInfo(null)
      }

      viewer.scene.requestRender()
    }, ScreenSpaceEventType.LEFT_CLICK)

    viewerRef.current = viewer
    setViewerReady(viewer)

    const onMoveStart = () => {
      refs.current.cameraMoving = true
      syncTerrainVisibility(viewer, refs, layersRef.current, settingsRef.current)
      applyAdaptiveDetail(viewer, refs, layersRef.current, settingsRef.current)
    }
    const onMoveEnd = () => {
      refs.current.cameraMoving = false
      syncTerrainVisibility(viewer, refs, layersRef.current, settingsRef.current)
      applyAdaptiveDetail(viewer, refs, layersRef.current, settingsRef.current)
    }
    viewer.camera.moveStart.addEventListener(onMoveStart)
    viewer.camera.moveEnd.addEventListener(onMoveEnd)
    applyAdaptiveDetail(viewer, refs, layersRef.current, settingsRef.current)

    // 預先建立 WMTS 圖層，後續只切 show，避免初次 add/remove 的時序問題
    for (const key of NLSC_WMTS_LAYER_ORDER) {
      const baseUrl = NLSC_WMTS[key]
      if (!normalizeSourceUrl(baseUrl)) continue
      const layer = viewer.imageryLayers.addImageryProvider(createWmtsProvider(baseUrl))
      layer.minificationFilter = TextureMinificationFilter.LINEAR
      layer.magnificationFilter = TextureMagnificationFilter.NEAREST
      layer.show = !!layersRef.current[key]
      refs.current[key] = layer
    }

    syncNlscLayerBlend(viewer, refs, layersRef.current)

    const osmLayer = viewer.imageryLayers.addImageryProvider(createOsmProvider())
    osmLayer.minificationFilter = TextureMinificationFilter.LINEAR
    osmLayer.magnificationFilter = TextureMagnificationFilter.NEAREST
    osmLayer.show = !!layersRef.current.osm
    refs.current.osm = osmLayer

    createGlobalSatelliteProvider().then((provider) => {
      if (viewer.isDestroyed()) return
      const globalSatelliteLayer = viewer.imageryLayers.addImageryProvider(provider)
      globalSatelliteLayer.minificationFilter = TextureMinificationFilter.LINEAR
      globalSatelliteLayer.magnificationFilter = TextureMagnificationFilter.NEAREST
      globalSatelliteLayer.show = !!layersRef.current.global_satellite
      refs.current.global_satellite = globalSatelliteLayer
      viewer.scene.requestRender()
    }).catch((error) => {
      console.error('[Basemap] 全球衛星圖載入失敗:', error)
    })

    viewer.scene.requestRender()

    return () => {
      initialKickTimers.forEach((id) => clearTimeout(id))
      scene.renderError.removeEventListener(onRenderError)
      viewer.camera.moveStart.removeEventListener(onMoveStart)
      viewer.camera.moveEnd.removeEventListener(onMoveEnd)
      pickHandler.destroy()
      disposeRoadCameras(viewer, refs)
      removeTileProgressListener()
      viewer.destroy()
      viewerRef.current = null
      setViewerReady(null)
    }
  }, [])

  // ── Sync layer visibility on every layers change ─────────────────
  useEffect(() => {
    const viewer = viewerRef.current
    if (!viewer) return
    const settings = settingsRef.current

    syncTerrainVisibility(viewer, refs, layers, settings)

    // OSM 3D Buildings (Cesium ion asset 96188)：只切換顯示，不移除快取。
    if (refs.current.buildings) {
      refs.current.buildings.show = !!layers.buildings && isCloseFor3dBuildings(viewer, settings)
    }

    // 國土測繪中心 3D Tiles（三個群組圖層）
    for (const [key, urls] of Object.entries(NLSC_TILESETS)) {
      if (key === 'nlsc_buildings') continue
      if (layers[key]) {
        ensureGroupTilesetsLoaded(viewer, refs, key, urls, () => {
          syncTilesetVisibilityByView(
            viewer,
            refs,
            refs.current.layerState || {},
            refs.current.renderSettings || DEFAULT_RENDER_SETTINGS
          )
        })
      }
    }

    // I3S 三個群組圖層
    for (const [key, urls] of Object.entries(NLSC_I3S)) {
      if (key === 'i3s_buildings') continue
      if (layers[key]) {
        ensureGroupI3SLoaded(viewer, refs, key, urls, () => {
          syncTilesetVisibilityByView(
            viewer,
            refs,
            refs.current.layerState || {},
            refs.current.renderSettings || DEFAULT_RENDER_SETTINGS
          )
        })
      }
    }

    ensureCloseRangeBuildingLoads(viewer, refs, layers, settings)

    // 國土測繪中心 WMTS 影像圖層（已預先建立，這裡只切可見）
    for (const key of Object.keys(NLSC_WMTS)) {
      if (refs.current[key]) refs.current[key].show = !!layers[key]
    }

    syncNlscLayerBlend(viewer, refs, layers)

    if (refs.current.osm) {
      refs.current.osm.show = !!layers.osm
    }

    if (refs.current.global_satellite) {
      refs.current.global_satellite.show = !!layers.global_satellite
    }

    if (layers.road_cameras) {
      ensureRoadCamerasLoaded(viewer, refs, setRoadCameraError)
    } else {
      setRoadCameraVisibility(refs, false)
      setRoadCameraError('')
    }

    applyAdaptiveDetail(viewer, refs, layers, settings)

    // requestRenderMode 下需手動通知場景重繪
    viewer.scene.requestRender()
  }, [layers, viewerReady])

  useEffect(() => {
    const viewer = viewerRef.current
    if (!viewer) return

    const settings = settingsRef.current
    RequestScheduler.maximumRequestsPerServer = settings.maxRequestsPerServer
    RequestScheduler.maximumRequests = settings.maxRequests
    viewer.resolutionScale = Math.min(window.devicePixelRatio || 1, settings.resolutionScaleMax)
    viewer.scene.msaaSamples = settings.msaaSamples

    applyAdaptiveDetail(viewer, refs, layersRef.current, settings)
    viewer.scene.requestRender()
  }, [renderSettings])

  // ── 2D / 3D 切換 ─────────────────────────────────────────────────
  useEffect(() => {
    const viewer = viewerRef.current
    if (!viewer) return
    const ctrl = viewer.scene.screenSpaceCameraController
    if (sceneMode === '2d') {
      viewer.scene.morphTo2D(1.0)
      // 2D 模式：右鍵拖曳旋轉地圖方向（heading），tilt 在 2D 無效
      ctrl.tiltEventTypes = [
        { eventType: CameraEventType.LEFT_DRAG, modifier: KeyboardEventModifier.CTRL },
      ]
      ctrl.rotateEventTypes = [CameraEventType.RIGHT_DRAG]
    } else {
      viewer.scene.morphTo3D(1.0)
      // 3D 模式：右鍵拖曳傾斜視角，左鍵旋轉地球
      ctrl.tiltEventTypes = [
        CameraEventType.RIGHT_DRAG,
        { eventType: CameraEventType.LEFT_DRAG, modifier: KeyboardEventModifier.CTRL },
      ]
      ctrl.rotateEventTypes = [CameraEventType.LEFT_DRAG]
    }
  }, [sceneMode])

  const flyToSearchResult = (result) => {
    const viewer = viewerRef.current
    if (!viewer) return

    viewer.camera.flyTo({
      destination: Cartesian3.fromDegrees(result.lon, result.lat, result.source === 'nlsc_building' ? 1000 : 2500),
      duration: 1.2,
    })
    viewer.scene.requestRender()
  }

  const handleSearchSubmit = async (event) => {
    event.preventDefault()
    const query = searchText.trim()
    if (!query) return

    if (searchAbortRef.current) {
      searchAbortRef.current.abort()
      searchAbortRef.current = null
    }

    const controller = new AbortController()
    searchAbortRef.current = controller

    setSearching(true)
    setSearchError('')

    try {
      const buildingResults = searchNlscBuildingNames(refs, query, BUILDING_SEARCH_LIMIT)
      if (buildingResults.length > 0) {
        setSearchResults(buildingResults)
        flyToSearchResult(buildingResults[0])
      } else {
        const geocodeResults = await geocodeAddressQuery(query, controller.signal)
        setSearchResults(geocodeResults)
        if (geocodeResults.length > 0) {
          flyToSearchResult(geocodeResults[0])
        } else {
          setSearchError('找不到符合的建物名稱或地址關鍵字')
        }
      }
    } catch (error) {
      if (error?.name !== 'AbortError') {
        setSearchResults([])
        setSearchError(error?.message || '搜尋失敗')
      }
    } finally {
      setSearching(false)
      if (searchAbortRef.current === controller) {
        searchAbortRef.current = null
      }
    }
  }

  useEffect(() => () => {
    if (searchAbortRef.current) searchAbortRef.current.abort()
  }, [])

  const handleRetryRoadCameras = () => {
    const viewer = viewerRef.current
    if (!viewer) return

    refs.current.roadCameraLoaded = false
    refs.current.loadingRoadCameras = false
    refs.current.roadCameraError = ''
    const entities = refs.current.roadCameraEntities
    if (Array.isArray(entities) && entities.length > 0) {
      for (const entity of entities) {
        try {
          viewer.entities.remove(entity)
        } catch {
        }
      }
    }
    refs.current.roadCameraEntities = []
    setRoadCameraError('')
    ensureRoadCamerasLoaded(viewer, refs, setRoadCameraError)
  }

  return (
    <>
      <div ref={containerRef} className="map-container" />
      <aside className={`map-search-panel ${searchCollapsed ? 'is-collapsed' : ''}`} aria-label="Map Search">
        <div className="map-search-header">
          <span className="map-search-title">地圖搜尋</span>
          <button
            type="button"
            className="panel-collapse-btn map-search-collapse-btn"
            onClick={() => setSearchCollapsed((value) => !value)}
            aria-expanded={!searchCollapsed}
            aria-controls="map-search-content"
            title={searchCollapsed ? '展開搜尋面板' : '收合搜尋面板'}
          >
            <span aria-hidden="true">{searchCollapsed ? '＋' : '−'}</span>
            <span className="sr-only">{searchCollapsed ? '展開' : '收合'}</span>
          </button>
        </div>
        <div id="map-search-content" hidden={searchCollapsed}>
        <form onSubmit={handleSearchSubmit} className="map-search-form">
          <input
            type="text"
            className="map-search-input"
            placeholder="輸入地址或關鍵字，例如：台北101"
            value={searchText}
            onChange={(e) => setSearchText(e.target.value)}
            aria-label="Address or keyword search"
          />
          <button type="submit" className="map-search-btn" disabled={searching}>
            {searching ? '搜尋中...' : '搜尋'}
          </button>
        </form>

        {searchError && <div className="map-search-error">{searchError}</div>}

        {searchResults.length > 0 && (
          <ul className="map-search-results">
            {searchResults.map((result, index) => (
              <li key={`${result.lon}-${result.lat}-${index}`}>
                <button
                  type="button"
                  className="map-search-result-item"
                  onClick={() => flyToSearchResult(result)}
                >
                  <span className="label">{result.label}</span>
                  <span className="meta">{result.meta || '搜尋結果'} · score {result.score.toFixed(0)} · {result.lat.toFixed(5)}, {result.lon.toFixed(5)}</span>
                </button>
              </li>
            ))}
          </ul>
        )}
        </div>
      </aside>
      {layers.road_cameras && (
        <aside className="road-camera-status-panel" aria-label="Road Camera Status">
          <div className="road-camera-status-title">道路監視器</div>
          {refs.current.loadingRoadCameras && <div className="road-camera-status-text">載入中...</div>}
          {!refs.current.loadingRoadCameras && !refs.current.roadCameraError && (
            <div className="road-camera-status-text">已載入 {Array.isArray(refs.current.roadCameraEntities) ? refs.current.roadCameraEntities.length : 0} 支</div>
          )}
          {!refs.current.loadingRoadCameras && !!refs.current.roadCameraError && (
            <>
              <button type="button" className="road-camera-retry-btn" onClick={handleRetryRoadCameras}>重新載入</button>
            </>
          )}
        </aside>
      )}
      {pickInfo && (
        <aside className="feature-query-panel" aria-label="Feature Query">
          <div className="feature-query-header">
            <span>點選查詢</span>
            <button className="feature-query-close" onClick={() => setPickInfo(null)}>關閉</button>
          </div>
          <div className="feature-query-source">來源：{pickInfo.source}</div>
          {pickInfo.coord && (
            <div className="feature-query-coord">
              Lon: {pickInfo.coord.lon.toFixed(6)}<br />
              Lat: {pickInfo.coord.lat.toFixed(6)}
            </div>
          )}
          {pickInfo.cameraPreviewUrl && (
            <a
              className="feature-query-preview-link"
              href={pickInfo.cameraPreviewUrl}
              target="_blank"
              rel="noreferrer"
            >
              <img className="feature-query-preview" src={pickInfo.cameraPreviewUrl} alt="監視器畫面預覽" />
            </a>
          )}
          {pickInfo.properties.length > 0 ? (
            <ul className="feature-query-list">
              {pickInfo.properties.map((item) => (
                <li key={item.name}>
                  <span className="k">{item.name}</span>
                  <span className="v">{item.value}</span>
                </li>
              ))}
            </ul>
          ) : (
            <div className="feature-query-empty">此位置沒有可讀取屬性</div>
          )}
        </aside>
      )}
      <Compass viewer={viewerReady} />
      <ScaleBar viewer={viewerReady} />
      {renderError && (
        <aside className="render-error-panel" aria-label="Render Error">
          <div className="render-error-title">Render Error</div>
          <div className="render-error-text">{renderError}</div>
          <button
            type="button"
            className="render-error-close"
            onClick={() => setRenderError('')}
          >
            關閉
          </button>
        </aside>
      )}
    </>
  )
}
