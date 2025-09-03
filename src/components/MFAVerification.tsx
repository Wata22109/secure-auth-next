'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

interface MFAVerificationProps {
  userId: string
  onSuccess: (user: any) => void
}

export default function MFAVerification({ userId, onSuccess }: MFAVerificationProps) {
  const [token, setToken] = useState('')
  const [isBackupCode, setIsBackupCode] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState('')
  const router = useRouter()

  const handleVerify = async () => {
    if (!token.trim()) {
      setError('認証コードを入力してください')
      return
    }

    setIsLoading(true)
    setError('')

    try {
      const response = await fetch('/api/auth/mfa-verify', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
          userId, 
          token, 
          isBackupCode 
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'MFA認証に失敗しました')
      }

      onSuccess(data.user)
    } catch (error) {
      setError(error instanceof Error ? error.message : 'エラーが発生しました')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="max-w-md mx-auto p-6 bg-white rounded-lg shadow-md">
      <h2 className="text-2xl font-bold mb-4 text-gray-800">多要素認証</h2>
      <p className="text-gray-600 mb-6">
        認証アプリに表示されている6桁のコードを入力してください。
      </p>

      <div className="mb-4">
        <label className="block text-sm font-medium text-gray-700 mb-2">
          認証コード
        </label>
        <input
          type="text"
          value={token}
          onChange={(e) => setToken(e.target.value)}
          placeholder={isBackupCode ? "8桁のバックアップコード" : "6桁の数字を入力"}
          className="w-full p-2 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          maxLength={isBackupCode ? 8 : 6}
        />
      </div>

      <div className="mb-6">
        <label className="flex items-center">
          <input
            type="checkbox"
            checked={isBackupCode}
            onChange={(e) => setIsBackupCode(e.target.checked)}
            className="mr-2"
          />
          <span className="text-sm text-gray-600">
            バックアップコードを使用する
          </span>
        </label>
      </div>

      {error && (
        <div className="mb-4 p-3 bg-red-100 border border-red-400 text-red-700 rounded">
          {error}
        </div>
      )}

      <button
        onClick={handleVerify}
        disabled={isLoading}
        className="w-full bg-blue-600 text-white py-2 px-4 rounded hover:bg-blue-700 disabled:opacity-50"
      >
        {isLoading ? '認証中...' : '認証'}
      </button>

      <div className="mt-4 text-center">
        <button
          onClick={() => router.push('/login')}
          className="text-sm text-blue-600 hover:text-blue-800"
        >
          ログイン画面に戻る
        </button>
      </div>
    </div>
  )
}
