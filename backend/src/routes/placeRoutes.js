import express from 'express'
import placeController from '../controllers/placeController.js'

const router = express.Router()

// GET /api/place/:placeId - Get place details
router.get('/:placeId', placeController.getDetails)

// GET /api/place/:placeId/reviews - Get place reviews
router.get('/:placeId/reviews', placeController.getReviews)

// GET /api/place/:placeId/photos - Get place photos
router.get('/:placeId/photos', placeController.getPhotos)

export default router
