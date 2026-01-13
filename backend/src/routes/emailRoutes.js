import express from 'express'
import emailController from '../controllers/emailController.js'

const router = express.Router()

// Extract emails from a single URL
router.post('/extract', emailController.extractFromUrl)

// Extract emails from search results
router.post('/search/:searchId/extract', emailController.extractFromSearchResults)

// Extract emails from multiple URLs
router.post('/extract/batch', emailController.extractBatch)

// Health check for email service
router.get('/health', emailController.healthCheck)

export default router
