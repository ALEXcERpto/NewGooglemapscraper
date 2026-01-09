import express from 'express'
import historyController from '../controllers/historyController.js'

const router = express.Router()

// GET /api/history - Get all searches
router.get('/', historyController.getAll)

// GET /api/history/:id - Get single search with results
router.get('/:id', historyController.getOne)

// POST /api/history/:id/save - Save a search
router.post('/:id/save', historyController.save)

// PUT /api/history/:id - Update saved search
router.put('/:id', historyController.update)

// DELETE /api/history/:id - Delete a search
router.delete('/:id', historyController.delete)

// POST /api/history/:id/rerun - Get parameters to rerun a search
router.post('/:id/rerun', historyController.rerun)

export default router
