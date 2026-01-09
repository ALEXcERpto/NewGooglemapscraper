import express from 'express'
import searchRoutes from './searchRoutes.js'
import historyRoutes from './historyRoutes.js'
import exportRoutes from './exportRoutes.js'
import placeRoutes from './placeRoutes.js'

const router = express.Router()

router.use('/search', searchRoutes)
router.use('/history', historyRoutes)
router.use('/export', exportRoutes)
router.use('/place', placeRoutes)

export default router
