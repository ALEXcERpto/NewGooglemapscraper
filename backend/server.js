import app from './src/app.js'
import config from './src/config/environment.js'
import { initSchema } from './src/config/database.js'

// Validate configuration
config.validate()

// Initialize database and start server
const startServer = async () => {
  await initSchema()

  const server = app.listen(config.port, () => {
    console.log(`Server running on http://localhost:${config.port}`)
    console.log(`Environment: ${config.nodeEnv}`)
  })

  // Graceful shutdown
  process.on('SIGTERM', () => {
    console.log('SIGTERM received. Shutting down...')
    server.close(() => {
      console.log('Server closed')
      process.exit(0)
    })
  })
}

startServer()
