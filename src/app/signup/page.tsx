'use client'

import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { signupSchema, SignupFormData } from '@/lib/validations'
import { useRouter } from 'next/navigation'
import PasswordStrengthMeter from '@/components/PasswordStrengthMeter'
import Link from 'next/link'

export default function SignupPage() {
  const [emailStatus, setEmailStatus] = useState<{
    checking: boolean
    available?: boolean
    message?: string
  }>({ checking: false })
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const router = useRouter()

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors },
    setError: setFormError
  } = useForm<SignupFormData>({
    resolver: zodResolver(signupSchema)
  })

  const password = watch('password', '')

  const checkEmailAvailability = async (email: string) => {
    if (!email || !email.includes('@')) return

    setEmailStatus({ checking: true })
    try {
      const response = await fetch('/api/auth/check-email', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email }),
      })

      const data = await response.json()
      setEmailStatus({
        checking: false,
        available: data.available,
        message: data.message
      })

      if (!data.available) {
        setFormError('email', {
          type: 'manual',
          message: data.message
        })
      }
    } catch (error) {
      setEmailStatus({ checking: false })
    }
  }

  const onSubmit = async (data: SignupFormData) => {
    setIsSubmitting(true)
    setError(null)

    try {
      const response = await fetch('/api/auth/signup', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: data.name,
          email: data.email,
          password: data.password,
          confirmPassword: data.confirmPassword
        }),
      })

      const result = await response.json()

      if (response.ok) {
        // サインアップ成功時はダッシュボードにリダイレクト
        router.push('/dashboard/profile')
        router.refresh()
      } else {
        setError(result.error || 'アカウント作成に失敗しました')
      }
    } catch (error) {
      console.error('Signup error:', error)
      setError('アカウント作成中にエラーが発生しました')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
          アカウントを作成
        </h2>
        <p className="mt-2 text-center text-sm text-gray-600">
          または{' '}
          <Link href="/login" className="font-medium text-blue-600 hover:text-blue-500">
            既存のアカウントでログイン
          </Link>
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white py-8 px-4 shadow sm:rounded-lg sm:px-10">
          <form className="space-y-6" onSubmit={handleSubmit(onSubmit)}>
            {error && (
              <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
                {error}
              </div>
            )}

            <div>
              <label htmlFor="name" className="block text-sm font-medium text-gray-700">
                名前
              </label>
              <div className="mt-1">
                <input
                  {...register('name')}
                  type="text"
                  id="name"
                  className="appearance-none block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                />
                {errors.name && (
                  <p className="mt-1 text-sm text-red-600">{errors.name.message}</p>
                )}
              </div>
            </div>

            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700">
                メールアドレス
              </label>
              <div className="mt-1">
                <input
                  {...register('email')}
                  type="email"
                  id="email"
                  onBlur={(e) => checkEmailAvailability(e.target.value)}
                  className="appearance-none block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                />
                {emailStatus.checking && (
                  <p className="mt-1 text-sm text-gray-500">チェック中...</p>
                )}
                {!emailStatus.checking && emailStatus.message && (
                  <p className={`mt-1 text-sm ${
                    emailStatus.available ? 'text-green-600' : 'text-red-600'
                  }`}>
                    {emailStatus.message}
                  </p>
                )}
                {errors.email && (
                  <p className="mt-1 text-sm text-red-600">{errors.email.message}</p>
                )}
              </div>
            </div>

            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-700">
                パスワード
              </label>
              <div className="mt-1">
                <input
                  {...register('password')}
                  type="password"
                  id="password"
                  className="appearance-none block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                />
                <PasswordStrengthMeter password={password} />
                {errors.password && (
                  <p className="mt-1 text-sm text-red-600">{errors.password.message}</p>
                )}
              </div>
            </div>

            <div>
              <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700">
                パスワード（確認用）
              </label>
              <div className="mt-1">
                <input
                  {...register('confirmPassword')}
                  type="password"
                  id="confirmPassword"
                  className="appearance-none block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                />
                {errors.confirmPassword && (
                  <p className="mt-1 text-sm text-red-600">{errors.confirmPassword.message}</p>
                )}
              </div>
            </div>

            <div>
              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isSubmitting ? '作成中...' : 'アカウントを作成'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  )
}
