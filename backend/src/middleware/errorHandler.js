export class AppError extends Error {
  constructor(message, statusCode, code = 'INTERNAL_ERROR') {
    super(message)
    this.statusCode = statusCode
    this.code = code
    this.isOperational = true
  }
}

export const errorHandler = (err, req, res, next) => {
  console.error('Error:', {
    message: err.message,
    stack: err.stack,
    code: err.code,
    path: req.path
  })

  // Handle operational errors
  if (err.isOperational) {
    return res.status(err.statusCode).json({
      success: false,
      code: err.code,
      message: err.message
    })
  }

  // Handle Axios errors (Scraper.Tech API)
  if (err.response?.status) {
    const status = err.response.status
    const messages = {
      400: 'Invalid request parameters',
      401: 'API authentication failed - check API key',
      403: 'Access forbidden - check API permissions',
      429: 'Rate limit exceeded - please slow down',
      500: 'Scraper API server error',
      503: 'Scraper API temporarily unavailable'
    }

    return res.status(status).json({
      success: false,
      code: `SCRAPER_${status}`,
      message: messages[status] || 'API request failed'
    })
  }

  // Handle validation errors
  if (err.name === 'ValidationError') {
    return res.status(400).json({
      success: false,
      code: 'VALIDATION_ERROR',
      message: err.message
    })
  }

  // Generic error
  res.status(500).json({
    success: false,
    code: 'INTERNAL_ERROR',
    message: process.env.NODE_ENV === 'production'
      ? 'An unexpected error occurred'
      : err.message
  })
}
