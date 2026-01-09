class GridService {
  // Generate a grid of points centered on a location
  generateGrid({ centerLat, centerLng, radiusKm, gridSize }) {
    const points = []
    const earthRadius = 6371 // km

    // Calculate step size in degrees
    const latStep = (radiusKm / earthRadius) * (180 / Math.PI)
    const lngStep = latStep / Math.cos(centerLat * Math.PI / 180)

    const halfGrid = Math.floor(gridSize / 2)
    const stepMultiplier = (2 * radiusKm) / (gridSize - 1 || 1)

    for (let i = -halfGrid; i <= halfGrid; i++) {
      for (let j = -halfGrid; j <= halfGrid; j++) {
        const lat = centerLat + (i * latStep * stepMultiplier / radiusKm)
        const lng = centerLng + (j * lngStep * stepMultiplier / radiusKm)
        points.push({
          lat: parseFloat(lat.toFixed(6)),
          lng: parseFloat(lng.toFixed(6)),
          index: points.length
        })
      }
    }

    return points
  }

  // Generate grid covering a bounding box
  generateBoundingBoxGrid({ north, south, east, west, stepKm = 2 }) {
    const points = []
    const earthRadius = 6371

    const latStep = (stepKm / earthRadius) * (180 / Math.PI)

    for (let lat = south; lat <= north; lat += latStep) {
      const lngStep = latStep / Math.cos(lat * Math.PI / 180)
      for (let lng = west; lng <= east; lng += lngStep) {
        points.push({
          lat: parseFloat(lat.toFixed(6)),
          lng: parseFloat(lng.toFixed(6)),
          index: points.length
        })
      }
    }

    return points
  }

  // Calculate estimated API calls for a grid search
  estimateApiCalls({ radiusKm, gridSize, limitPerPoint = 20 }) {
    const totalPoints = gridSize * gridSize
    return {
      gridPoints: totalPoints,
      estimatedCalls: totalPoints,
      estimatedCost: (totalPoints / 10000) * 2 // $2 per 10k requests
    }
  }
}

export default new GridService()
