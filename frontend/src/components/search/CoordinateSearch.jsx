import { useState, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { MapContainer, TileLayer, Marker, useMapEvents, Circle } from 'react-leaflet'
import { Search, MapPin } from 'lucide-react'
import toast from 'react-hot-toast'
import { useSearchStore } from '../../store/searchStore'
import ProgressBar from '../common/ProgressBar'
import 'leaflet/dist/leaflet.css'
import L from 'leaflet'

// Fix for default marker icon
delete L.Icon.Default.prototype._getIconUrl
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png',
})

function LocationMarker({ position, setPosition }) {
  useMapEvents({
    click(e) {
      setPosition({ lat: e.latlng.lat, lng: e.latlng.lng })
    }
  })

  return position ? <Marker position={[position.lat, position.lng]} /> : null
}

export default function CoordinateSearch() {
  const navigate = useNavigate()
  const { searchByCoordinates, isLoading, progress, error } = useSearchStore()

  const [position, setPosition] = useState({ lat: 40.7128, lng: -74.0060 }) // NYC default
  const [config, setConfig] = useState({
    radiusKm: 5,
    gridSize: 3,
    query: '',
    limit: 20,
    country: 'us',
    language: 'en'
  })

  const estimatedCalls = config.gridSize * config.gridSize
  const estimatedCost = ((estimatedCalls / 10000) * 2).toFixed(4)

  const handleSearch = async () => {
    try {
      const result = await searchByCoordinates({
        centerLat: position.lat,
        centerLng: position.lng,
        ...config
      })
      toast.success(`Found ${result.resultCount} unique results from ${result.gridPointsSearched} grid points`)
      navigate(`/results/${result.searchId}`)
    } catch (err) {
      toast.error(err.friendlyMessage || 'Search failed')
    }
  }

  return (
    <div className="grid grid-cols-2 gap-6">
      {/* Left: Controls */}
      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Search Query (optional)
          </label>
          <input
            type="text"
            value={config.query}
            onChange={(e) => setConfig({ ...config, query: e.target.value })}
            placeholder="e.g., restaurants, coffee shops (leave empty for all)"
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
            disabled={isLoading}
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Latitude
            </label>
            <input
              type="number"
              step="0.0001"
              value={position.lat}
              onChange={(e) => setPosition({ ...position, lat: parseFloat(e.target.value) || 0 })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              disabled={isLoading}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Longitude
            </label>
            <input
              type="number"
              step="0.0001"
              value={position.lng}
              onChange={(e) => setPosition({ ...position, lng: parseFloat(e.target.value) || 0 })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              disabled={isLoading}
            />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Radius (km)
            </label>
            <input
              type="number"
              min="1"
              max="50"
              value={config.radiusKm}
              onChange={(e) => setConfig({ ...config, radiusKm: parseInt(e.target.value) || 5 })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              disabled={isLoading}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Grid Size
            </label>
            <select
              value={config.gridSize}
              onChange={(e) => setConfig({ ...config, gridSize: parseInt(e.target.value) })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              disabled={isLoading}
            >
              <option value={2}>2x2 (4 points)</option>
              <option value={3}>3x3 (9 points)</option>
              <option value={4}>4x4 (16 points)</option>
              <option value={5}>5x5 (25 points)</option>
            </select>
          </div>
        </div>

        <div className="p-4 bg-gray-50 rounded-lg">
          <div className="flex justify-between text-sm">
            <span className="text-gray-600">Estimated API calls:</span>
            <span className="font-medium">{estimatedCalls}</span>
          </div>
          <div className="flex justify-between text-sm mt-1">
            <span className="text-gray-600">Estimated cost:</span>
            <span className="font-medium">${estimatedCost}</span>
          </div>
        </div>

        <button
          onClick={handleSearch}
          disabled={isLoading}
          className="w-full py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
        >
          <Search size={20} />
          Search Area ({estimatedCalls} API calls)
        </button>

        {isLoading && (
          <div className="p-4 bg-blue-50 rounded-lg">
            <ProgressBar progress={progress} />
          </div>
        )}

        {error && (
          <div className="p-4 bg-red-50 text-red-700 rounded-lg">
            {error}
          </div>
        )}
      </div>

      {/* Right: Map */}
      <div className="h-[500px] rounded-lg overflow-hidden border border-gray-200">
        <MapContainer
          center={[position.lat, position.lng]}
          zoom={12}
          className="h-full w-full"
        >
          <TileLayer
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
          />
          <LocationMarker position={position} setPosition={setPosition} />
          {position && (
            <Circle
              center={[position.lat, position.lng]}
              radius={config.radiusKm * 1000}
              pathOptions={{ color: 'blue', fillColor: 'blue', fillOpacity: 0.1 }}
            />
          )}
        </MapContainer>
        <p className="text-xs text-gray-500 mt-2 text-center">
          Click on the map to set the center point
        </p>
      </div>
    </div>
  )
}
