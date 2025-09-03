'use client'

import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { changePasswordSchema, ChangePasswordFormData } from '@/lib/validations'
import PasswordStrengthMeter from '@/components/PasswordStrengthMeter'
import Header from '@/components/Header'
import useSWR from 'swr'

interface LoginHistory {
  id: string
  ipAddress: string
  userAgent: string
  createdAt: string
}

interface AdminLoginHistory extends LoginHistory {
  user?: {
    id: string
    name: string
    email: string
  }
}

const fetcher = (url: string) => fetch(url).then(res => res.json())

export default function ProfilePage() {
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [passwordError, setPasswordError] = useState<string | null>(null)
  const [passwordSuccess, setPasswordSuccess] = useState<string | null>(null)

  const {
    register,
    handleSubmit,
    watch,
    reset,
    formState: { errors }
  } = useForm<ChangePasswordFormData>({
    resolver: zodResolver(changePasswordSchema)
  })

  const newPassword = watch('newPassword', '')

  // 現在のユーザー
  const { data: meData } = useSWR<{ user?: { id: string; name: string; email: string; role: string } }>(
    '/api/user/me',
    fetcher
  )

  const isAdmin = (meData?.user?.role || '').toUpperCase() === 'ADMIN'

  // ログイン履歴の取得（一般は自分、管理者は全体）
  const historyUrl = isAdmin
    ? '/api/user/login-history?all=true&limit=50'
    : '/api/user/login-history?limit=20'

  const { data: loginHistoryData, error: loginHistoryError } = useSWR<{ loginHistory: AdminLoginHistory[] }>(
    historyUrl,
    fetcher
  )

  const handlePasswordChange = async (data: ChangePasswordFormData) => {
    setIsSubmitting(true)
    setPasswordError(null)
    setPasswordSuccess(null)

    try {
      const response = await fetch('/api/user/change-password', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          currentPassword: data.currentPassword,
          newPassword: data.newPassword,
          confirmNewPassword: data.confirmNewPassword
        }),
      })

      const result = await response.json()

      if (response.ok) {
        setPasswordSuccess(result.message)
        reset()
      } else {
        setPasswordError(result.error)
      }
    } catch (error) {
      setPasswordError('パスワード変更中にエラーが発生しました')
    } finally {
      setIsSubmitting(false)
    }
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString('ja-JP')
  }

  const truncateUserAgent = (userAgent: string) => {
    return userAgent.length > 50 ? userAgent.substring(0, 50) + '...' : userAgent
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      
      <div className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="px-4 py-6 sm:px-0">
          <h1 className="text-3xl font-bold text-gray-900 mb-8">プロファイル</h1>
          
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* パスワード変更セクション */}
            <div className="bg-white shadow rounded-lg p-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-6">パスワード変更</h2>
              
              {passwordError && (
                <div className="mb-4 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
                  {passwordError}
                </div>
              )}
              
              {passwordSuccess && (
                <div className="mb-4 bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded">
                  {passwordSuccess}
                </div>
              )}

              <form onSubmit={handleSubmit(handlePasswordChange)} className="space-y-4">
                <div>
                  <label htmlFor="currentPassword" className="block text-sm font-medium text-gray-700">
                    現在のパスワード
                  </label>
                  <input
                    {...register('currentPassword')}
                    type="password"
                    id="currentPassword"
                    className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                  />
                  {errors.currentPassword && (
                    <p className="mt-1 text-sm text-red-600">{errors.currentPassword.message}</p>
                  )}
                </div>

                <div>
                  <label htmlFor="newPassword" className="block text-sm font-medium text-gray-700">
                    新しいパスワード
                  </label>
                  <input
                    {...register('newPassword')}
                    type="password"
                    id="newPassword"
                    className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                  />
                  <PasswordStrengthMeter password={newPassword} />
                  {errors.newPassword && (
                    <p className="mt-1 text-sm text-red-600">{errors.newPassword.message}</p>
                  )}
                </div>

                <div>
                  <label htmlFor="confirmNewPassword" className="block text-sm font-medium text-gray-700">
                    新しいパスワード（確認用）
                  </label>
                  <input
                    {...register('confirmNewPassword')}
                    type="password"
                    id="confirmNewPassword"
                    className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                  />
                  {errors.confirmNewPassword && (
                    <p className="mt-1 text-sm text-red-600">{errors.confirmNewPassword.message}</p>
                  )}
                </div>

                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-4 rounded-md focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isSubmitting ? '変更中...' : 'パスワードを変更'}
                </button>
              </form>
            </div>

            {/* ログイン履歴セクション */}
            <div className="bg-white shadow rounded-lg p-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-6">ログイン履歴{isAdmin ? '（全ユーザー）' : ''}</h2>
              
              {loginHistoryError && (
                <div className="text-red-600">ログイン履歴の取得に失敗しました</div>
              )}
              
              {loginHistoryData?.loginHistory && loginHistoryData.loginHistory.length > 0 ? (
                <div className="overflow-x-auto overflow-y-auto max-h-96">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          日時
                        </th>
                        {isAdmin && (
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            ユーザー
                          </th>
                        )}
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          IPアドレス
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          ユーザーエージェント
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {loginHistoryData.loginHistory.map((history) => (
                        <tr key={history.id}>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            {formatDate(history.createdAt)}
                          </td>
                          {isAdmin && (
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                              {history.user ? `${history.user.name} (${history.user.email})` : '-'}
                            </td>
                          )}
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            {history.ipAddress}
                          </td>
                          <td className="px-6 py-4 text-sm text-gray-900">
                            <span title={history.userAgent}>
                              {truncateUserAgent(history.userAgent)}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div className="text-gray-500 text-center py-8">
                  ログイン履歴がありません
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
