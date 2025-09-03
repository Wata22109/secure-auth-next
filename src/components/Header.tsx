'use client'

import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useSWRConfig } from 'swr'

export default function Header() {
  const router = useRouter()
  const { mutate } = useSWRConfig()

  const handleLogout = async () => {
    try {
      const response = await fetch('/api/auth/logout', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      })

      if (response.ok) {
        // SWRキャッシュをクリア
        mutate(() => true, undefined, { revalidate: false })
        router.push('/login')
      }
    } catch (error) {
      console.error('Logout error:', error)
    }
  }

  return (
    <header className="bg-white shadow-sm border-b">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          <div className="flex items-center">
            <Link href="/" className="text-xl font-bold text-gray-900">
              SecureAuth-Next
            </Link>
          </div>
          
          <nav className="flex items-center space-x-4">
            <Link 
              href="/dashboard/profile" 
              className="text-gray-700 hover:text-gray-900 px-3 py-2 rounded-md text-sm font-medium"
            >
              プロファイル
            </Link>
            <button
              onClick={handleLogout}
              className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-md text-sm font-medium transition-colors"
            >
              ログアウト
            </button>
          </nav>
        </div>
      </div>
    </header>
  )
}
