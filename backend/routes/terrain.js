import { Router } from 'express'
import { existsSync } from 'fs'
import { fileURLToPath } from 'url'
import { join, dirname } from 'path'

const router = Router()
const __dirname = dirname(fileURLToPath(import.meta.url))
const TERRAIN_DIR = join(__dirname, '../data/terrain')

// GET /api/terrain/heightmap?lat=&lon=
// Placeholder — returns 0 until a DEM file is loaded
router.get('/heightmap', (_req, res) => {
  res.json({ elevation: 0, source: 'placeholder' })
})

// GET /api/terrain/status
router.get('/status', (_req, res) => {
  res.json({ available: existsSync(TERRAIN_DIR), path: TERRAIN_DIR })
})

export default router
