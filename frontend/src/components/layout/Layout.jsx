import { useState } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { MapPin, Search, History, Menu, X, Home, Mail } from 'lucide-react'
import clsx from 'clsx'

const navItems = [
  { path: '/', icon: Home, label: 'Dashboard' },
  { path: '/search', icon: Search, label: 'Search' },
  { path: '/email', icon: Mail, label: 'Email Finder' },
  { path: '/history', icon: History, label: 'History' }
]

export default function Layout({ children }) {
  const [sidebarOpen, setSidebarOpen] = useState(true)
  const location = useLocation()

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 fixed top-0 left-0 right-0 z-50">
        <div className="flex items-center justify-between px-4 h-16">
          <div className="flex items-center gap-4">
            <button
              onClick={() => setSidebarOpen(!sidebarOpen)}
              className="p-2 rounded-lg hover:bg-gray-100"
            >
              {sidebarOpen ? <X size={20} /> : <Menu size={20} />}
            </button>
            <div className="flex items-center gap-2">
              <MapPin className="text-blue-600" size={24} />
              <span className="font-semibold text-lg">Maps Scraper</span>
            </div>
          </div>
        </div>
      </header>

      <div className="flex pt-16">
        {/* Sidebar */}
        <aside
          className={clsx(
            'fixed left-0 top-16 bottom-0 bg-white border-r border-gray-200 transition-all duration-300 z-40',
            sidebarOpen ? 'w-64' : 'w-0 overflow-hidden'
          )}
        >
          <nav className="p-4 space-y-2">
            {navItems.map(({ path, icon: Icon, label }) => (
              <Link
                key={path}
                to={path}
                className={clsx(
                  'flex items-center gap-3 px-4 py-3 rounded-lg transition-colors',
                  location.pathname === path
                    ? 'bg-blue-50 text-blue-600'
                    : 'text-gray-600 hover:bg-gray-100'
                )}
              >
                <Icon size={20} />
                <span>{label}</span>
              </Link>
            ))}
          </nav>
        </aside>

        {/* Main Content */}
        <main
          className={clsx(
            'flex-1 transition-all duration-300 min-h-[calc(100vh-4rem)]',
            sidebarOpen ? 'ml-64' : 'ml-0'
          )}
        >
          <div className="p-6">{children}</div>
        </main>
      </div>
    </div>
  )
}
