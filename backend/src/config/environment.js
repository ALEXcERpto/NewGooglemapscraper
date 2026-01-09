import dotenv from 'dotenv'
dotenv.config()

const config = {
  scraperApiKey: process.env.SCRAPER_API_KEY,
  port: process.env.PORT || 3001,
  nodeEnv: process.env.NODE_ENV || 'development',
  corsOrigin: process.env.CORS_ORIGIN || 'http://localhost:5173',

  validate() {
    if (!this.scraperApiKey) {
      console.warn('WARNING: SCRAPER_API_KEY not set. API calls will fail.')
    }
  }
}

export default config
