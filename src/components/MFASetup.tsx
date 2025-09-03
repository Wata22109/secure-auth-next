'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

interface MFASetupProps {
  onComplete: () => void
}

export default function MFASetup({ onComplete }: MFASetupProps) {
  const [step, setStep] = useState<'setup' | 'verify' | 'complete'>('setup')
  const [qrCodeUrl, setQrCodeUrl] = useState('')
  const [secret, setSecret] = useState('')
  const [backupCodes, setBackupCodes] = useState<string[]>([])
  const [token, setToken] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState('')
  const router = useRouter()

  const handleSetup = async () => {
    setIsLoading(true)
    setError('')

    try {
      const response = await fetch('/api/user/mfa/setup', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'MFA設定の初期化に失敗しました')
      }

      setQrCodeUrl(data.qrCodeUrl)
      setSecret(data.secret)
      setBackupCodes(data.backupCodes)
      setStep('verify')
    } catch (error) {
      setError(error instanceof Error ? error.message : 'エラーが発生しました')
    } finally {
      setIsLoading(false)
    }
  }

  const handleVerify = async () => {
    if (!token.trim()) {
      setError('認証コードを入力してください')
      return
    }

    setIsLoading(true)
    setError('')

    try {
      const response = await fetch('/api/user/mfa/enable', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ token }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'MFA有効化に失敗しました')
      }

      setStep('complete')
      onComplete()
    } catch (error) {
      setError(error instanceof Error ? error.message : 'エラーが発生しました')
    } finally {
      setIsLoading(false)
    }
  }

  if (step === 'setup') {
    return (
      <div className="max-w-md mx-auto p-6 bg-white rounded-lg shadow-md">
        <h2 className="text-2xl font-bold mb-4 text-gray-800">多要素認証の設定</h2>
        <p className="text-gray-600 mb-6">
          アカウントのセキュリティを向上させるために、多要素認証（MFA）を設定します。
        </p>
        
        {error && (
          <div className="mb-4 p-3 bg-red-100 border border-red-400 text-red-700 rounded">
            {error}
          </div>
        )}

        <button
          onClick={handleSetup}
          disabled={isLoading}
          className="w-full bg-blue-600 text-white py-2 px-4 rounded hover:bg-blue-700 disabled:opacity-50"
        >
          {isLoading ? '設定中...' : 'MFA設定を開始'}
        </button>
      </div>
    )
  }

  if (step === 'verify') {
    return (
      <div className="max-w-md mx-auto p-6 bg-white rounded-lg shadow-md">
        <h2 className="text-2xl font-bold mb-4 text-gray-800">QRコードの設定</h2>
        
        <div className="mb-6">
          <p className="text-gray-600 mb-4">
            1. Google Authenticatorなどの認証アプリをインストールしてください
          </p>
          <p className="text-gray-600 mb-4">
            2. 以下のQRコードをスキャンするか、手動でシークレットキーを入力してください
          </p>
          
          {qrCodeUrl && (
            <div className="text-center mb-4">
              <img src={qrCodeUrl} alt="QR Code" className="mx-auto border" />
            </div>
          )}
          
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              シークレットキー（手動入力用）
            </label>
            <input
              type="text"
              value={secret}
              readOnly
              className="w-full p-2 border border-gray-300 rounded bg-gray-50"
            />
          </div>
        </div>

        <div className="mb-6">
          <h3 className="text-lg font-semibold mb-2 text-gray-800">バックアップコード</h3>
          <p className="text-sm text-gray-600 mb-3">
            認証アプリが利用できない場合に使用するバックアップコードです。安全な場所に保存してください。
          </p>
          <div className="bg-gray-50 p-3 rounded border">
            <div className="grid grid-cols-2 gap-2 text-sm font-mono">
              {backupCodes.map((code, index) => (
                <div key={index} className="text-center p-1 bg-white rounded">
                  {code}
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="mb-6">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            認証コード
          </label>
          <input
            type="text"
            value={token}
            onChange={(e) => setToken(e.target.value)}
            placeholder="6桁の数字を入力"
            className="w-full p-2 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            maxLength={6}
          />
        </div>

        {error && (
          <div className="mb-4 p-3 bg-red-100 border border-red-400 text-red-700 rounded">
            {error}
          </div>
        )}

        <div className="flex gap-3">
          <button
            onClick={() => setStep('setup')}
            className="flex-1 bg-gray-500 text-white py-2 px-4 rounded hover:bg-gray-600"
          >
            戻る
          </button>
          <button
            onClick={handleVerify}
            disabled={isLoading}
            className="flex-1 bg-blue-600 text-white py-2 px-4 rounded hover:bg-blue-700 disabled:opacity-50"
          >
            {isLoading ? '確認中...' : '確認'}
          </button>
        </div>
      </div>
    )
  }

  if (step === 'complete') {
    return (
      <div className="max-w-md mx-auto p-6 bg-white rounded-lg shadow-md">
        <div className="text-center">
          <div className="text-green-500 text-6xl mb-4">✓</div>
          <h2 className="text-2xl font-bold mb-4 text-gray-800">設定完了</h2>
          <p className="text-gray-600 mb-6">
            多要素認証が正常に設定されました。次回のログインからMFA認証が必要になります。
          </p>
          <button
            onClick={() => router.push('/dashboard')}
            className="bg-blue-600 text-white py-2 px-4 rounded hover:bg-blue-700"
          >
            ダッシュボードに戻る
          </button>
        </div>
      </div>
    )
  }

  return null
}
