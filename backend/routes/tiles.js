import { Router } from 'express'
import { readFile } from 'fs/promises'
import { existsSync } from 'fs'
import { fileURLToPath } from 'url'
import { join, dirname } from 'path'

const router = Router()
const __dirname = dirname(fileURLToPath(import.meta.url))
const TILES_DIR = join(__dirname, '../data/tiles')

// GET /api/tiles/:source/:z/:x/:y
router.get('/:source/:z/:x/:y', async (req, res) => {
  const { source, z, x, y } = req.params
  const tilePath = join(TILES_DIR, source, z, x, `${y}.png`)

  if (!existsSync(tilePath)) {
    return res.status(404).send('Tile not found')
  }

  try {
    const data = await readFile(tilePath)
    res.setHeader('Content-Type', 'image/png')
    res.setHeader('Cache-Control', 'public, max-age=86400')
    res.send(data)
  } catch {
    res.status(500).send('Failed to read tile')
  }
})

export default router
