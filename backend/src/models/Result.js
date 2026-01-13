import { db } from '../config/database.js'

class Result {
  static async bulkCreate(searchId, results) {
    await db.read()

    const newResults = results.map((r, idx) => ({
      id: Date.now() + idx,
      search_id: searchId,
      place_id: r.place_id || r.placeId || '',
      business_id: r.business_id || r.businessId || null,
      name: r.name || r.title || '',
      address: r.address || r.full_address || '',
      phone: r.phone || r.phone_number || null,
      website: r.website || r.site || null,
      rating: r.rating || null,
      review_count: r.review_count || r.reviews || r.reviews_count || null,
      latitude: r.latitude || r.lat || null,
      longitude: r.longitude || r.lng || r.lon || null,
      types: r.types || r.categories || [],
      hours: r.hours || r.working_hours || null,
      raw_data: r,
      created_at: new Date().toISOString()
    }))

    db.data.results.push(...newResults)
    await db.write()
    return newResults.length
  }

  static async getBySearchId(searchId, { page = 1, limit = 100 } = {}) {
    await db.read()
    let results = db.data.results.filter(r => r.search_id === parseInt(searchId))

    // Sort by rating descending
    results.sort((a, b) => (b.rating || 0) - (a.rating || 0))

    const offset = (page - 1) * limit
    return results.slice(offset, offset + limit)
  }

  static async getCountBySearchId(searchId) {
    await db.read()
    return db.data.results.filter(r => r.search_id === parseInt(searchId)).length
  }

  static async deleteBySearchId(searchId) {
    await db.read()
    const before = db.data.results.length
    db.data.results = db.data.results.filter(r => r.search_id !== parseInt(searchId))
    await db.write()
    return { changes: before - db.data.results.length }
  }

  static async update(resultId, data) {
    await db.read()
    const index = db.data.results.findIndex(r => r.id === parseInt(resultId))
    if (index === -1) return null

    db.data.results[index] = {
      ...db.data.results[index],
      ...data,
      updated_at: new Date().toISOString()
    }
    await db.write()
    return db.data.results[index]
  }

  static async getById(resultId) {
    await db.read()
    return db.data.results.find(r => r.id === parseInt(resultId)) || null
  }
}

export default Result
