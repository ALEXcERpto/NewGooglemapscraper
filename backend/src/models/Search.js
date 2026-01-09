import { db } from '../config/database.js'

class Search {
  static async create({ type, query, parameters, name = null }) {
    await db.read()
    const id = Date.now()
    const search = {
      id,
      name,
      type,
      query,
      parameters,
      result_count: 0,
      api_calls_used: 0,
      status: 'completed',
      is_saved: 0,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    }
    db.data.searches.push(search)
    await db.write()
    return search
  }

  static async getById(id) {
    await db.read()
    return db.data.searches.find(s => s.id === parseInt(id))
  }

  static async update(id, updates) {
    await db.read()
    const index = db.data.searches.findIndex(s => s.id === parseInt(id))
    if (index === -1) return null

    db.data.searches[index] = {
      ...db.data.searches[index],
      ...updates,
      updated_at: new Date().toISOString()
    }
    await db.write()
    return db.data.searches[index]
  }

  static async getAll({ page = 1, limit = 20, savedOnly = false }) {
    await db.read()
    let searches = [...db.data.searches]

    if (savedOnly) {
      searches = searches.filter(s => s.is_saved === 1)
    }

    // Sort by created_at descending
    searches.sort((a, b) => new Date(b.created_at) - new Date(a.created_at))

    const total = searches.length
    const offset = (page - 1) * limit
    const paginatedSearches = searches.slice(offset, offset + limit)

    return {
      searches: paginatedSearches,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit)
      }
    }
  }

  static async save(id, name) {
    return this.update(id, { is_saved: 1, name })
  }

  static async delete(id) {
    await db.read()
    const index = db.data.searches.findIndex(s => s.id === parseInt(id))
    if (index !== -1) {
      db.data.searches.splice(index, 1)
      // Also delete related results
      db.data.results = db.data.results.filter(r => r.search_id !== parseInt(id))
      await db.write()
    }
    return { changes: index !== -1 ? 1 : 0 }
  }
}

export default Search
