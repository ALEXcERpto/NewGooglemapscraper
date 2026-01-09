import Search from '../models/Search.js'
import Result from '../models/Result.js'
import { AppError } from '../middleware/errorHandler.js'

class HistoryController {
  // Get all searches (paginated)
  async getAll(req, res, next) {
    try {
      const { page = 1, limit = 20, savedOnly = false } = req.query

      const result = await Search.getAll({
        page: parseInt(page),
        limit: parseInt(limit),
        savedOnly: savedOnly === 'true'
      })

      res.json({
        success: true,
        ...result
      })
    } catch (error) {
      next(error)
    }
  }

  // Get single search with results
  async getOne(req, res, next) {
    try {
      const { id } = req.params

      const search = await Search.getById(id)
      if (!search) {
        throw new AppError('Search not found', 404, 'NOT_FOUND')
      }

      const results = await Result.getBySearchId(id)

      res.json({
        success: true,
        search,
        results
      })
    } catch (error) {
      next(error)
    }
  }

  // Save a search
  async save(req, res, next) {
    try {
      const { id } = req.params
      const { name } = req.body

      if (!name || name.trim().length === 0) {
        throw new AppError('Name is required', 400, 'VALIDATION_ERROR')
      }

      const search = await Search.getById(id)
      if (!search) {
        throw new AppError('Search not found', 404, 'NOT_FOUND')
      }

      const updated = await Search.save(id, name.trim())

      res.json({
        success: true,
        search: updated
      })
    } catch (error) {
      next(error)
    }
  }

  // Update saved search name
  async update(req, res, next) {
    try {
      const { id } = req.params
      const { name } = req.body

      const search = await Search.getById(id)
      if (!search) {
        throw new AppError('Search not found', 404, 'NOT_FOUND')
      }

      const updated = await Search.update(id, { name: name?.trim() || search.name })

      res.json({
        success: true,
        search: updated
      })
    } catch (error) {
      next(error)
    }
  }

  // Delete a search
  async delete(req, res, next) {
    try {
      const { id } = req.params

      const search = await Search.getById(id)
      if (!search) {
        throw new AppError('Search not found', 404, 'NOT_FOUND')
      }

      await Search.delete(id)

      res.json({
        success: true,
        message: 'Search deleted'
      })
    } catch (error) {
      next(error)
    }
  }

  // Rerun a saved search
  async rerun(req, res, next) {
    try {
      const { id } = req.params

      const search = await Search.getById(id)
      if (!search) {
        throw new AppError('Search not found', 404, 'NOT_FOUND')
      }

      // Return the parameters so the client can initiate a new search
      res.json({
        success: true,
        type: search.type,
        parameters: search.parameters
      })
    } catch (error) {
      next(error)
    }
  }
}

export default new HistoryController()
