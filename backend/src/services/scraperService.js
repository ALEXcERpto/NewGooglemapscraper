import axios from 'axios'
import config from '../config/environment.js'

class ScraperService {
  constructor() {
    this.client = axios.create({
      baseURL: 'https://scraper.tech/api',
      timeout: 30000,
      headers: {
        'Scraper-Key': config.scraperApiKey
      }
    })

    // Add response interceptor for logging
    this.client.interceptors.response.use(
      response => {
        console.log('API Response:', response.status, response.data?.length || 'object')
        return response
      },
      error => {
        console.error('Scraper API Error:', {
          status: error.response?.status,
          data: error.response?.data,
          message: error.response?.data?.message || error.message
        })
        throw error
      }
    )
  }

  // Search Google Maps by query
  async searchMaps({ query, limit = 20, country = 'us', language = 'en', lat, lng, zoom = 15, offset = 0 }) {
    const params = {
      query,
      limit,
      country,
      lang: language,
      offset
    }

    if (lat !== undefined && lng !== undefined) {
      params.lat = lat
      params.lng = lng
      params.zoom = zoom
    }

    const response = await this.client.get('/searchmaps.php', { params })
    return response.data
  }

  // Get detailed place information
  async getPlaceInfo({ placeId, businessId, country = 'us', language = 'en' }) {
    const params = { country, lang: language }
    if (placeId) params.place_id = placeId
    if (businessId) params.business_id = businessId

    const response = await this.client.get('/place.php', { params })
    return response.data
  }

  // Get place reviews
  async getReviews({ placeId, sort = 'relevant', limit = 10, cursor = null }) {
    const params = {
      place_id: placeId,
      sort,
      limit
    }
    if (cursor) params.cursor = cursor

    const response = await this.client.get('/reviews.php', { params })
    return response.data
  }

  // Get place photos
  async getPhotos({ placeId, cursor = null }) {
    const params = { place_id: placeId }
    if (cursor) params.cursor = cursor

    const response = await this.client.get('/photos.php', { params })
    return response.data
  }

  // Reverse geocoding - what is at this location
  async whatIsHere({ lat, lng }) {
    const response = await this.client.get('/whatishere.php', {
      params: { lat, lng }
    })
    return response.data
  }
}

export default new ScraperService()
