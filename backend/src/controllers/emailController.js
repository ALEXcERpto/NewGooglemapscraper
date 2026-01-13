import emailService from '../services/emailService.js'
import Result from '../models/Result.js'
import { AppError } from '../middleware/errorHandler.js'

class EmailController {
  // Extract emails from a single URL
  async extractFromUrl(req, res, next) {
    try {
      const { url } = req.body

      if (!url) {
        throw new AppError('URL is required', 400, 'VALIDATION_ERROR')
      }

      const result = await emailService.extractFromUrl(url)

      res.json({
        success: true,
        ...result
      })
    } catch (error) {
      next(error)
    }
  }

  // Extract emails from search results (batch)
  async extractFromSearchResults(req, res, next) {
    try {
      const { searchId } = req.params

      // Get all results with websites
      const results = await Result.getBySearchId(searchId)
      const websiteUrls = results
        .filter(r => r.website)
        .map(r => r.website)

      if (websiteUrls.length === 0) {
        return res.json({
          success: true,
          message: 'No websites found in search results',
          results: [],
          totalEmails: 0,
          uniqueEmails: []
        })
      }

      // Batch extract emails (max 50 at a time)
      const batches = []
      for (let i = 0; i < websiteUrls.length; i += 50) {
        batches.push(websiteUrls.slice(i, i + 50))
      }

      const allResults = []
      const allUniqueEmails = new Set()

      for (const batch of batches) {
        const batchResult = await emailService.extractFromUrls(batch)
        allResults.push(...batchResult.results)
        batchResult.unique_emails?.forEach(email => allUniqueEmails.add(email))
      }

      // Update results with found emails
      for (const emailResult of allResults) {
        if (emailResult.emails.length > 0) {
          const matchingResult = results.find(r => r.website === emailResult.url)
          if (matchingResult) {
            await Result.update(matchingResult.id, {
              emails: emailResult.emails
            })
          }
        }
      }

      res.json({
        success: true,
        websitesProcessed: websiteUrls.length,
        results: allResults,
        totalEmails: allResults.reduce((sum, r) => sum + r.emails.length, 0),
        uniqueEmails: Array.from(allUniqueEmails)
      })
    } catch (error) {
      next(error)
    }
  }

  // Extract emails from multiple URLs
  async extractBatch(req, res, next) {
    try {
      const { urls } = req.body

      if (!urls || !Array.isArray(urls) || urls.length === 0) {
        throw new AppError('URLs array is required', 400, 'VALIDATION_ERROR')
      }

      if (urls.length > 50) {
        throw new AppError('Maximum 50 URLs per request', 400, 'VALIDATION_ERROR')
      }

      const result = await emailService.extractFromUrls(urls)

      res.json({
        success: true,
        ...result
      })
    } catch (error) {
      next(error)
    }
  }

  // Check email service health
  async healthCheck(req, res, next) {
    try {
      const health = await emailService.healthCheck()
      res.json(health)
    } catch (error) {
      next(error)
    }
  }
}

export default new EmailController()
