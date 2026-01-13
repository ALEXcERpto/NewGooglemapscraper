import axios from 'axios'

const EMAIL_SERVICE_URL = process.env.EMAIL_SERVICE_URL || 'http://localhost:8000'

class EmailService {
  constructor() {
    this.client = axios.create({
      baseURL: EMAIL_SERVICE_URL,
      timeout: 60000 // 60 seconds for crawling
    })
  }

  async extractFromUrl(url) {
    try {
      const response = await this.client.post('/extract', { url })
      return response.data
    } catch (error) {
      console.error('Email extraction error:', error.message)
      throw new Error(`Failed to extract emails: ${error.message}`)
    }
  }

  async extractFromUrls(urls) {
    try {
      const response = await this.client.post('/extract/batch', { urls })
      return response.data
    } catch (error) {
      console.error('Batch email extraction error:', error.message)
      throw new Error(`Failed to extract emails: ${error.message}`)
    }
  }

  async healthCheck() {
    try {
      const response = await this.client.get('/health')
      return response.data
    } catch (error) {
      return { status: 'unavailable', error: error.message }
    }
  }
}

export default new EmailService()
