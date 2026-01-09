import express from 'express'
import exportController from '../controllers/exportController.js'

const router = express.Router()

// POST /api/export - Create export job
router.post('/', exportController.create)

// GET /api/export/:jobId/status - Get export job status
router.get('/:jobId/status', exportController.getStatus)

// GET /api/export/:jobId/download - Download export file
router.get('/:jobId/download', exportController.download)

export default router
