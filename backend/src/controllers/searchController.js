import scraperService from '../services/scraperService.js'
import gridService from '../services/gridService.js'
import Search from '../models/Search.js'
import Result from '../models/Result.js'
import { AppError } from '../middleware/errorHandler.js'

class SearchController {
  // Search by query string
  async searchByQuery(req, res, next) {
    try {
      const { query, limit = 100, country = 'us', language = 'en' } = req.body

      if (!query || query.trim().length === 0) {
        throw new AppError('Query is required', 400, 'VALIDATION_ERROR')
      }

      // Create search record
      const search = await Search.create({
        type: 'query',
        query,
        parameters: { query, limit, country, language }
      })

      // Fetch results from Scraper API with pagination
      const allResults = []
      let offset = 0
      const batchSize = 20
      let apiCalls = 0

      while (allResults.length < limit) {
        try {
          const response = await scraperService.searchMaps({
            query,
            limit: batchSize,
            country,
            language,
            offset
          })

          apiCalls++

          const data = response.data || response.results || response
          if (!data || !Array.isArray(data) || data.length === 0) break

          allResults.push(...data)
          offset += batchSize

          // Rate limit protection
          await new Promise(resolve => setTimeout(resolve, 100))
        } catch (error) {
          console.error('API call error:', error.message)
          break
        }
      }

      // Trim to requested limit
      const trimmedResults = allResults.slice(0, limit)

      // Store results in database
      if (trimmedResults.length > 0) {
        await Result.bulkCreate(search.id, trimmedResults)
      }

      // Update search record
      await Search.update(search.id, {
        result_count: trimmedResults.length,
        api_calls_used: apiCalls,
        status: 'completed'
      })

      res.json({
        success: true,
        searchId: search.id,
        resultCount: trimmedResults.length,
        apiCallsUsed: apiCalls,
        results: trimmedResults
      })
    } catch (error) {
      next(error)
    }
  }

  // Search by coordinates with grid
  async searchByCoordinates(req, res, next) {
    try {
      const {
        centerLat,
        centerLng,
        radiusKm = 5,
        gridSize = 3,
        query,
        limit = 20,
        country = 'us',
        language = 'en'
      } = req.body

      if (centerLat === undefined || centerLng === undefined) {
        throw new AppError('Center coordinates are required', 400, 'VALIDATION_ERROR')
      }

      // Generate grid points
      const gridPoints = gridService.generateGrid({
        centerLat: parseFloat(centerLat),
        centerLng: parseFloat(centerLng),
        radiusKm: parseFloat(radiusKm),
        gridSize: parseInt(gridSize)
      })

      // Create search record
      const search = await Search.create({
        type: 'coordinates',
        query: query || `Area search at ${centerLat}, ${centerLng}`,
        parameters: { centerLat, centerLng, radiusKm, gridSize, query, limit, country, language }
      })

      // Search each grid point and deduplicate
      const allResults = new Map()
      let apiCalls = 0

      for (const point of gridPoints) {
        try {
          const response = await scraperService.searchMaps({
            query: query || '',
            lat: point.lat,
            lng: point.lng,
            zoom: 15,
            limit,
            country,
            language
          })

          apiCalls++

          const data = response.data || response.results || response
          if (data && Array.isArray(data)) {
            data.forEach(place => {
              const placeId = place.place_id || place.placeId
              if (placeId && !allResults.has(placeId)) {
                allResults.set(placeId, place)
              }
            })
          }

          // Rate limit protection
          await new Promise(resolve => setTimeout(resolve, 150))
        } catch (error) {
          console.error(`Error at grid point ${point.index}:`, error.message)
        }
      }

      const uniqueResults = Array.from(allResults.values())

      // Store results
      if (uniqueResults.length > 0) {
        await Result.bulkCreate(search.id, uniqueResults)
      }

      // Update search record
      await Search.update(search.id, {
        result_count: uniqueResults.length,
        api_calls_used: apiCalls,
        status: 'completed'
      })

      res.json({
        success: true,
        searchId: search.id,
        gridPointsSearched: gridPoints.length,
        resultCount: uniqueResults.length,
        apiCallsUsed: apiCalls,
        results: uniqueResults
      })
    } catch (error) {
      next(error)
    }
  }

  // Get search results by search ID
  async getResults(req, res, next) {
    try {
      const { searchId } = req.params
      const { page = 1, limit = 100 } = req.query

      const search = await Search.getById(searchId)
      if (!search) {
        throw new AppError('Search not found', 404, 'NOT_FOUND')
      }

      const results = await Result.getBySearchId(searchId, {
        page: parseInt(page),
        limit: parseInt(limit)
      })

      res.json({
        success: true,
        search,
        results
      })
    } catch (error) {
      next(error)
    }
  }

  // Estimate cost for coordinate search
  async estimateCost(req, res, next) {
    try {
      const { radiusKm = 5, gridSize = 3 } = req.body

      const estimate = gridService.estimateApiCalls({
        radiusKm: parseFloat(radiusKm),
        gridSize: parseInt(gridSize)
      })

      res.json({
        success: true,
        ...estimate
      })
    } catch (error) {
      next(error)
    }
  }
}

export default new SearchController()
