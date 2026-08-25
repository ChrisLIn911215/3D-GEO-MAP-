import 'dotenv/config'
import express from 'express'
import cors from 'cors'
import layersRouter from './routes/layers.js'
import tilesRouter from './routes/tiles.js'
import terrainRouter from './routes/terrain.js'

const app = express()
const PORT = process.env.PORT || 3001

app.use(cors({ origin: process.env.FRONTEND_ORIGIN || 'http://localhost:5173' }))
app.use(express.json())

app.use('/api/layers', layersRouter)
app.use('/api/tiles', tilesRouter)
app.use('/api/terrain', terrainRouter)

app.get('/api/health', (_req, res) => {
  res.json({ status: 'ok', time: new Date().toISOString() })
})

app.listen(PORT, () => {
  console.log(`Backend running on http://localhost:${PORT}`)
})
