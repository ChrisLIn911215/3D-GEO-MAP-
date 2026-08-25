/**
 * migrate_pg.mjs
 * Create PostGIS tables and import GeoJSON/CSV data into PostgreSQL.
 *
 * Prerequisites:
 *   CREATE DATABASE geodata;
 *   \c geodata
 *   CREATE EXTENSION IF NOT EXISTS postgis;
 *
 * Usage: node backend/scripts/migrate_pg.mjs
 *
 * Add layer names to LAYERS below, then place .geojson or .csv files
 * in backend/data/ before running.
 */
import 'dotenv/config'
import { readFile, access } from 'fs/promises'
import { join, dirname } from 'path'
import { fileURLToPath } from 'url'
import { parse } from 'csv-parse/sync'
import pg from 'pg'

const { Pool } = pg
const __dirname = dirname(fileURLToPath(import.meta.url))
const DATA_DIR = join(__dirname, '../data')

const pool = new Pool({
  host:     process.env.PGHOST     || 'localhost',
  port:     Number(process.env.PGPORT) || 5432,
  database: process.env.PGDATABASE || 'geodata',
  user:     process.env.PGUSER     || 'postgres',
  password: process.env.PGPASSWORD,
})

// ── Add your layer names here ────────────────────────────────────
const LAYERS = [
  // 'my_points',
  // 'my_polygons',
]

function extractXY(row) {
  const xKey = Object.keys(row).find((k) =>
    /^(longitude|lng|lon|x|easting)$/i.test(k.trim()))
  const yKey = Object.keys(row).find((k) =>
    /^(latitude|lat|y|northing)$/i.test(k.trim()))
  return { x: parseFloat(row[xKey]), y: parseFloat(row[yKey]) }
}

async function readLayerFeatures(key) {
  const geojsonPath = join(DATA_DIR, `${key}.geojson`)
  const csvPath = join(DATA_DIR, `${key}.csv`)
  const exists = (p) => access(p).then(() => true).catch(() => false)

  if (await exists(geojsonPath)) {
    const raw = await readFile(geojsonPath, 'utf-8')
    return JSON.parse(raw).features ?? []
  }
  if (await exists(csvPath)) {
    const raw = await readFile(csvPath, 'utf-8')
    const records = parse(raw, { columns: true, skip_empty_lines: true, trim: true })
    return records
      .map((row) => {
        const { x, y } = extractXY(row)
        const props = Object.fromEntries(
          Object.entries(row).filter(
            ([k]) => !/(longitude|lng|lon|latitude|lat|x|y|easting|northing)$/i.test(k.trim())
          )
        )
        return { type: 'Feature', properties: props, geometry: { type: 'Point', coordinates: [x, y] } }
      })
      .filter((f) => !isNaN(f.geometry.coordinates[0]))
  }
  return null
}

async function main() {
  if (LAYERS.length === 0) {
    console.log('No layers defined. Add layer names to the LAYERS array in migrate_pg.mjs.')
    process.exit(0)
  }

  const client = await pool.connect()
  try {
    await client.query('CREATE EXTENSION IF NOT EXISTS postgis;')
    console.log('✔ PostGIS ready')

    for (const layer of LAYERS) {
      console.log(`\n→ Layer: ${layer}`)
      await client.query(`
        CREATE TABLE IF NOT EXISTS ${layer} (
          id         SERIAL PRIMARY KEY,
          properties JSONB,
          geom       GEOMETRY(Geometry, 4326)
        );
        CREATE INDEX IF NOT EXISTS ${layer}_geom_idx ON ${layer} USING GIST (geom);
      `)
      console.log('  ✔ Table ready')

      const features = await readLayerFeatures(layer)
      if (!features) { console.log('  ⚠ No data file found, skipping'); continue }
      if (!features.length) { console.log('  ⚠ Empty file, skipping'); continue }

      await client.query(`TRUNCATE TABLE ${layer} RESTART IDENTITY;`)
      let count = 0
      for (const f of features) {
        if (!f.geometry) continue
        await client.query(
          `INSERT INTO ${layer} (properties, geom) VALUES ($1, ST_SetSRID(ST_GeomFromGeoJSON($2), 4326))`,
          [JSON.stringify(f.properties ?? {}), JSON.stringify(f.geometry)]
        )
        count++
      }
      console.log(`  ✔ Inserted ${count} rows`)
    }
    console.log('\n✅ Migration complete')
  } finally {
    client.release()
    await pool.end()
  }
}

main().catch((err) => {
  console.error('❌ Migration failed:', err.message)
  process.exit(1)
})
