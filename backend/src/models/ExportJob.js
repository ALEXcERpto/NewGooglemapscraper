import { db } from '../config/database.js'

class ExportJob {
  static async create({ id, searchId, format }) {
    await db.read()
    const job = {
      id,
      search_id: searchId,
      format,
      status: 'processing',
      file_path: null,
      record_count: null,
      error_message: null,
      created_at: new Date().toISOString(),
      completed_at: null
    }
    db.data.exportJobs.push(job)
    await db.write()
    return job
  }

  static async getById(id) {
    await db.read()
    return db.data.exportJobs.find(j => j.id === id)
  }

  static async update(id, updates) {
    await db.read()
    const index = db.data.exportJobs.findIndex(j => j.id === id)
    if (index === -1) return null

    // Convert camelCase to snake_case for updates
    const snakeUpdates = {}
    Object.entries(updates).forEach(([key, value]) => {
      const snakeKey = key.replace(/([A-Z])/g, '_$1').toLowerCase()
      snakeUpdates[snakeKey] = value
    })

    db.data.exportJobs[index] = {
      ...db.data.exportJobs[index],
      ...snakeUpdates
    }
    await db.write()
    return db.data.exportJobs[index]
  }

  static async getBySearchId(searchId) {
    await db.read()
    return db.data.exportJobs
      .filter(j => j.search_id === searchId)
      .sort((a, b) => new Date(b.created_at) - new Date(a.created_at))
  }
}

export default ExportJob
