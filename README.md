# Google Maps Scraper

A full-stack web application for scraping Google Maps data using the Scraper.Tech API.

## Features

- **Search by Query**: Search for businesses like "restaurants in NYC" or "plumbers 10001"
- **Search by Coordinates**: Define a geographic area with lat/long and grid configuration
- **Export Results**: Download data as CSV, JSON, or Excel
- **Search History**: Save and re-run previous searches

## Tech Stack

- **Frontend**: React 18 + Vite + Tailwind CSS + Zustand
- **Backend**: Node.js + Express.js + SQLite
- **Maps**: Leaflet + react-leaflet

## Getting Started

### Prerequisites

- Node.js 18+ installed
- Scraper.Tech API key (get one at [scraper.tech](https://scraper.tech))

### Installation

1. Clone the repository:
```bash
cd Googlemapscraper
```

2. Install backend dependencies:
```bash
cd backend
npm install
```

3. Create `.env` file in backend folder:
```bash
cp .env.example .env
```

4. Edit `.env` and add your API key:
```
SCRAPER_API_KEY=your_api_key_here
PORT=3001
CORS_ORIGIN=http://localhost:5173
```

5. Install frontend dependencies:
```bash
cd ../frontend
npm install
```

### Running the Application

1. Start the backend server:
```bash
cd backend
npm run dev
```

2. In a new terminal, start the frontend:
```bash
cd frontend
npm run dev
```

3. Open http://localhost:5173 in your browser

## Project Structure

```
googlemapscraper/
├── backend/
│   ├── src/
│   │   ├── config/          # Configuration files
│   │   ├── controllers/     # Route handlers
│   │   ├── middleware/      # Express middleware
│   │   ├── models/          # Database models
│   │   ├── routes/          # API routes
│   │   ├── services/        # Business logic
│   │   └── app.js           # Express app setup
│   ├── database/            # SQLite database
│   ├── exports/             # Generated export files
│   └── server.js            # Entry point
│
├── frontend/
│   ├── src/
│   │   ├── components/      # React components
│   │   ├── pages/           # Page components
│   │   ├── services/        # API client
│   │   ├── store/           # Zustand stores
│   │   └── App.jsx          # Root component
│   └── index.html
│
└── README.md
```

## API Endpoints

### Search
- `POST /api/search/query` - Search by query string
- `POST /api/search/coordinates` - Search by coordinates

### History
- `GET /api/history` - List all searches
- `POST /api/history/:id/save` - Save a search
- `DELETE /api/history/:id` - Delete a search
- `POST /api/history/:id/rerun` - Re-run a search

### Export
- `POST /api/export` - Create export job
- `GET /api/export/:jobId/download` - Download export file

## Configuration

### Backend Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| SCRAPER_API_KEY | Your Scraper.Tech API key | Required |
| PORT | Server port | 3001 |
| CORS_ORIGIN | Frontend URL | http://localhost:5173 |

## Cost Estimation

- Scraper.Tech pricing: ~$2 per 10,000 requests
- Query search: ~1-5 API calls depending on result limit
- Coordinate search: Grid size squared (e.g., 3x3 = 9 API calls)

## License

MIT
