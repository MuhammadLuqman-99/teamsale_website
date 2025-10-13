import Link from 'next/link'

export default function Footer() {
  return (
    <footer className="bg-white border-t border-gray-100 py-12">
      <div className="container mx-auto px-4">
        <div className="flex flex-col items-center space-y-6">
          {/* Logo */}
          <div className="flex items-center space-x-3">
            <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-purple-500 rounded-2xl flex items-center justify-center shadow-soft">
              <span className="text-white font-bold">K</span>
            </div>
            <span className="text-xl font-bold text-gray-900">KilangDM</span>
          </div>

          {/* Description */}
          <p className="text-gray-600 text-center max-w-md">
            Sistem Pengurusan Data Perniagaan
          </p>

          {/* Links */}
          <div className="flex items-center space-x-6 text-sm text-gray-500">
            <span>© 2024 KilangDM</span>
            <span>•</span>
            <Link href="#" className="hover:text-gray-900 transition-colors">
              Privacy
            </Link>
            <span>•</span>
            <Link href="#" className="hover:text-gray-900 transition-colors">
              Terms
            </Link>
          </div>
        </div>
      </div>
    </footer>
  )
}
