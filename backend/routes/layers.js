import { Router } from 'express'
import { readFile } from 'fs/promises'
import { existsSync } from 'fs'
import { fileURLToPath } from 'url'
import { join, dirname } from 'path'
import { parse } from 'csv-parse/sync'
import { parseCoordinates } from '../utils/coordTransform.js'
import pool from '../db.js'

const router = Router()
const __dirname = dirname(fileURLToPath(import.meta.url))
const DATA_DIR = join(__dirname, '../data')

// Add fixed layer keys here if you prefer code-based configuration.
const STATIC_LAYER_KEYS = []

// Recommended: configure keys in backend/.env
// Example: LAYER_KEYS=flood_risk,hospitals,police_stations
const ENV_LAYER_KEYS = (process.env.LAYER_KEYS || '')
  .split(',')
  .map((v) => v.trim())
  .filter(Boolean)

const LAYER_KEYS = Object.freeze([...new Set([...STATIC_LAYER_KEYS, ...ENV_LAYER_KEYS])])

const cache = new Map()

function isSafeIdentifier(name) {
  return /^[A-Za-z_][A-Za-z0-9_]*$/.test(name)
}

function quoteIdentifier(name) {
  if (!isSafeIdentifier(name)) {
    throw new Error(`Invalid SQL identifier: "${name}"`)
  }
  return `"${name}"`
}

function isAllowedLayerKey(key) {
  return LAYER_KEYS.includes(key)
}

function extractXY(row) {
  const xKey = Object.keys(row).find((k) =>
    /^(longitude|lng|lon|x|easting)$/i.test(k.trim()))
  const yKey = Object.keys(row).find((k) =>
    /^(latitude|lat|y|northing)$/i.test(k.trim()))
  return { x: row[xKey], y: row[yKey] }
}

function csvToGeoJSON(csvText) {
  const records = parse(csvText, { columns: true, skip_empty_lines: true, trim: true })
  const features = []
  for (const row of records) {
    const { x, y } = extractXY(row)
    const coords = parseCoordinates(x, y, row)
    if (!coords) continue
    const props = Object.fromEntries(
      Object.entries(row).filter(
        ([k]) => !/(longitude|lng|lon|latitude|lat|x|y|easting|northing)$/i.test(k.trim())
      )
    )
    features.push({
      type: 'Feature',
      properties: props,
      geometry: { type: 'Point', coordinates: [...coords, 0] },
    })
  }
  return { type: 'FeatureCollection', features }
}

function resolveLayerFile(key) {
  const geojson = join(DATA_DIR, `${key}.geojson`)
  const csv = join(DATA_DIR, `${key}.csv`)
  if (existsSync(geojson)) return { path: geojson, type: 'geojson' }
  if (existsSync(csv)) return { path: csv, type: 'csv' }
  return null
}

async function loadLayerFromFile(key) {
  if (cache.has(key)) return cache.get(key)
  const file = resolveLayerFile(key)
  if (!file) return null
  const raw = await readFile(file.path, 'utf-8')
  const geojson = file.type === 'csv' ? csvToGeoJSON(raw) : JSON.parse(raw)
  cache.set(key, { geojson, format: file.type })
  return cache.get(key)
}

async function loadLayerFromDB(key) {
  const table = quoteIdentifier(key)
  const { rows } = await pool.query(
    `SELECT properties, ST_AsGeoJSON(geom)::jsonb AS geometry FROM ${table}`
  )
  return {
    type: 'FeatureCollection',
    features: rows.map((r) => ({ type: 'Feature', properties: r.properties, geometry: r.geometry })),
  }
}

async function tableHasData(key) {
  try {
    const table = quoteIdentifier(key)
    const { rows } = await pool.query(
      `SELECT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = $1) AS exists`,
      [key]
    )
    if (!rows[0].exists) return false
    const cnt = await pool.query(`SELECT COUNT(*)::int AS n FROM ${table}`)
    return cnt.rows[0].n > 0
  } catch {
    return false
  }
}

// GET /api/layers
router.get('/', (_req, res) => {
  res.json({ layers: LAYER_KEYS.map((key) => ({ key, url: `/api/layers/${key}` })) })
})

// GET /api/layers/:type
router.get('/:type', async (req, res) => {
  const { type } = req.params
  if (!isAllowedLayerKey(type)) {
    return res.status(404).json({ error: `Unknown layer: "${type}"`, available: LAYER_KEYS })
  }
  try {
    res.setHeader('Content-Type', 'application/geo+json')
    res.setHeader('Cache-Control', 'public, max-age=300')
    if (await tableHasData(type)) {
      return res.json(await loadLayerFromDB(type))
    }
    const data = await loadLayerFromFile(type)
    if (!data) return res.status(404).json({ error: `No data found for "${type}"` })
    res.json(data.geojson)
  } catch (err) {
    res.status(500).json({ error: 'Failed to load layer', detail: err.message })
  }
})

// POST /api/layers/:type/reload
router.post('/:type/reload', (req, res) => {
  const { type } = req.params
  if (!isAllowedLayerKey(type)) {
    return res.status(404).json({ error: `Unknown layer: "${type}"`, available: LAYER_KEYS })
  }
  cache.delete(type)
  res.json({ message: `Cache cleared for "${type}"` })
})

export default router
