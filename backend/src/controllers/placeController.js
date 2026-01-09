import scraperService from '../services/scraperService.js'
import { AppError } from '../middleware/errorHandler.js'

class PlaceController {
  // Get place details
  async getDetails(req, res, next) {
    try {
      const { placeId } = req.params
      const { country = 'us', language = 'en' } = req.query

      if (!placeId) {
        throw new AppError('Place ID is required', 400, 'VALIDATION_ERROR')
      }

      const result = await scraperService.getPlaceInfo({
        placeId,
        country,
        language
      })

      res.json({
        success: true,
        place: result.data || result
      })
    } catch (error) {
      next(error)
    }
  }

  // Get place reviews
  async getReviews(req, res, next) {
    try {
      const { placeId } = req.params
      const { sort = 'relevant', limit = 10, cursor } = req.query

      if (!placeId) {
        throw new AppError('Place ID is required', 400, 'VALIDATION_ERROR')
      }

      const result = await scraperService.getReviews({
        placeId,
        sort,
        limit: parseInt(limit),
        cursor
      })

      res.json({
        success: true,
        reviews: result.data || result.reviews || result,
        nextCursor: result.next_cursor || result.cursor
      })
    } catch (error) {
      next(error)
    }
  }

  // Get place photos
  async getPhotos(req, res, next) {
    try {
      const { placeId } = req.params
      const { cursor } = req.query

      if (!placeId) {
        throw new AppError('Place ID is required', 400, 'VALIDATION_ERROR')
      }

      const result = await scraperService.getPhotos({
        placeId,
        cursor
      })

      res.json({
        success: true,
        photos: result.data || result.photos || result,
        nextCursor: result.next_cursor || result.cursor
      })
    } catch (error) {
      next(error)
    }
  }
}

export default new PlaceController()
