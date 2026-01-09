import { Low } from 'lowdb'
import { JSONFile } from 'lowdb/node'
import path from 'path'
import fs from 'fs'
import { fileURLToPath } from 'url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const dbDir = path.join(__dirname, '../../database')
const dbPath = path.join(dbDir, 'db.json')

// Default data structure
const defaultData = {
  searches: [],
  results: [],
  exportJobs: []
}

// Ensure database directory exists
const ensureDbDir = () => {
  if (!fs.existsSync(dbDir)) {
    fs.mkdirSync(dbDir, { recursive: true })
    console.log('Database directory created')
  }
}

ensureDbDir()

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
