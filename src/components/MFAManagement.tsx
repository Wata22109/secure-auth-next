'use client'

import { useState, useEffect } from 'react'
import MFASetup from './MFASetup'

interface MFAManagementProps {
  onUpdate: () => void
}

export default function MFAManagement({ onUpdate }: MFAManagementProps) {
  const [mfaStatus, setMfaStatus] = useState<{
    mfaEnabled: boolean
    remainingBackupCodes: number
  } | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [showSetup, setShowSetup] = useState(false)
  const [showDisable, setShowDisable] = useState(false)
  const [showRegenerate, setShowRegenerate] = useState(false)
  const [token, setToken] = useState('')
  const [error, setError] = useState('')
  const [newBackupCodes, setNewBackupCodes] = useState<string[]>([])

  useEffect(() => {
    fetchMFAStatus()
  }, [])

  const fetchMFAStatus = async () => {
    try {
      const response = await fetch('/api/user/mfa/status')
      const data = await response.json()

      if (response.ok) {
        setMfaStatus(data)
      }
    } catch (error) {
      console.error('MFA status fetch error:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const handleDisable = async () => {
    if (!token.trim()) {
      setError('認証コードを入力してください')
      return
    }

    try {
      const response = await fetch('/api/user/mfa/disable', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ token }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'MFA無効化に失敗しました')
      }

      setShowDisable(false)
      setToken('')
      setError('')
      fetchMFAStatus()
      onUpdate()
    } catch (error) {
      setError(error instanceof Error ? error.message : 'エラーが発生しました')
    }
  }

  const handleRegenerateBackupCodes = async () => {
    if (!token.trim()) {
      setError('認証コードを入力してください')
      return
    }

    try {
      const response = await fetch('/api/user/mfa/backup-codes', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ token }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'バックアップコードの再生成に失敗しました')
      }

      setNewBackupCodes(data.backupCodes)
      setShowRegenerate(false)
      setToken('')
      setError('')
      fetchMFAStatus()
    } catch (error) {
      setError(error instanceof Error ? error.message : 'エラーが発生しました')
    }
  }

  if (isLoading) {
    return (
      <div className="max-w-md mx-auto p-6 bg-white rounded-lg shadow-md">
        <div className="text-center">読み込み中...</div>
      </div>
    )
  }

  if (showSetup) {
    return (
      <MFASetup
        onComplete={() => {
          setShowSetup(false)
          fetchMFAStatus()
          onUpdate()
        }}
      />
    )
  }

  if (newBackupCodes.length > 0) {
    return (
      <div className="max-w-md mx-auto p-6 bg-white rounded-lg shadow-md">
        <h2 className="text-2xl font-bold mb-4 text-gray-800">新しいバックアップコード</h2>
        <p className="text-gray-600 mb-4">
          新しいバックアップコードが生成されました。古いコードは無効になります。
        </p>
        
        <div className="bg-gray-50 p-3 rounded border mb-4">
          <div className="grid grid-cols-2 gap-2 text-sm font-mono">
            {newBackupCodes.map((code, index) => (
              <div key={index} className="text-center p-1 bg-white rounded">
                {code}
              </div>
            ))}
          </div>
        </div>

        <button
          onClick={() => {
            setNewBackupCodes([])
            fetchMFAStatus()
          }}
          className="w-full bg-blue-600 text-white py-2 px-4 rounded hover:bg-blue-700"
        >
          完了
        </button>
      </div>
    )
  }

  return (
    <div className="max-w-md mx-auto p-6 bg-white rounded-lg shadow-md">
      <h2 className="text-2xl font-bold mb-4 text-gray-800">多要素認証の管理</h2>

      {mfaStatus?.mfaEnabled ? (
        <div>
          <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded">
            <div className="flex items-center">
              <div className="text-green-500 mr-2">✓</div>
              <span className="text-green-800 font-medium">MFAが有効になっています</span>
            </div>
            <p className="text-green-700 text-sm mt-1">
              残りのバックアップコード: {mfaStatus.remainingBackupCodes}個
            </p>
          </div>

          <div className="space-y-3">
            <button
              onClick={() => setShowRegenerate(true)}
              className="w-full bg-yellow-600 text-white py-2 px-4 rounded hover:bg-yellow-700"
            >
              バックアップコードを再生成
            </button>
            <button
              onClick={() => setShowDisable(true)}
              className="w-full bg-red-600 text-white py-2 px-4 rounded hover:bg-red-700"
            >
              MFAを無効化
            </button>
          </div>

          {showRegenerate && (
            <div className="mt-4 p-4 bg-yellow-50 border border-yellow-200 rounded">
              <h3 className="font-medium text-yellow-800 mb-2">バックアップコードの再生成</h3>
              <p className="text-yellow-700 text-sm mb-3">
                認証アプリのコードを入力して、新しいバックアップコードを生成してください。
              </p>
              
              <input
                type="text"
                value={token}
                onChange={(e) => setToken(e.target.value)}
                placeholder="6桁の数字を入力"
                className="w-full p-2 border border-gray-300 rounded mb-3"
                maxLength={6}
              />

              {error && (
                <div className="mb-3 p-2 bg-red-100 border border-red-400 text-red-700 rounded text-sm">
                  {error}
                </div>
              )}

              <div className="flex gap-2">
                <button
                  onClick={() => {
                    setShowRegenerate(false)
                    setToken('')
                    setError('')
                  }}
                  className="flex-1 bg-gray-500 text-white py-2 px-4 rounded hover:bg-gray-600"
                >
                  キャンセル
                </button>
                <button
                  onClick={handleRegenerateBackupCodes}
                  className="flex-1 bg-yellow-600 text-white py-2 px-4 rounded hover:bg-yellow-700"
                >
                  再生成
                </button>
              </div>
            </div>
          )}

          {showDisable && (
            <div className="mt-4 p-4 bg-red-50 border border-red-200 rounded">
              <h3 className="font-medium text-red-800 mb-2">MFAの無効化</h3>
              <p className="text-red-700 text-sm mb-3">
                認証アプリのコードを入力して、MFAを無効化してください。
              </p>
              
              <input
                type="text"
                value={token}
                onChange={(e) => setToken(e.target.value)}
                placeholder="6桁の数字を入力"
                className="w-full p-2 border border-gray-300 rounded mb-3"
                maxLength={6}
              />

              {error && (
                <div className="mb-3 p-2 bg-red-100 border border-red-400 text-red-700 rounded text-sm">
                  {error}
                </div>
              )}

              <div className="flex gap-2">
                <button
                  onClick={() => {
                    setShowDisable(false)
                    setToken('')
                    setError('')
                  }}
                  className="flex-1 bg-gray-500 text-white py-2 px-4 rounded hover:bg-gray-600"
                >
                  キャンセル
                </button>
                <button
                  onClick={handleDisable}
                  className="flex-1 bg-red-600 text-white py-2 px-4 rounded hover:bg-red-700"
                >
                  無効化
                </button>
              </div>
            </div>
          )}
        </div>
      ) : (
        <div>
          <div className="mb-6 p-4 bg-yellow-50 border border-yellow-200 rounded">
            <div className="flex items-center">
              <div className="text-yellow-500 mr-2">⚠</div>
              <span className="text-yellow-800 font-medium">MFAが無効になっています</span>
            </div>
            <p className="text-yellow-700 text-sm mt-1">
              アカウントのセキュリティを向上させるために、MFAを有効にすることをお勧めします。
            </p>
          </div>

          <button
            onClick={() => setShowSetup(true)}
            className="w-full bg-blue-600 text-white py-2 px-4 rounded hover:bg-blue-700"
          >
            MFAを有効化
          </button>
        </div>
      )}
    </div>
  )
}
