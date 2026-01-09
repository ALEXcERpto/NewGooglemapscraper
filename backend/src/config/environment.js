import dotenv from 'dotenv'
dotenv.config()

// Parse CORS origins (comma-separated in env variable)
const parseCorsOrigins = () => {
  const origins = process.env.CORS_ORIGIN
  if (!origins) {
    return ['http://localhost:5173', 'http://localhost:3000']
  }
  // Support comma-separated origins
  return origins.split(',').map(o => o.trim())
}

const config = {
  scraperApiKey: process.env.SCRAPER_API_KEY,
  port: process.env.PORT || 3001,
  nodeEnv: process.env.NODE_ENV || 'development',
  corsOrigins: parseCorsOrigins(),

  validate() {
    if (!this.scraperApiKey) {
      console.warn('WARNING: SCRAPER_API_KEY not set. API calls will fail.')
    }
  }
}

export default config
