import express from 'express'
import searchController from '../controllers/searchController.js'

const router = express.Router()

// POST /api/search/query - Search by query string
router.post('/query', searchController.searchByQuery)

// POST /api/search/coordinates - Search by coordinates with grid
router.post('/coordinates', searchController.searchByCoordinates)

// GET /api/search/:searchId/results - Get results for a search
router.get('/:searchId/results', searchController.getResults)

// POST /api/search/estimate - Estimate cost for coordinate search
router.post('/estimate', searchController.estimateCost)

export default router
