/**
 * Coordinate transformation utilities.
 * Supports: WGS84, TWD97 TM2 (zone 119/121), TWD67 TM2 (zone 119/121)
 */
import proj4 from 'proj4'

// TWD97 / TM2 zone 119
proj4.defs('EPSG:3825',
  '+proj=tmerc +lat_0=0 +lon_0=119 +k=0.9999 +x_0=250000 +y_0=0 ' +
  '+ellps=GRS80 +towgs84=0,0,0,0,0,0,0 +units=m +no_defs'
)

// TWD97 / TM2 zone 121
proj4.defs('EPSG:3826',
  '+proj=tmerc +lat_0=0 +lon_0=121 +k=0.9999 +x_0=250000 +y_0=0 ' +
  '+ellps=GRS80 +towgs84=0,0,0,0,0,0,0 +units=m +no_defs'
)

// TWD67 / TM2 zone 119
proj4.defs('EPSG:3824',
  '+proj=tmerc +lat_0=0 +lon_0=119 +k=0.9999 +x_0=250000 +y_0=0 ' +
  '+ellps=aust_SA +towgs84=-750,265,890,0,0,0,0 +units=m +no_defs'
)

// TWD67 / TM2 zone 121
proj4.defs('EPSG:3821',
  '+proj=tmerc +lat_0=0 +lon_0=121 +k=0.9999 +x_0=250000 +y_0=0 ' +
  '+ellps=aust_SA +towgs84=-750,265,890,0,0,0,0 +units=m +no_defs'
)

const WGS84 = 'EPSG:4326'
const TW_BBOX = { minLon: 117.0, maxLon: 123.5, minLat: 20.0, maxLat: 27.0 }

/**
 * Auto-detect coordinate system and return [longitude, latitude] in WGS84.
 *
 * @param {string|number} x
 * @param {string|number} y
 * @param {object} [meta] optional metadata object (CSV row / hints)
 * Returns null if the input is invalid.
 */
export function parseCoordinates(x, y, meta = {}) {
  const nx = parseFloat(String(x).replace(/,/g, ''))
  const ny = parseFloat(String(y).replace(/,/g, ''))
  if (isNaN(nx) || isNaN(ny)) return null

  // Direct WGS84 lon/lat
  if (isValidWGS84(nx, ny)) return [nx, ny]

  // Projected coordinates (TM2) usually in meter scale.
  if (Math.abs(nx) > 1000 || Math.abs(ny) > 1000) {
    const orderedCrs = getCandidateCrsOrder(meta)
    let firstValid = null

    for (const crs of orderedCrs) {
      try {
        const [lon, lat] = proj4(crs, WGS84, [nx, ny])
        if (!isValidWGS84(lon, lat)) continue
        if (isLikelyTaiwan(lon, lat)) return [lon, lat]
        if (!firstValid) firstValid = [lon, lat]
      } catch {
        // Try next candidate CRS.
      }
    }

    return firstValid
  }

  return null
}

function getCandidateCrsOrder(meta) {
  const hint = String(
    meta?.crs ??
    meta?.epsg ??
    meta?.srid ??
    meta?.coord_sys ??
    meta?.datum ??
    ''
  ).toUpperCase()
  const zoneHint = String(meta?.zone ?? meta?.tm2_zone ?? '').trim()

  const all = ['EPSG:3826', 'EPSG:3825', 'EPSG:3821', 'EPSG:3824']

  if (hint.includes('4326') || hint.includes('WGS84')) return all
  if (hint.includes('3826')) return ['EPSG:3826', 'EPSG:3825', 'EPSG:3821', 'EPSG:3824']
  if (hint.includes('3825')) return ['EPSG:3825', 'EPSG:3826', 'EPSG:3824', 'EPSG:3821']
  if (hint.includes('3821')) return ['EPSG:3821', 'EPSG:3824', 'EPSG:3826', 'EPSG:3825']
  if (hint.includes('3824')) return ['EPSG:3824', 'EPSG:3821', 'EPSG:3825', 'EPSG:3826']

  if (zoneHint === '121') return ['EPSG:3826', 'EPSG:3821', 'EPSG:3825', 'EPSG:3824']
  if (zoneHint === '119') return ['EPSG:3825', 'EPSG:3824', 'EPSG:3826', 'EPSG:3821']

  // Default: TWD97 first, then TWD67; both zones.
  return all
}

function isLikelyTaiwan(lon, lat) {
  return (
    lon >= TW_BBOX.minLon &&
    lon <= TW_BBOX.maxLon &&
    lat >= TW_BBOX.minLat &&
    lat <= TW_BBOX.maxLat
  )
}

function isValidWGS84(lon, lat) {
  return lon >= -180 && lon <= 180 && lat >= -90 && lat <= 90
}
