import { useState } from 'react'
import { Search, MapPin } from 'lucide-react'
import clsx from 'clsx'
import QuerySearch from '../components/search/QuerySearch'
import CoordinateSearch from '../components/search/CoordinateSearch'

const tabs = [
  { id: 'query', label: 'Search by Query', icon: Search },
  { id: 'coordinates', label: 'Search by Coordinates', icon: MapPin }
]

export default function SearchPage() {
  const [activeTab, setActiveTab] = useState('query')

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Search Google Maps</h1>
        <p className="text-gray-600 mt-1">
          Find businesses, places, and locations with detailed information
        </p>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 border-b border-gray-200">
        {tabs.map(({ id, label, icon: Icon }) => (
          <button
            key={id}
            onClick={() => setActiveTab(id)}
            className={clsx(
              'flex items-center gap-2 px-4 py-3 border-b-2 -mb-px transition-colors',
              activeTab === id
                ? 'border-blue-600 text-blue-600'
                : 'border-transparent text-gray-600 hover:text-gray-900'
            )}
          >
            <Icon size={18} />
            {label}
          </button>
        ))}
      </div>

      {/* Content */}
      <div className="bg-white rounded-xl border border-gray-200 p-6">
        {activeTab === 'query' ? <QuerySearch /> : <CoordinateSearch />}
      </div>
    </div>
  )
}
