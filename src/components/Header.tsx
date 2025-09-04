'use client'

import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useSWRConfig } from 'swr'
import useSWR from 'swr'

export default function Header() {
  const router = useRouter()
  const { mutate } = useSWRConfig()
  const fetcher = (url: string) => fetch(url).then(res => res.json())
  const { data } = useSWR<{ user?: { id: string; name: string; email: string; role: string } }>(
    '/api/user/me',
    fetcher
  )

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
      // Error handling
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
            {data?.user && (
              <span className="text-gray-600 text-sm">
                ログイン中: <strong>{data.user.name}</strong>{' '}
                <span className="ml-1 px-2 py-0.5 text-xs bg-gray-100 text-gray-700 rounded">
                  {data.user.role}
                </span>
              </span>
            )}
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
