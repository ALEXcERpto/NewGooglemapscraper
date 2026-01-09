import { Low } from 'lowdb'
import { JSONFile } from 'lowdb/node'
import path from 'path'
import { fileURLToPath } from 'url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const dbPath = path.join(__dirname, '../../database/db.json')

// Default data structure
const defaultData = {
  searches: [],
  results: [],
  exportJobs: []
}

const adapter = new JSONFile(dbPath)
const db = new Low(adapter, defaultData)

// Initialize database
const initSchema = async () => {
  await db.read()
  db.data ||= defaultData
  await db.write()
  console.log('Database initialized')
}

export { db, initSchema }
