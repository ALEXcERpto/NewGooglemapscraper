import { v4 as uuidv4 } from 'uuid'
import path from 'path'
import exportService from '../services/exportService.js'
import ExportJob from '../models/ExportJob.js'
import Result from '../models/Result.js'
import Search from '../models/Search.js'
import { AppError } from '../middleware/errorHandler.js'

class ExportController {
  // Create an export job
  async create(req, res, next) {
    try {
      const { searchId, format } = req.body

      if (!['csv', 'json', 'xlsx'].includes(format)) {
        throw new AppError('Invalid format. Use csv, json, or xlsx', 400, 'VALIDATION_ERROR')
      }

      // Verify search exists
      const search = await Search.getById(searchId)
      if (!search) {
        throw new AppError('Search not found', 404, 'NOT_FOUND')
      }

      // Get results
      const results = await Result.getBySearchId(searchId)
      if (!results || results.length === 0) {
        throw new AppError('No results to export', 400, 'NO_RESULTS')
      }

      // Create export job
      const jobId = uuidv4()
      await ExportJob.create({
        id: jobId,
        searchId,
        format
      })

      // Generate export file
      const filename = `export_${searchId}_${Date.now()}`
      let filePath

      try {
        switch (format) {
          case 'csv':
            filePath = await exportService.exportToCSV(results, filename)
            break
          case 'json':
            filePath = await exportService.exportToJSON(results, filename)
            break
          case 'xlsx':
            filePath = await exportService.exportToExcel(results, filename)
            break
        }

        await ExportJob.update(jobId, {
          status: 'completed',
          filePath,
          recordCount: results.length,
          completedAt: new Date().toISOString()
        })

        res.json({
          success: true,
          jobId,
          recordCount: results.length,
          downloadUrl: `/api/export/${jobId}/download`
        })
      } catch (exportError) {
        await ExportJob.update(jobId, {
          status: 'failed',
          errorMessage: exportError.message
        })
        throw exportError
      }
    } catch (error) {
      next(error)
    }
  }

  // Get export job status
  async getStatus(req, res, next) {
    try {
      const { jobId } = req.params

      const job = await ExportJob.getById(jobId)
      if (!job) {
        throw new AppError('Export job not found', 404, 'NOT_FOUND')
      }

      res.json({
        success: true,
        job
      })
    } catch (error) {
      next(error)
    }
  }

  // Download export file
  async download(req, res, next) {
    try {
      const { jobId } = req.params

      const job = await ExportJob.getById(jobId)
      if (!job) {
        throw new AppError('Export job not found', 404, 'NOT_FOUND')
      }

      if (job.status !== 'completed') {
        throw new AppError('Export not ready', 400, 'EXPORT_NOT_READY')
      }

      const filename = path.basename(job.file_path)
      res.download(job.file_path, filename)
    } catch (error) {
      next(error)
    }
  }
}

export default new ExportController()
